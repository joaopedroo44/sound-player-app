import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchYouTube } from "./youtube";
import {
  insertUserSchema,
  loginSchema,
  updateUserSchema,
  insertPlaylistSchema,
  updatePlaylistSchema,
  insertPlaylistTrackSchema,
  type User,
} from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "user_sessions",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "musicstream-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      req.session.userId = user.id;

      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error("Register error:", error);
      res.status(400).json({ message: error.message || "Erro ao criar conta" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      req.session.userId = user.id;

      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: error.message || "Erro ao fazer login" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  // User profile routes
  app.patch("/api/user/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = updateUserSchema.parse(req.body);
      const userId = req.session.userId!;

      if (data.currentPassword && data.newPassword) {
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "Usuário não encontrado" });
        }

        const validPassword = await bcrypt.compare(data.currentPassword, user.password);
        if (!validPassword) {
          return res.status(401).json({ message: "Senha atual incorreta" });
        }

        const hashedPassword = await bcrypt.hash(data.newPassword, 10);
        data.newPassword = hashedPassword;
      }

      if (data.email) {
        const existing = await storage.getUserByEmail(data.email);
        if (existing && existing.id !== userId) {
          return res.status(400).json({ message: "Email já está em uso" });
        }
      }

      if (data.username) {
        const existing = await storage.getUserByUsername(data.username);
        if (existing && existing.id !== userId) {
          return res.status(400).json({ message: "Nome de usuário já está em uso" });
        }
      }

      const updatedUser = await storage.updateUser(userId, data);
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error("Update profile error:", error);
      res.status(400).json({ message: error.message || "Erro ao atualizar perfil" });
    }
  });

  // Playlist routes
  app.get("/api/playlists", requireAuth, async (req: Request, res: Response) => {
    try {
      const playlists = await storage.getUserPlaylists(req.session.userId!);
      res.json(playlists);
    } catch (error: any) {
      console.error("Get playlists error:", error);
      res.status(500).json({ message: "Erro ao buscar playlists" });
    }
  });

  app.get("/api/playlists/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist não encontrada" });
      }

      if (playlist.userId !== req.session.userId && playlist.isPublic === 0) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      res.json(playlist);
    } catch (error: any) {
      console.error("Get playlist error:", error);
      res.status(500).json({ message: "Erro ao buscar playlist" });
    }
  });

  app.post("/api/playlists", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = insertPlaylistSchema.parse(req.body);
      const playlist = await storage.createPlaylist({
        ...data,
        userId: req.session.userId!,
      });
      res.json(playlist);
    } catch (error: any) {
      console.error("Create playlist error:", error);
      res.status(400).json({ message: error.message || "Erro ao criar playlist" });
    }
  });

  app.patch("/api/playlists/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist não encontrada" });
      }

      if (playlist.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const data = updatePlaylistSchema.parse(req.body);
      const updated = await storage.updatePlaylist(req.params.id, data);
      res.json(updated);
    } catch (error: any) {
      console.error("Update playlist error:", error);
      res.status(400).json({ message: error.message || "Erro ao atualizar playlist" });
    }
  });

  app.delete("/api/playlists/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist não encontrada" });
      }

      if (playlist.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      await storage.deletePlaylist(req.params.id);
      res.json({ message: "Playlist excluída" });
    } catch (error: any) {
      console.error("Delete playlist error:", error);
      res.status(500).json({ message: "Erro ao excluir playlist" });
    }
  });

  // Playlist tracks routes
  app.get("/api/playlists/:id/tracks", requireAuth, async (req: Request, res: Response) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist não encontrada" });
      }

      if (playlist.userId !== req.session.userId && playlist.isPublic === 0) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const tracks = await storage.getPlaylistTracks(req.params.id);
      res.json(tracks);
    } catch (error: any) {
      console.error("Get playlist tracks error:", error);
      res.status(500).json({ message: "Erro ao buscar músicas" });
    }
  });

  app.post("/api/playlists/:id/tracks", requireAuth, async (req: Request, res: Response) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist não encontrada" });
      }

      if (playlist.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const data = insertPlaylistTrackSchema.parse(req.body);
      const track = await storage.addTrackToPlaylist({
        ...data,
        playlistId: req.params.id,
      });

      await storage.updatePlaylist(req.params.id, { updatedAt: new Date() } as any);

      res.json(track);
    } catch (error: any) {
      console.error("Add track error:", error);
      res.status(400).json({ message: error.message || "Erro ao adicionar música" });
    }
  });

  app.delete("/api/playlists/:playlistId/tracks/:trackId", requireAuth, async (req: Request, res: Response) => {
    try {
      const playlist = await storage.getPlaylist(req.params.playlistId);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist não encontrada" });
      }

      if (playlist.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      await storage.removeTrackFromPlaylist(req.params.trackId);
      await storage.updatePlaylist(req.params.playlistId, { updatedAt: new Date() } as any);

      res.json({ message: "Música removida" });
    } catch (error: any) {
      console.error("Remove track error:", error);
      res.status(500).json({ message: "Erro ao remover música" });
    }
  });

  // Recently played routes
  app.get("/api/recently-played", requireAuth, async (req: Request, res: Response) => {
    try {
      const tracks = await storage.getRecentlyPlayed(req.session.userId!, 20);
      res.json(tracks);
    } catch (error: any) {
      console.error("Get recently played error:", error);
      res.status(500).json({ message: "Erro ao buscar histórico" });
    }
  });

  app.post("/api/recently-played", requireAuth, async (req: Request, res: Response) => {
    try {
      const track = await storage.addRecentlyPlayed({
        userId: req.session.userId!,
        youtubeId: req.body.youtubeId,
        title: req.body.title,
        artist: req.body.artist,
        thumbnail: req.body.thumbnail,
        duration: req.body.duration,
      });
      res.json(track);
    } catch (error: any) {
      console.error("Add recently played error:", error);
      res.status(400).json({ message: "Erro ao adicionar ao histórico" });
    }
  });

  // YouTube search route
  app.get("/api/youtube/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query é obrigatório" });
      }

      const results = await searchYouTube(query);
      res.json(results);
    } catch (error: any) {
      console.error("YouTube search error:", error);
      res.status(500).json({ message: "Erro ao buscar no YouTube" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

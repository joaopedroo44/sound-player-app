import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Playlists table
export const playlists = pgTable("playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  isPublic: integer("is_public").default(0).notNull(), // 0 = private, 1 = public
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Playlist tracks table (stores YouTube video metadata)
export const playlistTracks = pgTable("playlist_tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playlistId: varchar("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
  youtubeId: text("youtube_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  thumbnail: text("thumbnail").notNull(),
  duration: integer("duration").notNull(), // duration in seconds
  position: integer("position").notNull(), // order in playlist
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Recently played tracks
export const recentlyPlayed = pgTable("recently_played", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  youtubeId: text("youtube_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  thumbnail: text("thumbnail").notNull(),
  duration: integer("duration").notNull(),
  playedAt: timestamp("played_at").defaultNow().notNull(),
});

// Schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Nome de usuário deve ter no mínimo 3 caracteres"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
}).omit({ id: true, createdAt: true });

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const updateUserSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter no mínimo 3 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres").optional(),
});

export const insertPlaylistSchema = createInsertSchema(playlists, {
  name: z.string().min(1, "Nome da playlist é obrigatório"),
  description: z.string().optional(),
}).omit({ id: true, userId: true, createdAt: true, updatedAt: true });

export const updatePlaylistSchema = insertPlaylistSchema.partial();

export const insertPlaylistTrackSchema = createInsertSchema(playlistTracks, {
  youtubeId: z.string().min(1, "ID do YouTube é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  artist: z.string().min(1, "Artista é obrigatório"),
  thumbnail: z.string().url("URL da thumbnail inválida"),
  duration: z.number().positive("Duração deve ser positiva"),
}).omit({ id: true, playlistId: true, addedAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type UpdatePlaylist = z.infer<typeof updatePlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;

export type InsertPlaylistTrack = z.infer<typeof insertPlaylistTrackSchema>;
export type PlaylistTrack = typeof playlistTracks.$inferSelect;

export type RecentlyPlayed = typeof recentlyPlayed.$inferSelect;

// YouTube search result type
export type YouTubeVideo = {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
};

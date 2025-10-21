import {
  users,
  playlists,
  playlistTracks,
  recentlyPlayed,
  type User,
  type InsertUser,
  type UpdateUser,
  type Playlist,
  type InsertPlaylist,
  type UpdatePlaylist,
  type PlaylistTrack,
  type InsertPlaylistTrack,
  type RecentlyPlayed,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: UpdateUser): Promise<User | undefined>;

  // Playlists
  getUserPlaylists(userId: string): Promise<Playlist[]>;
  getPlaylist(id: string): Promise<Playlist | undefined>;
  createPlaylist(playlist: InsertPlaylist & { userId: string }): Promise<Playlist>;
  updatePlaylist(id: string, updates: UpdatePlaylist): Promise<Playlist | undefined>;
  deletePlaylist(id: string): Promise<void>;

  // Playlist Tracks
  getPlaylistTracks(playlistId: string): Promise<PlaylistTrack[]>;
  addTrackToPlaylist(track: InsertPlaylistTrack & { playlistId: string }): Promise<PlaylistTrack>;
  removeTrackFromPlaylist(trackId: string): Promise<void>;

  // Recently Played
  getRecentlyPlayed(userId: string, limit?: number): Promise<RecentlyPlayed[]>;
  addRecentlyPlayed(track: Omit<RecentlyPlayed, 'id' | 'playedAt'>): Promise<RecentlyPlayed>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: UpdateUser): Promise<User | undefined> {
    const updateData: any = {};
    
    if (updates.username) updateData.username = updates.username;
    if (updates.email) updateData.email = updates.email;
    if (updates.newPassword) updateData.password = updates.newPassword;

    if (Object.keys(updateData).length === 0) {
      return this.getUser(id);
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Playlists
  async getUserPlaylists(userId: string): Promise<Playlist[]> {
    return db
      .select()
      .from(playlists)
      .where(eq(playlists.userId, userId))
      .orderBy(desc(playlists.createdAt));
  }

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist || undefined;
  }

  async createPlaylist(playlist: InsertPlaylist & { userId: string }): Promise<Playlist> {
    const [newPlaylist] = await db
      .insert(playlists)
      .values(playlist)
      .returning();
    return newPlaylist;
  }

  async updatePlaylist(id: string, updates: UpdatePlaylist): Promise<Playlist | undefined> {
    const updateData: any = { updatedAt: new Date() };
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.coverUrl !== undefined) updateData.coverUrl = updates.coverUrl;
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;

    const [playlist] = await db
      .update(playlists)
      .set(updateData)
      .where(eq(playlists.id, id))
      .returning();
    return playlist || undefined;
  }

  async deletePlaylist(id: string): Promise<void> {
    await db.delete(playlists).where(eq(playlists.id, id));
  }

  // Playlist Tracks
  async getPlaylistTracks(playlistId: string): Promise<PlaylistTrack[]> {
    return db
      .select()
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, playlistId))
      .orderBy(playlistTracks.position);
  }

  async addTrackToPlaylist(track: InsertPlaylistTrack & { playlistId: string }): Promise<PlaylistTrack> {
    const existingTracks = await this.getPlaylistTracks(track.playlistId);
    const maxPosition = existingTracks.length > 0 
      ? Math.max(...existingTracks.map(t => t.position))
      : -1;

    const [newTrack] = await db
      .insert(playlistTracks)
      .values({
        ...track,
        position: track.position || maxPosition + 1,
      })
      .returning();
    return newTrack;
  }

  async removeTrackFromPlaylist(trackId: string): Promise<void> {
    await db.delete(playlistTracks).where(eq(playlistTracks.id, trackId));
  }

  // Recently Played
  async getRecentlyPlayed(userId: string, limit: number = 20): Promise<RecentlyPlayed[]> {
    return db
      .select()
      .from(recentlyPlayed)
      .where(eq(recentlyPlayed.userId, userId))
      .orderBy(desc(recentlyPlayed.playedAt))
      .limit(limit);
  }

  async addRecentlyPlayed(track: Omit<RecentlyPlayed, 'id' | 'playedAt'>): Promise<RecentlyPlayed> {
    const [newTrack] = await db
      .insert(recentlyPlayed)
      .values(track)
      .returning();
    return newTrack;
  }
}

export const storage = new DatabaseStorage();

import { BACKEND_URL } from './socket.js';
import { PersistentPlayerStats } from '../types/index.js';

export const api = {
  async getActiveRooms() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/active`);
      return await res.json();
    } catch (e) {
      console.error('Failed to fetch rooms:', e);
      return { success: false, rooms: [] };
    }
  },

  async getRoomByCode(code: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/${code}`);
      return await res.json();
    } catch (e) {
      console.error('Failed to fetch room:', e);
      return { success: false, error: 'Could not connect to server' };
    }
  },

  async getProfile(userId: string): Promise<PersistentPlayerStats | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/profile/${userId}`);
      const data = await res.json();
      return data.success ? data.stats : null;
    } catch (e) {
      console.error('Failed to get profile:', e);
      return null;
    }
  },

  async updateProfile(userId: string, displayName: string, avatarUrl?: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/profile/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, avatarUrl }),
      });
      return await res.json();
    } catch (e) {
      console.error('Failed to update profile:', e);
      return { success: false };
    }
  },

  async getLeaderboard(): Promise<PersistentPlayerStats[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/leaderboard`);
      const data = await res.json();
      return data.success ? data.leaderboard : [];
    } catch (e) {
      console.error('Failed to get leaderboard:', e);
      return [];
    }
  },

  async getHistory(userId: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/history/${userId}`);
      const data = await res.json();
      return data.success ? data.history : [];
    } catch (e) {
      console.error('Failed to get history:', e);
      return [];
    }
  },
};

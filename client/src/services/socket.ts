import { io, Socket } from 'socket.io-client';

// Determine backend URL:
// In Capacitor / mobile: VITE_BACKEND_URL or LAN address
// In Web: VITE_BACKEND_URL or current host with port 3001
const getBackendUrl = (): string => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:3001`;
  }
  return 'http://localhost:3001';
};

export const BACKEND_URL = getBackendUrl();

export interface ActiveSessionData {
  roomId: string;
  roomCode: string;
  userId: string;
  displayName: string;
  timestamp: number;
}

class SocketService {
  private socket: Socket | null = null;
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private statusListeners: ((status: 'connected' | 'disconnected' | 'connecting') => void)[] = [];

  public getSocket(): Socket {
    if (!this.socket) {
      this.init();
    }
    return this.socket!;
  }

  public init(): Socket {
    if (this.socket) return this.socket;

    this.connectionStatus = 'connecting';
    this.notifyStatus();

    this.socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.connectionStatus = 'connected';
      this.notifyStatus();
      console.log('✓ Connected to NumRush game server:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionStatus = 'disconnected';
      this.notifyStatus();
      console.warn('Disconnected from server:', reason);
    });

    this.socket.on('connect_error', (err) => {
      this.connectionStatus = 'disconnected';
      this.notifyStatus();
      console.error('Socket connection error:', err.message);
    });

    return this.socket;
  }

  public onStatusChange(callback: (status: 'connected' | 'disconnected' | 'connecting') => void) {
    this.statusListeners.push(callback);
    callback(this.connectionStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyStatus() {
    this.statusListeners.forEach((cb) => cb(this.connectionStatus));
  }

  // Active Session Persistence
  public saveActiveSession(data: ActiveSessionData) {
    try {
      localStorage.setItem('numrush_active_session', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  }

  public getActiveSession(): ActiveSessionData | null {
    try {
      const raw = localStorage.getItem('numrush_active_session');
      if (!raw) return null;
      const data: ActiveSessionData = JSON.parse(raw);
      // Valid for 24 hours
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('numrush_active_session');
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  public clearActiveSession() {
    localStorage.removeItem('numrush_active_session');
  }
}

export const socketService = new SocketService();

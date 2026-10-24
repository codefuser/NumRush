import { io, Socket } from 'socket.io-client';

// Determine backend URL:
// Uses VITE_BACKEND_URL if specified, otherwise connects to live production Render server
const getBackendUrl = (): string => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined') {
    // Local development Vite server only
    if (window.location.hostname === 'localhost' && window.location.port === '5173') {
      return 'http://localhost:3001';
    }
  }
  // Live Production Backend URL on Render
  return 'https://numrush-server.onrender.com';
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
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 12000,
    });

    this.socket.on('connect', () => {
      this.connectionStatus = 'connected';
      this.notifyStatus();
      console.log('✓ Connected to NumRush game server:', this.socket?.id);
    });

    this.socket.io.on('reconnect_attempt', () => {
      this.connectionStatus = 'connecting';
      this.notifyStatus();
    });

    this.socket.io.on('reconnect', () => {
      this.connectionStatus = 'connected';
      this.notifyStatus();
      console.log('✓ Reconnected to NumRush game server');
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionStatus = 'disconnected';
      this.notifyStatus();
      console.warn('Disconnected from server:', reason);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // Automatically try to reconnect
        setTimeout(() => {
          this.socket?.connect();
        }, 1000);
      }
    });

    this.socket.on('connect_error', (err) => {
      this.connectionStatus = 'disconnected';
      this.notifyStatus();
      console.error('Socket connection error:', err.message);
    });

    // Auto reconnect when device regains internet connectivity
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Network online detected, reconnecting socket...');
        this.reconnect();
      });
      window.addEventListener('offline', () => {
        this.connectionStatus = 'disconnected';
        this.notifyStatus();
      });
    }

    return this.socket;
  }

  public reconnect() {
    if (this.socket) {
      this.connectionStatus = 'connecting';
      this.notifyStatus();
      this.socket.connect();
    } else {
      this.init();
    }
  }

  public getStatus(): 'connected' | 'disconnected' | 'connecting' {
    return this.connectionStatus;
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

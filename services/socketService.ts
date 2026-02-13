import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from './apiConfig';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private lastErrorLog: number = 0;
  private readonly ERROR_LOG_THROTTLE = 10000; // Only log errors every 10 seconds

  // Initialize and connect to Socket.IO server
  connect(userId: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        if (__DEV__) {
          console.log('✅ Socket already connected');
        }
        resolve(this.socket);
        return;
      }

      const API_BASE_URL = getApiBaseUrl();

      this.socket = io(API_BASE_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 3,
        timeout: 5000,
        // Fail silently if server is down
        autoConnect: true,
      });

      // Register user when connected
      this.socket.once('connect', () => {
        if (__DEV__) {
          console.log('✅ Socket.IO connected:', this.socket?.id);
        }
        this.isConnected = true;
        this.connectionAttempts = 0;
        this.socket!.emit('register', userId);
        resolve(this.socket!);
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        // Only log disconnect if it's unexpected (not from manual disconnect)
        if (__DEV__ && reason !== 'io client disconnect') {
          console.log('⚠️ Socket.IO disconnected:', reason);
        }
      });

      // Throttle error logging to avoid spam
      this.socket.on('connect_error', (error) => {
        this.connectionAttempts++;
        const now = Date.now();
        
        // Only log error if enough time has passed (throttle)
        if (__DEV__ && (now - this.lastErrorLog) > this.ERROR_LOG_THROTTLE) {
          console.warn('⚠️ Socket.IO: Server unavailable (backend may be down)');
          this.lastErrorLog = now;
        }
        
        // Don't reject - let it keep trying to reconnect silently
        // The app will work without real-time features
        if (this.connectionAttempts === 1) {
          // Only reject on first attempt to avoid hanging promises
          setTimeout(() => {
            if (!this.isConnected) {
              // Fail silently - don't spam errors
              resolve(this.socket!); // Resolve anyway so app can continue
            }
          }, 5000);
        }
      });

      // Handle reconnection attempts
      this.socket.on('reconnect_attempt', () => {
        // Silent reconnection - don't spam logs
      });

      this.socket.on('reconnect', () => {
        if (__DEV__) {
          console.log('✅ Socket.IO reconnected');
        }
        this.isConnected = true;
        this.socket!.emit('register', userId);
      });

      // Timeout - resolve anyway to prevent hanging
      setTimeout(() => {
        if (!this.isConnected) {
          // Server is down, but resolve anyway so app continues
          resolve(this.socket!);
        }
      }, 5000);
    });
  }

  // Join a thread room
  joinRoom(threadId: string) {
    if (!this.socket?.connected) {
      // Silent fail - server might be down
      return;
    }
    this.socket.emit('joinThread', threadId);
    if (__DEV__) {
      console.log(`🏠 Joined thread room: ${threadId}`);
    }
  }

  // Leave a thread room
  leaveRoom(threadId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('leaveThread', threadId);
    if (__DEV__) {
      console.log(`🚪 Left thread room: ${threadId}`);
    }
  }

  // Send a message
  sendMessage(messageData: {
    threadId: string;
    senderId: string;
    receiverId: string;
    message: string;
  }) {
    if (!this.socket?.connected) {
      // Silent fail - server might be down, but message will be sent via API fallback
      return;
    }
    this.socket.emit('sendMessage', messageData);
    if (__DEV__) {
      console.log('📤 Sent message via socket');
    }
  }

  // Listen for new messages
  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('newMessage', callback);
  }

  // Listen for new notifications
  onNewNotification(callback: (notification: any) => void) {
    this.socket?.on('newNotification', callback);
  }

  // Remove listeners
  offNewMessage() {
    this.socket?.off('newMessage');
  }

  offNewNotification() {
    this.socket?.off('newNotification');
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 Socket disconnected');
    }
  }

  // Check connection status
  get isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }
}

export default new SocketService();


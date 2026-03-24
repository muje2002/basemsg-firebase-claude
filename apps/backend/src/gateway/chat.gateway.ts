import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface SendMessagePayload {
  chatRoomId: string;
  senderId: string;
  text: string;
  type?: 'text' | 'image' | 'file' | 'video' | 'emoji';
  fileUri?: string;
  fileName?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private userSockets = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId as string | undefined;
    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
    }
    console.log(`[WS] Client connected: ${client.id} (user: ${userId ?? 'unknown'})`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth?.userId as string | undefined;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    console.log(`[WS] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.join(roomId);
    console.log(`[WS] ${client.id} joined room ${roomId}`);
  }

  @SubscribeMessage('room:leave')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.leave(roomId);
    console.log(`[WS] ${client.id} left room ${roomId}`);
  }

  @SubscribeMessage('message:send')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    // Relay only — DB save is handled by REST API
    client.to(payload.chatRoomId).emit('message:receive', payload);
  }

  /** Broadcast a message to all clients in a room (called from REST controller) */
  broadcastToRoom(roomId: string, message: unknown) {
    this.server.to(roomId).emit('message:receive', message);
  }
}

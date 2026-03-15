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
import { MessagesService } from '../messages/messages.service';

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

  constructor(private readonly messagesService: MessagesService) {}

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
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    const message = await this.messagesService.create(
      payload.chatRoomId,
      payload.senderId,
      {
        text: payload.text,
        type: payload.type,
        fileUri: payload.fileUri,
        fileName: payload.fileName,
      },
    );

    // Broadcast to all clients in the room (including sender)
    this.server.to(payload.chatRoomId).emit('message:receive', message);

    return message;
  }
}

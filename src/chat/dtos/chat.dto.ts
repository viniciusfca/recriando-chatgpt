import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { Message } from '../entities/conversation.entity';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;
}

export class ChatResponseDto {
  conversationId: string;
  messages: Message[];
}

export class ConversationHistoryDto {
  id: string;
  startedAt: Date;
  finishedAt: Date;
  messageCount: number;
  lastMessage: string;
}
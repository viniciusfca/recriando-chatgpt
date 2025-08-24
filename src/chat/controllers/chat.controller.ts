import { Controller, Post, Get, Put, Body, Param, HttpCode, HttpStatus, ParseUUIDPipe, ValidationPipe } from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { SendMessageDto, ChatResponseDto, ConversationHistoryDto } from '../dtos/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body(ValidationPipe) sendMessageDto: SendMessageDto): Promise<ChatResponseDto> {
    return this.chatService.sendMessage(sendMessageDto);
  }

  @Get('conversation/history')
  async getConversationHistory(): Promise<ConversationHistoryDto[]> {
    return this.chatService.getConversationHistory();
  }

  @Get('conversation/:id')
  async getConversation(@Param('id', ParseUUIDPipe) id: string): Promise<ChatResponseDto> {
    return this.chatService.getConversation(id);
  }

  @Put('conversation/:id/close')
  @HttpCode(HttpStatus.NO_CONTENT)
  async finishConversation(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.chatService.finishConversation(id);
  }
}
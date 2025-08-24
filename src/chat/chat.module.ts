import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { OpenAIService } from './services/openai.service';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation])],
  controllers: [ChatController],
  providers: [ChatService, OpenAIService],
})
export class ChatModule {}
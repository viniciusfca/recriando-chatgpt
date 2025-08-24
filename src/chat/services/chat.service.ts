import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message, MessageRole } from '../entities/conversation.entity';
import { OpenAIService } from '../services/openai.service';
import { SendMessageDto, ChatResponseDto, ConversationHistoryDto } from '../dtos/chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    private openaiService: OpenAIService,
  ) {}

  async sendMessage(sendMessageDto: SendMessageDto): Promise<ChatResponseDto> {
    try {
      this.logger.log(`Enviando mensagem: ${sendMessageDto.conversationId ? 'conversa existente' : 'nova conversa'}`);
      
      let conversation: Conversation;

      if (sendMessageDto.conversationId) {
        this.logger.log(`Buscando conversa existente: ${sendMessageDto.conversationId}`);
        
        const foundConversation = await this.conversationRepository.findOne({
          where: { id: sendMessageDto.conversationId },
        });
        
        if (!foundConversation) {
          this.logger.warn(`Conversa não encontrada ou finalizada: ${sendMessageDto.conversationId}`);
          throw new NotFoundException('Conversa não encontrada ou já finalizada');
        }
        
        conversation = foundConversation;
        this.logger.log(`Conversa encontrada com ${conversation.messages.length} mensagens`);
      } else {
        this.logger.log('Criando nova conversa');
        conversation = this.conversationRepository.create({
          messages: [],
          isFinished: false,
        });
      }

      const userMessage: Message = {
        id: uuidv4(),
        role: MessageRole.USER,
        content: sendMessageDto.message,
        timestamp: new Date(),
      };

      conversation.messages.push(userMessage);
      this.logger.log('Mensagem do usuário adicionada');

      const messagesForOpenAI = conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      this.logger.log(`Enviando ${messagesForOpenAI.length} mensagens para OpenAI`);
      const aiResponse = await this.openaiService.getChatCompletion(messagesForOpenAI);
      this.logger.log('Resposta recebida da OpenAI');

      const assistantMessage: Message = {
        id: uuidv4(),
        role: MessageRole.ASSISTANT,
        content: aiResponse,
        timestamp: new Date(),
      };

      conversation.messages.push(assistantMessage);

      this.logger.log('Salvando conversa no banco de dados');
      const savedConversation = await this.conversationRepository.save(conversation);
      
      this.logger.log(`Conversa salva com sucesso. ID: ${savedConversation.id}`);

      return {
        conversationId: savedConversation.id,
        messages: savedConversation.messages,
      };
    } catch (error) {
      this.logger.error('Erro ao enviar mensagem', error.stack);
      throw error;
    }
  }

  async getConversation(id: string): Promise<ChatResponseDto> {
    try {
      this.logger.log(`Buscando conversa: ${id}`);
      
      const conversation = await this.conversationRepository.findOne({
        where: { id },
      });

      if (!conversation) {
        this.logger.warn(`Conversa não encontrada: ${id}`);
        throw new NotFoundException('Conversa não encontrada');
      }

      this.logger.log(`Conversa encontrada com ${conversation.messages.length} mensagens`);

      return {
        conversationId: conversation.id,
        messages: conversation.messages,
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar conversa ${id}`, error.stack);
      throw error;
    }
  }

  async finishConversation(id: string): Promise<void> {
    try {
      this.logger.log(`Finalizando conversa: ${id}`);
      
      const conversation = await this.conversationRepository.findOne({
        where: { id, isFinished: false },
      });

      if (!conversation) {
        this.logger.warn(`Conversa não encontrada ou já finalizada: ${id}`);
        throw new NotFoundException('Conversa não encontrada ou já finalizada');
      }

      conversation.isFinished = true;
      conversation.finishedAt = new Date();
      
      await this.conversationRepository.save(conversation);
      this.logger.log(`Conversa finalizada com sucesso: ${id}`);
    } catch (error) {
      this.logger.error(`Erro ao finalizar conversa ${id}`, error.stack);
      throw error;
    }
  }

  async getConversationHistory(): Promise<ConversationHistoryDto[]> {
    try {
      this.logger.log('Buscando histórico de conversas');
      
      const conversations = await this.conversationRepository.find({
        order: { finishedAt: 'DESC' },
        take: 20,
      });

      this.logger.log(`Encontradas ${conversations.length} conversas no histórico `);

      return conversations.map(conv => ({
        id: conv.id,
        startedAt: conv.startedAt,
        finishedAt: conv.finishedAt,
        messageCount: conv.messages.length,
        lastMessage: conv.messages[conv.messages.length - 1]?.content || '',
      }));
    } catch (error) {
      this.logger.error('Erro ao buscar histórico de conversas', error.stack);
      throw error;
    }
  }
}
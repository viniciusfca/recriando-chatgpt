import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from '../services/chat.service';
import { SendMessageDto, ChatResponseDto, ConversationHistoryDto } from '../dtos/chat.dto';
import { NotFoundException } from '@nestjs/common';
import { MessageRole } from '../entities/conversation.entity';

describe('ChatController', () => {
  let controller: ChatController;
  let service: ChatService;

  const mockChatService = {
    sendMessage: jest.fn(),
    getConversationHistory: jest.fn(),
    getConversation: jest.fn(),
    finishConversation: jest.fn(),
  };

  const mockConversationId = '123e4567-e89b-12d3-a456-426614174000';
  const mockMessage = 'Hello, how can I help you?';
  
  const mockChatResponse: ChatResponseDto = {
    conversationId: mockConversationId,
    messages: [
      {
        id: '1',
        role: MessageRole.USER,
        content: mockMessage,
        timestamp: new Date('2024-01-01T10:00:00Z'),
      },
      {
        id: '2',
        role: MessageRole.ASSISTANT,
        content: 'Hello! I can help you with various tasks.',
        timestamp: new Date('2024-01-01T10:00:01Z'),
      },
    ],
  };

  const mockConversationHistory: ConversationHistoryDto[] = [
    {
      id: mockConversationId,
      startedAt: new Date('2024-01-01T10:00:00Z'),
      finishedAt: new Date('2024-01-01T10:30:00Z'),
      messageCount: 4,
      lastMessage: 'Thank you for your help!',
    },
    {
      id: '223e4567-e89b-12d3-a456-426614174001',
      startedAt: new Date('2024-01-01T09:00:00Z'),
      finishedAt: new Date('2024-01-01T09:30:00Z'),
      messageCount: 6,
      lastMessage: 'Goodbye!',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should send a message and return chat response', async () => {
      const sendMessageDto: SendMessageDto = {
        message: mockMessage,
        conversationId: mockConversationId,
      };

      mockChatService.sendMessage.mockResolvedValue(mockChatResponse);

      const result = await controller.sendMessage(sendMessageDto);

      expect(result).toEqual(mockChatResponse);
      expect(service.sendMessage).toHaveBeenCalledWith(sendMessageDto);
      expect(service.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('should create a new conversation when conversationId is not provided', async () => {
      const sendMessageDto: SendMessageDto = {
        message: mockMessage,
      };

      mockChatService.sendMessage.mockResolvedValue(mockChatResponse);

      const result = await controller.sendMessage(sendMessageDto);

      expect(result).toEqual(mockChatResponse);
      expect(service.sendMessage).toHaveBeenCalledWith(sendMessageDto);
    });

    it('should throw NotFoundException when conversation does not exist', async () => {
      const sendMessageDto: SendMessageDto = {
        message: mockMessage,
        conversationId: 'non-existent-id',
      };

      mockChatService.sendMessage.mockRejectedValue(
        new NotFoundException('Conversa não encontrada ou já finalizada')
      );

      await expect(controller.sendMessage(sendMessageDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getConversationHistory', () => {
    it('should return conversation history', async () => {
      mockChatService.getConversationHistory.mockResolvedValue(mockConversationHistory);

      const result = await controller.getConversationHistory();

      expect(result).toEqual(mockConversationHistory);
      expect(service.getConversationHistory).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no conversations exist', async () => {
      mockChatService.getConversationHistory.mockResolvedValue([]);

      const result = await controller.getConversationHistory();

      expect(result).toEqual([]);
      expect(service.getConversationHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('getConversation', () => {
    it('should return a specific conversation', async () => {
      mockChatService.getConversation.mockResolvedValue(mockChatResponse);

      const result = await controller.getConversation(mockConversationId);

      expect(result).toEqual(mockChatResponse);
      expect(service.getConversation).toHaveBeenCalledWith(mockConversationId);
      expect(service.getConversation).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when conversation does not exist', async () => {
      const nonExistentId = 'non-existent-id';
      
      mockChatService.getConversation.mockRejectedValue(
        new NotFoundException('Conversa não encontrada')
      );

      await expect(controller.getConversation(nonExistentId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('finishConversation', () => {
    it('should finish a conversation successfully', async () => {
      mockChatService.finishConversation.mockResolvedValue(undefined);

      await controller.finishConversation(mockConversationId);

      expect(service.finishConversation).toHaveBeenCalledWith(mockConversationId);
      expect(service.finishConversation).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when conversation does not exist', async () => {
      const nonExistentId = 'non-existent-id';
      
      mockChatService.finishConversation.mockRejectedValue(
        new NotFoundException('Conversa não encontrada ou já finalizada')
      );

      await expect(controller.finishConversation(nonExistentId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException when conversation is already finished', async () => {
      mockChatService.finishConversation.mockRejectedValue(
        new NotFoundException('Conversa não encontrada ou já finalizada')
      );

      await expect(controller.finishConversation(mockConversationId)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
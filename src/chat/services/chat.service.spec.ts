import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { OpenAIService } from './openai.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, MessageRole } from '../entities/conversation.entity';
import { SendMessageDto } from '../dtos/chat.dto';
import { NotFoundException } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;
  let conversationRepository: Repository<Conversation>;
  let openaiService: OpenAIService;

  const mockConversationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockOpenAIService = {
    getChatCompletion: jest.fn(),
  };

  const mockConversationId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserMessage = 'Hello, how can you help me?';
  const mockAssistantResponse = 'Hello! I can help you with various tasks.';

  const mockConversation: Conversation = {
    id: mockConversationId,
    messages: [
      {
        id: '1',
        role: MessageRole.USER,
        content: mockUserMessage,
        timestamp: new Date('2024-01-01T10:00:00Z'),
      },
      {
        id: '2',
        role: MessageRole.ASSISTANT,
        content: mockAssistantResponse,
        timestamp: new Date('2024-01-01T10:00:01Z'),
      },
    ],
    isFinished: false,
    startedAt: new Date('2024-01-01T10:00:00Z'),
    finishedAt: null,
    updatedAt: new Date('2024-01-01T10:00:01Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: mockConversationRepository,
        },
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    conversationRepository = module.get<Repository<Conversation>>(
      getRepositoryToken(Conversation),
    );
    openaiService = module.get<OpenAIService>(OpenAIService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should create a new conversation when conversationId is not provided', async () => {
      const sendMessageDto: SendMessageDto = {
        message: mockUserMessage,
      };

      const newConversation = {
        messages: [],
        isFinished: false,
      };

      const savedConversation = {
        ...newConversation,
        id: mockConversationId,
        messages: [
          {
            id: expect.any(String),
            role: MessageRole.USER,
            content: mockUserMessage,
            timestamp: expect.any(Date),
          },
          {
            id: expect.any(String),
            role: MessageRole.ASSISTANT,
            content: mockAssistantResponse,
            timestamp: expect.any(Date),
          },
        ],
      };

      mockConversationRepository.create.mockReturnValue(newConversation);
      mockOpenAIService.getChatCompletion.mockResolvedValue(mockAssistantResponse);
      mockConversationRepository.save.mockImplementation((conversation) => {
        return Promise.resolve({
          ...conversation,
          id: mockConversationId,
        });
      });

      const result = await service.sendMessage(sendMessageDto);

      expect(mockConversationRepository.create).toHaveBeenCalledWith({
        messages: [],
        isFinished: false,
      });
      expect(mockOpenAIService.getChatCompletion).toHaveBeenCalled();
      expect(mockConversationRepository.save).toHaveBeenCalled();
      expect(result.conversationId).toBeDefined();
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].role).toBe(MessageRole.USER);
      expect(result.messages[1].role).toBe(MessageRole.ASSISTANT);
    });

    it('should add message to existing conversation', async () => {
      const sendMessageDto: SendMessageDto = {
        message: 'Another question',
        conversationId: mockConversationId,
      };

      const existingConversation = {
        id: mockConversationId,
        messages: [
          {
            id: '1',
            role: MessageRole.USER,
            content: mockUserMessage,
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        ],
        isFinished: false,
      };

      mockConversationRepository.findOne.mockResolvedValue(existingConversation);
      mockOpenAIService.getChatCompletion.mockResolvedValue('Here is my answer');
      mockConversationRepository.save.mockResolvedValue({
        ...existingConversation,
        messages: [
          ...existingConversation.messages,
          {
            id: expect.any(String),
            role: MessageRole.USER,
            content: 'Another question',
            timestamp: expect.any(Date),
          },
          {
            id: expect.any(String),
            role: MessageRole.ASSISTANT,
            content: 'Here is my answer',
            timestamp: expect.any(Date),
          },
        ],
      });

      const result = await service.sendMessage(sendMessageDto);

      expect(mockConversationRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockConversationId },
      });
      expect(mockOpenAIService.getChatCompletion).toHaveBeenCalled();
      expect(mockConversationRepository.save).toHaveBeenCalled();
      expect(result.conversationId).toBe(mockConversationId);
      expect(result.messages.length).toBeGreaterThanOrEqual(3);
    });

    it('should throw NotFoundException when conversation does not exist', async () => {
      const sendMessageDto: SendMessageDto = {
        message: mockUserMessage,
        conversationId: 'non-existent-id',
      };

      mockConversationRepository.findOne.mockResolvedValue(null);

      await expect(service.sendMessage(sendMessageDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockConversationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
    });

    it('should handle OpenAI service errors', async () => {
      const sendMessageDto: SendMessageDto = {
        message: mockUserMessage,
      };

      const newConversation = {
        messages: [],
        isFinished: false,
      };

      mockConversationRepository.create.mockReturnValue(newConversation);
      mockOpenAIService.getChatCompletion.mockRejectedValue(
        new Error('OpenAI API error'),
      );

      await expect(service.sendMessage(sendMessageDto)).rejects.toThrow(
        'OpenAI API error',
      );
    });
  });

  describe('getConversation', () => {
    it('should return a conversation by id', async () => {
      mockConversationRepository.findOne.mockResolvedValue(mockConversation);

      const result = await service.getConversation(mockConversationId);

      expect(result.conversationId).toBe(mockConversationId);
      expect(result.messages).toEqual(mockConversation.messages);
      expect(mockConversationRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockConversationId },
      });
    });

    it('should throw NotFoundException when conversation does not exist', async () => {
      mockConversationRepository.findOne.mockResolvedValue(null);

      await expect(service.getConversation('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('finishConversation', () => {
    it('should finish a conversation successfully', async () => {
      const unfinishedConversation = {
        ...mockConversation,
        isFinished: false,
        finishedAt: null,
      };

      mockConversationRepository.findOne.mockResolvedValue(unfinishedConversation);
      mockConversationRepository.save.mockResolvedValue({
        ...unfinishedConversation,
        isFinished: true,
        finishedAt: new Date(),
      });

      await service.finishConversation(mockConversationId);

      expect(mockConversationRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockConversationId, isFinished: false },
      });
      expect(mockConversationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isFinished: true,
          finishedAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException when conversation does not exist', async () => {
      mockConversationRepository.findOne.mockResolvedValue(null);

      await expect(service.finishConversation('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when conversation is already finished', async () => {
      mockConversationRepository.findOne.mockResolvedValue(null);

      await expect(service.finishConversation(mockConversationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getConversationHistory', () => {
    it('should return conversation history', async () => {
      const mockConversations = [
        {
          id: '1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          finishedAt: new Date('2024-01-01T10:30:00Z'),
          messages: [
            { content: 'Hello' },
            { content: 'Hi there' },
            { content: 'How can I help?' },
            { content: 'Thank you!' },
          ],
        },
        {
          id: '2',
          startedAt: new Date('2024-01-01T09:00:00Z'),
          finishedAt: new Date('2024-01-01T09:30:00Z'),
          messages: [
            { content: 'Question' },
            { content: 'Answer' },
          ],
        },
      ];

      mockConversationRepository.find.mockResolvedValue(mockConversations);

      const result = await service.getConversationHistory();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        startedAt: mockConversations[0].startedAt,
        finishedAt: mockConversations[0].finishedAt,
        messageCount: 4,
        lastMessage: 'Thank you!',
      });
      expect(result[1]).toEqual({
        id: '2',
        startedAt: mockConversations[1].startedAt,
        finishedAt: mockConversations[1].finishedAt,
        messageCount: 2,
        lastMessage: 'Answer',
      });
      expect(mockConversationRepository.find).toHaveBeenCalledWith({
        order: { finishedAt: 'DESC' },
        take: 20,
      });
    });

    it('should return empty array when no conversations exist', async () => {
      mockConversationRepository.find.mockResolvedValue([]);

      const result = await service.getConversationHistory();

      expect(result).toEqual([]);
      expect(mockConversationRepository.find).toHaveBeenCalled();
    });

    it('should handle conversations with no messages', async () => {
      const mockConversations = [
        {
          id: '1',
          startedAt: new Date('2024-01-01T10:00:00Z'),
          finishedAt: new Date('2024-01-01T10:30:00Z'),
          messages: [],
        },
      ];

      mockConversationRepository.find.mockResolvedValue(mockConversations);

      const result = await service.getConversationHistory();

      expect(result).toHaveLength(1);
      expect(result[0].lastMessage).toBe('');
    });
  });
});
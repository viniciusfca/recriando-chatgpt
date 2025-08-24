import { Test, TestingModule } from '@nestjs/testing';
import { OpenAIService } from './openai.service';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

jest.mock('openai');

describe('OpenAIService', () => {
  let service: OpenAIService;
  let configService: ConfigService;
  let mockOpenAIInstance: any;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockMessages = [
    { role: 'user', content: 'Hello, how are you?' },
    { role: 'assistant', content: 'I am doing well, thank you!' },
    { role: 'user', content: 'Can you help me with coding?' },
  ];

  const mockCompletion = {
    choices: [
      {
        message: {
          content: 'Of course! I would be happy to help you with coding.',
        },
      },
    ],
  };

  beforeEach(async () => {
    mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAIInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OpenAIService>(OpenAIService);
    configService = module.get<ConfigService>(ConfigService);

    mockConfigService.get.mockReturnValue('test-api-key');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize OpenAI with API key from config', () => {
    expect(configService.get).toHaveBeenCalledWith('OPENAI_API_KEY');
    expect(OpenAI).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
    });
  });

  describe('getChatCompletion', () => {
    it('should successfully get chat completion from OpenAI', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await service.getChatCompletion(mockMessages);

      expect(result).toBe('Of course! I would be happy to help you with coding.');
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: mockMessages,
        max_tokens: 1000,
        temperature: 0.7,
      });
    });

    it('should return fallback message when response is empty', async () => {
      const emptyCompletion = {
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(emptyCompletion);

      const result = await service.getChatCompletion(mockMessages);

      expect(result).toBe('Desculpe, não consegui gerar uma resposta.');
    });

    it('should return fallback message when choices array is empty', async () => {
      const noChoicesCompletion = {
        choices: [],
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(noChoicesCompletion);

      const result = await service.getChatCompletion(mockMessages);

      expect(result).toBe('Desculpe, não consegui gerar uma resposta.');
    });

    it('should handle OpenAI API errors', async () => {
      const apiError = new Error('OpenAI API error: Rate limit exceeded');
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(apiError);

      await expect(service.getChatCompletion(mockMessages)).rejects.toThrow(
        'Erro interno do servidor ao processar mensagem',
      );

      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error: Connection timeout');
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(networkError);

      await expect(service.getChatCompletion(mockMessages)).rejects.toThrow(
        'Erro interno do servidor ao processar mensagem',
      );
    });

    it('should pass correct parameters to OpenAI API', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockCompletion);

      const singleMessage = [{ role: 'user', content: 'Test message' }];
      await service.getChatCompletion(singleMessage);

      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: singleMessage,
        max_tokens: 1000,
        temperature: 0.7,
      });
    });

    it('should handle malformed response structure', async () => {
      const malformedCompletion = {
        choices: [
          {
            text: 'This is a different format',
          },
        ],
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(malformedCompletion);

      const result = await service.getChatCompletion(mockMessages);

      expect(result).toBe('Desculpe, não consegui gerar uma resposta.');
    });
  });
});
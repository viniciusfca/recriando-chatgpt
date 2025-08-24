import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async getChatCompletion(messages: Array<{ role: string; content: string }>) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages as any,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';
    } catch (error) {
      console.error('Erro ao chamar OpenAI:', error);
      throw new Error('Erro interno do servidor ao processar mensagem');
    }
  }
}
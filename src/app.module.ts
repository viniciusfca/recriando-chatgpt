import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Conversation } from './chat/entities/conversation.entity';
import { ChatModule } from './chat/chat.module';


@Module({ // Decorador que define a classe como um módulo principal do NestJS
  imports: [ // Lista de módulos que este módulo precisa importar
    ConfigModule.forRoot({ // Configura o módulo de variáveis de ambiente
      isGlobal: true, // Torna o ConfigModule acessível globalmente na aplicação
    }),
    TypeOrmModule.forRoot({ // Configuração do TypeORM para conectar no banco de dados
      type: 'postgres', // Define o banco como PostgreSQL
      host: process.env.DATABASE_HOST || 'localhost', // Usa a variável de ambiente DATABASE_HOST ou "localhost" como fallback
      port: parseInt(process.env.DATABASE_PORT || '5432'), // Converte a variável DATABASE_PORT para número, padrão 5432
      username: process.env.DATABASE_USERNAME || 'postgres', // Usuário do banco, padrão "postgres"
      password: process.env.DATABASE_PASSWORD || 'postgres', // Senha do banco, padrão "postgres"
      database: process.env.DATABASE_NAME || 'chatgpt_clone', // Nome do banco, padrão "chatgpt_clone"
      entities: [Conversation], // Registra a entidade Conversation (mapeia a tabela no banco)
      synchronize: true, // Cria/atualiza tabelas automaticamente (não recomendado em produção)
    }),
    ChatModule, // Importa o módulo de chat (com controller, services e entidade)
  ],
  controllers: [AppController], // Registra o controller principal da aplicação
  providers: [AppService], // Registra o service principal da aplicação
})
export class AppModule {} // Classe principal que representa o módulo raiz da aplicação

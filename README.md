# API Clone ChatGPT

API backend para um clone do ChatGPT construída com NestJS, PostgreSQL e integração com OpenAI.

## Funcionalidades

- ✅ Envio de mensagens e geração de respostas via OpenAI
- ✅ Histórico de conversas armazenado em PostgreSQL 
- ✅ Conversas em tempo real com identificação por UUID
- ✅ Encerramento manual de conversas
- ✅ Listagem de conversas finalizadas para o histórico

## Estrutura da API

### Rotas Principais

```
POST /chat
- Envia mensagem e recebe resposta do ChatGPT
- Body: { "message": "string", "conversationId": "uuid?" }
- Response: { "conversationId": "uuid", "messages": Message[] }

GET /chat/conversations/:id
- Busca conversa ativa por ID
- Response: { "conversationId": "uuid", "messages": Message[] }

PUT /chat/conversations/:id/close
- Encerra uma conversa
- Response: 204 No Content

GET /chat/conversations/history
- Lista últimas 20 conversas encerradas
- Response: ConversationHistoryDto[]
```

### Estrutura do Banco

```sql
Conversation {
  id: UUID (PK)
  messages: JSONB
  isFinished: boolean
  startedAt: timestamp
  finishedAt: timestamp
  updatedAt: timestamp
}
```

## Setup

1. Clone o repositório
2. Instale dependências: `npm install`
3. Configure o `.env` com sua chave OpenAI
4. Suba o PostgreSQL: `docker-compose up -d`
5. Inicie a aplicação: `npm run start:dev`

## Variáveis de Ambiente

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=chatgpt_clone
OPENAI_API_KEY=seu_token_aqui
```

## Comandos

```bash
# development
npm run start:dev

# production
npm run start:prod

# docker database
docker-compose up -d
```

## Melhorias Futuras

- WebSocket para chat em tempo real
- Rate limiting e autenticação
- Cache Redis para performance
- Logs estruturados
- Filtros de conteúdo
- Compressão de mensagens longas

## Testes

```bash
npm run test
npm run test:e2e
npm run test:cov
```

# Redirect Webhook API

API leve e performática para receber webhooks e redirecioná-los para múltiplos endpoints.

## 🚀 Características

- **Performático**: Usa Fastify (um dos frameworks Node.js mais rápidos)
- **Leve**: Apenas 2 dependências principais
- **Paralelo**: Redireciona para todos os endpoints simultaneamente
- **Flexível**: Aceita qualquer método HTTP (GET, POST, PUT, DELETE, etc.)
- **Preserva tudo**: Mantém headers, body e método HTTP original
- **Logs detalhados**: Registra todas as operações

## 📦 Instalação

```bash
npm install
```

## ⚙️ Configuração

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e configure seus endpoints:
```env
ENDPOINT_1=https://seu-endpoint-1.com/webhook
ENDPOINT_2=https://seu-endpoint-2.com/webhook
META_VERIFY_TOKEN=seu_token_secreto_da_meta
PORT=3000
```

### 🔐 Configuração para Meta (WhatsApp/Facebook/Instagram)

Para webhooks da Meta, você precisa:

1. Definir um token de verificação (pode ser qualquer string secreta):
```bash
export META_VERIFY_TOKEN="meu_token_super_secreto_123"
```

2. Configurar o webhook no painel da Meta apontando para sua URL
3. A Meta enviará uma requisição GET de verificação que será automaticamente tratada

## 🏃 Executar

### Modo produção:
```bash
npm start
```

### Modo desenvolvimento (com auto-reload):
```bash
npm run dev
```

## 📡 Uso

A API aceita webhooks em qualquer rota. Exemplos:

```bash
# POST com JSON
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "data": "hello"}'

# GET com query params
curl http://localhost:3000/webhook?param=value

# Qualquer outro método
curl -X PUT http://localhost:3000/custom/path \
  -H "Authorization: Bearer token" \
  -d "raw data"
```

### Health Check

```bash
curl http://localhost:3000/health
```

## 📊 Respostas

- **200**: Webhook redirecionado com sucesso para todos os endpoints
- **207**: Webhook redirecionado parcialmente (alguns endpoints falharam)
- **502**: Falha ao redirecionar para todos os endpoints

Exemplo de resposta:
```json
{
  "message": "Webhook redirecionado para todos os endpoints",
  "results": [
    {
      "url": "https://endpoint1.example.com/webhook",
      "status": 200,
      "success": true
    },
    {
      "url": "https://endpoint2.example.com/webhook",
      "status": 200,
      "success": true
    }
  ]
}
```

## 🔧 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `ENDPOINT_1` | Primeiro endpoint de destino | - |
| `ENDPOINT_2` | Segundo endpoint de destino | - |
| `META_VERIFY_TOKEN` | Token de verificação para webhooks da Meta | - |
| `PORT` | Porta do servidor | 3000 |
| `HOST` | Host do servidor | 0.0.0.0 |

## 🏗️ Arquitetura

- **Fastify**: Framework web ultra-rápido
- **Undici**: Cliente HTTP de alta performance (usado internamente pelo Node.js)
- **Processamento paralelo**: Usa `Promise.all()` para máxima eficiência

## 📝 Licença

ISC


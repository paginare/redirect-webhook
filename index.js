import Fastify from 'fastify';
import { request } from 'undici';

const fastify = Fastify({
  logger: true,
  disableRequestLogging: false,
  requestIdLogLabel: 'reqId',
  // Importante: não fazer parsing automático do body para preservar o raw
  bodyLimit: 10485760, // 10MB
});

// Configure seus endpoints de destino aqui
const TARGET_ENDPOINTS = [
  process.env.ENDPOINT_1 || 'https://golden-fish-68.webhook.cool',
  process.env.ENDPOINT_2 || 'https://webhook.site/6052667b-164c-45a7-b44d-3ad2b5059a72',
];

// Token de verificação da Meta (configure via variável de ambiente)
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'seu_token_de_verificacao_aqui';

// Função para redirecionar o webhook preservando tudo exatamente como veio
async function redirectWebhook(url, method, headers, rawBody) {
  try {
    // Lista de headers que não devem ser redirecionados
    const headersToRemove = [
      'host',
      'connection',
      'transfer-encoding',
      'content-length', // Será recalculado pelo undici
    ];
    
    // Copia todos os headers exceto os que causam problemas
    const cleanHeaders = {};
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (!headersToRemove.includes(lowerKey)) {
        cleanHeaders[key] = value;
      }
    }
    
    // Prepara o body - se for Buffer vazio ou undefined, não envia
    let bodyToSend = undefined;
    if (rawBody && Buffer.isBuffer(rawBody) && rawBody.length > 0) {
      bodyToSend = rawBody;
    } else if (rawBody && !Buffer.isBuffer(rawBody)) {
      bodyToSend = rawBody;
    }
    
    const response = await request(url, {
      method,
      headers: cleanHeaders,
      body: bodyToSend,
    });

    return {
      url,
      status: response.statusCode,
      success: response.statusCode >= 200 && response.statusCode < 300,
    };
  } catch (error) {
    fastify.log.error({ url, error: error.message }, 'Erro ao redirecionar webhook');
    return {
      url,
      status: 0,
      success: false,
      error: error.message,
    };
  }
}

// Plugin para capturar o body raw antes de qualquer parsing
// Captura como string para garantir compatibilidade com undici
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  done(null, body);
});

fastify.addContentTypeParser('text/plain', { parseAs: 'string' }, (req, body, done) => {
  done(null, body);
});

// Para outros content types, captura como buffer
fastify.addContentTypeParser('*', { parseAs: 'buffer' }, (req, body, done) => {
  done(null, body);
});

// Rota catch-all para receber webhooks em qualquer path
fastify.all('/*', async (request, reply) => {
  const { method, headers, body, query } = request;
  
  // Verificação de webhook da Meta (GET request)
  // https://developers.facebook.com/docs/graph-api/webhooks/getting-started
  if (method === 'GET') {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    // Verifica se é uma requisição de verificação da Meta
    if (mode === 'subscribe' && token) {
      fastify.log.info({ mode, token }, 'Recebida requisição de verificação da Meta');
      
      if (token === META_VERIFY_TOKEN) {
        fastify.log.info('Token verificado com sucesso');
        return reply.code(200).send(challenge);
      } else {
        fastify.log.warn('Token de verificação inválido');
        return reply.code(403).send('Token de verificação inválido');
      }
    }
  }
  
  // Log com informações importantes (sem logar o body inteiro para performance)
  fastify.log.info({
    method,
    url: request.url,
    contentType: headers['content-type'],
    signature: headers['x-hub-signature-256'] || headers['x-hub-signature'], // Meta signature
  }, 'Webhook recebido - redirecionando');

  // Usa o body raw (Buffer) exatamente como veio
  // Isso preserva a assinatura da Meta
  const rawBody = body;

  // Redireciona para todos os endpoints em paralelo
  const redirectPromises = TARGET_ENDPOINTS.map(endpoint => 
    redirectWebhook(endpoint, method, headers, rawBody)
  );

  const results = await Promise.all(redirectPromises);

  // Log dos resultados
  results.forEach(result => {
    if (result.success) {
      fastify.log.info(result, 'Webhook redirecionado com sucesso');
    } else {
      fastify.log.error(result, 'Falha ao redirecionar webhook');
    }
  });

  // Retorna status baseado nos resultados
  const allSuccessful = results.every(r => r.success);
  const someSuccessful = results.some(r => r.success);

  if (allSuccessful) {
    return reply.code(200).send({
      message: 'Webhook redirecionado para todos os endpoints',
      results,
    });
  } else if (someSuccessful) {
    return reply.code(207).send({
      message: 'Webhook redirecionado parcialmente',
      results,
    });
  } else {
    return reply.code(502).send({
      message: 'Falha ao redirecionar webhook para todos os endpoints',
      results,
    });
  }
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', endpoints: TARGET_ENDPOINTS };
});

// Inicia o servidor
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    fastify.log.info(`Servidor rodando em http://${host}:${port}`);
    fastify.log.info(`Redirecionando webhooks para: ${TARGET_ENDPOINTS.join(', ')}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();


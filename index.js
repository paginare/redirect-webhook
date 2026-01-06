import Fastify from 'fastify';
import { request } from 'undici';

const fastify = Fastify({
  logger: true,
  disableRequestLogging: false,
  requestIdLogLabel: 'reqId',
});

// Configure seus endpoints de destino aqui
const TARGET_ENDPOINTS = [
  process.env.ENDPOINT_1 || 'https://golden-fish-68.webhook.cool',
  process.env.ENDPOINT_2 || 'https://webhook.site/6052667b-164c-45a7-b44d-3ad2b5059a72',
];

// Token de verificação da Meta (configure via variável de ambiente)
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'seu_token_de_verificacao_aqui';

// Função para redirecionar o webhook
async function redirectWebhook(url, method, headers, body) {
  try {
    const response = await request(url, {
      method,
      headers: {
        ...headers,
        host: undefined, // Remove o header host original
        'content-length': undefined, // Será recalculado automaticamente
      },
      body: body || undefined,
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

// Rota catch-all para receber webhooks em qualquer path
fastify.all('/*', async (request, reply) => {
  const { method, headers, body, raw, query } = request;
  
  // Verificação de webhook da Meta (GET request)
  // https://developers.facebook.com/docs/graph-api/webhooks/getting-started
  if (method === 'GET') {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    // Verifica se é uma requisição de verificação da Meta
    if (mode && mode === 'subscribe') {
      fastify.log.info({ mode, token, challenge }, 'Recebida requisição de verificação da Meta');
      
      if (token === META_VERIFY_TOKEN) {
        fastify.log.info('Token verificado com sucesso - não redirecionando');
        // Retorna o challenge como texto plano (não JSON)
        // NÃO redireciona para os endpoints
        return reply
          .code(200)
          .header('Content-Type', 'text/plain')
          .send(challenge);
      } else {
        fastify.log.warn({ receivedToken: token, expectedToken: META_VERIFY_TOKEN }, 'Token de verificação inválido');
        return reply.code(403).send('Token de verificação inválido');
      }
    }
    
    // Se for GET mas não for validação da Meta, retorna 200 sem redirecionar
    fastify.log.info({ method, url: request.url }, 'Requisição GET recebida - não redirecionando');
    return reply.code(200).send({ message: 'GET request recebido, mas não redirecionado' });
  }
  
  // Apenas redireciona requisições POST (e outros métodos que não sejam GET)
  fastify.log.info({
    method,
    url: request.url,
    headers,
  }, 'Webhook recebido - redirecionando');

  // Serializa o body se necessário
  let bodyToSend = body;
  if (typeof body === 'object' && body !== null) {
    bodyToSend = JSON.stringify(body);
  } else if (body === undefined || body === null) {
    bodyToSend = '';
  }

  // Redireciona para todos os endpoints em paralelo
  const redirectPromises = TARGET_ENDPOINTS.map(endpoint => 
    redirectWebhook(endpoint, method, headers, bodyToSend)
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


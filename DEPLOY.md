# 🚀 Instruções de Deploy no GitHub

O projeto já foi inicializado com Git e está pronto para ser enviado ao GitHub.

## Opção 1: Usando a Interface Web do GitHub (Recomendado)

1. **Acesse o GitHub** e faça login: https://github.com/new

2. **Crie um novo repositório:**
   - Nome: `redirect-webhook`
   - Descrição: `API leve para redirecionar webhooks com suporte Meta`
   - Visibilidade: Public ou Private (sua escolha)
   - **NÃO** marque "Add README" ou outras opções

3. **Execute os comandos abaixo** (substitua `SEU_USUARIO` pelo seu usuário do GitHub):

```bash
cd /Users/antonioduarte/Lançar/redirect-webhook
git remote add origin https://github.com/SEU_USUARIO/redirect-webhook.git
git push -u origin main
```

## Opção 2: Usando SSH (se configurado)

```bash
cd /Users/antonioduarte/Lançar/redirect-webhook
git remote add origin git@github.com:SEU_USUARIO/redirect-webhook.git
git push -u origin main
```

## ✅ Verificação

Após o push, seu repositório estará disponível em:
`https://github.com/SEU_USUARIO/redirect-webhook`

## 📝 Próximos Passos

Após fazer o deploy no GitHub, você pode:

1. **Deploy em produção:**
   - Render.com (gratuito)
   - Railway.app
   - Heroku
   - DigitalOcean
   - Qualquer servidor VPS

2. **Configurar variáveis de ambiente** no serviço de hosting:
   - `ENDPOINT_1`
   - `ENDPOINT_2`
   - `META_VERIFY_TOKEN`
   - `PORT` (geralmente definido automaticamente)

---

## 🔧 Status Atual

✅ Repositório Git inicializado
✅ Commit inicial feito
✅ Branch main configurada
⏳ Aguardando push para o GitHub


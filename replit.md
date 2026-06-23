# Discord Bot Sunset

Um bot de Discord completo e pronto para produção, construído com Node.js e Discord.js v14, totalmente em português do Brasil.

## Funcionalidades

- **Sistema de Tickets** — criação via botão, fluxo de fechar/confirmar, transcript automático
- **Suporte por IA** — respostas OpenAI dentro dos tickets enquanto o usuário aguarda a equipe
- **Comandos de Moderação** — `/banir`, `/desbanir`, `/expulsar`, `/limpar`, `/advertir`, `/tempo`
- **Sistema de Permissões** — por ID de usuário (dono/admin/moderador/suporte), sem depender de cargos do Discord
- **Gerenciamento de Permissões** — `/addadmin`, `/addmoderador`, `/addsuporte` e seus equivalentes de remoção
- **Logs de Moderação** — ações registradas em canal configurável

## Estrutura do Projeto

```
index.js              — Ponto de entrada do bot
deploy-commands.js    — Registra os slash commands no Discord
config.js             — Todas as configurações (permissões, embeds, tickets, logs, IA)
data/
  permissoes.json     — Permissões dinâmicas (adicionadas via comandos)
src/
  commands/           — Todos os slash commands
  events/             — interactionCreate.js, messageCreate.js, guildCreate.js, ready.js
  systems/            — tickets.js, ai.js, permissoes.js, advertencias.js, logs.js
  utils/              — embed.js, logger.js
```

## Configuração Inicial

### 1. Variáveis de ambiente (Replit Secrets)

Defina as seguintes variáveis em **Secrets** no Replit:

| Variável | Descrição |
|---|---|
| `DISCORD_TOKEN` | Token do bot (Discord Developer Portal) |
| `CLIENT_ID` | ID da aplicação (Discord Developer Portal → General Information) |
| `GUILD_ID` | ID do seu servidor (para registro instantâneo de comandos) |
| `OPENAI_API_KEY` | Chave da API OpenAI (para respostas de IA nos tickets) |

### 2. Registrar os slash commands

> **Este passo é obrigatório** para que os comandos apareçam no Discord.

Abra o **Shell** no Replit e execute:

```bash
node deploy-commands.js
```

- Se `GUILD_ID` estiver definido → registro **instantâneo** apenas no servidor configurado
- Sem `GUILD_ID` → registro **global** (pode levar até 1 hora para aparecer)

Rode este comando sempre que adicionar ou remover comandos.

### 3. Iniciar o bot

```bash
node index.js
```

Ou use o botão **Run** no Replit (já configurado no workflow).

## Configuração (config.js)

### Permissões por ID

```js
permissoes: {
  donos: ['SEU_ID_AQUI'],        // Acesso total
  administradores: [],            // Gerenciam moderadores/suporte
  moderadores: [],                // Ban, expulsar, advertir, silenciar
  suporte: [],                    // Abrir/fechar tickets
}
```

Use `/meuid` no Discord para descobrir seu ID.

### Outros ajustes

- **embeds** — Cores e rodapé das mensagens do bot
- **tickets** — `categoryId`, `logChannelId`, `transcriptChannelId`
- **logs** — `channelId`, `moderationChannelId`
- **ai** — `model`, `systemPrompt`, `maxTokens`

## Lista de Comandos

### Moderação
| Comando | Descrição | Nível mínimo |
|---|---|---|
| `/banir @usuario` | Bane um usuário | Moderador |
| `/desbanir <id>` | Remove banimento | Moderador |
| `/expulsar @usuario` | Expulsa um usuário | Moderador |
| `/limpar <quantidade>` | Apaga mensagens | Moderador |
| `/advertir @usuario` | Adverte um usuário | Moderador |
| `/advertencias @usuario` | Lista advertências | Moderador |
| `/removeradvertencia @usuario` | Remove advertência | Moderador |
| `/tempo @usuario` | Silenciamento temporário | Moderador |
| `/removertempo @usuario` | Remove silenciamento | Moderador |

### Tickets
| Comando | Descrição | Nível mínimo |
|---|---|---|
| `/ticket painel` | Envia painel de abertura | Suporte |
| `/fecharticket` | Fecha o ticket atual | Suporte |

### Permissões
| Comando | Descrição | Nível mínimo |
|---|---|---|
| `/meuid` | Mostra seu ID e nível | Qualquer um |
| `/permissoes` | Lista usuários por nível | Suporte |
| `/addadmin @usuario` | Adiciona administrador | Dono |
| `/addmoderador @usuario` | Adiciona moderador | Admin |
| `/addsuporte @usuario` | Adiciona suporte | Moderador |
| `/removeadmin @usuario` | Remove administrador | Dono |
| `/removemoderador @usuario` | Remove moderador | Admin |
| `/removesuporte @usuario` | Remove suporte | Moderador |

### Utilidades
| Comando | Descrição | Nível mínimo |
|---|---|---|
| `/verificarpermissoes` | Verifica permissões do bot | Suporte |
| `/corrigirpermissoes` | Gera link OAuth2 correto | Admin |
| `/sincronizarcomandos` | Instruções de re-deploy | Dono |

## Intents Privilegiados (Obrigatório)

No [Discord Developer Portal](https://discord.com/developers/applications):

1. Selecione sua aplicação → **Bot**
2. Em **Privileged Gateway Intents**, habilite:
   - ✅ **Server Members Intent**
   - ✅ **Message Content Intent**

## User preferences

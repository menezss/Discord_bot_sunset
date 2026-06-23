# Discord Bot Sunset

A complete, production-ready Discord bot built with Node.js and Discord.js v14.

## Features

- **Ticket System** — button-based ticket creation with per-user channel, close/confirm flow
- **AI Support** — OpenAI-powered responses inside tickets while users wait for staff
- **Moderation Commands** — `/ban`, `/kick`, `/clear`, `/warn`, `/timeout`
- **Permission System** — owner/admin/moderator/support levels by Discord user ID (no roles required)
- **Logging System** — moderation, ticket, member join/leave, message edit/delete logs
- **Configurable Embeds** — colors, footer, banner all in `config.js`

## Project Structure

```
index.js              — Bot entry point
deploy-commands.js    — Register slash commands
config.js             — All settings (permissions, embeds, tickets, logs, AI)
src/
  commands/           — ban.js, kick.js, clear.js, warn.js, timeout.js, ticket.js
  events/             — interactionCreate.js, messageCreate.js, guildCreate.js, ready.js
  systems/            — tickets.js, ai.js, permissions.js, logs.js
  utils/              — embed.js, logger.js
```

## Setup

1. Copy `.env.example` to `.env` and fill in your values
2. Set `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID` (optional, for faster dev), `OPENAI_API_KEY`
3. Configure `config.js` — add user IDs to permission arrays, set channel IDs for logs/tickets
4. Run `npm run deploy` to register slash commands
5. Run `npm start` to start the bot

## Configuration (config.js)

- **permissions** — Add Discord user IDs to `owners`, `admins`, `moderators`, `support` arrays
- **embeds** — Change `color`, `errorColor`, `successColor`, `warningColor`, `footer`, `banner`
- **tickets** — Set `categoryId`, `logChannelId`, `supportRoleId`, `transcriptChannelId`
- **logs** — Set `channelId`, `moderationChannelId`, `ticketChannelId`
- **ai** — Change `model`, `systemPrompt`, `maxTokens`

## User preferences

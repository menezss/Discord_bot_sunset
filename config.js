require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  openaiKey: process.env.OPENAI_API_KEY,

  permissions: {
    owners: [],
    admins: [],
    moderators: [],
    support: [],
  },

  embeds: {
    color: '#5865F2',
    errorColor: '#ED4245',
    successColor: '#57F287',
    warningColor: '#FEE75C',
    footer: {
      text: 'Sunset Bot',
      iconURL: null,
    },
    banner: null,
  },

  tickets: {
    categoryId: null,
    logChannelId: null,
    supportRoleId: null,
    maxTicketsPerUser: 1,
    transcriptChannelId: null,
  },

  logs: {
    channelId: null,
    moderationChannelId: null,
    ticketChannelId: null,
  },

  ai: {
    model: 'gpt-4o-mini',
    systemPrompt:
      'You are a helpful support assistant for this Discord server. Answer user questions concisely and helpfully. If you cannot help, suggest they wait for a staff member.',
    maxTokens: 500,
  },
};

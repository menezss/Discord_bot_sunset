require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  openaiKey: process.env.OPENAI_API_KEY,

  permissoes: {
    donos: ['1512007449291522124'],
    administradores: [],
    moderadores: [],
    suporte: [],
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
    maxTicketsPorUsuario: 1,
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
      'Você é um assistente de suporte prestativo deste servidor do Discord. Responda as perguntas dos usuários de forma clara e concisa em português do Brasil. Se não puder ajudar, sugira que o usuário aguarde um membro da equipe.',
    maxTokens: 500,
  },
};

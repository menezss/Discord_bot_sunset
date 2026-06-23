const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`[Bot] Conectado como ${client.user.tag}`);
    console.log(`[Bot] Servindo ${client.guilds.cache.size} servidor(es)`);

    client.user.setPresence({
      activities: [{ name: 'Tickets de Suporte', type: ActivityType.Watching }],
      status: 'online',
    });
  },
};

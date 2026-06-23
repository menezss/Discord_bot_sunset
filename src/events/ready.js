const { Events, ActivityType } = require('discord.js');
const { autoAdicionarDonoServidor } = require('../systems/permissoes');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`[Bot] Conectado como ${client.user.tag}`);
    console.log(`[Bot] Servindo ${client.guilds.cache.size} servidor(es)`);

    // Adiciona automaticamente o dono de cada servidor como Dono do bot
    for (const guild of client.guilds.cache.values()) {
      try {
        const guildCompleto = await guild.fetch();
        autoAdicionarDonoServidor(guildCompleto);
      } catch (err) {
        console.error(`[Bot] Erro ao verificar dono de ${guild.name}:`, err.message);
      }
    }

    client.user.setPresence({
      activities: [{ name: 'Tickets de Suporte', type: ActivityType.Watching }],
      status: 'online',
    });
  },
};

const { Events } = require('discord.js');
const config = require('../../config');
const { buildEmbed } = require('../utils/logger');

module.exports = {
  name: Events.GuildCreate,
  async execute(guild) {
    console.log(`[Bot] Entrou em um novo servidor: ${guild.name} (${guild.id}) — Membros: ${guild.memberCount}`);

    if (config.logs.channelId) {
      try {
        const canal = await guild.client.channels.fetch(config.logs.channelId);
        if (canal?.isTextBased()) {
          await canal.send({
            embeds: [buildEmbed(
              '🌐 Entrou em um Novo Servidor',
              `O bot entrou em **${guild.name}**.`,
              config.embeds.successColor,
              [
                { name: 'ID do Servidor', value: guild.id, inline: true },
                { name: 'Membros', value: String(guild.memberCount), inline: true },
              ]
            )],
          });
        }
      } catch {}
    }
  },
};

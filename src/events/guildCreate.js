const { Events } = require('discord.js');
const config = require('../../config');
const { buildEmbed } = require('../utils/logger');

module.exports = {
  name: Events.GuildCreate,
  async execute(guild) {
    console.log(`[Bot] Joined new guild: ${guild.name} (${guild.id}) — Members: ${guild.memberCount}`);

    if (config.logs.channelId) {
      try {
        const channel = await guild.client.channels.fetch(config.logs.channelId);
        if (channel?.isTextBased()) {
          await channel.send({
            embeds: [buildEmbed(
              '🌐 Joined a New Server',
              `The bot has joined **${guild.name}**.`,
              config.embeds.successColor,
              [
                { name: 'Guild ID', value: guild.id, inline: true },
                { name: 'Members', value: String(guild.memberCount), inline: true },
              ]
            )],
          });
        }
      } catch {}
    }
  },
};

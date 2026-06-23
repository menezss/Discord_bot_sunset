const { Events } = require('discord.js');
const { getTicketByChannel } = require('../systems/tickets');
const { askAI } = require('../systems/ai');
const { logMessageDelete } = require('../systems/logs');
const embed = require('../utils/embed');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const ticket = getTicketByChannel(message.channel.id);
    if (!ticket) return;

    if (!ticket.aiEnabled) return;

    if (message.author.id !== ticket.userId) return;

    try {
      await message.channel.sendTyping();
      const response = await askAI(message.channel.id, message.content, message.author.username);
      await message.channel.send({
        embeds: [
          embed.info('🤖 AI Support', response, [
            { name: 'Note', value: 'This is an automated AI response. A staff member will assist you soon.' },
          ]),
        ],
      });
    } catch (err) {
      console.error('[AI]', err.message);
      if (err.message.includes('API key')) {
        await message.channel.send({
          embeds: [embed.error('AI Error', 'AI support is not properly configured. Please wait for a staff member.')],
        });
      }
    }
  },
};

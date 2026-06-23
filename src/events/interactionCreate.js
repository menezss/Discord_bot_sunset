const { Events } = require('discord.js');
const {
  createTicket,
  closeTicket,
  confirmCloseTicket,
  toggleAI,
} = require('../systems/tickets');
const embed = require('../utils/embed');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        return interaction.reply({ embeds: [embed.error('Unknown Command', 'This command does not exist.')], ephemeral: true });
      }
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`[Commands] Error executing /${interaction.commandName}:`, err);
        const errMsg = { embeds: [embed.error('Error', 'An error occurred while running this command.')], ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errMsg).catch(() => {});
        } else {
          await interaction.reply(errMsg).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton()) {
      const { customId } = interaction;

      if (customId === 'ticket_create') return createTicket(interaction);
      if (customId === 'ticket_close') return closeTicket(interaction);
      if (customId === 'ticket_confirm_close') return confirmCloseTicket(interaction);
      if (customId === 'ticket_cancel_close') {
        return interaction.update({ content: '❌ Close cancelled.', components: [], embeds: [] });
      }
      if (customId === 'ticket_toggle_ai') return toggleAI(interaction);
    }
  },
};

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isSupport } = require('../systems/permissions');
const { sendTicketPanel } = require('../systems/tickets');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket system commands.')
    .addSubcommand(sub =>
      sub.setName('panel').setDescription('Send the ticket panel to this channel.')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!isSupport(interaction.user.id)) {
      return interaction.reply({ embeds: [embed.error('No Permission', 'You do not have permission to use this command.')], ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'panel') {
      await sendTicketPanel(interaction.channel);
      await interaction.reply({ embeds: [embed.success('Panel Sent', 'The ticket panel has been sent.')], ephemeral: true });
    }
  },
};

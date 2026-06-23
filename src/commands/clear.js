const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isModerator } = require('../systems/permissions');
const { logModeration } = require('../utils/logger');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear messages from the channel.')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to delete (1-100)').setMinValue(1).setMaxValue(100).setRequired(true))
    .addUserOption(opt => opt.setName('user').setDescription('Only clear messages from this user').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!isModerator(interaction.user.id)) {
      return interaction.reply({ embeds: [embed.error('No Permission', 'You do not have permission to use this command.')], ephemeral: true });
    }

    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    try {
      let messages = await interaction.channel.messages.fetch({ limit: 100 });

      if (targetUser) {
        messages = messages.filter(m => m.author.id === targetUser.id);
      }

      messages = [...messages.values()].slice(0, amount);

      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const bulkDeletable = messages.filter(m => m.createdTimestamp > twoWeeksAgo);
      const tooOld = messages.length - bulkDeletable.length;

      let deleted = 0;
      if (bulkDeletable.length > 0) {
        const result = await interaction.channel.bulkDelete(bulkDeletable, true);
        deleted = result.size;
      }

      let summary = `Deleted **${deleted}** message(s).`;
      if (tooOld > 0) summary += ` (${tooOld} message(s) were too old to delete.)`;
      if (targetUser) summary += ` From: **${targetUser.tag}**`;

      await interaction.editReply({ embeds: [embed.success('Messages Cleared', summary)] });

      await logModeration(
        interaction.client,
        'Clear',
        interaction.user,
        { tag: targetUser?.tag || 'Channel', id: targetUser?.id || interaction.channel.id },
        `Cleared ${deleted} messages${targetUser ? ` from ${targetUser.tag}` : ''} in #${interaction.channel.name}`
      );
    } catch (err) {
      console.error('[Clear]', err.message);
      return interaction.editReply({ embeds: [embed.error('Error', 'Failed to clear messages.')] });
    }
  },
};

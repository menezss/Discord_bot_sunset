const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isModerator } = require('../systems/permissions');
const { logModeration } = require('../utils/logger');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server.')
    .addUserOption(opt => opt.setName('user').setDescription('The user to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the ban').setRequired(false))
    .addIntegerOption(opt => opt.setName('delete_days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7).setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    if (!isModerator(interaction.user.id)) {
      return interaction.reply({ embeds: [embed.error('No Permission', 'You do not have permission to use this command.')], ephemeral: true });
    }

    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') ?? 0;

    if (target.id === interaction.user.id) {
      return interaction.reply({ embeds: [embed.error('Invalid Target', 'You cannot ban yourself.')], ephemeral: true });
    }

    if (target.id === interaction.client.user.id) {
      return interaction.reply({ embeds: [embed.error('Invalid Target', 'You cannot ban the bot.')], ephemeral: true });
    }

    try {
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      if (member && !member.bannable) {
        return interaction.reply({ embeds: [embed.error('Cannot Ban', 'I cannot ban this user. They may have higher permissions.')], ephemeral: true });
      }

      try {
        await target.send({ embeds: [embed.info('You have been banned', `You were banned from **${interaction.guild.name}**.\n**Reason:** ${reason}`)] });
      } catch {}

      await interaction.guild.members.ban(target, { reason, deleteMessageDays: deleteDays });

      await interaction.reply({
        embeds: [embed.success('User Banned', `**${target.tag}** has been banned.\n**Reason:** ${reason}`)],
      });

      await logModeration(interaction.client, 'Ban', interaction.user, target, reason);
    } catch (err) {
      console.error('[Ban]', err.message);
      return interaction.reply({ embeds: [embed.error('Error', 'Failed to ban the user.')], ephemeral: true });
    }
  },
};

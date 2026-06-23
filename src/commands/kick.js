const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isModerator } = require('../systems/permissions');
const { logModeration } = require('../utils/logger');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server.')
    .addUserOption(opt => opt.setName('user').setDescription('The user to kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the kick').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    if (!isModerator(interaction.user.id)) {
      return interaction.reply({ embeds: [embed.error('No Permission', 'You do not have permission to use this command.')], ephemeral: true });
    }

    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (target.id === interaction.user.id) {
      return interaction.reply({ embeds: [embed.error('Invalid Target', 'You cannot kick yourself.')], ephemeral: true });
    }

    if (target.id === interaction.client.user.id) {
      return interaction.reply({ embeds: [embed.error('Invalid Target', 'You cannot kick the bot.')], ephemeral: true });
    }

    try {
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      if (!member) {
        return interaction.reply({ embeds: [embed.error('Not Found', 'This user is not in the server.')], ephemeral: true });
      }
      if (!member.kickable) {
        return interaction.reply({ embeds: [embed.error('Cannot Kick', 'I cannot kick this user. They may have higher permissions.')], ephemeral: true });
      }

      try {
        await target.send({ embeds: [embed.info('You have been kicked', `You were kicked from **${interaction.guild.name}**.\n**Reason:** ${reason}`)] });
      } catch {}

      await member.kick(reason);

      await interaction.reply({
        embeds: [embed.success('User Kicked', `**${target.tag}** has been kicked.\n**Reason:** ${reason}`)],
      });

      await logModeration(interaction.client, 'Kick', interaction.user, target, reason);
    } catch (err) {
      console.error('[Kick]', err.message);
      return interaction.reply({ embeds: [embed.error('Error', 'Failed to kick the user.')], ephemeral: true });
    }
  },
};

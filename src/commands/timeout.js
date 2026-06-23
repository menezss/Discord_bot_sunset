const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isModerator } = require('../systems/permissions');
const { logModeration } = require('../utils/logger');
const embed = require('../utils/embed');

const DURATIONS = {
  '60s': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '10m': 10 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user.')
    .addUserOption(opt => opt.setName('user').setDescription('The user to timeout').setRequired(true))
    .addStringOption(opt =>
      opt.setName('duration')
        .setDescription('Duration of the timeout')
        .setRequired(true)
        .addChoices(
          { name: '60 Seconds', value: '60s' },
          { name: '5 Minutes', value: '5m' },
          { name: '10 Minutes', value: '10m' },
          { name: '30 Minutes', value: '30m' },
          { name: '1 Hour', value: '1h' },
          { name: '6 Hours', value: '6h' },
          { name: '12 Hours', value: '12h' },
          { name: '1 Day', value: '1d' },
          { name: '7 Days', value: '7d' },
        )
    )
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the timeout').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!isModerator(interaction.user.id)) {
      return interaction.reply({ embeds: [embed.error('No Permission', 'You do not have permission to use this command.')], ephemeral: true });
    }

    const target = interaction.options.getUser('user');
    const durationKey = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const durationMs = DURATIONS[durationKey];

    if (target.id === interaction.user.id) {
      return interaction.reply({ embeds: [embed.error('Invalid Target', 'You cannot timeout yourself.')], ephemeral: true });
    }

    try {
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      if (!member) {
        return interaction.reply({ embeds: [embed.error('Not Found', 'This user is not in the server.')], ephemeral: true });
      }
      if (!member.moderatable) {
        return interaction.reply({ embeds: [embed.error('Cannot Timeout', 'I cannot timeout this user.')], ephemeral: true });
      }

      await member.timeout(durationMs, reason);

      try {
        await target.send({
          embeds: [embed.warning('You have been timed out', `You were timed out in **${interaction.guild.name}** for **${durationKey}**.\n**Reason:** ${reason}`)],
        });
      } catch {}

      await interaction.reply({
        embeds: [embed.success('User Timed Out', `**${target.tag}** has been timed out for **${durationKey}**.\n**Reason:** ${reason}`)],
      });

      await logModeration(interaction.client, 'Timeout', interaction.user, target, reason, { duration: durationKey });
    } catch (err) {
      console.error('[Timeout]', err.message);
      return interaction.reply({ embeds: [embed.error('Error', 'Failed to timeout the user.')], ephemeral: true });
    }
  },
};

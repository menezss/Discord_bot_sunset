const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isModerator } = require('../systems/permissions');
const { logModeration } = require('../utils/logger');
const embed = require('../utils/embed');

const warnings = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user.')
    .addUserOption(opt => opt.setName('user').setDescription('The user to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the warning').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!isModerator(interaction.user.id)) {
      return interaction.reply({ embeds: [embed.error('No Permission', 'You do not have permission to use this command.')], ephemeral: true });
    }

    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    if (target.id === interaction.user.id) {
      return interaction.reply({ embeds: [embed.error('Invalid Target', 'You cannot warn yourself.')], ephemeral: true });
    }

    if (target.bot) {
      return interaction.reply({ embeds: [embed.error('Invalid Target', 'You cannot warn a bot.')], ephemeral: true });
    }

    const key = `${interaction.guild.id}-${target.id}`;
    if (!warnings.has(key)) warnings.set(key, []);
    const userWarnings = warnings.get(key);
    userWarnings.push({ reason, moderator: interaction.user.tag, timestamp: new Date() });

    try {
      await target.send({
        embeds: [embed.warning('You have been warned', `You received a warning in **${interaction.guild.name}**.\n**Reason:** ${reason}\n**Total Warnings:** ${userWarnings.length}`)],
      });
    } catch {}

    await interaction.reply({
      embeds: [embed.warning('User Warned', `**${target.tag}** has been warned.\n**Reason:** ${reason}\n**Total Warnings:** ${userWarnings.length}`)],
    });

    await logModeration(interaction.client, 'Warn', interaction.user, target, reason, { duration: `Warning #${userWarnings.length}` });
  },
};

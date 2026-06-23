const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isModerator } = require('../systems/permissions');
const { getWarnings, clearWarnings, removeWarning } = require('../systems/warnings');
const { logModeration } = require('../utils/logger');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Manage user warnings.')
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('View all warnings for a user.')
        .addUserOption(opt => opt.setName('user').setDescription('The user to check').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('clear')
        .setDescription('Clear all warnings for a user.')
        .addUserOption(opt => opt.setName('user').setDescription('The user to clear').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a specific warning by number.')
        .addUserOption(opt => opt.setName('user').setDescription('The user').setRequired(true))
        .addIntegerOption(opt => opt.setName('number').setDescription('Warning number to remove (from /warnings list)').setMinValue(1).setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!isModerator(interaction.user.id)) {
      return interaction.reply({ embeds: [embed.error('No Permission', 'You do not have permission to use this command.')], ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('user');

    if (sub === 'list') {
      const list = getWarnings(interaction.guild.id, target.id);

      if (list.length === 0) {
        return interaction.reply({
          embeds: [embed.info(`Warnings — ${target.tag}`, `**${target.tag}** has no warnings.`)],
          ephemeral: true,
        });
      }

      const fields = list.map((w, i) => ({
        name: `#${i + 1} — ${new Date(w.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`,
        value: `**Reason:** ${w.reason}\n**By:** ${w.moderator}`,
        inline: false,
      }));

      return interaction.reply({
        embeds: [
          embed.warning(`⚠️ Warnings — ${target.tag}`, `**${target.tag}** has **${list.length}** warning(s).`, fields),
        ],
        ephemeral: true,
      });
    }

    if (sub === 'clear') {
      const count = clearWarnings(interaction.guild.id, target.id);

      if (count === 0) {
        return interaction.reply({
          embeds: [embed.info('No Warnings', `**${target.tag}** had no warnings to clear.`)],
          ephemeral: true,
        });
      }

      await logModeration(
        interaction.client,
        'Clear Warnings',
        interaction.user,
        target,
        `Cleared ${count} warning(s)`
      );

      return interaction.reply({
        embeds: [embed.success('Warnings Cleared', `Cleared **${count}** warning(s) from **${target.tag}**.`)],
        ephemeral: true,
      });
    }

    if (sub === 'remove') {
      const number = interaction.options.getInteger('number');
      const removed = removeWarning(interaction.guild.id, target.id, number - 1);

      if (!removed) {
        return interaction.reply({
          embeds: [embed.error('Not Found', `Warning #${number} does not exist for **${target.tag}**.`)],
          ephemeral: true,
        });
      }

      await logModeration(
        interaction.client,
        'Remove Warning',
        interaction.user,
        target,
        `Removed warning #${number}: ${removed.reason}`
      );

      return interaction.reply({
        embeds: [embed.success('Warning Removed', `Removed warning #${number} from **${target.tag}**.\n**Reason was:** ${removed.reason}`)],
        ephemeral: true,
      });
    }
  },
};

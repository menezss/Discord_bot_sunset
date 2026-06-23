const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const { getAdvertencias } = require('../systems/advertencias');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('advertencias')
    .setDescription('Exibe todas as advertências de um usuário.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O usuário a verificar').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.moderador)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Você não tem permissão para usar este comando.')], ephemeral: true });
    }

    const alvo = interaction.options.getUser('usuario');
    const lista = getAdvertencias(interaction.guild.id, alvo.id);

    if (lista.length === 0) {
      return interaction.reply({
        embeds: [embed.info(`Advertências — ${alvo.tag}`, `**${alvo.tag}** não possui advertências.`)],
        ephemeral: true,
      });
    }

    const campos = lista.map((a, i) => ({
      name: `#${i + 1} — ${new Date(a.timestamp).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' })}`,
      value: `**Motivo:** ${a.motivo}\n**Por:** ${a.moderador}`,
      inline: false,
    }));

    return interaction.reply({
      embeds: [embed.aviso(`⚠️ Advertências — ${alvo.tag}`, `**${alvo.tag}** possui **${lista.length}** advertência(s).`, campos)],
      ephemeral: true,
    });
  },
};

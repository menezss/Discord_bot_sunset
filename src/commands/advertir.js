const { SlashCommandBuilder } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const { addAdvertencia } = require('../systems/advertencias');
const { logModeracao } = require('../utils/logger');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('advertir')
    .setDescription('Adverte um usuário.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O usuário a ser advertido').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo da advertência').setRequired(true)),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.moderador)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Você não tem permissão para usar este comando.')], ephemeral: true });
    }

    const alvo = interaction.options.getUser('usuario');
    const motivo = interaction.options.getString('motivo');

    if (alvo.id === interaction.user.id) {
      return interaction.reply({ embeds: [embed.erro('Alvo Inválido', 'Você não pode advertir a si mesmo.')], ephemeral: true });
    }
    if (alvo.bot) {
      return interaction.reply({ embeds: [embed.erro('Alvo Inválido', 'Você não pode advertir um bot.')], ephemeral: true });
    }

    const lista = addAdvertencia(interaction.guild.id, alvo.id, { motivo, moderador: interaction.user.tag });

    try {
      await alvo.send({
        embeds: [embed.aviso('Você recebeu uma advertência', `Você foi advertido em **${interaction.guild.name}**.\n**Motivo:** ${motivo}\n**Total de advertências:** ${lista.length}`)],
      });
    } catch {}

    await interaction.reply({
      embeds: [embed.aviso('Usuário Advertido', `**${alvo.tag}** foi advertido.\n**Motivo:** ${motivo}\n**Total de advertências:** ${lista.length}`)],
    });

    await logModeracao(interaction.client, 'Advertência', interaction.user, alvo, motivo, { duracao: `Advertência #${lista.length}` });
  },
};

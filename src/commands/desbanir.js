const { SlashCommandBuilder } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const { logModeracao } = require('../utils/logger');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('desbanir')
    .setDescription('Remove o banimento de um usuário pelo ID.')
    .addStringOption(opt => opt.setName('id').setDescription('ID do usuário banido').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do desbanimento').setRequired(false)),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.moderador)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Você não tem permissão para usar este comando.')], ephemeral: true });
    }

    const id = interaction.options.getString('id');
    const motivo = interaction.options.getString('motivo') || 'Nenhum motivo informado';

    if (!/^\d{17,20}$/.test(id)) {
      return interaction.reply({ embeds: [embed.erro('ID Inválido', 'Informe um ID de usuário válido (17-20 dígitos).')], ephemeral: true });
    }

    try {
      const banimento = await interaction.guild.bans.fetch(id).catch(() => null);
      if (!banimento) {
        return interaction.reply({ embeds: [embed.erro('Não Encontrado', 'Este usuário não está banido neste servidor.')], ephemeral: true });
      }

      await interaction.guild.members.unban(id, motivo);
      const alvo = banimento.user;

      await interaction.reply({
        embeds: [embed.sucesso('Usuário Desbanido', `**${alvo.tag}** foi desbanido.\n**Motivo:** ${motivo}`)],
      });

      await logModeracao(interaction.client, 'Desbanimento', interaction.user, alvo, motivo);
    } catch (err) {
      console.error('[Desbanir]', err.message);
      return interaction.reply({ embeds: [embed.erro('Erro', 'Falha ao desbanir o usuário. Verifique o ID informado.')], ephemeral: true });
    }
  },
};

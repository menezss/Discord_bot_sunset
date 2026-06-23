const { SlashCommandBuilder } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const { logModeracao } = require('../utils/logger');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removertempo')
    .setDescription('Remove o silenciamento de um usuário.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O usuário a dessilenciar').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo da remoção').setRequired(false)),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.moderador)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Você não tem permissão para usar este comando.')], ephemeral: true });
    }

    const alvo = interaction.options.getUser('usuario');
    const motivo = interaction.options.getString('motivo') || 'Nenhum motivo informado';

    try {
      const membro = await interaction.guild.members.fetch(alvo.id).catch(() => null);
      if (!membro) return interaction.reply({ embeds: [embed.erro('Não Encontrado', 'Este usuário não está no servidor.')], ephemeral: true });
      if (!membro.isCommunicationDisabled()) return interaction.reply({ embeds: [embed.erro('Sem Silenciamento', 'Este usuário não está silenciado.')], ephemeral: true });

      await membro.timeout(null, motivo);

      try {
        await alvo.send({ embeds: [embed.sucesso('Silenciamento Removido', `Seu silenciamento em **${interaction.guild.name}** foi removido.\n**Motivo:** ${motivo}`)] });
      } catch {}

      await interaction.reply({ embeds: [embed.sucesso('Silenciamento Removido', `Silenciamento de **${alvo.tag}** removido.\n**Motivo:** ${motivo}`)] });
      await logModeracao(interaction.client, 'Remover Silenciamento', interaction.user, alvo, motivo);
    } catch (err) {
      console.error('[RemoverTempo]', err.message);
      return interaction.reply({ embeds: [embed.erro('Erro', 'Falha ao remover o silenciamento.')], ephemeral: true });
    }
  },
};

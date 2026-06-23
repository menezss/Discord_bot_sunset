const { SlashCommandBuilder } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const { logModeracao } = require('../utils/logger');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('limpar')
    .setDescription('Apaga mensagens do canal.')
    .addIntegerOption(opt => opt.setName('quantidade').setDescription('Número de mensagens a apagar (1-100)').setMinValue(1).setMaxValue(100).setRequired(true))
    .addUserOption(opt => opt.setName('usuario').setDescription('Apagar apenas mensagens deste usuário').setRequired(false)),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.moderador)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Você não tem permissão para usar este comando.')], ephemeral: true });
    }

    const quantidade = interaction.options.getInteger('quantidade');
    const usuarioAlvo = interaction.options.getUser('usuario');

    await interaction.deferReply({ ephemeral: true });

    try {
      let mensagens = await interaction.channel.messages.fetch({ limit: 100 });

      if (usuarioAlvo) mensagens = mensagens.filter(m => m.author.id === usuarioAlvo.id);

      mensagens = [...mensagens.values()].slice(0, quantidade);

      const duasSemanas = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const deletaveis = mensagens.filter(m => m.createdTimestamp > duasSemanas);
      const muitoAntigas = mensagens.length - deletaveis.length;

      let deletadas = 0;
      if (deletaveis.length > 0) {
        const resultado = await interaction.channel.bulkDelete(deletaveis, true);
        deletadas = resultado.size;
      }

      let resumo = `**${deletadas}** mensagem(ns) apagada(s).`;
      if (muitoAntigas > 0) resumo += ` (${muitoAntigas} muito antiga(s) para apagar.)`;
      if (usuarioAlvo) resumo += ` De: **${usuarioAlvo.tag}**`;

      await interaction.editReply({ embeds: [embed.sucesso('Mensagens Apagadas', resumo)] });

      await logModeracao(
        interaction.client, 'Limpar Mensagens', interaction.user,
        { tag: usuarioAlvo?.tag || 'Canal', id: usuarioAlvo?.id || interaction.channel.id },
        `${deletadas} mensagem(ns) apagada(s) em #${interaction.channel.name}`
      );
    } catch (err) {
      console.error('[Limpar]', err.message);
      return interaction.editReply({ embeds: [embed.erro('Erro', 'Falha ao apagar as mensagens.')] });
    }
  },
};

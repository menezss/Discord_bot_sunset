const { SlashCommandBuilder } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const { removerAdvertencia, limparAdvertencias } = require('../systems/advertencias');
const { logModeracao } = require('../utils/logger');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeradvertencia')
    .setDescription('Remove uma advertência específica ou todas as de um usuário.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O usuário').setRequired(true))
    .addIntegerOption(opt => opt.setName('numero').setDescription('Número da advertência (use /advertencias para ver a lista)').setMinValue(1).setRequired(false))
    .addBooleanOption(opt => opt.setName('limpar_tudo').setDescription('Remove TODAS as advertências do usuário').setRequired(false)),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.moderador)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Você não tem permissão para usar este comando.')], ephemeral: true });
    }

    const alvo = interaction.options.getUser('usuario');
    const numero = interaction.options.getInteger('numero');
    const limparTudo = interaction.options.getBoolean('limpar_tudo');

    if (!numero && !limparTudo) {
      return interaction.reply({
        embeds: [embed.aviso('Parâmetro Necessário', 'Informe o `numero` da advertência ou use `limpar_tudo: true` para apagar todas.')],
        ephemeral: true,
      });
    }

    if (limparTudo) {
      const total = limparAdvertencias(interaction.guild.id, alvo.id);
      if (total === 0) {
        return interaction.reply({ embeds: [embed.info('Sem Advertências', `**${alvo.tag}** não possuía advertências.`)], ephemeral: true });
      }
      await logModeracao(interaction.client, 'Limpar Advertências', interaction.user, alvo, `${total} advertência(s) removida(s)`);
      return interaction.reply({
        embeds: [embed.sucesso('Advertências Removidas', `Todas as **${total}** advertência(s) de **${alvo.tag}** foram removidas.`)],
        ephemeral: true,
      });
    }

    const removida = removerAdvertencia(interaction.guild.id, alvo.id, numero - 1);
    if (!removida) {
      return interaction.reply({
        embeds: [embed.erro('Não Encontrada', `Advertência #${numero} não existe para **${alvo.tag}**. Use **/advertencias** para ver a lista.`)],
        ephemeral: true,
      });
    }

    await logModeracao(interaction.client, 'Remover Advertência', interaction.user, alvo, `Advertência #${numero} removida: ${removida.motivo}`);
    return interaction.reply({
      embeds: [embed.sucesso('Advertência Removida', `Advertência #${numero} de **${alvo.tag}** removida.\n**Motivo era:** ${removida.motivo}`)],
      ephemeral: true,
    });
  },
};

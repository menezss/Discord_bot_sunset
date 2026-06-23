const { SlashCommandBuilder } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const { enviarPainelTicket } = require('../systems/tickets');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Comandos do sistema de tickets.')
    .addSubcommand(sub => sub.setName('painel').setDescription('Envia o painel de tickets neste canal.')),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.suporte)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Você não tem permissão para usar este comando.')], ephemeral: true });
    }

    if (interaction.options.getSubcommand() === 'painel') {
      await enviarPainelTicket(interaction.channel);
      await interaction.reply({ embeds: [embed.sucesso('Painel Enviado', 'O painel de tickets foi enviado com sucesso.')], ephemeral: true });
    }
  },
};

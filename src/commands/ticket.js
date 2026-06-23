const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isSupporte } = require('../systems/permissoes');
const { enviarPainelTicket } = require('../systems/tickets');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Comandos do sistema de tickets.')
    .addSubcommand(sub =>
      sub.setName('painel').setDescription('Envia o painel de tickets neste canal.')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!isSupporte(interaction.user.id)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Você não tem permissão para usar este comando.')], ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'painel') {
      await enviarPainelTicket(interaction.channel);
      await interaction.reply({ embeds: [embed.sucesso('Painel Enviado', 'O painel de tickets foi enviado com sucesso.')], ephemeral: true });
    }
  },
};

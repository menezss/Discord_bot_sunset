const { SlashCommandBuilder } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const { fecharTicket } = require('../systems/tickets');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fecharticket')
    .setDescription('Fecha o ticket do canal atual.'),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.suporte)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Você não tem permissão para fechar tickets.')], ephemeral: true });
    }
    await fecharTicket(interaction);
  },
};

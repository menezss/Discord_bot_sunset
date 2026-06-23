const { Events } = require('discord.js');
const {
  criarTicket,
  fecharTicket,
  confirmarFecharTicket,
  salvarTranscritoAgora,
  alternarIA,
} = require('../systems/tickets');
const embed = require('../utils/embed');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const comando = interaction.client.commands.get(interaction.commandName);
      if (!comando) {
        return interaction.reply({ embeds: [embed.erro('Comando Desconhecido', 'Este comando não existe.')], ephemeral: true });
      }
      try {
        await comando.execute(interaction);
      } catch (err) {
        console.error(`[Comandos] Erro ao executar /${interaction.commandName}:`, err);
        const msgErro = { embeds: [embed.erro('Erro', 'Ocorreu um erro ao executar este comando.')], ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msgErro).catch(() => {});
        } else {
          await interaction.reply(msgErro).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton()) {
      const { customId } = interaction;

      if (customId === 'ticket_criar') return criarTicket(interaction);
      if (customId === 'ticket_fechar') return fecharTicket(interaction);
      if (customId === 'ticket_confirmar_fechar') return confirmarFecharTicket(interaction);
      if (customId === 'ticket_cancelar_fechar') {
        return interaction.update({ content: '❌ Fechamento cancelado.', components: [], embeds: [] });
      }
      if (customId === 'ticket_alternar_ia') return alternarIA(interaction);
      if (customId === 'ticket_transcrito') return salvarTranscritoAgora(interaction);
    }
  },
};

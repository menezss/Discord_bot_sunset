const { Events } = require('discord.js');
const { getTicketPorCanal } = require('../systems/tickets');
const { perguntarIA } = require('../systems/ai');
const embed = require('../utils/embed');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const ticket = getTicketPorCanal(message.channel.id);
    if (!ticket) return;
    if (!ticket.iaAtivada) return;
    if (message.author.id !== ticket.userId) return;

    try {
      await message.channel.sendTyping();
      const resposta = await perguntarIA(message.channel.id, message.content, message.author.username);
      await message.channel.send({
        embeds: [
          embed.info('🤖 Suporte com IA', resposta, [
            { name: 'Aviso', value: 'Esta é uma resposta automática da IA. Um membro da equipe irá te atender em breve.' },
          ]),
        ],
      });
    } catch (err) {
      console.error('[IA]', err.message);
      if (err.message.includes('API')) {
        await message.channel.send({
          embeds: [embed.erro('Erro na IA', 'O suporte com IA não está configurado corretamente. Aguarde um membro da equipe.')],
        });
      }
    }
  },
};

const { Events, EmbedBuilder } = require('discord.js');
const { getConfig, getCanalId } = require('../systems/logConfig');

function tempoNoServidor(joinedAt) {
  if (!joinedAt) return 'Desconhecido';
  const diff = Date.now() - joinedAt.getTime();
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (dias < 1) return 'Menos de 1 dia';
  if (dias < 30) return `${dias} dia(s)`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `${meses} mês(es)`;
  const anos = Math.floor(meses / 12);
  return `${anos} ano(s)`;
}

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const cfg = getConfig();
    const canalId = getCanalId('saida');
    if (!canalId) return;

    try {
      const canal = await member.client.channels.fetch(canalId);
      if (!canal?.isTextBased()) return;

      const mensagem = (cfg.mensagem_saida || '{usuario} deixou o servidor.')
        .replace(/{usuario}/g, member.user.tag)
        .replace(/{servidor}/g, member.guild.name)
        .replace(/{nome}/g, member.user.username);

      // Lista de cargos do membro (excluindo @everyone)
      const cargos = member.roles?.cache
        .filter(r => r.id !== member.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(r => r.name)
        .slice(0, 5);

      const cargosTexto = cargos && cargos.length > 0
        ? cargos.join(', ') + (member.roles.cache.size - 1 > 5 ? ` e mais ${member.roles.cache.size - 1 - 5}...` : '')
        : '*Nenhum*';

      const totalRestante = member.guild.memberCount;

      const embed = new EmbedBuilder()
        .setColor(cfg.cor_saida || '#ED4245')
        .setTitle('📤 Membro Saiu')
        .setDescription(mensagem)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: '👤 Usuário', value: `${member.user.tag}`, inline: true },
          { name: '🆔 ID', value: member.id, inline: true },
          { name: '📅 Entrou em', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Desconhecido', inline: true },
          { name: '⏱️ Tempo no servidor', value: tempoNoServidor(member.joinedAt), inline: true },
          { name: '👥 Total de membros', value: `**${totalRestante}** membros`, inline: true },
          { name: '🏷️ Cargos', value: cargosTexto, inline: false },
        )
        .setTimestamp()
        .setFooter({ text: `${totalRestante} membros restantes` });

      await canal.send({ embeds: [embed] });
    } catch (err) {
      console.error('[MemberRemove] Erro ao enviar log:', err.message);
    }
  },
};

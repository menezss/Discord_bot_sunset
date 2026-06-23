const { Events, EmbedBuilder } = require('discord.js');
const { getConfig, getCanalId } = require('../systems/logConfig');

function idadeContaFormatada(createdAt) {
  const agora = Date.now();
  const diff = agora - createdAt.getTime();
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (dias < 1) return 'Menos de 1 dia';
  if (dias < 30) return `${dias} dia(s)`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `${meses} mês(es)`;
  const anos = Math.floor(meses / 12);
  return `${anos} ano(s)`;
}

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const cfg = getConfig();
    const canalId = getCanalId('entrada');
    if (!canalId) return;

    try {
      const canal = await member.client.channels.fetch(canalId);
      if (!canal?.isTextBased()) return;

      // Substitui {usuario} e {servidor} na mensagem
      const mensagem = (cfg.mensagem_entrada || 'Bem-vindo(a), {usuario}!')
        .replace(/{usuario}/g, `<@${member.id}>`)
        .replace(/{servidor}/g, member.guild.name)
        .replace(/{nome}/g, member.user.username);

      // Conta nova posição
      const posicao = member.guild.memberCount;

      const embed = new EmbedBuilder()
        .setColor(cfg.cor_entrada || '#57F287')
        .setTitle('📥 Membro Entrou')
        .setDescription(mensagem)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: '👤 Usuário', value: `${member.user.tag}`, inline: true },
          { name: '🆔 ID', value: member.id, inline: true },
          { name: '📅 Conta criada', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '🕐 Idade da conta', value: idadeContaFormatada(member.user.createdAt), inline: true },
          { name: '👥 Total de membros', value: `**${posicao}** membros`, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: `Membro #${posicao}` });

      await canal.send({ embeds: [embed] });
    } catch (err) {
      console.error('[MemberAdd] Erro ao enviar log:', err.message);
    }
  },
};

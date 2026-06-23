const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

function timestamp() {
  return new Date().toISOString();
}

function buildEmbed(titulo, descricao, cor, campos = []) {
  const e = new EmbedBuilder()
    .setColor(cor || config.embeds.color)
    .setTitle(titulo)
    .setDescription(descricao)
    .setTimestamp();

  if (config.embeds.footer?.text) {
    e.setFooter({
      text: config.embeds.footer.text,
      iconURL: config.embeds.footer.iconURL || undefined,
    });
  }

  if (campos.length > 0) e.addFields(campos);
  if (config.embeds.banner) e.setImage(config.embeds.banner);

  return e;
}

async function enviarLog(client, channelId, embed) {
  if (!channelId) return;
  try {
    const canal = await client.channels.fetch(channelId);
    if (canal?.isTextBased()) await canal.send({ embeds: [embed] });
  } catch (err) {
    console.error(`[Logger] Falha ao enviar log para o canal ${channelId}:`, err.message);
  }
}

async function logModeracao(client, acao, moderador, alvo, motivo, extra = {}) {
  console.log(`[${timestamp()}] [MOD] ${acao} | Moderador: ${moderador.tag} | Alvo: ${alvo.tag} | Motivo: ${motivo}`);

  const campos = [
    { name: 'Ação', value: acao, inline: true },
    { name: 'Moderador', value: `${moderador.tag} (${moderador.id})`, inline: true },
    { name: 'Alvo', value: `${alvo.tag} (${alvo.id})`, inline: true },
    { name: 'Motivo', value: motivo || 'Nenhum motivo informado', inline: false },
  ];

  if (extra.duracao) campos.push({ name: 'Duração', value: extra.duracao, inline: true });

  const embed = buildEmbed(`🔨 Moderação — ${acao}`, 'Uma ação de moderação foi executada.', config.embeds.color, campos);
  await enviarLog(client, config.logs.moderationChannelId || config.logs.channelId, embed);
}

async function logTicket(client, acao, usuario, canal, extra = {}) {
  console.log(`[${timestamp()}] [TICKET] ${acao} | Usuário: ${usuario.tag} | Canal: ${canal?.name}`);

  const campos = [
    { name: 'Ação', value: acao, inline: true },
    { name: 'Usuário', value: `${usuario.tag} (${usuario.id})`, inline: true },
  ];
  if (canal) campos.push({ name: 'Canal', value: `${canal.name} (${canal.id})`, inline: true });
  if (extra.closedBy) campos.push({ name: 'Fechado Por', value: `${extra.closedBy.tag}`, inline: true });

  const embed = buildEmbed(`🎫 Ticket — ${acao}`, 'Um evento de ticket ocorreu.', config.embeds.color, campos);
  await enviarLog(client, config.logs.ticketChannelId || config.logs.channelId, embed);
}

async function logGeral(client, titulo, descricao, campos = []) {
  console.log(`[${timestamp()}] [LOG] ${titulo}: ${descricao}`);
  const embed = buildEmbed(titulo, descricao, config.embeds.color, campos);
  await enviarLog(client, config.logs.channelId, embed);
}

module.exports = { buildEmbed, logModeracao, logTicket, logGeral };

const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

function timestamp() {
  return new Date().toISOString();
}

function buildEmbed(title, description, color, fields = []) {
  const embed = new EmbedBuilder()
    .setColor(color || config.embeds.color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();

  if (config.embeds.footer?.text) {
    embed.setFooter({
      text: config.embeds.footer.text,
      iconURL: config.embeds.footer.iconURL || undefined,
    });
  }

  if (fields.length > 0) embed.addFields(fields);
  if (config.embeds.banner) embed.setImage(config.embeds.banner);

  return embed;
}

async function sendLog(client, channelId, embed) {
  if (!channelId) return;
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel?.isTextBased()) await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(`[Logger] Failed to send log to channel ${channelId}:`, err.message);
  }
}

async function logModeration(client, action, moderator, target, reason, extra = {}) {
  console.log(`[${timestamp()}] [MOD] ${action} | Moderator: ${moderator.tag} | Target: ${target.tag} | Reason: ${reason}`);

  const fields = [
    { name: 'Action', value: action, inline: true },
    { name: 'Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true },
    { name: 'Target', value: `${target.tag} (${target.id})`, inline: true },
    { name: 'Reason', value: reason || 'No reason provided', inline: false },
  ];

  if (extra.duration) fields.push({ name: 'Duration', value: extra.duration, inline: true });

  const embed = buildEmbed(`🔨 Moderation — ${action}`, `A moderation action was performed.`, config.embeds.color, fields);
  await sendLog(client, config.logs.moderationChannelId || config.logs.channelId, embed);
}

async function logTicket(client, action, user, channel, extra = {}) {
  console.log(`[${timestamp()}] [TICKET] ${action} | User: ${user.tag} | Channel: ${channel?.name}`);

  const fields = [
    { name: 'Action', value: action, inline: true },
    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
  ];
  if (channel) fields.push({ name: 'Channel', value: `${channel.name} (${channel.id})`, inline: true });
  if (extra.closedBy) fields.push({ name: 'Closed By', value: `${extra.closedBy.tag}`, inline: true });

  const embed = buildEmbed(`🎫 Ticket — ${action}`, `A ticket event occurred.`, config.embeds.color, fields);
  await sendLog(client, config.logs.ticketChannelId || config.logs.channelId, embed);
}

async function logGeneral(client, title, description, fields = []) {
  console.log(`[${timestamp()}] [LOG] ${title}: ${description}`);
  const embed = buildEmbed(title, description, config.embeds.color, fields);
  await sendLog(client, config.logs.channelId, embed);
}

module.exports = { buildEmbed, logModeration, logTicket, logGeneral };

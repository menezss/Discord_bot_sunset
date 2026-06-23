const { AuditLogEvent } = require('discord.js');
const { logGeneral } = require('../utils/logger');
const config = require('../../config');

async function logMemberJoin(client, member) {
  await logGeneral(client, '📥 Member Joined', `**${member.user.tag}** joined the server.`, [
    { name: 'User ID', value: member.user.id, inline: true },
    { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
  ]);
}

async function logMemberLeave(client, member) {
  await logGeneral(client, '📤 Member Left', `**${member.user.tag}** left the server.`, [
    { name: 'User ID', value: member.user.id, inline: true },
  ]);
}

async function logMessageDelete(client, message) {
  if (message.author?.bot) return;
  if (!message.content) return;

  await logGeneral(client, '🗑️ Message Deleted', `A message was deleted in <#${message.channel.id}>.`, [
    { name: 'Author', value: `${message.author?.tag || 'Unknown'} (${message.author?.id || 'Unknown'})`, inline: true },
    { name: 'Content', value: message.content.slice(0, 1000) || '*No content*', inline: false },
  ]);
}

async function logMessageEdit(client, oldMessage, newMessage) {
  if (newMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;

  await logGeneral(client, '✏️ Message Edited', `A message was edited in <#${newMessage.channel.id}>.`, [
    { name: 'Author', value: `${newMessage.author?.tag} (${newMessage.author?.id})`, inline: true },
    { name: 'Before', value: oldMessage.content?.slice(0, 500) || '*No content*', inline: false },
    { name: 'After', value: newMessage.content?.slice(0, 500) || '*No content*', inline: false },
  ]);
}

module.exports = { logMemberJoin, logMemberLeave, logMessageDelete, logMessageEdit };

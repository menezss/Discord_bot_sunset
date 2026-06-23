const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
} = require('discord.js');
const config = require('../../config');
const { buildEmbed, logTicket } = require('../utils/logger');
const { clearHistory } = require('./ai');

const activeTickets = new Map();

function getTicketByUser(userId) {
  for (const [channelId, data] of activeTickets.entries()) {
    if (data.userId === userId) return { channelId, ...data };
  }
  return null;
}

function getTicketByChannel(channelId) {
  return activeTickets.get(channelId) || null;
}

async function generateTranscript(channel, ticket) {
  try {
    const messages = [];
    let lastId;

    while (true) {
      const opts = { limit: 100 };
      if (lastId) opts.before = lastId;
      const batch = await channel.messages.fetch(opts);
      if (batch.size === 0) break;
      messages.push(...batch.values());
      lastId = batch.last().id;
      if (batch.size < 100) break;
    }

    messages.reverse();

    const lines = [
      `═══════════════════════════════════════════════`,
      `  TICKET TRANSCRIPT`,
      `═══════════════════════════════════════════════`,
      `  Ticket:   ${channel.name}`,
      `  User:     ${ticket.username} (${ticket.userId})`,
      `  Opened:   ${new Date(ticket.createdAt).toUTCString()}`,
      `  Closed:   ${new Date().toUTCString()}`,
      `  Messages: ${messages.length}`,
      `═══════════════════════════════════════════════`,
      '',
    ];

    for (const msg of messages) {
      if (msg.author.bot && msg.embeds.length > 0 && !msg.content) {
        const e = msg.embeds[0];
        lines.push(`[${new Date(msg.createdTimestamp).toUTCString()}] [BOT EMBED] ${e.title || ''}: ${e.description || ''}`);
      } else if (msg.content) {
        lines.push(`[${new Date(msg.createdTimestamp).toUTCString()}] ${msg.author.tag}: ${msg.content}`);
      }
      if (msg.attachments.size > 0) {
        for (const att of msg.attachments.values()) {
          lines.push(`  [Attachment] ${att.name}: ${att.url}`);
        }
      }
    }

    lines.push('', `═══════════════════════════════════════════════`);
    lines.push(`  End of transcript`);
    lines.push(`═══════════════════════════════════════════════`);

    return Buffer.from(lines.join('\n'), 'utf-8');
  } catch (err) {
    console.error('[Tickets] Transcript generation failed:', err.message);
    return null;
  }
}

async function sendTranscript(client, channel, ticket, closedBy) {
  const transcriptChannelId = config.tickets.transcriptChannelId || config.logs.ticketChannelId || config.logs.channelId;
  const buf = await generateTranscript(channel, ticket);
  if (!buf) return;

  const attachment = new AttachmentBuilder(buf, { name: `transcript-${channel.name}.txt` });

  const transcriptEmbed = new EmbedBuilder()
    .setColor(config.embeds.color)
    .setTitle('📄 Ticket Transcript')
    .setDescription(`Transcript for **${channel.name}**`)
    .addFields(
      { name: 'User', value: `${ticket.username} (<@${ticket.userId}>)`, inline: true },
      { name: 'Closed By', value: closedBy ? `${closedBy.tag}` : 'Unknown', inline: true },
      { name: 'Opened', value: `<t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:F>`, inline: false },
      { name: 'Closed', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
    )
    .setTimestamp()
    .setFooter({ text: config.embeds.footer.text });

  if (transcriptChannelId) {
    try {
      const transcriptChannel = await client.channels.fetch(transcriptChannelId);
      if (transcriptChannel?.isTextBased()) {
        await transcriptChannel.send({ embeds: [transcriptEmbed], files: [attachment] });
      }
    } catch (err) {
      console.error('[Tickets] Failed to send transcript to channel:', err.message);
    }
  }

  const ticketOwner = await client.users.fetch(ticket.userId).catch(() => null);
  if (ticketOwner) {
    try {
      const dmBuf = await generateTranscript(channel, ticket);
      if (dmBuf) {
        const dmAttachment = new AttachmentBuilder(dmBuf, { name: `transcript-${channel.name}.txt` });
        await ticketOwner.send({
          embeds: [buildEmbed('📄 Your Ticket Transcript', `Your ticket **${channel.name}** has been closed. Your transcript is attached.`, config.embeds.color)],
          files: [dmAttachment],
        });
      }
    } catch {}
  }
}

async function createTicket(interaction) {
  const { guild, user } = interaction;

  const existing = getTicketByUser(user.id);
  if (existing) {
    return interaction.reply({
      embeds: [buildEmbed('Ticket Already Open', `You already have an open ticket: <#${existing.channelId}>`, config.embeds.warningColor)],
      ephemeral: true,
    });
  }

  const categoryId = config.tickets.categoryId;
  const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;

  const permissionOverwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: user.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    },
    {
      id: interaction.client.user.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory],
    },
  ];

  if (config.tickets.supportRoleId) {
    permissionOverwrites.push({
      id: config.tickets.supportRoleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    });
  }

  const channelOptions = {
    name: channelName,
    type: ChannelType.GuildText,
    permissionOverwrites,
    topic: `Support ticket for ${user.tag} | User ID: ${user.id}`,
  };

  if (categoryId) {
    try {
      const cat = await guild.channels.fetch(categoryId);
      if (cat) channelOptions.parent = categoryId;
    } catch {}
  }

  let ticketChannel;
  try {
    ticketChannel = await guild.channels.create(channelOptions);
  } catch (err) {
    console.error('[Tickets] Failed to create channel:', err.message);
    return interaction.reply({
      embeds: [buildEmbed('Error', 'Failed to create your ticket. Please contact a staff member.', config.embeds.errorColor)],
      ephemeral: true,
    });
  }

  activeTickets.set(ticketChannel.id, {
    userId: user.id,
    username: user.tag,
    createdAt: new Date(),
    aiEnabled: !!config.openaiKey,
  });

  const controlRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒'),
    new ButtonBuilder()
      .setCustomId('ticket_toggle_ai')
      .setLabel('Toggle AI')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🤖'),
    new ButtonBuilder()
      .setCustomId('ticket_transcript')
      .setLabel('Save Transcript')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📄'),
  );

  const welcomeEmbed = new EmbedBuilder()
    .setColor(config.embeds.color)
    .setTitle('🎫 Support Ticket')
    .addFields(
      { name: 'User', value: `<@${user.id}>`, inline: true },
      { name: 'Opened', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
    )
    .setDescription(
      `Welcome, <@${user.id}>! A staff member will assist you shortly.\n\n` +
      `${config.openaiKey ? '🤖 **AI Support is active** — ask questions while you wait for staff.\n\n' : ''}` +
      `Please describe your issue in as much detail as possible.`
    )
    .setTimestamp()
    .setFooter({ text: config.embeds.footer.text });

  if (config.embeds.banner) welcomeEmbed.setImage(config.embeds.banner);

  await ticketChannel.send({ content: `<@${user.id}>`, embeds: [welcomeEmbed], components: [controlRow] });

  await interaction.reply({
    embeds: [buildEmbed('✅ Ticket Created', `Your ticket has been created: <#${ticketChannel.id}>`, config.embeds.successColor)],
    ephemeral: true,
  });

  await logTicket(interaction.client, 'Opened', user, ticketChannel);
}

async function closeTicket(interaction) {
  const { channel } = interaction;
  const ticket = getTicketByChannel(channel.id);

  if (!ticket) {
    return interaction.reply({
      embeds: [buildEmbed('Error', 'This is not a ticket channel.', config.embeds.errorColor)],
      ephemeral: true,
    });
  }

  const confirmRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_confirm_close')
      .setLabel('Confirm Close')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒'),
    new ButtonBuilder()
      .setCustomId('ticket_cancel_close')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('✖️'),
  );

  await interaction.reply({
    embeds: [buildEmbed('🔒 Close Ticket', 'Are you sure you want to close this ticket? A transcript will be saved automatically.', config.embeds.warningColor)],
    components: [confirmRow],
    ephemeral: true,
  });
}

async function confirmCloseTicket(interaction) {
  const { channel, user } = interaction;
  const ticket = getTicketByChannel(channel.id);

  if (!ticket) {
    return interaction.reply({
      embeds: [buildEmbed('Error', 'This is not a ticket channel.', config.embeds.errorColor)],
      ephemeral: true,
    });
  }

  await interaction.update({ content: '📄 Saving transcript and closing ticket...', components: [], embeds: [] });

  await channel.send({
    embeds: [buildEmbed('🔒 Ticket Closing', `Closed by **${user.tag}**. Generating transcript, channel will be deleted in 10 seconds...`, config.embeds.errorColor)],
  });

  clearHistory(channel.id);
  activeTickets.delete(channel.id);

  await sendTranscript(interaction.client, channel, ticket, user);

  const ticketOwner = await interaction.client.users.fetch(ticket.userId).catch(() => null);
  if (ticketOwner) {
    await logTicket(interaction.client, 'Closed', ticketOwner, channel, { closedBy: user });
  }

  setTimeout(() => channel.delete().catch(() => {}), 10000);
}

async function saveTranscriptNow(interaction) {
  const ticket = getTicketByChannel(interaction.channel.id);
  if (!ticket) {
    return interaction.reply({
      embeds: [buildEmbed('Error', 'This is not a ticket channel.', config.embeds.errorColor)],
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const buf = await generateTranscript(interaction.channel, ticket);
  if (!buf) {
    return interaction.editReply({ embeds: [buildEmbed('Error', 'Failed to generate transcript.', config.embeds.errorColor)] });
  }

  const attachment = new AttachmentBuilder(buf, { name: `transcript-${interaction.channel.name}.txt` });
  await interaction.editReply({
    embeds: [buildEmbed('📄 Transcript Saved', 'Here is the current transcript of this ticket.', config.embeds.successColor)],
    files: [attachment],
  });
}

async function toggleAI(interaction) {
  const ticket = getTicketByChannel(interaction.channel.id);
  if (!ticket) {
    return interaction.reply({
      embeds: [buildEmbed('Error', 'This is not a ticket channel.', config.embeds.errorColor)],
      ephemeral: true,
    });
  }

  if (!config.openaiKey) {
    return interaction.reply({
      embeds: [buildEmbed('AI Not Configured', 'OpenAI API key is not set up.', config.embeds.warningColor)],
      ephemeral: true,
    });
  }

  ticket.aiEnabled = !ticket.aiEnabled;
  activeTickets.set(interaction.channel.id, ticket);

  return interaction.reply({
    embeds: [buildEmbed(
      ticket.aiEnabled ? '🤖 AI Support Enabled' : '🤖 AI Support Disabled',
      ticket.aiEnabled ? 'AI will now respond to messages in this ticket.' : 'AI support has been disabled for this ticket.',
      ticket.aiEnabled ? config.embeds.successColor : config.embeds.warningColor,
    )],
    ephemeral: true,
  });
}

async function sendTicketPanel(channel) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_create')
      .setLabel('Open a Ticket')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎫'),
  );

  const embed = new EmbedBuilder()
    .setColor(config.embeds.color)
    .setTitle('🎫 Support Tickets')
    .setDescription(
      'Need help? Click the button below to open a support ticket.\nA staff member will assist you as soon as possible.\n\n' +
      '**Before opening a ticket:**\n' +
      '• Describe your issue clearly\n' +
      '• Include any relevant screenshots\n' +
      '• Be patient while staff respond'
    )
    .setTimestamp()
    .setFooter({ text: config.embeds.footer.text });

  if (config.embeds.banner) embed.setImage(config.embeds.banner);

  await channel.send({ embeds: [embed], components: [row] });
}

module.exports = {
  createTicket,
  closeTicket,
  confirmCloseTicket,
  saveTranscriptNow,
  toggleAI,
  sendTicketPanel,
  getTicketByChannel,
  getTicketByUser,
};

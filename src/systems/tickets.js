const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const config = require('../../config');
const { buildEmbed } = require('../utils/logger');
const { logTicket } = require('../utils/logger');
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

async function createTicket(interaction) {
  const { guild, user } = interaction;

  const existing = getTicketByUser(user.id);
  if (existing) {
    const ch = guild.channels.cache.get(existing.channelId);
    return interaction.reply({
      embeds: [buildEmbed('Ticket Already Open', `You already have an open ticket: <#${existing.channelId}>`, config.embeds.warningColor)],
      ephemeral: true,
    });
  }

  const categoryId = config.tickets.categoryId;
  const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;

  const permissionOverwrites = [
    {
      id: guild.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: user.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    },
    {
      id: interaction.client.user.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
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

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒'),
    new ButtonBuilder()
      .setCustomId('ticket_toggle_ai')
      .setLabel('Toggle AI Support')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🤖'),
  );

  const welcomeEmbed = new EmbedBuilder()
    .setColor(config.embeds.color)
    .setTitle('🎫 Support Ticket')
    .setDescription(
      `Welcome, <@${user.id}>! A staff member will assist you shortly.\n\n` +
      `${config.openaiKey ? '🤖 **AI Support is active** — you can ask questions while you wait.\n\n' : ''}` +
      `Please describe your issue in detail.`
    )
    .setTimestamp()
    .setFooter({ text: config.embeds.footer.text });

  if (config.embeds.banner) welcomeEmbed.setImage(config.embeds.banner);

  await ticketChannel.send({ content: `<@${user.id}>`, embeds: [welcomeEmbed], components: [closeRow] });

  await interaction.reply({
    embeds: [buildEmbed('Ticket Created', `Your ticket has been created: <#${ticketChannel.id}>`, config.embeds.successColor)],
    ephemeral: true,
  });

  await logTicket(interaction.client, 'Opened', user, ticketChannel);
}

async function closeTicket(interaction) {
  const { channel, user } = interaction;
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
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('ticket_cancel_close')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.reply({
    embeds: [buildEmbed('Close Ticket', 'Are you sure you want to close this ticket?', config.embeds.warningColor)],
    components: [confirmRow],
    ephemeral: true,
  });
}

async function confirmCloseTicket(interaction) {
  const { channel, user, guild } = interaction;
  const ticket = getTicketByChannel(channel.id);

  if (!ticket) {
    return interaction.reply({
      embeds: [buildEmbed('Error', 'This is not a ticket channel.', config.embeds.errorColor)],
      ephemeral: true,
    });
  }

  await interaction.update({ content: '🔒 Closing ticket...', components: [], embeds: [] });

  clearHistory(channel.id);
  activeTickets.delete(channel.id);

  const ticketOwner = await interaction.client.users.fetch(ticket.userId).catch(() => null);
  if (ticketOwner) {
    await logTicket(interaction.client, 'Closed', ticketOwner, channel, { closedBy: user });
    try {
      await ticketOwner.send({
        embeds: [buildEmbed('Ticket Closed', `Your ticket **${channel.name}** has been closed by ${user.tag}.`, config.embeds.color)],
      });
    } catch {}
  }

  await channel.send({
    embeds: [buildEmbed('Ticket Closed', `This ticket has been closed by ${user.tag}. Channel will be deleted in 5 seconds.`, config.embeds.errorColor)],
  });

  setTimeout(() => channel.delete().catch(() => {}), 5000);
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
      ticket.aiEnabled ? 'AI will now respond to messages in this ticket.' : 'AI has been disabled for this ticket.',
      ticket.aiEnabled ? config.embeds.successColor : config.embeds.warningColor
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
    .setDescription('Click the button below to open a support ticket. A staff member will assist you as soon as possible.')
    .setTimestamp()
    .setFooter({ text: config.embeds.footer.text });

  if (config.embeds.banner) embed.setImage(config.embeds.banner);

  await channel.send({ embeds: [embed], components: [row] });
}

module.exports = {
  createTicket,
  closeTicket,
  confirmCloseTicket,
  toggleAI,
  sendTicketPanel,
  getTicketByChannel,
  getTicketByUser,
};

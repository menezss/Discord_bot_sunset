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

const ticketsAtivos = new Map();

function getTicketPorUsuario(userId) {
  for (const [channelId, dados] of ticketsAtivos.entries()) {
    if (dados.userId === userId) return { channelId, ...dados };
  }
  return null;
}

function getTicketPorCanal(channelId) {
  return ticketsAtivos.get(channelId) || null;
}

async function gerarTranscrito(canal, ticket) {
  try {
    const mensagens = [];
    let lastId;

    while (true) {
      const opts = { limit: 100 };
      if (lastId) opts.before = lastId;
      const lote = await canal.messages.fetch(opts);
      if (lote.size === 0) break;
      mensagens.push(...lote.values());
      lastId = lote.last().id;
      if (lote.size < 100) break;
    }

    mensagens.reverse();

    const linhas = [
      `═══════════════════════════════════════════════`,
      `  TRANSCRITO DO TICKET`,
      `═══════════════════════════════════════════════`,
      `  Ticket:    ${canal.name}`,
      `  Usuário:   ${ticket.username} (${ticket.userId})`,
      `  Aberto:    ${new Date(ticket.criadoEm).toLocaleString('pt-BR')}`,
      `  Fechado:   ${new Date().toLocaleString('pt-BR')}`,
      `  Mensagens: ${mensagens.length}`,
      `═══════════════════════════════════════════════`,
      '',
    ];

    for (const msg of mensagens) {
      if (msg.author.bot && msg.embeds.length > 0 && !msg.content) {
        const e = msg.embeds[0];
        linhas.push(`[${new Date(msg.createdTimestamp).toLocaleString('pt-BR')}] [BOT EMBED] ${e.title || ''}: ${e.description || ''}`);
      } else if (msg.content) {
        linhas.push(`[${new Date(msg.createdTimestamp).toLocaleString('pt-BR')}] ${msg.author.tag}: ${msg.content}`);
      }
      if (msg.attachments.size > 0) {
        for (const anexo of msg.attachments.values()) {
          linhas.push(`  [Anexo] ${anexo.name}: ${anexo.url}`);
        }
      }
    }

    linhas.push('', `═══════════════════════════════════════════════`);
    linhas.push(`  Fim do transcrito`);
    linhas.push(`═══════════════════════════════════════════════`);

    return Buffer.from(linhas.join('\n'), 'utf-8');
  } catch (err) {
    console.error('[Tickets] Falha ao gerar transcrito:', err.message);
    return null;
  }
}

async function enviarTranscrito(client, canal, ticket, fechadoPor) {
  const canalTranscritoId = config.tickets.transcriptChannelId || config.logs.ticketChannelId || config.logs.channelId;
  const buf = await gerarTranscrito(canal, ticket);
  if (!buf) return;

  const anexo = new AttachmentBuilder(buf, { name: `transcrito-${canal.name}.txt` });

  const embedTranscrito = new EmbedBuilder()
    .setColor(config.embeds.color)
    .setTitle('📄 Transcrito do Ticket')
    .setDescription(`Transcrito de **${canal.name}**`)
    .addFields(
      { name: 'Usuário', value: `${ticket.username} (<@${ticket.userId}>)`, inline: true },
      { name: 'Fechado Por', value: fechadoPor ? `${fechadoPor.tag}` : 'Desconhecido', inline: true },
      { name: 'Aberto em', value: `<t:${Math.floor(new Date(ticket.criadoEm).getTime() / 1000)}:F>`, inline: false },
      { name: 'Fechado em', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
    )
    .setTimestamp()
    .setFooter({ text: config.embeds.footer.text });

  if (canalTranscritoId) {
    try {
      const canalDestino = await client.channels.fetch(canalTranscritoId);
      if (canalDestino?.isTextBased()) {
        await canalDestino.send({ embeds: [embedTranscrito], files: [anexo] });
      }
    } catch (err) {
      console.error('[Tickets] Falha ao enviar transcrito para o canal:', err.message);
    }
  }

  const donoDaTicket = await client.users.fetch(ticket.userId).catch(() => null);
  if (donoDaTicket) {
    try {
      const bufDm = await gerarTranscrito(canal, ticket);
      if (bufDm) {
        const anexoDm = new AttachmentBuilder(bufDm, { name: `transcrito-${canal.name}.txt` });
        await donoDaTicket.send({
          embeds: [buildEmbed('📄 Transcrito do Seu Ticket', `Seu ticket **${canal.name}** foi fechado. O transcrito está em anexo.`, config.embeds.color)],
          files: [anexoDm],
        });
      }
    } catch {}
  }
}

async function criarTicket(interaction) {
  const { guild, user } = interaction;

  const existente = getTicketPorUsuario(user.id);
  if (existente) {
    return interaction.reply({
      embeds: [buildEmbed('Ticket Já Aberto', `Você já possui um ticket aberto: <#${existente.channelId}>`, config.embeds.warningColor)],
      ephemeral: true,
    });
  }

  const categoryId = config.tickets.categoryId;
  const nomeCanal = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;

  const permissoes = [
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
    permissoes.push({
      id: config.tickets.supportRoleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    });
  }

  const opcoesCanal = {
    name: nomeCanal,
    type: ChannelType.GuildText,
    permissionOverwrites: permissoes,
    topic: `Ticket de suporte de ${user.tag} | ID: ${user.id}`,
  };

  if (categoryId) {
    try {
      const categoria = await guild.channels.fetch(categoryId);
      if (categoria) opcoesCanal.parent = categoryId;
    } catch {}
  }

  let canalTicket;
  try {
    canalTicket = await guild.channels.create(opcoesCanal);
  } catch (err) {
    console.error('[Tickets] Falha ao criar canal:', err.message);
    return interaction.reply({
      embeds: [buildEmbed('Erro', 'Falha ao criar o ticket. Entre em contato com um membro da equipe.', config.embeds.errorColor)],
      ephemeral: true,
    });
  }

  ticketsAtivos.set(canalTicket.id, {
    userId: user.id,
    username: user.tag,
    criadoEm: new Date(),
    iaAtivada: !!config.openaiKey,
  });

  const botoesControle = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_fechar')
      .setLabel('Fechar Ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒'),
    new ButtonBuilder()
      .setCustomId('ticket_alternar_ia')
      .setLabel('Alternar IA')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🤖'),
    new ButtonBuilder()
      .setCustomId('ticket_transcrito')
      .setLabel('Salvar Transcrito')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📄'),
  );

  const embedBemVindo = new EmbedBuilder()
    .setColor(config.embeds.color)
    .setTitle('🎫 Ticket de Suporte')
    .addFields(
      { name: 'Usuário', value: `<@${user.id}>`, inline: true },
      { name: 'Aberto em', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
    )
    .setDescription(
      `Olá, <@${user.id}>! Um membro da equipe irá te atender em breve.\n\n` +
      `${config.openaiKey ? '🤖 **Suporte com IA está ativo** — você pode fazer perguntas enquanto aguarda a equipe.\n\n' : ''}` +
      `Descreva seu problema com o máximo de detalhes possível.`
    )
    .setTimestamp()
    .setFooter({ text: config.embeds.footer.text });

  if (config.embeds.banner) embedBemVindo.setImage(config.embeds.banner);

  await canalTicket.send({ content: `<@${user.id}>`, embeds: [embedBemVindo], components: [botoesControle] });

  await interaction.reply({
    embeds: [buildEmbed('✅ Ticket Criado', `Seu ticket foi criado: <#${canalTicket.id}>`, config.embeds.successColor)],
    ephemeral: true,
  });

  await logTicket(interaction.client, 'Aberto', user, canalTicket);
}

async function fecharTicket(interaction) {
  const { channel } = interaction;
  const ticket = getTicketPorCanal(channel.id);

  if (!ticket) {
    return interaction.reply({
      embeds: [buildEmbed('Erro', 'Este não é um canal de ticket.', config.embeds.errorColor)],
      ephemeral: true,
    });
  }

  const botoesConfirmar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_confirmar_fechar')
      .setLabel('Confirmar Fechamento')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒'),
    new ButtonBuilder()
      .setCustomId('ticket_cancelar_fechar')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('✖️'),
  );

  await interaction.reply({
    embeds: [buildEmbed('🔒 Fechar Ticket', 'Tem certeza que deseja fechar este ticket? Um transcrito será salvo automaticamente.', config.embeds.warningColor)],
    components: [botoesConfirmar],
    ephemeral: true,
  });
}

async function confirmarFecharTicket(interaction) {
  const { channel, user } = interaction;
  const ticket = getTicketPorCanal(channel.id);

  if (!ticket) {
    return interaction.reply({
      embeds: [buildEmbed('Erro', 'Este não é um canal de ticket.', config.embeds.errorColor)],
      ephemeral: true,
    });
  }

  await interaction.update({ content: '📄 Salvando transcrito e fechando ticket...', components: [], embeds: [] });

  await channel.send({
    embeds: [buildEmbed('🔒 Ticket Sendo Fechado', `Fechado por **${user.tag}**. Gerando transcrito, o canal será deletado em 10 segundos...`, config.embeds.errorColor)],
  });

  clearHistory(channel.id);
  ticketsAtivos.delete(channel.id);

  await enviarTranscrito(interaction.client, channel, ticket, user);

  const donoTicket = await interaction.client.users.fetch(ticket.userId).catch(() => null);
  if (donoTicket) {
    await logTicket(interaction.client, 'Fechado', donoTicket, channel, { closedBy: user });
  }

  setTimeout(() => channel.delete().catch(() => {}), 10000);
}

async function salvarTranscritoAgora(interaction) {
  const ticket = getTicketPorCanal(interaction.channel.id);
  if (!ticket) {
    return interaction.reply({
      embeds: [buildEmbed('Erro', 'Este não é um canal de ticket.', config.embeds.errorColor)],
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const buf = await gerarTranscrito(interaction.channel, ticket);
  if (!buf) {
    return interaction.editReply({ embeds: [buildEmbed('Erro', 'Falha ao gerar o transcrito.', config.embeds.errorColor)] });
  }

  const anexo = new AttachmentBuilder(buf, { name: `transcrito-${interaction.channel.name}.txt` });
  await interaction.editReply({
    embeds: [buildEmbed('📄 Transcrito Salvo', 'Aqui está o transcrito atual deste ticket.', config.embeds.successColor)],
    files: [anexo],
  });
}

async function alternarIA(interaction) {
  const ticket = getTicketPorCanal(interaction.channel.id);
  if (!ticket) {
    return interaction.reply({
      embeds: [buildEmbed('Erro', 'Este não é um canal de ticket.', config.embeds.errorColor)],
      ephemeral: true,
    });
  }

  if (!config.openaiKey) {
    return interaction.reply({
      embeds: [buildEmbed('IA Não Configurada', 'A chave da API OpenAI não está configurada.', config.embeds.warningColor)],
      ephemeral: true,
    });
  }

  ticket.iaAtivada = !ticket.iaAtivada;
  ticketsAtivos.set(interaction.channel.id, ticket);

  return interaction.reply({
    embeds: [buildEmbed(
      ticket.iaAtivada ? '🤖 Suporte com IA Ativado' : '🤖 Suporte com IA Desativado',
      ticket.iaAtivada ? 'A IA irá responder às mensagens neste ticket.' : 'O suporte com IA foi desativado para este ticket.',
      ticket.iaAtivada ? config.embeds.successColor : config.embeds.warningColor,
    )],
    ephemeral: true,
  });
}

async function enviarPainelTicket(canal) {
  const botao = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_criar')
      .setLabel('Abrir Ticket')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎫'),
  );

  const embed = new EmbedBuilder()
    .setColor(config.embeds.color)
    .setTitle('🎫 Suporte via Tickets')
    .setDescription(
      'Precisa de ajuda? Clique no botão abaixo para abrir um ticket de suporte.\nUm membro da equipe irá te atender o mais breve possível.\n\n' +
      '**Antes de abrir um ticket:**\n' +
      '• Descreva seu problema com clareza\n' +
      '• Inclua capturas de tela relevantes\n' +
      '• Seja paciente enquanto a equipe responde'
    )
    .setTimestamp()
    .setFooter({ text: config.embeds.footer.text });

  if (config.embeds.banner) embed.setImage(config.embeds.banner);

  await canal.send({ embeds: [embed], components: [botao] });
}

module.exports = {
  criarTicket,
  fecharTicket,
  confirmarFecharTicket,
  salvarTranscritoAgora,
  alternarIA,
  enviarPainelTicket,
  getTicketPorCanal,
  getTicketPorUsuario,
};

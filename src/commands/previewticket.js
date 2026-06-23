const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const { getConfig } = require('../systems/ticketConfig');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('previewticket')
    .setDescription('Mostra uma prévia do painel de ticket antes de publicar.'),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.admin)) {
      return interaction.reply({
        embeds: [embed.erro('Sem Permissão', 'Apenas **Administradores** e **Donos** podem ver a prévia dos tickets.')],
        ephemeral: true,
      });
    }

    const cfg = getConfig();

    // Botão de prévia (desativado para mostrar visual)
    const botao = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_preview_disabled')
        .setLabel(cfg.texto_botao || 'Abrir Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(cfg.emoji_botao || '🎫')
        .setDisabled(true),
    );

    const painelEmbed = new EmbedBuilder()
      .setTitle(cfg.titulo || '🎫 Suporte via Tickets')
      .setDescription(cfg.descricao || '*Sem descrição configurada*')
      .setColor(cfg.cor || '#5865F2')
      .setTimestamp()
      .setFooter({ text: `${cfg.rodape || 'Sunset Bot'} • PRÉVIA — não é o painel real` });

    if (cfg.banner) painelEmbed.setImage(cfg.banner);
    if (cfg.thumbnail) painelEmbed.setThumbnail(cfg.thumbnail);

    const avisoEmbed = embed.aviso(
      '👁️ Prévia do Painel de Tickets',
      'Esta é uma **prévia**. O botão está desativado — use **/publicarticket** para publicar o painel real no canal atual.',
      [
        {
          name: '📋 Resumo da configuração',
          value: [
            `**Cor:** ${cfg.cor || '`padrão`'}`,
            `**Botão:** ${cfg.emoji_botao || '🎫'} ${cfg.texto_botao || 'Abrir Ticket'}`,
            `**Banner:** ${cfg.banner ? '✅ Configurado' : '❌ Não definido'}`,
            `**Thumbnail:** ${cfg.thumbnail ? '✅ Configurado' : '❌ Não definido'}`,
            `**Categoria:** ${cfg.categoria_ticket ? `\`${cfg.categoria_ticket}\`` : '❌ Não definida'}`,
            `**Canal de logs:** ${cfg.canal_logs ? `<#${cfg.canal_logs}>` : '❌ Não definido'}`,
            `**Transcritos:** ${cfg.canal_transcripts ? `<#${cfg.canal_transcripts}>` : '❌ Não definido'}`,
          ].join('\n'),
          inline: false,
        },
      ]
    );

    return interaction.reply({
      embeds: [avisoEmbed, painelEmbed],
      components: [botao],
      ephemeral: true,
    });
  },
};

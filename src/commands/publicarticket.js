const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const { getConfig } = require('../systems/ticketConfig');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('publicarticket')
    .setDescription('Publica o painel de tickets no canal atual.'),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.admin)) {
      return interaction.reply({
        embeds: [embed.erro('Sem Permissão', 'Apenas **Administradores** e **Donos** podem publicar o painel de tickets.')],
        ephemeral: true,
      });
    }

    const cfg = getConfig();

    const botao = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_criar')
        .setLabel(cfg.texto_botao || 'Abrir Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(cfg.emoji_botao || '🎫'),
    );

    const painelEmbed = new EmbedBuilder()
      .setTitle(cfg.titulo || '🎫 Suporte via Tickets')
      .setDescription(cfg.descricao || 'Clique no botão abaixo para abrir um ticket.')
      .setColor(cfg.cor || '#5865F2')
      .setTimestamp()
      .setFooter({ text: cfg.rodape || 'Sunset Bot' });

    if (cfg.banner) painelEmbed.setImage(cfg.banner);
    if (cfg.thumbnail) painelEmbed.setThumbnail(cfg.thumbnail);

    try {
      await interaction.channel.send({ embeds: [painelEmbed], components: [botao] });
      return interaction.reply({
        embeds: [embed.sucesso('Painel Publicado', `O painel de tickets foi publicado em <#${interaction.channel.id}> com sucesso.\n\nUse **/configticket** para alterar as configurações e **/publicarticket** novamente para publicar uma versão atualizada.`)],
        ephemeral: true,
      });
    } catch (err) {
      console.error('[PublicarTicket]', err.message);
      return interaction.reply({
        embeds: [embed.erro('Erro ao Publicar', `Falha ao enviar o painel: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};

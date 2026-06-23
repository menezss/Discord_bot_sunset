const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const { getConfig } = require('../systems/ticketConfig');
const embed = require('../utils/embed');

function fmt(valor, tipo = 'texto') {
  if (valor === null || valor === undefined || valor === '') return '*não definido*';
  if (tipo === 'url') return `[Ver imagem](${valor})`;
  if (tipo === 'canal') return `<#${valor}>`;
  if (tipo === 'cat') return `\`${valor}\``;
  return `\`${valor}\``;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verticketconfig')
    .setDescription('Mostra a configuração atual do painel de tickets.'),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.admin)) {
      return interaction.reply({
        embeds: [embed.erro('Sem Permissão', 'Apenas **Administradores** e **Donos** podem ver a configuração dos tickets.')],
        ephemeral: true,
      });
    }

    const cfg = getConfig();

    const e = new EmbedBuilder()
      .setColor(cfg.cor || '#5865F2')
      .setTitle('⚙️ Configuração Atual do Ticket')
      .setDescription('Veja abaixo todas as configurações do painel de tickets. Use **/configticket** para alterar.')
      .addFields(
        { name: '📝 Título', value: fmt(cfg.titulo), inline: true },
        { name: '🎨 Cor', value: fmt(cfg.cor), inline: true },
        { name: '🔖 Rodapé', value: fmt(cfg.rodape), inline: true },
        { name: '🖼️ Banner', value: fmt(cfg.banner, 'url'), inline: true },
        { name: '🖼️ Thumbnail', value: fmt(cfg.thumbnail, 'url'), inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: '🔘 Texto do Botão', value: fmt(cfg.texto_botao), inline: true },
        { name: '😀 Emoji do Botão', value: cfg.emoji_botao || '*não definido*', inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: '📁 Categoria dos Tickets', value: fmt(cfg.categoria_ticket, 'cat'), inline: true },
        { name: '📋 Canal de Logs', value: cfg.canal_logs ? fmt(cfg.canal_logs, 'canal') : '*não definido*', inline: true },
        { name: '📄 Canal de Transcritos', value: cfg.canal_transcripts ? fmt(cfg.canal_transcripts, 'canal') : '*não definido*', inline: true },
        {
          name: '💬 Descrição do Painel',
          value: cfg.descricao ? `\`\`\`${cfg.descricao.slice(0, 200)}${cfg.descricao.length > 200 ? '...' : ''}\`\`\`` : '*não definida*',
          inline: false,
        },
        {
          name: '📩 Mensagem de Abertura',
          value: cfg.mensagem_abertura ? `\`\`\`${cfg.mensagem_abertura.slice(0, 200)}${cfg.mensagem_abertura.length > 200 ? '...' : ''}\`\`\`` : '*não definida*',
          inline: false,
        },
        {
          name: '🔒 Mensagem de Fechamento',
          value: cfg.mensagem_fechamento ? `\`\`\`${cfg.mensagem_fechamento.slice(0, 200)}${cfg.mensagem_fechamento.length > 200 ? '...' : ''}\`\`\`` : '*não definida*',
          inline: false,
        },
      )
      .setTimestamp()
      .setFooter({ text: 'Use /configticket para editar • /previewticket para prévia' });

    if (cfg.thumbnail) e.setThumbnail(cfg.thumbnail);

    return interaction.reply({ embeds: [e], ephemeral: true });
  },
};

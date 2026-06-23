const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const embed = require('../utils/embed');

const HEX_REGEX = /^#([0-9A-Fa-f]{6})$/;
const URL_REGEX = /^https?:\/\/.+\..+/;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('enviar')
    .setDescription('Envia uma mensagem em embed personalizada para um canal.')
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('Canal onde a mensagem será enviada')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('titulo')
        .setDescription('Título da embed')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('descricao')
        .setDescription('Descrição da embed (use \\n para quebra de linha)')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('cor')
        .setDescription('Cor em HEX, ex: #5865F2 (padrão: cor do bot)')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('imagem')
        .setDescription('URL da imagem grande (banner inferior da embed)')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('thumbnail')
        .setDescription('URL da imagem pequena (canto superior direito)')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('rodape')
        .setDescription('Texto do rodapé da embed')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('botao_texto')
        .setDescription('Texto do botão de link (requer botao_link)')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('botao_link')
        .setDescription('URL do botão (requer botao_texto)')
        .setRequired(false)),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.admin)) {
      return interaction.reply({
        embeds: [embed.erro('Sem Permissão', 'Apenas **Administradores** e **Donos** podem usar este comando.')],
        ephemeral: true,
      });
    }

    const canal = interaction.options.getChannel('canal');
    const titulo = interaction.options.getString('titulo');
    const descricao = interaction.options.getString('descricao').replace(/\\n/g, '\n');
    const cor = interaction.options.getString('cor');
    const imagem = interaction.options.getString('imagem');
    const thumbnail = interaction.options.getString('thumbnail');
    const rodape = interaction.options.getString('rodape');
    const botaoTexto = interaction.options.getString('botao_texto');
    const botaoLink = interaction.options.getString('botao_link');

    const erros = [];

    // Validações
    if (cor) {
      const corNorm = cor.startsWith('#') ? cor : `#${cor}`;
      if (!HEX_REGEX.test(corNorm)) erros.push('`cor`: Formato inválido. Use HEX, ex: `#5865F2`');
    }
    if (imagem && !URL_REGEX.test(imagem)) erros.push('`imagem`: URL inválida. Deve começar com http:// ou https://');
    if (thumbnail && !URL_REGEX.test(thumbnail)) erros.push('`thumbnail`: URL inválida. Deve começar com http:// ou https://');
    if (botaoTexto && !botaoLink) erros.push('`botao_link`: Obrigatório quando `botao_texto` é informado.');
    if (botaoLink && !botaoTexto) erros.push('`botao_texto`: Obrigatório quando `botao_link` é informado.');
    if (botaoLink && !URL_REGEX.test(botaoLink)) erros.push('`botao_link`: URL inválida. Deve começar com http:// ou https://');

    if (!canal.isTextBased()) erros.push('`canal`: O canal selecionado não é um canal de texto.');

    if (erros.length > 0) {
      return interaction.reply({
        embeds: [embed.erro('Erros de Validação', erros.join('\n'))],
        ephemeral: true,
      });
    }

    // Constrói a embed
    const corFinal = cor ? (cor.startsWith('#') ? cor : `#${cor}`) : '#5865F2';

    const embedMensagem = new EmbedBuilder()
      .setTitle(titulo)
      .setDescription(descricao)
      .setColor(corFinal)
      .setTimestamp();

    if (rodape) embedMensagem.setFooter({ text: rodape });
    if (imagem) embedMensagem.setImage(imagem);
    if (thumbnail) embedMensagem.setThumbnail(thumbnail);

    // Constrói componentes
    const componentes = [];
    if (botaoTexto && botaoLink) {
      const linha = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(botaoTexto)
          .setStyle(ButtonStyle.Link)
          .setURL(botaoLink),
      );
      componentes.push(linha);
    }

    try {
      await canal.send({ embeds: [embedMensagem], components: componentes });

      return interaction.reply({
        embeds: [embed.sucesso(
          'Mensagem Enviada',
          `Sua mensagem foi enviada para <#${canal.id}> com sucesso.`,
          [
            { name: '📝 Título', value: titulo, inline: true },
            { name: '🎨 Cor', value: `\`${corFinal}\``, inline: true },
            { name: '🖼️ Imagem', value: imagem ? '✅ Incluída' : '—', inline: true },
            { name: '🖼️ Thumbnail', value: thumbnail ? '✅ Incluída' : '—', inline: true },
            { name: '🔘 Botão', value: botaoTexto ? `✅ "${botaoTexto}"` : '—', inline: true },
          ]
        )],
        ephemeral: true,
      });
    } catch (err) {
      console.error('[Enviar]', err.message);
      return interaction.reply({
        embeds: [embed.erro('Erro ao Enviar', `Não foi possível enviar a mensagem para <#${canal.id}>.\n\`${err.message}\`\n\nVerifique se o bot tem permissão para enviar mensagens neste canal.`)],
        ephemeral: true,
      });
    }
  },
};

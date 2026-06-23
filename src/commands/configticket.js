const { SlashCommandBuilder } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const { salvarConfig, getConfig } = require('../systems/ticketConfig');
const embed = require('../utils/embed');

const HEX_REGEX = /^#([0-9A-Fa-f]{6})$/;
const URL_REGEX = /^https?:\/\/.+\..+/;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configticket')
    .setDescription('Configura a embed e o comportamento do painel de tickets.')
    .addStringOption(opt => opt.setName('titulo').setDescription('Título da embed do painel').setRequired(false))
    .addStringOption(opt => opt.setName('descricao').setDescription('Descrição da embed (use \\n para nova linha)').setRequired(false))
    .addStringOption(opt => opt.setName('cor').setDescription('Cor em HEX, ex: #5865F2').setRequired(false))
    .addStringOption(opt => opt.setName('rodape').setDescription('Texto do rodapé da embed').setRequired(false))
    .addStringOption(opt => opt.setName('banner').setDescription('URL da imagem de banner (ou "remover")').setRequired(false))
    .addStringOption(opt => opt.setName('thumbnail').setDescription('URL da imagem thumbnail (ou "remover")').setRequired(false))
    .addStringOption(opt => opt.setName('texto_botao').setDescription('Texto do botão de abrir ticket').setRequired(false))
    .addStringOption(opt => opt.setName('emoji_botao').setDescription('Emoji do botão de abrir ticket').setRequired(false))
    .addStringOption(opt => opt.setName('mensagem_abertura').setDescription('Mensagem enviada ao abrir ticket (use {usuario} para mencionar)').setRequired(false))
    .addStringOption(opt => opt.setName('mensagem_fechamento').setDescription('Mensagem enviada ao fechar ticket').setRequired(false))
    .addStringOption(opt => opt.setName('categoria_ticket').setDescription('ID da categoria onde os tickets são criados (ou "remover")').setRequired(false))
    .addStringOption(opt => opt.setName('canal_logs').setDescription('ID do canal de logs de tickets (ou "remover")').setRequired(false))
    .addStringOption(opt => opt.setName('canal_transcripts').setDescription('ID do canal de transcritos (ou "remover")').setRequired(false)),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.admin)) {
      return interaction.reply({
        embeds: [embed.erro('Sem Permissão', 'Apenas **Administradores** e **Donos** podem configurar os tickets.')],
        ephemeral: true,
      });
    }

    const opcoes = {
      titulo: interaction.options.getString('titulo'),
      descricao: interaction.options.getString('descricao'),
      cor: interaction.options.getString('cor'),
      rodape: interaction.options.getString('rodape'),
      banner: interaction.options.getString('banner'),
      thumbnail: interaction.options.getString('thumbnail'),
      texto_botao: interaction.options.getString('texto_botao'),
      emoji_botao: interaction.options.getString('emoji_botao'),
      mensagem_abertura: interaction.options.getString('mensagem_abertura'),
      mensagem_fechamento: interaction.options.getString('mensagem_fechamento'),
      categoria_ticket: interaction.options.getString('categoria_ticket'),
      canal_logs: interaction.options.getString('canal_logs'),
      canal_transcripts: interaction.options.getString('canal_transcripts'),
    };

    // Filtra apenas os campos fornecidos
    const atualizacoes = {};
    const erros = [];
    const alterados = [];

    for (const [chave, valor] of Object.entries(opcoes)) {
      if (valor === null) continue;

      // Campos de URL: valida ou permite "remover"
      if (['banner', 'thumbnail'].includes(chave)) {
        if (valor.toLowerCase() === 'remover') {
          atualizacoes[chave] = null;
          alterados.push(`**${chave}** → *removido*`);
        } else if (!URL_REGEX.test(valor)) {
          erros.push(`\`${chave}\`: URL inválida — deve começar com http:// ou https://`);
        } else {
          atualizacoes[chave] = valor;
          alterados.push(`**${chave}** → \`${valor.slice(0, 60)}${valor.length > 60 ? '...' : ''}\``);
        }
        continue;
      }

      // Campos de ID de canal: valida ou permite "remover"
      if (['categoria_ticket', 'canal_logs', 'canal_transcripts'].includes(chave)) {
        if (valor.toLowerCase() === 'remover') {
          atualizacoes[chave] = null;
          alterados.push(`**${chave}** → *removido*`);
        } else if (!/^\d{17,20}$/.test(valor)) {
          erros.push(`\`${chave}\`: ID inválido — deve ter 17-20 dígitos numéricos`);
        } else {
          atualizacoes[chave] = valor;
          alterados.push(`**${chave}** → \`${valor}\``);
        }
        continue;
      }

      // Cor HEX
      if (chave === 'cor') {
        const corNorm = valor.startsWith('#') ? valor : `#${valor}`;
        if (!HEX_REGEX.test(corNorm)) {
          erros.push(`\`cor\`: Formato inválido — use HEX, ex: \`#5865F2\``);
        } else {
          atualizacoes[chave] = corNorm;
          alterados.push(`**cor** → \`${corNorm}\``);
        }
        continue;
      }

      // Texto simples
      atualizacoes[chave] = valor.replace(/\\n/g, '\n');
      alterados.push(`**${chave}** → \`${valor.slice(0, 80)}${valor.length > 80 ? '...' : ''}\``);
    }

    if (erros.length > 0 && alterados.length === 0) {
      return interaction.reply({
        embeds: [embed.erro('Erros de Validação', erros.join('\n'))],
        ephemeral: true,
      });
    }

    if (Object.keys(atualizacoes).length === 0) {
      const cfg = getConfig();
      return interaction.reply({
        embeds: [embed.aviso('Nenhuma Alteração', `Nenhum campo foi fornecido.\n\nUse **/verticketconfig** para ver a configuração atual ou **/previewticket** para prévia.\n\n💡 Use \`"remover"\` em campos de URL ou ID para limpá-los.`)],
        ephemeral: true,
      });
    }

    salvarConfig(atualizacoes);

    const campos = [
      { name: '✅ Campos atualizados', value: alterados.join('\n'), inline: false },
    ];

    if (erros.length > 0) {
      campos.push({ name: '⚠️ Campos com erro (ignorados)', value: erros.join('\n'), inline: false });
    }

    campos.push({
      name: '💡 Próximos passos',
      value: 'Use **/previewticket** para ver a prévia e **/publicarticket** para publicar no canal.',
      inline: false,
    });

    return interaction.reply({
      embeds: [embed.sucesso('Configuração Salva', `**${alterados.length}** campo(s) atualizado(s) com sucesso.`, campos)],
      ephemeral: true,
    });
  },
};

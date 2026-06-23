const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const { salvarConfig, getConfig } = require('../systems/logConfig');
const embed = require('../utils/embed');

const HEX_REGEX = /^#([0-9A-Fa-f]{6})$/;

function validarId(valor) {
  if (!valor) return null;
  if (valor.toLowerCase() === 'remover') return 'remover';
  const id = valor.replace(/[<#>]/g, '');
  return /^\d{17,20}$/.test(id) ? id : null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configlogs')
    .setDescription('Configura os canais e mensagens de log de entrada e saída de membros.')
    .addStringOption(opt =>
      opt.setName('canal_entrada')
        .setDescription('ID ou #canal para logs de entrada de membros (ou "remover")')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('canal_saida')
        .setDescription('ID ou #canal para logs de saída de membros (ou "remover")')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('canal_geral')
        .setDescription('ID ou #canal de log geral (fallback para outros logs, ou "remover")')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('canal_moderacao')
        .setDescription('ID ou #canal para logs de moderação (ou "remover")')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('mensagem_entrada')
        .setDescription('Mensagem de boas-vindas. Use {usuario}, {nome}, {servidor}')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('mensagem_saida')
        .setDescription('Mensagem de despedida. Use {usuario}, {nome}, {servidor}')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('cor_entrada')
        .setDescription('Cor da embed de entrada em HEX, ex: #57F287')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('cor_saida')
        .setDescription('Cor da embed de saída em HEX, ex: #ED4245')
        .setRequired(false)),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.admin)) {
      return interaction.reply({
        embeds: [embed.erro('Sem Permissão', 'Apenas **Administradores** e **Donos** podem configurar os logs.')],
        ephemeral: true,
      });
    }

    const opcoes = {
      canal_entrada: interaction.options.getString('canal_entrada'),
      canal_saida: interaction.options.getString('canal_saida'),
      canal_geral: interaction.options.getString('canal_geral'),
      canal_moderacao: interaction.options.getString('canal_moderacao'),
      mensagem_entrada: interaction.options.getString('mensagem_entrada'),
      mensagem_saida: interaction.options.getString('mensagem_saida'),
      cor_entrada: interaction.options.getString('cor_entrada'),
      cor_saida: interaction.options.getString('cor_saida'),
    };

    const atualizacoes = {};
    const alterados = [];
    const erros = [];

    for (const [chave, valor] of Object.entries(opcoes)) {
      if (valor === null) continue;

      if (chave.startsWith('canal_')) {
        const id = validarId(valor);
        if (id === null) {
          erros.push(`\`${chave}\`: ID ou canal inválido. Use um ID numérico, #canal, ou "remover".`);
        } else if (id === 'remover') {
          atualizacoes[chave] = null;
          alterados.push(`**${chave}** → *removido*`);
        } else {
          atualizacoes[chave] = id;
          alterados.push(`**${chave}** → <#${id}>`);
        }
        continue;
      }

      if (chave.startsWith('cor_')) {
        const cor = valor.startsWith('#') ? valor : `#${valor}`;
        if (!HEX_REGEX.test(cor)) {
          erros.push(`\`${chave}\`: Cor inválida. Use formato HEX, ex: \`#57F287\``);
        } else {
          atualizacoes[chave] = cor;
          alterados.push(`**${chave}** → \`${cor}\``);
        }
        continue;
      }

      // Mensagens de texto
      atualizacoes[chave] = valor.replace(/\\n/g, '\n');
      alterados.push(`**${chave}** → \`${valor.slice(0, 80)}${valor.length > 80 ? '...' : ''}\``);
    }

    if (Object.keys(atualizacoes).length === 0 && erros.length === 0) {
      const cfg = getConfig();
      const campos = [
        { name: '📥 Canal de Entrada', value: cfg.canal_entrada ? `<#${cfg.canal_entrada}>` : '*não definido*', inline: true },
        { name: '📤 Canal de Saída', value: cfg.canal_saida ? `<#${cfg.canal_saida}>` : '*não definido*', inline: true },
        { name: '📋 Canal Geral', value: cfg.canal_geral ? `<#${cfg.canal_geral}>` : '*não definido*', inline: true },
        { name: '🔨 Canal Moderação', value: cfg.canal_moderacao ? `<#${cfg.canal_moderacao}>` : '*não definido*', inline: true },
        { name: '🟢 Cor Entrada', value: `\`${cfg.cor_entrada || '#57F287'}\``, inline: true },
        { name: '🔴 Cor Saída', value: `\`${cfg.cor_saida || '#ED4245'}\``, inline: true },
        { name: '💬 Mensagem de Entrada', value: `\`\`\`${cfg.mensagem_entrada || 'padrão'}\`\`\``, inline: false },
        { name: '👋 Mensagem de Saída', value: `\`\`\`${cfg.mensagem_saida || 'padrão'}\`\`\``, inline: false },
        { name: '💡 Variáveis disponíveis', value: '`{usuario}` — menção ou nome\n`{nome}` — nome de usuário\n`{servidor}` — nome do servidor', inline: false },
      ];
      return interaction.reply({
        embeds: [embed.info('⚙️ Configuração Atual de Logs', 'Forneça opções para alterar. Nenhum campo foi informado.', campos)],
        ephemeral: true,
      });
    }

    salvarConfig(atualizacoes);

    const campos = [];
    if (alterados.length > 0) campos.push({ name: '✅ Alterados', value: alterados.join('\n'), inline: false });
    if (erros.length > 0) campos.push({ name: '⚠️ Erros (ignorados)', value: erros.join('\n'), inline: false });
    campos.push({
      name: '💡 Variáveis disponíveis nas mensagens',
      value: '`{usuario}` — menção/nome do usuário\n`{nome}` — nome de usuário\n`{servidor}` — nome do servidor',
      inline: false,
    });

    return interaction.reply({
      embeds: [embed.sucesso('Logs Configurados', `**${alterados.length}** campo(s) atualizado(s).`, campos)],
      ephemeral: true,
    });
  },
};

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embed = require('../utils/embed');

const PERMISSOES_NECESSARIAS = [
  { nome: 'Banir Membros', descricao: 'Necessário para o comando `/banir`' },
  { nome: 'Expulsar Membros', descricao: 'Necessário para o comando `/expulsar`' },
  { nome: 'Gerenciar Mensagens', descricao: 'Necessário para o comando `/limpar`' },
  { nome: 'Gerenciar Canais', descricao: 'Necessário para criar e deletar canais de tickets' },
  { nome: 'Moderar Membros', descricao: 'Necessário para `/tempo` e `/advertir`' },
  { nome: 'Ver Canais', descricao: 'Necessário para visualizar canais do servidor' },
  { nome: 'Enviar Mensagens', descricao: 'Necessário para enviar mensagens e embeds' },
  { nome: 'Ler Histórico de Mensagens', descricao: 'Necessário para `/limpar` e transcritos' },
  { nome: 'Incorporar Links', descricao: 'Necessário para enviar embeds' },
  { nome: 'Anexar Arquivos', descricao: 'Necessário para enviar transcritos de tickets' },
  { nome: 'Usar Comandos de Aplicação', descricao: 'Necessário para os comandos de barra (/)' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('permissoes')
    .setDescription('Exibe todas as permissões necessárias do bot.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const campos = PERMISSOES_NECESSARIAS.map(p => ({
      name: `✅ ${p.nome}`,
      value: p.descricao,
      inline: false,
    }));

    return interaction.reply({
      embeds: [embed.info(
        '🔐 Permissões Necessárias',
        'Abaixo estão todas as permissões que o bot precisa para funcionar corretamente.\nUse `/verificarpermissoes` para checar quais estão faltando.',
        campos
      )],
      ephemeral: true,
    });
  },
};

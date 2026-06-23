const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embed = require('../utils/embed');

const PERMISSOES_VERIFICAR = [
  { flag: PermissionFlagsBits.BanMembers, nome: 'Banir Membros' },
  { flag: PermissionFlagsBits.KickMembers, nome: 'Expulsar Membros' },
  { flag: PermissionFlagsBits.ManageMessages, nome: 'Gerenciar Mensagens' },
  { flag: PermissionFlagsBits.ManageChannels, nome: 'Gerenciar Canais' },
  { flag: PermissionFlagsBits.ModerateMembers, nome: 'Moderar Membros (Timeout)' },
  { flag: PermissionFlagsBits.ViewChannel, nome: 'Ver Canais' },
  { flag: PermissionFlagsBits.SendMessages, nome: 'Enviar Mensagens' },
  { flag: PermissionFlagsBits.ReadMessageHistory, nome: 'Ler Histórico de Mensagens' },
  { flag: PermissionFlagsBits.EmbedLinks, nome: 'Incorporar Links' },
  { flag: PermissionFlagsBits.AttachFiles, nome: 'Anexar Arquivos' },
  { flag: PermissionFlagsBits.UseApplicationCommands, nome: 'Usar Comandos de Aplicação' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verificarpermissoes')
    .setDescription('Verifica quais permissões do bot estão faltando no servidor.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const botMembro = await interaction.guild.members.fetchMe();
    const permsBot = botMembro.permissions;

    const presentes = [];
    const faltando = [];

    for (const perm of PERMISSOES_VERIFICAR) {
      if (permsBot.has(perm.flag)) {
        presentes.push(`✅ ${perm.nome}`);
      } else {
        faltando.push(`❌ ${perm.nome}`);
      }
    }

    const temAdmin = permsBot.has(PermissionFlagsBits.Administrator);

    let descricao = '';
    if (temAdmin) {
      descricao = '⭐ **O bot possui permissão de Administrador**, então todas as ações estão liberadas.\n\n';
    }

    if (faltando.length === 0) {
      descricao += '✅ **Todas as permissões necessárias estão configuradas corretamente!**';
    } else {
      descricao += `**Permissões faltando (${faltando.length}):**\n${faltando.join('\n')}\n\n**Permissões presentes (${presentes.length}):**\n${presentes.join('\n')}`;
      descricao += '\n\n💡 Use `/corrigirpermissoes` para obter um link de convite com as permissões corretas.';
    }

    const corEmbed = faltando.length === 0 ? 'sucesso' : faltando.length >= 5 ? 'erro' : 'aviso';
    const embedFn = faltando.length === 0 ? embed.sucesso : faltando.length >= 5 ? embed.erro : embed.aviso;

    return interaction.editReply({
      embeds: [embedFn(
        `🔍 Verificação de Permissões — ${faltando.length === 0 ? 'Tudo OK' : `${faltando.length} faltando`}`,
        descricao
      )],
    });
  },
};

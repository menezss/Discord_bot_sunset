const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const embed = require('../utils/embed');

const PERMISSAO_ADMIN = 8n;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('corrigirpermissoes')
    .setDescription('Gera um link OAuth2 para convidar o bot com as permissões corretas.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const clientId = config.clientId;

    if (!clientId) {
      return interaction.reply({
        embeds: [embed.erro('Configuração Incompleta', 'O `CLIENT_ID` não está configurado nas variáveis de ambiente.')],
        ephemeral: true,
      });
    }

    const permissaoEspecifica = [
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.UseApplicationCommands,
    ].reduce((acc, flag) => acc | flag, 0n);

    const linkAdmin = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot%20applications.commands&permissions=${PERMISSAO_ADMIN}`;
    const linkEspecifico = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot%20applications.commands&permissions=${permissaoEspecifica}`;

    return interaction.reply({
      embeds: [embed.info(
        '🔗 Links de Convite',
        'Use um dos links abaixo para reconvidar o bot com as permissões corretas:',
        [
          {
            name: '⭐ Com Permissão de Administrador (recomendado)',
            value: `[Clique aqui para convidar](${linkAdmin})\n\`\`\`${linkAdmin}\`\`\``,
            inline: false,
          },
          {
            name: '🔒 Apenas Permissões Necessárias',
            value: `[Clique aqui para convidar](${linkEspecifico})\n\`\`\`${linkEspecifico}\`\`\``,
            inline: false,
          },
          {
            name: '⚠️ Atenção',
            value: 'Ao reconvidar o bot no mesmo servidor, as configurações anteriores são mantidas. Apenas as permissões serão atualizadas.',
            inline: false,
          },
        ]
      )],
      ephemeral: true,
    });
  },
};

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const config = require('../../config');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('corrigirpermissoes')
    .setDescription('Gera um link OAuth2 para convidar o bot com as permissões corretas.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.admin)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Apenas administradores podem usar este comando.')], ephemeral: true });
    }

    const clientId = config.clientId;
    if (!clientId) {
      return interaction.reply({ embeds: [embed.erro('Configuração Incompleta', 'O `CLIENT_ID` não está configurado.')], ephemeral: true });
    }

    const permEspecifica = [
      PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.UseApplicationCommands,
    ].reduce((acc, flag) => acc | flag, 0n);

    const linkAdmin = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot%20applications.commands&permissions=8`;
    const linkEspecifico = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot%20applications.commands&permissions=${permEspecifica}`;

    return interaction.reply({
      embeds: [embed.info('🔗 Links de Convite', 'Use um dos links abaixo para reconvidar o bot com as permissões corretas:', [
        { name: '⭐ Com Permissão de Administrador (recomendado)', value: `[Clique aqui](${linkAdmin})\n\`\`\`${linkAdmin}\`\`\``, inline: false },
        { name: '🔒 Apenas Permissões Necessárias', value: `[Clique aqui](${linkEspecifico})\n\`\`\`${linkEspecifico}\`\`\``, inline: false },
        { name: '⚠️ Atenção', value: 'Reconvidar o bot no mesmo servidor mantém as configurações anteriores.', inline: false },
      ])],
      ephemeral: true,
    });
  },
};

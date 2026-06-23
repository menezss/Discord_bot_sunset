const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermissao, removerPermissao, NIVEIS } = require('../systems/permissoes');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeadmin')
    .setDescription('Remove um usuário do cargo de Administrador do bot.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O usuário a remover').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.dono)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Apenas **Donos** podem remover administradores.')], ephemeral: true });
    }

    const alvo = interaction.options.getUser('usuario');
    const removido = removerPermissao(alvo.id, 'admin');

    if (!removido) {
      return interaction.reply({ embeds: [embed.aviso('Não Encontrado', `**${alvo.tag}** não está na lista de administradores dinâmicos.\n\nSe ele foi adicionado via \`config.js\`, remova manualmente de lá.`)], ephemeral: true });
    }

    return interaction.reply({
      embeds: [embed.sucesso('Administrador Removido', `**${alvo.tag}** foi removido do cargo de **Administrador**.\n\nID: \`${alvo.id}\``)],
      ephemeral: true,
    });
  },
};

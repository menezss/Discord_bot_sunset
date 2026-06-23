const { SlashCommandBuilder } = require('discord.js');
const { checkPermissao, removerPermissao, NIVEIS } = require('../systems/permissoes');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removemoderador')
    .setDescription('Remove um usuário do cargo de Moderador do bot.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O usuário a remover').setRequired(true)),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.admin)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Apenas **Administradores** ou superiores podem remover moderadores.')], ephemeral: true });
    }

    const alvo = interaction.options.getUser('usuario');
    const removido = removerPermissao(alvo.id, 'moderador');

    if (!removido) {
      return interaction.reply({ embeds: [embed.aviso('Não Encontrado', `**${alvo.tag}** não está na lista de moderadores dinâmicos.\n\nSe foi adicionado via \`config.js\`, remova manualmente de lá.`)], ephemeral: true });
    }

    return interaction.reply({
      embeds: [embed.sucesso('Moderador Removido', `**${alvo.tag}** foi removido do cargo de **Moderador**.\n\nID: \`${alvo.id}\``)],
      ephemeral: true,
    });
  },
};

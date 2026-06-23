const { SlashCommandBuilder } = require('discord.js');
const { checkPermissao, removerPermissao, NIVEIS } = require('../systems/permissoes');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removesuporte')
    .setDescription('Remove um usuário do cargo de Suporte do bot.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O usuário a remover').setRequired(true)),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.moderador)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Apenas **Moderadores** ou superiores podem remover membros de suporte.')], ephemeral: true });
    }

    const alvo = interaction.options.getUser('usuario');
    const removido = removerPermissao(alvo.id, 'suporte');

    if (!removido) {
      return interaction.reply({ embeds: [embed.aviso('Não Encontrado', `**${alvo.tag}** não está na lista de suporte dinâmico.\n\nSe foi adicionado via \`config.js\`, remova manualmente de lá.`)], ephemeral: true });
    }

    return interaction.reply({
      embeds: [embed.sucesso('Suporte Removido', `**${alvo.tag}** foi removido do cargo de **Suporte**.\n\nID: \`${alvo.id}\``)],
      ephemeral: true,
    });
  },
};

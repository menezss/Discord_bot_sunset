const { SlashCommandBuilder } = require('discord.js');
const { checkPermissao, adicionarPermissao, NIVEIS } = require('../systems/permissoes');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addmoderador')
    .setDescription('Adiciona um usuário como Moderador do bot.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O usuário a promover').setRequired(true)),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.admin)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Apenas **Administradores** ou superiores podem adicionar moderadores.')], ephemeral: true });
    }

    const alvo = interaction.options.getUser('usuario');
    if (alvo.bot) return interaction.reply({ embeds: [embed.erro('Alvo Inválido', 'Você não pode adicionar um bot como moderador.')], ephemeral: true });

    adicionarPermissao(alvo.id, 'moderador');

    return interaction.reply({
      embeds: [embed.sucesso('Moderador Adicionado', `**${alvo.tag}** foi adicionado como **Moderador** do bot.\n\nID: \`${alvo.id}\``)],
      ephemeral: true,
    });
  },
};

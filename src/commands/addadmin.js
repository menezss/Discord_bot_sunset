const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermissao, adicionarPermissao, NIVEIS } = require('../systems/permissoes');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addadmin')
    .setDescription('Adiciona um usuário como Administrador do bot.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O usuário a promover').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.dono)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Apenas **Donos** podem adicionar administradores.')], ephemeral: true });
    }

    const alvo = interaction.options.getUser('usuario');
    if (alvo.bot) return interaction.reply({ embeds: [embed.erro('Alvo Inválido', 'Você não pode adicionar um bot como administrador.')], ephemeral: true });

    adicionarPermissao(alvo.id, 'admin');

    return interaction.reply({
      embeds: [embed.sucesso('Administrador Adicionado', `**${alvo.tag}** foi adicionado como **Administrador** do bot.\n\nID: \`${alvo.id}\``)],
      ephemeral: true,
    });
  },
};

const { SlashCommandBuilder } = require('discord.js');
const { checkPermissao, adicionarPermissao, NIVEIS } = require('../systems/permissoes');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addsuporte')
    .setDescription('Adiciona um usuário como Suporte do bot.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O usuário a promover').setRequired(true)),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.moderador)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Apenas **Moderadores** ou superiores podem adicionar membros de suporte.')], ephemeral: true });
    }

    const alvo = interaction.options.getUser('usuario');
    if (alvo.bot) return interaction.reply({ embeds: [embed.erro('Alvo Inválido', 'Você não pode adicionar um bot ao suporte.')], ephemeral: true });

    adicionarPermissao(alvo.id, 'suporte');

    return interaction.reply({
      embeds: [embed.sucesso('Suporte Adicionado', `**${alvo.tag}** foi adicionado como **Suporte** do bot.\n\nID: \`${alvo.id}\``)],
      ephemeral: true,
    });
  },
};

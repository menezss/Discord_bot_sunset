const { SlashCommandBuilder } = require('discord.js');
const { checkPermissao, getNomeNivel, listarNivel, NIVEIS } = require('../systems/permissoes');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('permissoes')
    .setDescription('Exibe as permissões do bot e os usuários em cada nível.'),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.suporte)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Você não tem permissão para usar este comando.')], ephemeral: true });
    }

    const donos = listarNivel('dono');
    const admins = listarNivel('admin');
    const mods = listarNivel('moderador');
    const suporte = listarNivel('suporte');

    const fmt = (lista) => lista.length > 0 ? lista.map(id => `<@${id}>`).join(', ') : '*Nenhum*';
    const nivel = getNomeNivel(interaction.user.id, interaction.guild?.ownerId);

    return interaction.reply({
      embeds: [embed.info(
        '🔐 Sistema de Permissões',
        `Seu nível atual: **${nivel}**\n\nAbaixo estão os usuários registrados em cada nível do bot:`,
        [
          { name: '👑 Donos', value: fmt(donos), inline: false },
          { name: '🛡️ Administradores', value: fmt(admins), inline: false },
          { name: '🔨 Moderadores', value: fmt(mods), inline: false },
          { name: '🎫 Suporte', value: fmt(suporte), inline: false },
          { name: '📌 Nota', value: 'O **dono do servidor** tem acesso total automaticamente, mesmo que não esteja listado.', inline: false },
        ]
      )],
      ephemeral: true,
    });
  },
};

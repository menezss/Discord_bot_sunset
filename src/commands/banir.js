const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const { logModeracao } = require('../utils/logger');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banir')
    .setDescription('Bane um usuário do servidor.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O usuário a ser banido').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do banimento').setRequired(false))
    .addIntegerOption(opt => opt.setName('apagar_dias').setDescription('Dias de mensagens a apagar (0-7)').setMinValue(0).setMaxValue(7).setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.moderador)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Você não tem permissão para usar este comando.')], ephemeral: true });
    }

    const alvo = interaction.options.getUser('usuario');
    const motivo = interaction.options.getString('motivo') || 'Nenhum motivo informado';
    const apagarDias = interaction.options.getInteger('apagar_dias') ?? 0;

    if (alvo.id === interaction.user.id) {
      return interaction.reply({ embeds: [embed.erro('Alvo Inválido', 'Você não pode banir a si mesmo.')], ephemeral: true });
    }
    if (alvo.id === interaction.client.user.id) {
      return interaction.reply({ embeds: [embed.erro('Alvo Inválido', 'Você não pode banir o bot.')], ephemeral: true });
    }

    try {
      const membro = await interaction.guild.members.fetch(alvo.id).catch(() => null);
      if (membro && !membro.bannable) {
        return interaction.reply({ embeds: [embed.erro('Não é Possível Banir', 'Não consigo banir este usuário. Ele pode ter permissões superiores.')], ephemeral: true });
      }

      try {
        await alvo.send({ embeds: [embed.info('Você foi banido', `Você foi banido de **${interaction.guild.name}**.\n**Motivo:** ${motivo}`)] });
      } catch {}

      await interaction.guild.members.ban(alvo, { reason: motivo, deleteMessageDays: apagarDias });

      await interaction.reply({
        embeds: [embed.sucesso('Usuário Banido', `**${alvo.tag}** foi banido.\n**Motivo:** ${motivo}`)],
      });

      await logModeracao(interaction.client, 'Banimento', interaction.user, alvo, motivo);
    } catch (err) {
      console.error('[Banir]', err.message);
      return interaction.reply({ embeds: [embed.erro('Erro', 'Falha ao banir o usuário.')], ephemeral: true });
    }
  },
};

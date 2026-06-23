const { SlashCommandBuilder } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const { logModeracao } = require('../utils/logger');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('expulsar')
    .setDescription('Expulsa um usuário do servidor.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O usuário a ser expulso').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo da expulsão').setRequired(false)),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.moderador)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Você não tem permissão para usar este comando.')], ephemeral: true });
    }

    const alvo = interaction.options.getUser('usuario');
    const motivo = interaction.options.getString('motivo') || 'Nenhum motivo informado';

    if (alvo.id === interaction.user.id) {
      return interaction.reply({ embeds: [embed.erro('Alvo Inválido', 'Você não pode expulsar a si mesmo.')], ephemeral: true });
    }
    if (alvo.id === interaction.client.user.id) {
      return interaction.reply({ embeds: [embed.erro('Alvo Inválido', 'Você não pode expulsar o bot.')], ephemeral: true });
    }

    try {
      const membro = await interaction.guild.members.fetch(alvo.id).catch(() => null);
      if (!membro) {
        return interaction.reply({ embeds: [embed.erro('Não Encontrado', 'Este usuário não está no servidor.')], ephemeral: true });
      }
      if (!membro.kickable) {
        return interaction.reply({ embeds: [embed.erro('Não é Possível Expulsar', 'Não consigo expulsar este usuário. Ele pode ter permissões superiores.')], ephemeral: true });
      }

      try {
        await alvo.send({ embeds: [embed.info('Você foi expulso', `Você foi expulso de **${interaction.guild.name}**.\n**Motivo:** ${motivo}`)] });
      } catch {}

      await membro.kick(motivo);

      await interaction.reply({
        embeds: [embed.sucesso('Usuário Expulso', `**${alvo.tag}** foi expulso.\n**Motivo:** ${motivo}`)],
      });

      await logModeracao(interaction.client, 'Expulsão', interaction.user, alvo, motivo);
    } catch (err) {
      console.error('[Expulsar]', err.message);
      return interaction.reply({ embeds: [embed.erro('Erro', 'Falha ao expulsar o usuário.')], ephemeral: true });
    }
  },
};

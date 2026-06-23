const { SlashCommandBuilder } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const { logModeracao } = require('../utils/logger');
const embed = require('../utils/embed');

const DURACOES = {
  '60s': { ms: 60 * 1000, label: '60 Segundos' },
  '5m': { ms: 5 * 60 * 1000, label: '5 Minutos' },
  '10m': { ms: 10 * 60 * 1000, label: '10 Minutos' },
  '30m': { ms: 30 * 60 * 1000, label: '30 Minutos' },
  '1h': { ms: 60 * 60 * 1000, label: '1 Hora' },
  '6h': { ms: 6 * 60 * 60 * 1000, label: '6 Horas' },
  '12h': { ms: 12 * 60 * 60 * 1000, label: '12 Horas' },
  '1d': { ms: 24 * 60 * 60 * 1000, label: '1 Dia' },
  '7d': { ms: 7 * 24 * 60 * 60 * 1000, label: '7 Dias' },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tempo')
    .setDescription('Aplica silenciamento temporário a um usuário.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O usuário a silenciar').setRequired(true))
    .addStringOption(opt =>
      opt.setName('duracao').setDescription('Duração do silenciamento').setRequired(true)
        .addChoices(
          { name: '60 Segundos', value: '60s' },
          { name: '5 Minutos', value: '5m' },
          { name: '10 Minutos', value: '10m' },
          { name: '30 Minutos', value: '30m' },
          { name: '1 Hora', value: '1h' },
          { name: '6 Horas', value: '6h' },
          { name: '12 Horas', value: '12h' },
          { name: '1 Dia', value: '1d' },
          { name: '7 Dias', value: '7d' },
        )
    )
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do silenciamento').setRequired(false)),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.moderador)) {
      return interaction.reply({ embeds: [embed.erro('Sem Permissão', 'Você não tem permissão para usar este comando.')], ephemeral: true });
    }

    const alvo = interaction.options.getUser('usuario');
    const duracaoChave = interaction.options.getString('duracao');
    const motivo = interaction.options.getString('motivo') || 'Nenhum motivo informado';
    const { ms, label } = DURACOES[duracaoChave];

    if (alvo.id === interaction.user.id) {
      return interaction.reply({ embeds: [embed.erro('Alvo Inválido', 'Você não pode silenciar a si mesmo.')], ephemeral: true });
    }

    try {
      const membro = await interaction.guild.members.fetch(alvo.id).catch(() => null);
      if (!membro) return interaction.reply({ embeds: [embed.erro('Não Encontrado', 'Este usuário não está no servidor.')], ephemeral: true });
      if (!membro.moderatable) return interaction.reply({ embeds: [embed.erro('Não é Possível', 'Não consigo silenciar este usuário.')], ephemeral: true });

      await membro.timeout(ms, motivo);

      try {
        await alvo.send({ embeds: [embed.aviso('Você foi silenciado', `Silenciado em **${interaction.guild.name}** por **${label}**.\n**Motivo:** ${motivo}`)] });
      } catch {}

      await interaction.reply({ embeds: [embed.sucesso('Usuário Silenciado', `**${alvo.tag}** silenciado por **${label}**.\n**Motivo:** ${motivo}`)] });
      await logModeracao(interaction.client, 'Silenciamento', interaction.user, alvo, motivo, { duracao: label });
    } catch (err) {
      console.error('[Tempo]', err.message);
      return interaction.reply({ embeds: [embed.erro('Erro', 'Falha ao silenciar o usuário.')], ephemeral: true });
    }
  },
};

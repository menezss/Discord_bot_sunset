const { SlashCommandBuilder } = require('discord.js');
const { getNomeNivel } = require('../systems/permissoes');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meuid')
    .setDescription('Mostra o seu ID do Discord e seu nível de permissão no bot.'),

  async execute(interaction) {
    const nivel = getNomeNivel(interaction.user.id, interaction.guild?.ownerId);

    return interaction.reply({
      embeds: [embed.info('🪪 Seu ID do Discord', `Seu ID é:\n\`\`\`${interaction.user.id}\`\`\``, [
        { name: 'Usuário', value: `${interaction.user.tag}`, inline: true },
        { name: 'Nível no Bot', value: `**${nivel}**`, inline: true },
        { name: '💡 Dica', value: 'Copie o ID acima e use-o para configurar permissões no `config.js` ou com os comandos `/addadmin`, `/addmoderador`, `/addsuporte`.', inline: false },
      ])],
      ephemeral: true,
    });
  },
};

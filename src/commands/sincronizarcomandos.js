const { SlashCommandBuilder } = require('discord.js');
const { checkPermissao, NIVEIS } = require('../systems/permissoes');
const embed = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sincronizarcomandos')
    .setDescription('Informa o status do registro de slash commands e como sincronizá-los.'),

  async execute(interaction) {
    if (!checkPermissao(interaction, NIVEIS.dono)) {
      return interaction.reply({
        embeds: [embed.erro('Sem Permissão', 'Apenas **Donos** podem usar este comando.')],
        ephemeral: true,
      });
    }

    const totalComandos = interaction.client.commands.size;

    return interaction.reply({
      embeds: [embed.info(
        '🔄 Sincronização de Comandos',
        `O bot tem **${totalComandos}** comando(s) carregado(s) em memória.\n\nOs slash commands do Discord são registrados separadamente via **deploy-commands.js**. Se você adicionou ou removeu comandos e eles não aparecem no Discord, execute o deploy novamente.`,
        [
          {
            name: '📋 Como registrar os comandos',
            value: '```bash\nnode deploy-commands.js\n```\nRode este comando no terminal do Replit.\nSe `GUILD_ID` estiver definido, o registro é **instantâneo** (apenas no servidor configurado).\nSem `GUILD_ID`, os comandos são registrados **globalmente** (pode levar até 1 hora).',
            inline: false,
          },
          {
            name: '⚙️ Variáveis necessárias',
            value: '`DISCORD_TOKEN` — Token do bot\n`CLIENT_ID` — ID da aplicação\n`GUILD_ID` — (opcional) ID do servidor para registro rápido',
            inline: false,
          },
          {
            name: '💡 Dica',
            value: 'No Replit, acesse o **Shell** e execute `node deploy-commands.js`. O bot não precisa estar parado para isso.',
            inline: false,
          },
        ]
      )],
      ephemeral: true,
    });
  },
};

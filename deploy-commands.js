require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('[Deploy] ERRO: DISCORD_TOKEN e CLIENT_ID devem estar definidos nas variáveis de ambiente.');
  process.exit(1);
}

const comandos = [];
const pastaComandos = path.join(__dirname, 'src', 'commands');
const arquivosComandos = fs.readdirSync(pastaComandos).filter(f => f.endsWith('.js'));

for (const arquivo of arquivosComandos) {
  const comando = require(path.join(pastaComandos, arquivo));
  if (comando.data) {
    comandos.push(comando.data.toJSON());
    console.log(`[Deploy] Enfileirado: /${comando.data.name}`);
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`[Deploy] Registrando ${comandos.length} comando(s)...`);

    let dados;
    if (guildId) {
      dados = await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: comandos });
      console.log(`[Deploy] ${dados.length} comando(s) registrado(s) no servidor ${guildId} (instantâneo)`);
    } else {
      dados = await rest.put(Routes.applicationCommands(clientId), { body: comandos });
      console.log(`[Deploy] ${dados.length} comando(s) registrado(s) globalmente (pode levar até 1 hora)`);
    }
  } catch (err) {
    console.error('[Deploy] Falha:', err);
    process.exit(1);
  }
})();

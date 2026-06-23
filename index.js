require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.commands = new Collection();

const pastaComandos = path.join(__dirname, 'src', 'commands');
const arquivosComandos = fs.readdirSync(pastaComandos).filter(f => f.endsWith('.js'));

for (const arquivo of arquivosComandos) {
  const comando = require(path.join(pastaComandos, arquivo));
  if (comando.data && comando.execute) {
    client.commands.set(comando.data.name, comando);
    console.log(`[Comandos] Carregado: /${comando.data.name}`);
  } else {
    console.warn(`[Comandos] Ignorado ${arquivo} — sem data ou execute`);
  }
}

const pastaEventos = path.join(__dirname, 'src', 'events');
const arquivosEventos = fs.readdirSync(pastaEventos).filter(f => f.endsWith('.js'));

for (const arquivo of arquivosEventos) {
  const evento = require(path.join(pastaEventos, arquivo));
  if (evento.once) {
    client.once(evento.name, (...args) => evento.execute(...args));
  } else {
    client.on(evento.name, (...args) => evento.execute(...args));
  }
  console.log(`[Eventos] Carregado: ${evento.name}`);
}

if (!config.token) {
  console.error('[Bot] ERRO: DISCORD_TOKEN não está definido nas variáveis de ambiente.');
  process.exit(1);
}

client.login(config.token).catch(err => {
  if (err.message.includes('disallowed intents')) {
    console.error('[Bot] ERRO: Intents privilegiados não estão habilitados!');
    console.error('[Bot] Acesse: https://discord.com/developers/applications');
    console.error('[Bot] Selecione seu app → Bot → Privileged Gateway Intents');
    console.error('[Bot] Habilite: "Server Members Intent" E "Message Content Intent"');
    console.error('[Bot] Depois reinicie o bot.');
  } else {
    console.error('[Bot] Falha ao conectar:', err.message);
  }
  process.exit(1);
});

process.on('unhandledRejection', err => {
  console.error('[Bot] Rejeição não tratada:', err);
});

process.on('uncaughtException', err => {
  console.error('[Bot] Exceção não capturada:', err);
});

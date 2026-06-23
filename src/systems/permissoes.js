const fs = require('fs');
const path = require('path');
const config = require('../../config');

const ARQUIVO = path.join(__dirname, '../../data/permissoes.json');

const NIVEIS = {
  dono: 4,
  admin: 3,
  moderador: 2,
  suporte: 1,
  usuario: 0,
};

// Cache em memória das permissões dinâmicas
let cache = null;

function carregarDados() {
  if (cache) return cache;
  try {
    if (fs.existsSync(ARQUIVO)) {
      cache = JSON.parse(fs.readFileSync(ARQUIVO, 'utf-8'));
      return cache;
    }
  } catch (err) {
    console.error('[Permissões] Erro ao carregar dados:', err.message);
  }
  cache = { donos: [], administradores: [], moderadores: [], suporte: [] };
  return cache;
}

function salvarDados(dados) {
  cache = dados;
  try {
    fs.mkdirSync(path.dirname(ARQUIVO), { recursive: true });
    fs.writeFileSync(ARQUIVO, JSON.stringify(dados, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Permissões] Erro ao salvar dados:', err.message);
  }
}

function getNivel(userId, guildOwnerId = null) {
  // Dono do servidor sempre tem nível máximo
  if (guildOwnerId && userId === guildOwnerId) return NIVEIS.dono;

  const cfg = config.permissoes || {};
  const dados = carregarDados();

  const donos = [...(cfg.donos || []), ...(dados.donos || [])];
  const admins = [...(cfg.administradores || []), ...(dados.administradores || [])];
  const mods = [...(cfg.moderadores || []), ...(dados.moderadores || [])];
  const suporte = [...(cfg.suporte || []), ...(dados.suporte || [])];

  if (donos.includes(userId)) return NIVEIS.dono;
  if (admins.includes(userId)) return NIVEIS.admin;
  if (mods.includes(userId)) return NIVEIS.moderador;
  if (suporte.includes(userId)) return NIVEIS.suporte;
  return NIVEIS.usuario;
}

// Verifica permissão considerando dono do servidor automaticamente
function checkPermissao(interaction, nivelMinimo) {
  const guildOwnerId = interaction.guild?.ownerId;
  return getNivel(interaction.user.id, guildOwnerId) >= nivelMinimo;
}

function getNomeNivel(userId, guildOwnerId = null) {
  const nivel = getNivel(userId, guildOwnerId);
  if (nivel >= NIVEIS.dono) return 'Dono';
  if (nivel >= NIVEIS.admin) return 'Administrador';
  if (nivel >= NIVEIS.moderador) return 'Moderador';
  if (nivel >= NIVEIS.suporte) return 'Suporte';
  return 'Usuário';
}

function isDono(userId, guildOwnerId = null) { return getNivel(userId, guildOwnerId) >= NIVEIS.dono; }
function isAdmin(userId, guildOwnerId = null) { return getNivel(userId, guildOwnerId) >= NIVEIS.admin; }
function isModerador(userId, guildOwnerId = null) { return getNivel(userId, guildOwnerId) >= NIVEIS.moderador; }
function isSupporte(userId, guildOwnerId = null) { return getNivel(userId, guildOwnerId) >= NIVEIS.suporte; }

// Adiciona um usuário a um nível dinâmico
function adicionarPermissao(userId, nivel) {
  const mapa = { admin: 'administradores', moderador: 'moderadores', suporte: 'suporte', dono: 'donos' };
  const campo = mapa[nivel];
  if (!campo) return false;

  const dados = carregarDados();
  if (!dados[campo]) dados[campo] = [];
  if (!dados[campo].includes(userId)) {
    dados[campo].push(userId);
    salvarDados(dados);
  }
  return true;
}

// Remove um usuário de um nível dinâmico
function removerPermissao(userId, nivel) {
  const mapa = { admin: 'administradores', moderador: 'moderadores', suporte: 'suporte', dono: 'donos' };
  const campo = mapa[nivel];
  if (!campo) return false;

  const dados = carregarDados();
  if (!dados[campo]) return false;
  const idx = dados[campo].indexOf(userId);
  if (idx === -1) return false;

  dados[campo].splice(idx, 1);
  salvarDados(dados);
  return true;
}

// Adiciona automaticamente o dono do servidor como dono do bot
function autoAdicionarDonoServidor(guild) {
  const guildOwnerId = guild.ownerId;
  const nivel = getNivel(guildOwnerId);
  if (nivel < NIVEIS.dono) {
    adicionarPermissao(guildOwnerId, 'dono');
    console.log(`[Permissões] Dono do servidor ${guild.name} (${guildOwnerId}) adicionado automaticamente como Dono do bot.`);
  }
}

// Lista todos os usuários com permissão em um nível
function listarNivel(nivel) {
  const mapa = { admin: 'administradores', moderador: 'moderadores', suporte: 'suporte', dono: 'donos' };
  const campo = mapa[nivel];
  const cfg = config.permissoes || {};
  const dados = carregarDados();
  return [...new Set([...(cfg[campo] || []), ...(dados[campo] || [])])];
}

module.exports = {
  getNivel, getNomeNivel, checkPermissao,
  isDono, isAdmin, isModerador, isSupporte,
  adicionarPermissao, removerPermissao, autoAdicionarDonoServidor, listarNivel,
  NIVEIS,
};

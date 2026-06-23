const config = require('../../config');

const NIVEIS = {
  dono: 4,
  admin: 3,
  moderador: 2,
  suporte: 1,
  usuario: 0,
};

function getNivel(userId) {
  if (config.permissions.owners.includes(userId)) return NIVEIS.dono;
  if (config.permissions.admins.includes(userId)) return NIVEIS.admin;
  if (config.permissions.moderators.includes(userId)) return NIVEIS.moderador;
  if (config.permissions.support.includes(userId)) return NIVEIS.suporte;
  return NIVEIS.usuario;
}

function getNomeNivel(userId) {
  if (config.permissions.owners.includes(userId)) return 'Dono';
  if (config.permissions.admins.includes(userId)) return 'Administrador';
  if (config.permissions.moderators.includes(userId)) return 'Moderador';
  if (config.permissions.support.includes(userId)) return 'Suporte';
  return 'Usuário';
}

function isDono(userId) { return getNivel(userId) >= NIVEIS.dono; }
function isAdmin(userId) { return getNivel(userId) >= NIVEIS.admin; }
function isModerador(userId) { return getNivel(userId) >= NIVEIS.moderador; }
function isSupporte(userId) { return getNivel(userId) >= NIVEIS.suporte; }

module.exports = { getNivel, getNomeNivel, isDono, isAdmin, isModerador, isSupporte, NIVEIS };

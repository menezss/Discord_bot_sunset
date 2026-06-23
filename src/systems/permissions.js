const config = require('../../config');

const LEVELS = {
  owner: 4,
  admin: 3,
  moderator: 2,
  support: 1,
  user: 0,
};

function getLevel(userId) {
  if (config.permissions.owners.includes(userId)) return LEVELS.owner;
  if (config.permissions.admins.includes(userId)) return LEVELS.admin;
  if (config.permissions.moderators.includes(userId)) return LEVELS.moderator;
  if (config.permissions.support.includes(userId)) return LEVELS.support;
  return LEVELS.user;
}

function getRoleName(userId) {
  if (config.permissions.owners.includes(userId)) return 'Owner';
  if (config.permissions.admins.includes(userId)) return 'Admin';
  if (config.permissions.moderators.includes(userId)) return 'Moderator';
  if (config.permissions.support.includes(userId)) return 'Support';
  return 'User';
}

function isOwner(userId) { return getLevel(userId) >= LEVELS.owner; }
function isAdmin(userId) { return getLevel(userId) >= LEVELS.admin; }
function isModerator(userId) { return getLevel(userId) >= LEVELS.moderator; }
function isSupport(userId) { return getLevel(userId) >= LEVELS.support; }

function requireLevel(interaction, minRole) {
  const level = getLevel(interaction.user.id);
  const required = LEVELS[minRole] ?? LEVELS.user;

  if (level < required) {
    return false;
  }
  return true;
}

module.exports = { getLevel, getRoleName, isOwner, isAdmin, isModerator, isSupport, requireLevel, LEVELS };

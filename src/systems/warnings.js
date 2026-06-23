const warnings = new Map();

function getKey(guildId, userId) {
  return `${guildId}-${userId}`;
}

function addWarning(guildId, userId, { reason, moderator }) {
  const key = getKey(guildId, userId);
  if (!warnings.has(key)) warnings.set(key, []);
  const list = warnings.get(key);
  list.push({ reason, moderator, timestamp: new Date() });
  return list;
}

function getWarnings(guildId, userId) {
  return warnings.get(getKey(guildId, userId)) || [];
}

function clearWarnings(guildId, userId) {
  const key = getKey(guildId, userId);
  const count = (warnings.get(key) || []).length;
  warnings.delete(key);
  return count;
}

function removeWarning(guildId, userId, index) {
  const key = getKey(guildId, userId);
  const list = warnings.get(key);
  if (!list || index < 0 || index >= list.length) return null;
  const [removed] = list.splice(index, 1);
  if (list.length === 0) warnings.delete(key);
  return removed;
}

module.exports = { addWarning, getWarnings, clearWarnings, removeWarning };

const advertencias = new Map();

function getChave(guildId, userId) {
  return `${guildId}-${userId}`;
}

function addAdvertencia(guildId, userId, { motivo, moderador }) {
  const chave = getChave(guildId, userId);
  if (!advertencias.has(chave)) advertencias.set(chave, []);
  const lista = advertencias.get(chave);
  lista.push({ motivo, moderador, timestamp: new Date() });
  return lista;
}

function getAdvertencias(guildId, userId) {
  return advertencias.get(getChave(guildId, userId)) || [];
}

function limparAdvertencias(guildId, userId) {
  const chave = getChave(guildId, userId);
  const total = (advertencias.get(chave) || []).length;
  advertencias.delete(chave);
  return total;
}

function removerAdvertencia(guildId, userId, index) {
  const chave = getChave(guildId, userId);
  const lista = advertencias.get(chave);
  if (!lista || index < 0 || index >= lista.length) return null;
  const [removida] = lista.splice(index, 1);
  if (lista.length === 0) advertencias.delete(chave);
  return removida;
}

module.exports = { addAdvertencia, getAdvertencias, limparAdvertencias, removerAdvertencia };

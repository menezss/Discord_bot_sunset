const fs = require('fs');
const path = require('path');
const config = require('../../config');

const ARQUIVO = path.join(__dirname, '../../data/logConfig.json');

const PADRAO = {
  canal_entrada: null,
  canal_saida: null,
  canal_moderacao: null,
  canal_geral: null,
  mensagem_entrada: 'Seja bem-vindo(a) ao servidor, {usuario}! 🎉',
  mensagem_saida: '{usuario} deixou o servidor.',
  cor_entrada: '#57F287',
  cor_saida: '#ED4245',
};

let cache = null;

function carregarConfig() {
  if (cache) return cache;
  try {
    if (fs.existsSync(ARQUIVO)) {
      cache = { ...PADRAO, ...JSON.parse(fs.readFileSync(ARQUIVO, 'utf-8')) };
      return cache;
    }
  } catch (err) {
    console.error('[LogConfig] Erro ao carregar:', err.message);
  }
  cache = {
    ...PADRAO,
    canal_geral: config.logs?.channelId || null,
    canal_moderacao: config.logs?.moderationChannelId || null,
  };
  return cache;
}

function salvarConfig(atualizacoes) {
  const novo = { ...carregarConfig(), ...atualizacoes };
  cache = novo;
  try {
    fs.mkdirSync(path.dirname(ARQUIVO), { recursive: true });
    fs.writeFileSync(ARQUIVO, JSON.stringify(novo, null, 2), 'utf-8');
  } catch (err) {
    console.error('[LogConfig] Erro ao salvar:', err.message);
  }
  return novo;
}

function getConfig() {
  return carregarConfig();
}

// Retorna o ID do canal para um tipo de log (com fallback para canal_geral)
function getCanalId(tipo) {
  const cfg = carregarConfig();
  return cfg[`canal_${tipo}`] || cfg.canal_geral || null;
}

module.exports = { getConfig, salvarConfig, getCanalId, PADRAO };

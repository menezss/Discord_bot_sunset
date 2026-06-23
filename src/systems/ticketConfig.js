const fs = require('fs');
const path = require('path');
const config = require('../../config');

const ARQUIVO = path.join(__dirname, '../../data/ticketConfig.json');

const PADRAO = {
  titulo: '🎫 Suporte via Tickets',
  descricao:
    'Precisa de ajuda? Clique no botão abaixo para abrir um ticket de suporte.\nUm membro da equipe irá te atender o mais breve possível.\n\n**Antes de abrir um ticket:**\n• Descreva seu problema com clareza\n• Inclua capturas de tela relevantes\n• Seja paciente enquanto a equipe responde',
  cor: '#5865F2',
  rodape: 'Sunset Bot',
  banner: null,
  thumbnail: null,
  texto_botao: 'Abrir Ticket',
  emoji_botao: '🎫',
  mensagem_abertura:
    'Olá, {usuario}! Um membro da equipe irá te atender em breve.\n\nDescreva seu problema com o máximo de detalhes possível.',
  mensagem_fechamento: 'Este ticket está sendo fechado. O transcrito será salvo automaticamente.',
  categoria_ticket: null,
  canal_logs: null,
  canal_transcripts: null,
};

let cache = null;

function carregarConfig() {
  if (cache) return cache;
  try {
    if (fs.existsSync(ARQUIVO)) {
      const dados = JSON.parse(fs.readFileSync(ARQUIVO, 'utf-8'));
      cache = { ...PADRAO, ...dados };
      return cache;
    }
  } catch (err) {
    console.error('[TicketConfig] Erro ao carregar:', err.message);
  }
  // Aplica valores do config.js como fallback
  cache = {
    ...PADRAO,
    cor: config.embeds?.color || PADRAO.cor,
    rodape: config.embeds?.footer?.text || PADRAO.rodape,
    banner: config.embeds?.banner || null,
    categoria_ticket: config.tickets?.categoryId || null,
    canal_logs: config.tickets?.logChannelId || config.logs?.ticketChannelId || null,
    canal_transcripts: config.tickets?.transcriptChannelId || null,
  };
  return cache;
}

function salvarConfig(atualizacoes) {
  const atual = carregarConfig();
  const novo = { ...atual, ...atualizacoes };
  cache = novo;
  try {
    fs.mkdirSync(path.dirname(ARQUIVO), { recursive: true });
    fs.writeFileSync(ARQUIVO, JSON.stringify(novo, null, 2), 'utf-8');
  } catch (err) {
    console.error('[TicketConfig] Erro ao salvar:', err.message);
  }
  return novo;
}

function getConfig() {
  return carregarConfig();
}

module.exports = { getConfig, salvarConfig, carregarConfig, PADRAO };

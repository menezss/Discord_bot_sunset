const OpenAI = require('openai');
const config = require('../../config');

let client = null;

function getClient() {
  if (!client && config.openaiKey) {
    client = new OpenAI({ apiKey: config.openaiKey });
  }
  return client;
}

const historicoConversas = new Map();

async function perguntarIA(ticketChannelId, mensagemUsuario, nomeUsuario) {
  const openai = getClient();
  if (!openai) throw new Error('Chave da API OpenAI não configurada.');

  if (!historicoConversas.has(ticketChannelId)) {
    historicoConversas.set(ticketChannelId, [
      { role: 'system', content: config.ai.systemPrompt },
    ]);
  }

  const historico = historicoConversas.get(ticketChannelId);
  historico.push({ role: 'user', content: `${nomeUsuario}: ${mensagemUsuario}` });

  if (historico.length > 20) {
    const msgSistema = historico[0];
    historico.splice(1, historico.length - 19);
    historico[0] = msgSistema;
  }

  const resposta = await openai.chat.completions.create({
    model: config.ai.model,
    messages: historico,
    max_tokens: config.ai.maxTokens,
  });

  const reply = resposta.choices[0]?.message?.content?.trim();
  if (reply) {
    historico.push({ role: 'assistant', content: reply });
  }

  return reply || 'Não foi possível gerar uma resposta. Aguarde um membro da equipe.';
}

function limparHistorico(ticketChannelId) {
  historicoConversas.delete(ticketChannelId);
}

module.exports = { perguntarIA, limparHistorico, clearHistory: limparHistorico };

const OpenAI = require('openai');
const config = require('../../config');

let client = null;

function getClient() {
  if (!client && config.openaiKey) {
    client = new OpenAI({ apiKey: config.openaiKey });
  }
  return client;
}

const conversationHistory = new Map();

async function askAI(ticketChannelId, userMessage, username) {
  const openai = getClient();
  if (!openai) throw new Error('OpenAI API key not configured.');

  if (!conversationHistory.has(ticketChannelId)) {
    conversationHistory.set(ticketChannelId, [
      { role: 'system', content: config.ai.systemPrompt },
    ]);
  }

  const history = conversationHistory.get(ticketChannelId);
  history.push({ role: 'user', content: `${username}: ${userMessage}` });

  if (history.length > 20) {
    const systemMsg = history[0];
    history.splice(1, history.length - 19);
    history[0] = systemMsg;
  }

  const response = await openai.chat.completions.create({
    model: config.ai.model,
    messages: history,
    max_tokens: config.ai.maxTokens,
  });

  const reply = response.choices[0]?.message?.content?.trim();
  if (reply) {
    history.push({ role: 'assistant', content: reply });
  }

  return reply || 'I was unable to generate a response. Please wait for a staff member.';
}

function clearHistory(ticketChannelId) {
  conversationHistory.delete(ticketChannelId);
}

module.exports = { askAI, clearHistory };

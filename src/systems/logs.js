const { logGeral } = require('../utils/logger');

async function logEntradaMembro(client, member) {
  await logGeral(client, '📥 Membro Entrou', `**${member.user.tag}** entrou no servidor.`, [
    { name: 'ID do Usuário', value: member.user.id, inline: true },
    { name: 'Conta Criada', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
  ]);
}

async function logSaidaMembro(client, member) {
  await logGeral(client, '📤 Membro Saiu', `**${member.user.tag}** saiu do servidor.`, [
    { name: 'ID do Usuário', value: member.user.id, inline: true },
  ]);
}

async function logMensagemDeletada(client, message) {
  if (message.author?.bot) return;
  if (!message.content) return;

  await logGeral(client, '🗑️ Mensagem Deletada', `Uma mensagem foi deletada em <#${message.channel.id}>.`, [
    { name: 'Autor', value: `${message.author?.tag || 'Desconhecido'} (${message.author?.id || 'Desconhecido'})`, inline: true },
    { name: 'Conteúdo', value: message.content.slice(0, 1000) || '*Sem conteúdo*', inline: false },
  ]);
}

async function logMensagemEditada(client, antigaMensagem, novaMensagem) {
  if (novaMensagem.author?.bot) return;
  if (antigaMensagem.content === novaMensagem.content) return;

  await logGeral(client, '✏️ Mensagem Editada', `Uma mensagem foi editada em <#${novaMensagem.channel.id}>.`, [
    { name: 'Autor', value: `${novaMensagem.author?.tag} (${novaMensagem.author?.id})`, inline: true },
    { name: 'Antes', value: antigaMensagem.content?.slice(0, 500) || '*Sem conteúdo*', inline: false },
    { name: 'Depois', value: novaMensagem.content?.slice(0, 500) || '*Sem conteúdo*', inline: false },
  ]);
}

module.exports = { logEntradaMembro, logSaidaMembro, logMensagemDeletada, logMensagemEditada };

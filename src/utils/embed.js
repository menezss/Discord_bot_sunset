const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

function base(cor) {
  const e = new EmbedBuilder()
    .setColor(cor || config.embeds.color)
    .setTimestamp();

  if (config.embeds.footer?.text) {
    e.setFooter({
      text: config.embeds.footer.text,
      iconURL: config.embeds.footer.iconURL || undefined,
    });
  }

  return e;
}

function sucesso(titulo, descricao, campos = []) {
  const e = base(config.embeds.successColor).setTitle(`✅ ${titulo}`).setDescription(descricao);
  if (campos.length > 0) e.addFields(campos);
  return e;
}

function erro(titulo, descricao) {
  return base(config.embeds.errorColor).setTitle(`❌ ${titulo}`).setDescription(descricao);
}

function aviso(titulo, descricao, campos = []) {
  const e = base(config.embeds.warningColor).setTitle(`⚠️ ${titulo}`).setDescription(descricao);
  if (campos.length > 0) e.addFields(campos);
  return e;
}

function info(titulo, descricao, campos = []) {
  const e = base(config.embeds.color).setTitle(titulo).setDescription(descricao);
  if (campos.length > 0) e.addFields(campos);
  if (config.embeds.banner) e.setImage(config.embeds.banner);
  return e;
}

module.exports = { sucesso, erro, aviso, info, base };

const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

function base(color) {
  const embed = new EmbedBuilder()
    .setColor(color || config.embeds.color)
    .setTimestamp();

  if (config.embeds.footer?.text) {
    embed.setFooter({
      text: config.embeds.footer.text,
      iconURL: config.embeds.footer.iconURL || undefined,
    });
  }

  return embed;
}

function success(title, description) {
  return base(config.embeds.successColor).setTitle(`✅ ${title}`).setDescription(description);
}

function error(title, description) {
  return base(config.embeds.errorColor).setTitle(`❌ ${title}`).setDescription(description);
}

function warning(title, description) {
  return base(config.embeds.warningColor).setTitle(`⚠️ ${title}`).setDescription(description);
}

function info(title, description, fields = []) {
  const e = base(config.embeds.color).setTitle(title).setDescription(description);
  if (fields.length > 0) e.addFields(fields);
  if (config.embeds.banner) e.setImage(config.embeds.banner);
  return e;
}

module.exports = { success, error, warning, info, base };

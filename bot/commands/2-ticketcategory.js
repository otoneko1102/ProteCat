const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'ticketcategory',
  usage: 'ticketcategory {category}',
  aliases: ['tc'],
  description: 'チケットの作成先のカテゴリーを変更します',
  async execute(client, message, args, config) {
    const err_embed = new MessageEmbed()
      .setTitle("チケットカテゴリー")
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      err_embed.setDescription(`❌ 管理者権限が必要です`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    
    let prefix = config.prefix;
    const guildId = message.guild.id;
    const settingsFilePath = `./settings/${guildId}.json`;
    if (fs.existsSync(settingsFilePath)) {
      const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
      if (settings?.prefix) {
        prefix = settings.prefix;
      }
    }

    if (!fs.existsSync(settingsFilePath)) {
      err_embed.setDescription(`❌ 先に ${prefix}setup を実行してください`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    
    const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
    
    if (args.length < 1) {
      err_embed.setDescription(`❌ 値が不正です`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    let categoryId = args[0].replace(/<#|>/g,'');
    const category = message.guild.channels.cache.get(categoryId);
    if (categoryId !== 'reset' && (!category || category?.type !== 'GUILD_CATEGORY')) {
      err_embed.setDescription(`❌ {category} が不正です`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    categoryId = categoryId.toLowerCase() === 'reset' ? null : categoryId;
    settings.setting.ticket_number.category = categoryId;
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
    try {
      const embed = new MessageEmbed()
        .setTitle("チケットカテゴリー")
        .setDescription(`✅ チケットカテゴリーを${categoryId === null?'リセット':` <#${categoryId}> に変更`}しました`)
        .setFooter({text: `リセットする場合は ${prefix}ticketcategory reset と送信してください`})
        .setColor(config.color);
      await message.channel.send({ embeds: [embed] })
    } catch (e) {
      err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      console.error(e);
    }
  },
};
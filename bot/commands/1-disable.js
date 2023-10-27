const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'disable',
  usage: 'disable {mode}',
  aliases: ['d'],
  description: 'サーバー保護設定を変更します (mode: `true, false`)',
  async execute(client, message, args, config) {
    const err_embed = new MessageEmbed()
      .setTitle("サーバー保護設定")
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
    let mode = args[0].toLowerCase();
    if (mode !== 'true' && mode !== 'false') {
      err_embed.setDescription(`❌ {mode} の値が不正です`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    mode = mode === 'true' ? true : false;
    settings.setting.disable = mode;
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
    try {
      const embed = new MessageEmbed()
        .setTitle("サーバー保護設定")
        .setDescription(`✅ サーバー保護を **${mode?'無効':'有効'}** にしました`)
        .setFooter({text: `再び ${mode?'有効':'無効'} にする場合は ${prefix}disable ${mode?false:true} と送信してください`})
        .setColor(config.color);
      await message.channel.send({ embeds: [embed] })
    } catch (e) {
      err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      console.error(e);
    }
  },
};
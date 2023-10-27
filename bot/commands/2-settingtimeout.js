const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'settingtimeout',
  usage: 'settingtimeout {mode} {type}',
  aliases: ['st'],
  description: 'タイムアウト設定を変更します(mode: `true, false` type: `antispam, antiinvite, antilink, antingwords`)',
  async execute(client, message, args, config) {
    const err_embed = new MessageEmbed()
      .setTitle("タイムアウト設定");
    
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
    
    if (args.length < 2) {
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
    const type = args[1].toLowerCase();
    if (type !== 'antispam' && type !== 'antiinvite' && type !== 'antilink' && type !== 'antingwords' && type !== 'timeout') {
      err_embed.setDescription(`❌ {type} の値が不正です`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    try {
      const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
      settings.setting.timeout[type] = mode;
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
      
      const embed = new MessageEmbed()
        .setTitle("タイムアウト設定")
        .setDescription(`✅ 設定を更新しました`)
        .setColor(config.color);
        
      await message.channel.send({embeds: [embed]});
    } catch (e) {
      console.error(e);
      err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
    }   
  },
}
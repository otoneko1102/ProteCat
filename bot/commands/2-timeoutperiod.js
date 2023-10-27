const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'timeoutperiod',
  usage: 'timeoutperiod {time} {type}',
  aliases: ['tp'],
  description: 'タイムアウト設定を変更します(type: `days, hours, minutes, seconds`)',
  async execute(client, message, args, config) {
    const err_embed = new MessageEmbed()
      .setTitle("タイムアウト期間設定");
    
    function isNonNegativeInteger(number) {
      if (isNaN(number)) {
        return false;
      }
      if (typeof number !== 'number') {
        return false;
      }
      if (number >= 0 && Number.isInteger(number)) {
        return true;
      } else {
        return false;
      }
    }
    
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

    const time = parseFloat(args[0]);
    if (!isNonNegativeInteger(time)) {
      err_embed.setDescription(`❌ {time} の値が不正です`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    const type = args[1].toLowerCase();
    if (type !== 'days' && type !== 'hours' && type !== 'minutes' && type !== 'seconds') {
      err_embed.setDescription(`❌ {type} の値が不正です`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    try {
      const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
      if (type === 'days') {
        if (time > 28) {
          err_embed.setDescription(`❌ {time} の値が不正です`).setColor('RED');
          await message.channel.send({ embeds: [err_embed] });
          return;
        }
      }
      if (type === 'hours') {
        if (time > 23) {
          err_embed.setDescription(`❌ {time} の値が不正です`).setColor('RED');
          await message.channel.send({ embeds: [err_embed] });
          return;
        }
      }
      if (type === 'minutes') {
        if (time > 59) {
          err_embed.setDescription(`❌ {time} の値が不正です`).setColor('RED');
          await message.channel.send({ embeds: [err_embed] });
          return;
        }
      }
      if (type === 'seconds') {
        if (time > 59) {
          err_embed.setDescription(`❌ {time} の値が不正です`).setColor('RED');
          await message.channel.send({ embeds: [err_embed] });
          return;
        }
      }
      settings.setting.timeout[type] = time;
      
      if (
        (
          settings.setting.timeout.days +
          settings.setting.timeout.hours +
          settings.setting.timeout.minutes +
          settings.setting.timeout.seconds
        ) > 28
      ) {
        settings.setting.timeout.days = 28;
        settings.setting.timeout.hours = 0;
        settings.setting.timeout.minutes = 0;
        settings.setting.timeout.seconds = 0;
      }
      if (
        (
          settings.setting.timeout.days +
          settings.setting.timeout.hours +
          settings.setting.timeout.minutes +
          settings.setting.timeout.seconds
        ) == 0
      ) {
        settings.setting.timeout.minutes = 2;
      }
      
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
      
      const embed = new MessageEmbed()
        .setTitle("タイムアウト期間設定")
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
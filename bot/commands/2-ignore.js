const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'ignore',
  usage: 'ignore {mode} {type} (values...)',
  aliases: ['i'],
  description: '要素をホワイトリストに追加/削除します(mode: `add, remove, reset` type: `channels, roles, users`)',
  async execute(client, message, args, config) {
    const err_embed = new MessageEmbed()
      .setTitle("ホワイトリスト");
    
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
    
    if (args.length < 2) {
      err_embed.setDescription(`❌ 値が不正です`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    
    const mode = args[0].toLowerCase();
    const type = args[1].toLowerCase();
    if (mode === 'reset') {
      if (type === 'users' || type === 'roles' || type === 'channels') {
        settings[`ignore_${type}`] = [];
        fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
        const embed = new MessageEmbed()
          .setTitle("ホワイトリスト")
          .setDescription(`✅ 設定をリセットしました`)
          .setColor(config.color);
        
        await message.channel.send({embeds: [embed]});
      }
      return;
    }
    
    if (args.length < 3) {
      err_embed.setDescription(`❌ 値が不正です`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    
    if (mode !== 'add' && mode !== 'remove') {
      err_embed.setDescription(`❌ {mode} の値が不正です`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    
    const opts = args.slice(2);
    console.log(opts);
    const result = [];
    
    if (type === 'users') {
      await message.guild.members.fetch();
      for (const opt of opts) {
        const id = opt.replace(/<@|!|>/g,'');
        const member = message.guild.members.cache.get(id);
        if (member) {
          result.push(id);
        }
      }
    } else if (type === 'roles') {
      await message.guild.roles.fetch();
      for (const opt of opts) {
        const id = opt.replace(/<@&|>/g,'');
        const role = message.guild.roles.cache.get(id);
        if (role) {
          result.push(id);
        }
      }
    } else if (type === 'channels') {
      await message.guild.channels.fetch();
      for (const opt of opts) {
        const id = opt.replace(/<#|>/g,'');
        const channel = message.guild.channels.cache.get(id);
        if (channel) {
          result.push(id);
        }
      }
    } else {
      err_embed.setDescription(`❌ {type} の値が不正です`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    
    console.log(result);
    
    try {
      if (mode === 'add') {
        for (const item of result) {
          if (!settings[`ignore_${type}`].includes(item)) {
            settings[`ignore_${type}`].push(item);
          }
        }
      } else if (mode === 'remove') {
        if (settings[`ignore_${type}`]) {
          settings[`ignore_${type}`] = settings[`ignore_${type}`].filter(item => !result.includes(item));
        }
      }
      
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
      
      const embed = new MessageEmbed()
        .setTitle("ホワイトリスト")
        .setDescription(`✅ 設定を更新しました`)
        .setColor(config.color);
        
      await message.channel.send({embeds: [embed]});
    } catch (e) {
      console.error(e);
      err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
    }
  },
};
const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'settingnuke',
  usage: 'settingnuke {mode} (channels...)',
  aliases: ['sn'],
  description: '再生成チャンネルを追加/削除します(mode: `add, remove, reset`)',
  async execute(client, message, args, config) {
    const err_embed = new MessageEmbed()
      .setTitle("再生成チャンネル");
    
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
    
    const mode = args[0].toLowerCase();
    if (mode === 'reset') {
      settings.channel.nuke = [];
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
      const embed = new MessageEmbed()
        .setTitle("再生成チャンネル")
        .setDescription(`✅ 設定をリセットしました`)
        .setColor(config.color);
      
      await message.channel.send({ embeds: [embed] });
      return;
    }
    
    if (args.length < 2) {
      err_embed.setDescription(`❌ 値が不正です`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    
    if (mode !== 'add' && mode !== 'remove') {
      err_embed.setDescription(`❌ {mode} の値が不正です`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    
    const opts = args.slice(1);
    console.log(opts);
    const result = [];

    await message.guild.channels.fetch();
    for (const opt of opts) {
      const id = opt.replace(/<#|>/g,'');
      const channel = message.guild.channels.cache.get(id);
      if (channel && isTextOrVoiceChannel(channel)) {
        result.push(id);
      }
    }
    
    function isTextOrVoiceChannel(channel) {
      return channel.type === 'GUILD_TEXT' || channel.type === 'GUILD_VOICE';
    }
    
    console.log(result);
    
    try {
      if (mode === 'add') {
        for (const item of result) {
          if (!settings.channel?.nuke.includes(item)) {
            settings.channel.nuke.push(item);
          }
        }
      } else if (mode === 'remove') {
        if (settings.channel?.nuke) {
          settings.channel.nuke = settings.channel?.nuke.filter(item => !result.includes(item));
        }
      }
      
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
      
      const embed = new MessageEmbed()
        .setTitle("再生成チャンネル")
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
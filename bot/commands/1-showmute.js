const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'showmute',
  usage: 'showmute',
  aliases: ['sm'],
  description: 'ミュートユーザーを表示します',
  async execute(client, message, args, config) {
    const err_embed = new MessageEmbed()
      .setTitle("ミュートユーザー")
    
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
    const muted_users = settings?.muted_users;
    let description = '存在しません'
    if (muted_users.length > 0) {
      const mentions = [];
      for (const user of muted_users) {
        const member = await message.guild.members.cache.get(user);
        if (!member) continue;
        mentions.push(`<@${member.user.id}>`)
      }
      if (mentions.length > 0) description = mentions.join(' , ')
    }
    try {
      const embed = new MessageEmbed()
        .setTitle("ミュートユーザー")
        .setDescription(description)
        .setColor(config.color);
      await message.channel.send({ embeds: [embed] })
    } catch (e) {
      err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      console.error(e);
    }
  },
};
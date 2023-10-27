const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'showfile',
  usage: 'showfile',
  aliases: ['sf'],
  description: '設定ファイル(json形式)を表示します',
  async execute(client, message, args, config) {
    const err_embed = new MessageEmbed()
      .setTitle("設定ファイル");
    
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
    
    try {
      await message.channel.send({ content: `${message.guild.name} の設定ファイルです`, files: [settingsFilePath] });
    } catch (e) {
      console.error(e);
      err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
    }   
  },
}

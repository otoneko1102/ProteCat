const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'ticket',
  usage: 'ticket (description)',
  aliases: ['t'],
  description: '認証パネルを設置します',
  async execute(client, message, args, config) {
    const err_embed = new MessageEmbed()
      .setTitle("認証");
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
  
    const embed = new MessageEmbed()
      .setTitle("チケット")
      .setColor(config.color)

    let explanation = "下のボタンを押してチケットを作成できます"
    if (args.length > 0) {
      explanation = args.join(' ')
    }
    embed.setDescription(explanation);
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId(`ticket`)
          .setEmoji('🎫')
          .setLabel('チケット作成')
          .setStyle('SUCCESS'),
      )
   try {
     await message.channel.send({ embeds: [embed], components: [row] });
     await message.delete()
   } catch (e) {
     console.error(e);
     err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
     await message.channel.send({ embeds: [err_embed] });
   }
  },
};
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'verify',
  usage: 'verify {role} (description)',
  aliases: ['v'],
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
    
    if (args.length < 1) {
      err_embed.setDescription(`❌ 値が不正です`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    const roleId = args[0].replace(/<@&|>/g,'');
    const role = message.guild.roles.cache.get(roleId);
    if (!role) {
      err_embed.setDescription(`❌ {role} の値が不正です`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    
    const embed = new MessageEmbed()
      .setTitle("認証")
      .setColor(config.color)
      .addFields([
        {
          name: '付与されるロール',
          value: `${role}`
        }
      ])
      .setFooter({text: 'DMに送信される画像内の文字列を送信してください\n※大文字か小文字かは問いません\n30 秒以内に答えを送信してください'})
    if (args.length > 1) {
      const explanation = args.slice(1)?.join(' ')
      embed.setDescription(explanation);
    }
   const row = new MessageActionRow()
     .addComponents(
       new MessageButton()
         .setCustomId(`verify-${roleId}`)
         .setEmoji('✅')
         .setLabel('認証')
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
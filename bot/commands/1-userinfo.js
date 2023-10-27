const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'userinfo',
  usage: 'userinfo (user)',
  aliases: ['ui'],
  description: 'ユーザーの情報を表示します',
  async execute(client, message, args, config) {
    const err_embed = new MessageEmbed()
      .setTitle("ユーザー情報");
    
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
    const userId = args[0]?.replace(/<@|!|>/g,'') || message.author.id;
    const member = message.guild.members.cache.get(userId);
    if (!member) {
      err_embed.setDescription(`❌ ユーザーが存在しません`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
    const mods = settings?.mods;
    const isAdmin = message.member.permissions.has("ADMINISTRATOR");
    const isMod = hasRole(userId, mods);
    function hasRole(id, mods) {
      let count = 0;
      const roles = message.guild.members.cache.get(id).roles?.cache;
      if (!roles) {
        return false;
      }
      for (const role of roles.values()) {
        if (mods.includes(role.id)) {
          count++;
        }
      }
      return count > 0;
    }
    try {
      const roles = [];
      const roleIds = await member.roles.cache.map((role) => role.id);
      for (const roleId of roleIds) {
        const role = `<@&${roleId}>`
        roles.push(role);
      }
      const maxItemsToShow = 10; // 最大表示アイテム数
      function formatItems(items, itemName) {
        if (items.length > maxItemsToShow) {
          const extraItemsCount = items.length - maxItemsToShow;
          items = items.slice(0, maxItemsToShow);
          items.push(`+ ${extraItemsCount} ${extraItemsCount == 1?itemName.slice(0, -1):itemName}`);
        }
        return items.join(' , ');
      }
      const embed = new MessageEmbed()
        .setTitle('ユーザー情報')
        .setThumbnail(member.displayAvatarURL())
        .setDescription(`${member}\nName: ${member.user.tag.split('#')[1] === '0' ? member.user.username : member.user.tag}\n${member.user.id}`)
        .setColor(config.color)
        .addFields([
          {
            name: 'Admin?',
            value: `${isAdmin}`
          },
          {
            name: 'Mod?',
            value: `${isMod}`
          },
          {
            name: 'ロール',
            value: formatItems(roles, 'roles')
          }
        ])
      await message.channel.send({ embeds: [embed] })
    } catch (e) {
      console.error(e);
      err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
    }
  },
}
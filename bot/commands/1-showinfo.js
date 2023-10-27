const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'showinfo',
  usage: 'showinfo (type)',
  aliases: ['si'],
  description: '情報を表示します (type: `mods, channels, roles, users, nukes, autoroles, ngwords`)',
  async execute(client, message, args, config) {
    const err_embed = new MessageEmbed()
      .setTitle("情報");
    
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
    const mods_roles = settings?.mods;
    const ignore_channels = settings?.ignore_channels;
    const ignore_roles = settings?.ignore_roles;
    const ignore_users = settings?.ignore_users;
    const ngwords = settings?.ngwords;
    const auto_roles = settings.role?.autos;
    const nuke_channels = settings.channel?.nuke;
    const timeout = settings.setting?.timeout;
    const mods = [];
    const channels = [];
    const roles = [];
    const users = [];
    const autoroles = [];
    const nukes = [];
    for (const role of mods_roles) {
      mods.push(`<@&${role}>`)
    }
    for (const channel of ignore_channels) {
      channels.push(`<#${channel}>`)
    }
    for (const role of ignore_roles) {
      roles.push(`<@&${role}>`)
    }
    for (const user of ignore_users) {
      users.push(`<@${user}>`)
    }
    for (const channel of nuke_channels) {
      nukes.push(`<#${channel}>`)
    }
    for (const role of auto_roles) {
      autoroles.push(`<@&${role}>`)
    }
    
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('delete')
          .setLabel('Delete')
          .setStyle('DANGER'),
      )
    
    if (args.length > 0) {
      const type = args[0].toLowerCase()
      if (type !== 'mods' && type !== 'channels' && type !== 'roles' && type !== 'users' && type !== 'nukes' && type !== 'ngwords' && type !== 'autoroles') {
        err_embed.setDescription(`❌ (type) の値が不正です`).setColor('RED');
        await message.channel.send({ embeds: [err_embed] });
        return;
      }
      try {
        const show_type = { mods, channels, roles, users, nukes, autoroles, ngwords }
        const type_embed = new MessageEmbed()
          .setTitle("情報")
          .setThumbnail(message.guild.iconURL())
          .setDescription(`### ${type}${show_type[type].length > 0?` - ${show_type[type].length} ${show_type[type].length == 1?type.slice(0, -1):type}`:' - 未設定'}\n${show_type[type].join(' , ')}`)
          .setColor(config.color);
        await message.channel.send({ embeds: [type_embed], components: [row] });
      } catch (e) {
        console.error(e);
        err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
        await message.channel.send({ embeds: [err_embed] });
      }
    } else {
      const time = {
        days: settings.setting?.timeout?.days,
        hours: settings.setting?.timeout?.hours,
        minutes: settings.setting?.timeout?.minutes,
        seconds: settings.setting?.timeout?.seconds,
      }
      const embed = new MessageEmbed()
        .setTitle("情報")
        .setThumbnail(message.guild.iconURL())
        .setDescription(`## サーバー保護: ${!settings.setting?.disable ? '有効': '無効'}\n**antispam**: ${settings.setting?.antispam} (timeout: ${timeout?.antispam})\n**antiinvite**: ${settings.setting?.antiinvite} (timeout: ${timeout?.antiinvite})\n**antilink**: ${settings.setting?.antilink} (timeout: ${timeout?.antilink})\n**antingwords**: ${settings.setting?.antingwords} (timeout: ${timeout?.antingwords})\n**timeoutperiod**: ${time?.days!=0?`${time?.days} 日 `:''}${time?.hours!=0?`${time?.hours} 時間 `:''}${time?.minutes!=0?`${time?.minutes} 分 `:''}${time?.seconds!=0?`${time?.seconds} 秒 `:''}`)
        .setColor(config.color);
      const category = settings.setting.ticket_number?.category;
      const fieldValue = [
        {
          name: 'プレフィックス',
          value: prefix
        },
        {
          name: 'チケットカテゴリー',
          value: (category && message.guild.channels.cache.get(category)) ? `<#${category}>` : 'デフォルト'
        }
      ];

      const maxItemsToShow = 5; // 最大表示アイテム数

      function formatItems(items, itemName) {
        if (items.length > maxItemsToShow) {
          const extraItemsCount = items.length - maxItemsToShow;
          items = items.slice(0, maxItemsToShow);
          items.push(`+ ${extraItemsCount} ${extraItemsCount == 1?itemName.slice(0, -1):itemName}`);
        }
        return items.join(' , ');
      }
      
      if (mods.length > 0) {
        fieldValue.push({
          name: 'モデレーターロール',
          value: formatItems(mods, 'roles')
        });
      }
      if (channels.length > 0) {
        fieldValue.push({
          name: 'ホワイトリストチャンネル',
          value: formatItems(channels, 'channels')
        });
      }
      if (roles.length > 0) {
        fieldValue.push({
          name: 'ホワイトリストロール',
          value: formatItems(roles, 'roles')
        });
      }
      if (users.length > 0) {
        fieldValue.push({
          name: 'ホワイトリストユーザー',
          value: formatItems(users, 'users')
        });
      }
      if (ngwords.length > 0) {
        fieldValue.push({
          name: 'NGワード',
          value: formatItems(ngwords, 'ngwords')
        });
      }
      if (nukes.length > 0) {
        fieldValue.push({
          name: '再生成チャンネル',
          value: formatItems(nukes, 'nukes')
        });
      }
      if (autoroles.length > 0) {
        fieldValue.push({
          name: '自動付与ロール',
          value: formatItems(autoroles, 'autoroles')
        });
      }

      try {
        if (fieldValue.length > 0) {
          embed.addFields(fieldValue);
        }
        await message.channel.send({ embeds: [embed], components: [row] });
      } catch (e) {
        console.error(e);
        err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
        await message.channel.send({ embeds: [err_embed] });
      }
    }
  },
}

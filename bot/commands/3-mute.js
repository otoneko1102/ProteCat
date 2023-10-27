const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'mute',
  usage: 'mute {mode} (users...)',
  aliases: ['m'],
  description: 'ミュートユーザーを追加/削除します(mode: `add, remove, reset`)',
  async execute(client, message, args, config) {
    const err_embed = new MessageEmbed()
      .setTitle("ミュート");

    try {
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
        const muted_users = settings?.muted_users;
        if (muted_users.length > 0) {
          const role = await message.guild.roles.cache.get(settings.role?.muted);
          if (role) {
            for (const user of muted_users) {
              const member = await message.guild.members.cache.get(user);
              if (member) {
                member.roles.remove(settings.role.muted, 'Reset muted user')
              }
            }
          }
        }
        settings.muted_users = [];
        fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
        const embed = new MessageEmbed()
          .setTitle("ミュート")
          .setDescription(`✅ ミュートユーザーをリセットしました`)
          .setColor(config.color);

        await message.channel.send({embeds: [embed]});
        return;
      }

      const role = await message.guild.roles.cache.get(settings.role?.muted);

      if (!role) {
        err_embed.setDescription(`❌ **Muted User** ロールが存在しません`).setColor('RED');
        await message.channel.send({ embeds: [err_embed] });
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

      const usersBase = args.slice(1);
      const userIds = [];
      for (const user of usersBase) {
        const userId = user.replace(/<@|!|>/g,'')
        const member = message.guild.members.cache.get(userId);
        if (member) {
          userIds.push(userId);
        }
      }
      console.log(userIds);

      if (mode === 'add') {
        for (const userId of userIds) {
          const member = await message.guild.members.cache.get(userId);
          if (!member) continue;
          const roleIds = await member.roles.cache.map(role => role.id);
          console.log(roleIds)
          for (const roleId of roleIds) {
            try {
              if (message.guild.roles.cache.get(roleId)) {
                await member.roles.remove(roleId, 'Add muted user');
              }
            } catch (e) {
              console.log('Failed to remove.')
            }

            try {
              await member.roles.add(settings.role.muted, 'Add muted user');
            } catch (e) {
              console.log('Failed to add.')
            }
          }
        }
      } else if (mode === 'remove') {
        for (const userId of userIds) {
          const member = await message.guild.members.cache.get(userId);
          if (member) {
            try {
              await member.roles.remove(settings.role.muted, 'Remove muted user');
            } catch (e) {
              console.log('Failed to remove.')
            }
          }
        }
      }

      const embed = new MessageEmbed()
        .setTitle("ミュート")
        .setDescription(`✅ ミュートユーザーを更新しました`)
        .setColor(config.color);
      const mentions = [];
      for (const userId of userIds) {
        const member = await message.guild.members.cache.get(userId);
        if (!member) continue;
        mentions.push(`<@${userId}>`)
      }
      if (mentions.length > 0) {
        embed.addFields([
          {
            name: mode,
            value: mentions.join(' , ')
          }
        ])
      }
      await message.channel.send({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
    }
  },
}

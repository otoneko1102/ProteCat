const { MessageEmbed } = require("discord.js");
const fs = require("fs");

const cooldowns = new Map();

module.exports = {
  name: 'setup',
  usage: 'setup',
  aliases: ['s'],
  description: 'セットアップします',
  async execute(client, message, args, config) {
    
    const cooldownKey = message.guild.id;

    const startTime = Date.now();
    let setupMessage = `✅ セットアップ開始`;
    const embed = new MessageEmbed()
      .setTitle("セットアップ")
      .setDescription(setupMessage)
      .setColor(config.color);
    if (!message.guild.me.permissions.has("ADMINISTRATOR") || !message.member.permissions.has("ADMINISTRATOR")) {
      setupMessage = `❌ 管理者権限が必要です`;
      embed.setDescription(setupMessage).setColor('RED');
      await message.channel.send({ embeds: [embed] });
      return;
    }
    
    if (cooldowns.has(cooldownKey)) {
      const cooldownTime = cooldowns.get(cooldownKey);
      const currentTime = Date.now();

      if (currentTime < cooldownTime) {
        const remainingTime = Math.ceil((cooldownTime - currentTime) / 1000); // 秒単位で残り時間を計算
        const remainingMinutes = Math.floor(remainingTime / 60);
        const remainingSeconds = remainingTime % 60;
        setupMessage = `❌ クールダウン中です (残り ${remainingMinutes != 0 ? `${remainingMinutes} 分 `: ''}${remainingSeconds} 秒)`;
        embed.setDescription(setupMessage).setColor('RED');
        const msg = await message.channel.send({ embeds: [embed] });
        return;
      }
    }

    const msg = await message.channel.send({ embeds: [embed] });
    const cooldownTimeInSeconds = 180;
    const cooldownEndTime = startTime + cooldownTimeInSeconds * 1000;
    cooldowns.set(cooldownKey, cooldownEndTime);

    try {
      const guildId = message.guild.id;
      const guildSettings = {
        guild_name: message.guild.name,
        prefix: null,
        mods: [],
        channel: {
          category: "",
          log: "",
          msglog: "",
          invite: "",
          nuke: [],
        },
        role: {
          muted: "",
          autos: [],
        },
        setting: {
          disable: false,
          antispam: true,
          antiinvite: true,
          antilink: false,
          antingwords: true,
          ticket_number: {
            category: null,
          },
          timeout: {
            days: 0,
            hours: 0,
            minutes: 2,
            seconds: 0,
            antispam: true,
            antiinvite: true,
            antilink: false,
            antingwords: false,
          },
        },
        ignore_channels: [],
        ignore_roles: [],
        ignore_users: [],
        ngwords: [],
        muted_users: [],
      };
      const settingsFilePath = `./settings/${guildId}.json`;

      if (fs.existsSync(settingsFilePath)) {
        setupMessage = setupMessage + `\n✅ 既に設定ファイルが存在します`;
      } else {
        fs.writeFileSync(settingsFilePath, JSON.stringify(guildSettings, null, 2));
        setupMessage = setupMessage + `\n✅ 設定ファイル作成完了`;
      }

      embed.setDescription(setupMessage);
      await msg.edit({ embeds: [embed] });

      const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
      
      let category;
      if (settings.channel?.category && message.guild.channels.cache.get(settings.channel?.category)) {
        setupMessage = setupMessage + `\n✅ 既にカテゴリーが存在します`;
        category = message.guild.channels.cache.get(settings.channel?.category);
      } else {
        category = await message.guild.channels.create('ProteCat', {
          type: 'GUILD_CATEGORY',
          permissionOverwrites: [
            {
              id: message.guild.roles.everyone.id,
              deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
            },
            {
              id: client.user.id,
              allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
            },
          ],
        });
        setupMessage = setupMessage + `\n✅ カテゴリー作成完了`;
        settings.channel.category = category.id;
        fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
      }
      
      let auditLogChannel;
      if (settings.channel?.log && message.guild.channels.cache.get(settings.channel?.log)) {
        setupMessage = setupMessage + `\n✅ 既にaudit-logチャンネルが存在します`;
        auditLogChannel = message.guild.channels.cache.get(settings.channel?.log);
        auditLogChannel.setParent(category);
      } else {
        auditLogChannel = await message.guild.channels.create('protecat-audit-log', {
          type: 'GUILD_TEXT',
          parent: category,
          permissionOverwrites: [
            {
              id: message.guild.roles.everyone.id,
              deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
            },
            {
              id: client.user.id,
              allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
            },
          ],
        });
        setupMessage = setupMessage + `\n✅ audit-logチャンネル作成完了`;
        settings.channel.log = auditLogChannel.id;
        fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
      }
      
      let messageLogChannel;
      if (settings.channel?.msglog && message.guild.channels.cache.get(settings.channel?.msglog)) {
        setupMessage = setupMessage + `\n✅ 既にmessage-logチャンネルが存在します`;
        messageLogChannel = message.guild.channels.cache.get(settings.channel?.msglog);
        messageLogChannel.setParent(category);
      } else {
        messageLogChannel = await message.guild.channels.create('protecat-message-log', {
          type: 'GUILD_TEXT',
          parent: category,
          permissionOverwrites: [
            {
              id: message.guild.roles.everyone.id,
              deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
            },
            {
              id: client.user.id,
              allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
            },
          ],
        });
        setupMessage = setupMessage + `\n✅ message-logチャンネル作成完了`;
        settings.channel.msglog = messageLogChannel.id;
        fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
      }
      
      let inviteLogChannel;
      if (settings.channel?.invite && message.guild.channels.cache.get(settings.channel?.invite)) {
        setupMessage = setupMessage + `\n✅ 既にinvite-logチャンネルが存在します`;
        inviteLogChannel = message.guild.channels.cache.get(settings.channel?.invite);
        inviteLogChannel.setParent(category);
      } else {
        inviteLogChannel = await message.guild.channels.create('protecat-invite-log', {
          type: 'GUILD_TEXT',
          parent: category,
          permissionOverwrites: [
            {
              id: message.guild.roles.everyone.id,
              deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
            },
            {
              id: client.user.id,
              allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
            },
          ],
        });
        setupMessage = setupMessage + `\n✅ invite-logチャンネル作成完了`;
        settings.channel.invite = inviteLogChannel.id;
        fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
      }

      let mutedRole;

      if (settings.role?.muted && message.guild.roles.cache.get(settings.role?.muted)) {
        setupMessage = setupMessage + `\n✅ 既にMuted Userロールが存在します`;
        mutedRole = message.guild.roles.cache.get(settings.role?.muted);
      } else {
        const highestRole = message.guild.roles.cache
          .filter((role) => role.managed === false && role.comparePositionTo(message.guild.me.roles.highest) < 0)
          .sort((a, b) => b.comparePositionTo(a))
          .first();
        mutedRole = await message.guild.roles.create({
          name: 'Muted User',
          permissions: [],
          position: highestRole.position - 1,
          mentionable: false,
          color: '#000001'
        });
        setupMessage = setupMessage + `\n✅ Muted Userロール作成完了`;
        settings.role.muted = mutedRole.id;
        fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
      }

      embed.setDescription(setupMessage);
      await msg.edit({ embeds: [embed] });

      const channels = await message.guild.channels.cache.filter(channel => !channel.type.includes("THREAD"));

      let count = 0;
      let setupMessageWithoutCount = setupMessage;
      for (const [_, channel] of channels) {
        try{
          await channel.permissionOverwrites.edit(mutedRole, {
            VIEW_CHANNEL: false,
            CONNECT: false,
            SEND_MESSAGES: false
          })
        } catch (e) {
          console.error(e)
        }
        count = count + 1;
        if (count % 10 == 0 || count == channels.size) {
          let endTime = Date.now();
          let time = (endTime - startTime) / 1000;
          setupMessageWithoutCount = setupMessage + `\n✅ ${count}/${channels.size} チャンネル設定更新完了${count == channels.size ? `\n✅ 全ての設定が完了しました (${time} 秒)`: ''}`;
          embed.setDescription(setupMessageWithoutCount);
          await msg.edit({ embeds: [embed] });
        }
      }
    } catch (e) {
      setupMessage = setupMessage + `\n❌ エラーが発生しました`;
      embed.setDescription(setupMessage).setColor('RED');
      await msg.edit({ embeds: [embed] });
      console.error(e);
    }
  },
};

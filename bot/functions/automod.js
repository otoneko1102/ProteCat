const { Client, MessageEmbed } = require("discord.js");
const fs = require("fs");
const options = { intents: [3276799] };
const client = new Client(options);

const { inviteTracker } = require("discord-inviter"), tracker = new inviteTracker(client);

const config = JSON.parse(fs.readFileSync("./config.json", 'utf8'));
let prefix = config.prefix;

const spamUsers = new Map();

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (message.content === `<@${client.user.id}>` || message.content === `<@!${client.user.id}>`) {
    let px = config.prefix;
    const guildId = message.guild.id;
    const settingsFilePath = `./settings/${guildId}.json`;
    if (fs.existsSync(settingsFilePath)) {
      const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
      if (settings?.prefix) {
        px = settings.prefix;
      }
    }
    try {
      await message.reply(`プレフィックスは ${px} です`);
    } catch (e) {
      console.error(e);
    }
  }
}) 

client.on("ready", async () => {
  console.log(`automod.js OK!`);
  setInterval(async () => {
    client.user.setPresence({
      activities: [
        {
          name: `${prefix}help | ${client.guilds.cache.size} servers to Protect`,
          type: 'WATCHING'
        }
      ],
      status: 'online',
    })
    
    const timeZoneOffset = 9; // 日本時間はUTC+9
    const time = new Date(new Date().getTime() + timeZoneOffset * 60 * 60 * 1000);
    const hour = 2;
    if (time.getHours() % hour == 0 && time.getMinutes() % 60 == 0) {
      client.guilds.cache.forEach(async (guild) => {
        const guildId = guild.id;
        const settingsFilePath = `./settings/${guildId}.json`;
        if (!fs.existsSync(settingsFilePath)) return;
        const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
        settings.guild_name = guild.name;
        fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
        if (settings.setting.disable === true) return;
        const channelIds = settings.channel?.nuke || [];
        const newChannels = [];

        if (channelIds.length > 0) {
          let ignore_channels = settings?.ignore_channels;
          for (const channelId of channelIds) {
            const channel = guild.channels.cache.get(channelId);
            if (channel) {
              try {
                await channel.delete();
                await channel.clone().then(async (ch) => {
                  const embed = new MessageEmbed()
                    .setTitle("チャンネル再生成")
                    .setDescription(`**${channel.name}** を再生成しました`)
                    .setFooter(`次は ${(time.getHours() + hour) % 24}:00 です`)
                    .setTimestamp()
                    .setColor(config.color);
                  await ch.send({ embeds: [embed] });
                  newChannels.push(ch.id);
                  if (ignore_channels?.includes(channel.id)) {
                    ignore_channels = ignore_channels.filter(item => item !== channel.id);
                    ignore_channels.push(ch.id);
                    settings.ignore_channels = ignore_channels;
                  }
                });
              } catch (e) {
                console.error("チャンネルの再生成失敗", e);
              }
            }
          }
          settings.channel.nuke = newChannels;
          fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
        }
      });
      console.log("チャンネル再生成完了")
    }
  }, 60000);
});

client.on("messageCreate", async message => {
  if (message.author.bot || message.member?.permissions.has('ADMINISTRATOR')) return;
  const guildId = message.guild.id;
  const settingsFilePath = `./settings/${guildId}.json`;
  if (!fs.existsSync(settingsFilePath)) return;
  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
  if (settings.setting?.disable === true) return;
  const mods = settings?.mods;
  if (hasRole(message, mods)) return;
  const roleIds = message.member.roles.cache.map((role) => role.id); 
  function isIgnore(channelId, roleIds, userId, settings) {
    if (settings.ignore_channels?.includes(channelId)) return true;
    if (roleIds.some(roleId => settings.ignore_roles?.includes(roleId))) return true;
    if (settings.ignore_users?.includes(userId)) return true;
    return false;
  }
  if (isIgnore(message.channel.id, roleIds, message.author.id, settings)) return;
  
  const regex = /([A-Za-z\d]{24})\.([A-Za-z\d-_]{6})\.([A-Za-z\d-_]{27})|([A-Za-z\d-_]{59})\.([A-Za-z\d-_]{27})/g;
  if (!message.content.match(regex)) return;
  try {
    await message.guild.members.fetch();
    const embed = new MessageEmbed()
      .setTitle("トークンを検出しました")
      .setThumbnail(message.author.displayAvatarURL())
      .setDescription(`実行者: ${message.member}\nName: **${message.author.tag.split('#')[1] === '0' ? message.author.username : message.author.tag}**\nID: ${message.author.id}`)
      .setColor(config.color);
    const ch = message.channel;
    embed.addFields = ([
      {
        name: "チャンネル",
        value: `${ch} (**${ch.name}**, ID: ${ch.id})`
      }
    ]);
    try{await message.delete()}catch{console.error('x: delete')}
    const time = {
      days: settings.setting?.timeout?.days,
      hours: settings.setting?.timeout?.hours,
      minutes: settings.setting?.timeout?.minutes,
      seconds: settings.setting?.timeout?.seconds,
    }
    const timeout = (time?.days * 86400000) + (time?.hours * 360000) + (time?.minutes * 60000) + (time?.seconds * 1000);
    try{await message.member.timeout(timeout, "トークンの送信")}catch{console.error('x: timeout')}
    embed.setFooter({text: `${time?.days!=0?`${time?.days} 日 `:''}${time?.hours!=0?`${time?.hours} 時間 `:''}${time?.minutes!=0?`${time?.minutes} 分 `:''}${time?.seconds!=0?`${time?.seconds} 秒 `:''}の間タイムアウトしました`})
    await message.channel.send({embeds: [embed]});
    if (settings.channel?.log && message.guild.channels.cache.get(settings.channel?.log)) {
      const channel = message.guild.channels.cache.get(settings.channel?.log);
      await channel.send({embeds: [embed]});
      try {
        message.member.send({ embeds: [embed] })
      } catch (e) {
        console.error(e)
      }
    }
  } catch (e) {
    console.error(e);
  }
})

client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (newMessage.author.bot || newMessage.member?.permissions.has('ADMINISTRATOR')) return;
  const guildId = newMessage.guild.id;
  const settingsFilePath = `./settings/${guildId}.json`;
  if (!fs.existsSync(settingsFilePath)) return;
  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
  if (settings.setting?.disable === true) return;
  const mods = settings?.mods;
  if (hasRole(newMessage, mods)) return;
  const roleIds = newMessage.member.roles.cache.map((role) => role.id); 
  function isIgnore(channelId, roleIds, userId, settings) {
    if (settings.ignore_channels?.includes(channelId)) return true;
    if (roleIds.some(roleId => settings.ignore_roles?.includes(roleId))) return true;
    if (settings.ignore_users?.includes(userId)) return true;
    return false;
  }
  if (isIgnore(newMessage.channel.id, roleIds, newMessage.author.id, settings)) return;
  
  const regex = /([A-Za-z\d]{24})\.([A-Za-z\d-_]{6})\.([A-Za-z\d-_]{27})|([A-Za-z\d-_]{59})\.([A-Za-z\d-_]{27})/g;
  if (!newMessage.content.match(regex)) return;
  try {
    await newMessage.guild.members.fetch();
    const embed = new MessageEmbed()
      .setTitle("トークンを検出しました")
      .setThumbnail(newMessage.author.displayAvatarURL())
      .setDescription(`実行者: ${newMessage.member}\nName: **${newMessage.author.tag.split('#')[1] === '0' ? newMessage.author.username : newMessage.author.tag}**\nID: ${newMessage.author.id}`)
      .setColor(config.color);
    const time = {
      days: settings.setting?.timeout?.days,
      hours: settings.setting?.timeout?.hours,
      minutes: settings.setting?.timeout?.minutes,
      seconds: settings.setting?.timeout?.seconds,
    }
    try{await newMessage.delete()}catch{console.error('x: delete')}
    const timeout = (time?.days * 86400000) + (time?.hours * 360000) + (time?.minutes * 60000) + (time?.seconds * 1000);
    try{await newMessage.member.timeout(timeout, "トークンの送信")}catch{console.error('x: timeout')}
    embed.setFooter({text: `${time?.days!=0?`${time?.days} 日 `:''}${time?.hours!=0?`${time?.hours} 時間 `:''}${time?.minutes!=0?`${time?.minutes} 分 `:''}${time?.seconds!=0?`${time?.seconds} 秒 `:''}の間タイムアウトしました`})
    await newMessage.channel.send({ embeds: [embed] });
    if (settings.channel?.log && newMessage.guild.channels.cache.get(settings.channel?.log)) {
      const channel = newMessage.guild.channels.cache.get(settings.channel?.log);
      await channel.send({ embeds: [embed] });
      try {
        newMessage.member.send({ embeds: [embed] })
      } catch (e) {
        console.error(e)
      }
    }
  } catch (e) {
    console.error(e);
  }
});

client.on("messageCreate", async message => {
  if (message.author.bot || message.member?.permissions.has('ADMINISTRATOR')) return;
  const guildId = message.guild.id;
  const settingsFilePath = `./settings/${guildId}.json`;
  if (!fs.existsSync(settingsFilePath)) return;
  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
  if (settings.setting?.disable === true || settings.setting?.antiinvite === false) return;
  const mods = settings?.mods;
  if (hasRole(message, mods)) return;
  const roleIds = message.member.roles.cache.map((role) => role.id); 
  function isIgnore(channelId, roleIds, userId, settings) {
    if (settings.ignore_channels?.includes(channelId)) return true;
    if (roleIds.some(roleId => settings.ignore_roles?.includes(roleId))) return true;
    if (settings.ignore_users?.includes(userId)) return true;
    return false;
  }
  if (isIgnore(message.channel.id, roleIds, message.author.id, settings)) return;
  
  const regex = /(https?:\/\/)?(www\.)?(discord\.gg|discordapp\.com\/invite)\/[a-zA-Z0-9]+/gi;
  if (!message.content.match(regex)) return;
  try {
    await message.guild.members.fetch();
    const embed = new MessageEmbed()
      .setTitle("招待リンクを検出しました")
      .setThumbnail(message.author.displayAvatarURL())
      .setDescription(`実行者: ${message.member}\nName: **${message.author.tag.split('#')[1] === '0' ? message.author.username : message.author.tag}**\nID: ${message.author.id}`)
      .setColor(config.color);
    const ch = message.channel;
    embed.addFields = ([
      {
        name: "チャンネル",
        value: `${ch} (**${ch.name}**, ID: ${ch.id})`
      }
    ]);
    try{await message.delete()}catch{console.error('x: delete')}
    if (settings.setting?.timeout?.antiinvite) {
      const time = {
        days: settings.setting?.timeout?.days,
        hours: settings.setting?.timeout?.hours,
        minutes: settings.setting?.timeout?.minutes,
        seconds: settings.setting?.timeout?.seconds,
      }
      const timeout = (time?.days * 86400000) + (time?.hours * 360000) + (time?.minutes * 60000) + (time?.seconds * 1000);
      try{await message.member.timeout(timeout, "招待リンクの送信")}catch{console.error('x: timeout')}
      embed.setFooter({text: `${time?.days!=0?`${time?.days} 日 `:''}${time?.hours!=0?`${time?.hours} 時間 `:''}${time?.minutes!=0?`${time?.minutes} 分 `:''}${time?.seconds!=0?`${time?.seconds} 秒 `:''}の間タイムアウトしました`})
    }
    await message.channel.send({embeds: [embed]});
    if (settings.channel?.log && message.guild.channels.cache.get(settings.channel?.log)) {
      const channel = message.guild.channels.cache.get(settings.channel?.log);
      await channel.send({embeds: [embed]});
      try {
        message.member.send({ embeds: [embed] })
      } catch (e) {
        console.error(e)
      }
    }
  } catch (e) {
    console.error(e);
  }
})

client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (newMessage.author.bot || newMessage.member?.permissions.has('ADMINISTRATOR')) return;
  const guildId = newMessage.guild.id;
  const settingsFilePath = `./settings/${guildId}.json`;
  if (!fs.existsSync(settingsFilePath)) return;
  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
  if (settings.setting?.disable === true || settings.setting?.antiinvite === false) return;
  const mods = settings?.mods;
  if (hasRole(newMessage, mods)) return;
  const roleIds = newMessage.member.roles.cache.map((role) => role.id); 
  function isIgnore(channelId, roleIds, userId, settings) {
    if (settings.ignore_channels?.includes(channelId)) return true;
    if (roleIds.some(roleId => settings.ignore_roles?.includes(roleId))) return true;
    if (settings.ignore_users?.includes(userId)) return true;
    return false;
  }
  if (isIgnore(newMessage.channel.id, roleIds, newMessage.author.id, settings)) return;
  
  const regex = /(https?:\/\/)?(www\.)?(discord\.gg|discordapp\.com\/invite)\/[a-zA-Z0-9]+/gi;
  if (!newMessage.content.match(regex)) return;
  try {
    await newMessage.guild.members.fetch();
    const embed = new MessageEmbed()
      .setTitle("招待リンクを検出しました")
      .setThumbnail(newMessage.author.displayAvatarURL())
      .setDescription(`実行者: ${newMessage.member}\nName: **${newMessage.author.tag.split('#')[1] === '0' ? newMessage.author.username : newMessage.author.tag}**\nID: ${newMessage.author.id}`)
      .setColor(config.color);
    try{await newMessage.delete()}catch{console.error('x: delete')}
    if (settings.setting?.timeout?.antiinvite) {
      const time = {
        days: settings.setting?.timeout?.days,
        hours: settings.setting?.timeout?.hours,
        minutes: settings.setting?.timeout?.minutes,
        seconds: settings.setting?.timeout?.seconds,
      }
      const timeout = (time?.days * 86400000) + (time?.hours * 360000) + (time?.minutes * 60000) + (time?.seconds * 1000);
      try{await newMessage.member.timeout(timeout, "招待リンクの送信")}catch{console.error('x: timeout')}
      embed.setFooter({text: `${time?.days!=0?`${time?.days} 日 `:''}${time?.hours!=0?`${time?.hours} 時間 `:''}${time?.minutes!=0?`${time?.minutes} 分 `:''}${time?.seconds!=0?`${time?.seconds} 秒 `:''}の間タイムアウトしました`})
    }
    await newMessage.channel.send({embeds: [embed]});
    if (settings.channel?.log && newMessage.guild.channels.cache.get(settings.channel?.log)) {
      const channel = newMessage.guild.channels.cache.get(settings.channel?.log);
      await channel.send({embeds: [embed]});
      try {
        newMessage.member.send({ embeds: [embed] })
      } catch (e) {
        console.error(e)
      }
    }
  } catch (e) {
    console.error(e);
  }
})

client.on("messageCreate", async message => {
  if (message.author.bot || message.member?.permissions.has('ADMINISTRATOR')) return;
  const guildId = message.guild.id;
  const settingsFilePath = `./settings/${guildId}.json`;
  if (!fs.existsSync(settingsFilePath)) return;
  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
  if (settings.setting?.disable === true || settings.setting?.antilink === false) return;
  const mods = settings?.mods;
  if (hasRole(message, mods)) return;
  const roleIds = message.member.roles.cache.map((role) => role.id); 
  function isIgnore(channelId, roleIds, userId, settings) {
    if (settings.ignore_channels?.includes(channelId)) return true;
    if (roleIds.some(roleId => settings.ignore_roles?.includes(roleId))) return true;
    if (settings.ignore_users?.includes(userId)) return true;
    return false;
  }
  if (isIgnore(message.channel.id, roleIds, message.author.id, settings)) return;
  
  const regex = /https?:\/\/\S+/gi;
  const discordRegex = /(https?:\/\/)?(www\.)?(discord\.gg|discordapp\.com\/invite)\/[a-zA-Z0-9]+/gi;
  const contentToCheck = message.content;
  
  if (!regex.test(contentToCheck) || discordRegex.test(contentToCheck)) return;
  try {
    await message.guild.members.fetch();
    const embed = new MessageEmbed()
      .setTitle("リンクを検出しました")
      .setThumbnail(message.author.displayAvatarURL())
      .setDescription(`実行者: ${message.member}\nName: **${message.author.tag.split('#')[1] === '0' ? message.author.username : message.author.tag}**\nID: ${message.author.id}`)
      .setColor(config.color);
    const ch = message.channel;
    embed.addFields = ([
      {
        name: "チャンネル",
        value: `${ch} (**${ch.name}**, ID: ${ch.id})`
      }
    ]);
    try{await message.delete()}catch{console.error('x: delete')}
    if (settings.setting?.timeout?.antiilink) {
      const time = {
        days: settings.setting?.timeout?.days,
        hours: settings.setting?.timeout?.hours,
        minutes: settings.setting?.timeout?.minutes,
        seconds: settings.setting?.timeout?.seconds,
      }
      const timeout = (time?.days * 86400000) + (time?.hours * 360000) + (time?.minutes * 60000) + (time?.seconds * 1000);
      try{await message.member.timeout(timeout, "リンクの送信")}catch{console.error('x: timeout')}
      embed.setFooter({text: `${time?.days!=0?`${time?.days} 日 `:''}${time?.hours!=0?`${time?.hours} 時間 `:''}${time?.minutes!=0?`${time?.minutes} 分 `:''}${time?.seconds!=0?`${time?.seconds} 秒 `:''}の間タイムアウトしました`})
    }
    await message.channel.send({embeds: [embed]});
    if (settings.channel?.log && message.guild.channels.cache.get(settings.channel?.log)) {
      const channel = message.guild.channels.cache.get(settings.channel?.log);
      await channel.send({embeds: [embed]});
      try {
        message.member.send({ embeds: [embed] })
      } catch (e) {
        console.error(e)
      }
    }
  } catch (e) {
    console.error(e);
  }
})

client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (newMessage.author.bot || newMessage.member?.permissions.has('ADMINISTRATOR')) return;

  const guildId = newMessage.guild.id;
  const settingsFilePath = `./settings/${guildId}.json`;

  if (!fs.existsSync(settingsFilePath)) return;

  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));

  if (settings.setting?.disable === true || settings.setting?.antilink === false) return;
  const mods = settings?.mods;
  if (hasRole(newMessage, mods)) return;
  const roleIds = newMessage.member.roles.cache.map((role) => role.id);

  function isIgnore(channelId, roleIds, userId, settings) {
    if (settings.ignore_channels?.includes(channelId)) return true;
    if (roleIds.some(roleId => settings.ignore_roles?.includes(roleId))) return true;
    if (settings.ignore_users?.includes(userId)) return true;
    return false;
  }

  if (isIgnore(newMessage.channel.id, roleIds, newMessage.author.id, settings)) return;

  const regex = /https?:\/\/\S+/gi;
  const discordRegex = /(https?:\/\/)?(www\.)?(discord\.gg|discordapp\.com\/invite)\/[a-zA-Z0-9]+/gi;
  const contentToCheck = newMessage.content;

  if (!regex.test(contentToCheck) || discordRegex.test(contentToCheck)) return;

  try {
    await newMessage.guild.members.fetch();

    const embed = new MessageEmbed()
      .setTitle("リンクを検出しました")
      .setThumbnail(newMessage.author.displayAvatarURL())
      .setDescription(`実行者: ${newMessage.member}\nName: **${newMessage.author.tag.split('#')[1] === '0' ? newMessage.author.username : newMessage.author.tag}**\nID: ${newMessage.author.id}`)
      .setColor(config.color);
    try{await newMessage.delete()}catch{console.error('x: delete')}
    if (settings.setting?.timeout?.antiilink) {
      const time = {
        days: settings.setting?.timeout?.days,
        hours: settings.setting?.timeout?.hours,
        minutes: settings.setting?.timeout?.minutes,
        seconds: settings.setting?.timeout?.seconds,
      }
      const timeout = (time?.days * 86400000) + (time?.hours * 360000) + (time?.minutes * 60000) + (time?.seconds * 1000);
      try{await newMessage.member.timeout(timeout, "リンクの送信")}catch{console.error('x: timeout')}
      embed.setFooter({text: `${time?.days!=0?`${time?.days} 日 `:''}${time?.hours!=0?`${time?.hours} 時間 `:''}${time?.minutes!=0?`${time?.minutes} 分 `:''}${time?.seconds!=0?`${time?.seconds} 秒 `:''}の間タイムアウトしました`})
    }
    await newMessage.channel.send({ embeds: [embed] });
    if (settings.channel?.log && newMessage.guild.channels.cache.get(settings.channel?.log)) {
      const channel = newMessage.guild.channels.cache.get(settings.channel?.log);
      await channel.send({ embeds: [embed] });
      try {
        newMessage.member.send({ embeds: [embed] })
      } catch (e) {
        console.error(e)
      }
    }
  } catch (e) {
    console.error(e);
  }
});

client.on("messageCreate", async message => {
  if (message.author.bot || message.member?.permissions.has('ADMINISTRATOR')) return;
  const guildId = message.guild.id;
  const settingsFilePath = `./settings/${guildId}.json`;
  if (!fs.existsSync(settingsFilePath)) return;
  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
  if (settings.setting?.disable === true || settings.setting?.antingwords === false) return;
  const mods = settings?.mods;
  if (hasRole(message, mods)) return;
  const roleIds = message.member.roles.cache.map((role) => role.id); 
  function isIgnore(channelId, roleIds, userId, settings) {
    if (settings.ignore_channels?.includes(channelId)) return true;
    if (roleIds.some(roleId => settings.ignore_roles?.includes(roleId))) return true;
    if (settings.ignore_users?.includes(userId)) return true;
    return false;
  }
  if (isIgnore(message.channel.id, roleIds, message.author.id, settings)) return;
  
  const regex = settings?.ngwords;
  if (regex.length == 0) return;
  if (!regex.includes(message.content)) return;
  try {
    await message.guild.members.fetch();
    const embed = new MessageEmbed()
      .setTitle("NGワードを検出しました")
      .setThumbnail(message.author.displayAvatarURL())
      .setDescription(`実行者: ${message.member}\nName: **${message.author.tag.split('#')[1] === '0' ? message.author.username : message.author.tag}**\nID: ${message.author.id}`)
      .setColor(config.color);
    const ch = message.channel;
    embed.addFields = ([
      {
        name: "チャンネル",
        value: `${ch} (**${ch.name}**, ID: ${ch.id})`
      }
    ]);
    try{await message.delete()}catch{console.error('x: delete')}
    if (settings.setting?.timeout?.antingwords) {
      const time = {
        days: settings.setting?.timeout?.days,
        hours: settings.setting?.timeout?.hours,
        minutes: settings.setting?.timeout?.minutes,
        seconds: settings.setting?.timeout?.seconds,
      }
      const timeout = (time?.days * 86400000) + (time?.hours * 360000) + (time?.minutes * 60000) + (time?.seconds * 1000);
      try{await message.member.timeout(timeout, "NGワードの送信")}catch{console.error('x: timeout')}
      embed.setFooter({text: `${time?.days!=0?`${time?.days} 日 `:''}${time?.hours!=0?`${time?.hours} 時間 `:''}${time?.minutes!=0?`${time?.minutes} 分 `:''}${time?.seconds!=0?`${time?.seconds} 秒 `:''}の間タイムアウトしました`})
    }
    await message.channel.send({embeds: [embed]});
    if (settings.channel?.log && message.guild.channels.cache.get(settings.channel?.log)) {
      const channel = message.guild.channels.cache.get(settings.channel?.log);
      await channel.send({embeds: [embed]});
      try {
        message.member.send({ embeds: [embed] })
      } catch (e) {
        console.error(e)
      }
    }
  } catch (e) {
    console.error(e);
  }
})

client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (newMessage.author.bot || newMessage.member?.permissions.has('ADMINISTRATOR')) return;

  const guildId = newMessage.guild.id;
  const settingsFilePath = `./settings/${guildId}.json`;
  if (!fs.existsSync(settingsFilePath)) return;
  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
  const mods = settings?.mods;
  if (hasRole(newMessage, mods)) return;
  const roleIds = newMessage.member.roles.cache.map((role) => role.id);
  function isIgnore(channelId, roleIds, userId, settings) {
    if (settings.ignore_channels?.includes(channelId)) return true;
    if (roleIds.some(roleId => settings.ignore_roles?.includes(roleId))) return true;
    if (settings.ignore_users?.includes(userId)) return true;
    return false;
  }
  if (isIgnore(newMessage.channel.id, roleIds, newMessage.author.id, settings)) return;

  const regex = settings?.ngwords;
  if (regex.length == 0) return;
  if (!regex.includes(newMessage.content)) return;
  try {
    await newMessage.delete();
    await newMessage.guild.members.fetch();
    const embed = new MessageEmbed()
      .setTitle("NGワードを検出しました")
      .setThumbnail(newMessage.author.displayAvatarURL())
      .setDescription(`実行者: ${newMessage.member}\nName: **${newMessage.author.tag.split('#')[1] === '0' ? newMessage.author.username : newMessage.author.tag}**\nID: ${newMessage.author.id}`)
      .setColor(config.color);
    try{await newMessage.delete()}catch{console.error('x: delete')}
    if (settings.setting?.timeout?.antingwords) {
      const time = {
        days: settings.setting?.timeout?.days,
        hours: settings.setting?.timeout?.hours,
        minutes: settings.setting?.timeout?.minutes,
        seconds: settings.setting?.timeout?.seconds,
      }
      const timeout = (time?.days * 86400000) + (time?.hours * 360000) + (time?.minutes * 60000) + (time?.seconds * 1000);
      try{await newMessage.member.timeout(timeout, "NGワードの送信")}catch{console.error('x: timeout')}
      embed.setFooter({text: `${time?.days!=0?`${time?.days} 日 `:''}${time?.hours!=0?`${time?.hours} 時間 `:''}${time?.minutes!=0?`${time?.minutes} 分 `:''}${time?.seconds!=0?`${time?.seconds} 秒 `:''}の間タイムアウトしました`});
    }
    await newMessage.channel.send({embeds: [embed]});
    if (settings.channel?.log && newMessage.guild.channels.cache.get(settings.channel?.log)) {
      const channel = newMessage.guild.channels.cache.get(settings.channel?.log);
      await channel.send({embeds: [embed]});
      try {
        newMessage.member.send({ embeds: [embed] })
      } catch (e) {
        console.error(e)
      }
    }
  } catch (e) {
    console.error(e);
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || message.member?.permissions.has("ADMINISTRATOR")) return;
  const userId = message.author.id;
  const timestamp = Date.now();
  const content = message.content;
  const id = message.id;
  const guildId = message.guild.id;
  const settingsFilePath = `./settings/${guildId}.json`;
  if (!fs.existsSync(settingsFilePath)) return;
  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
  if (settings.setting?.disable === true || settings.setting?.antispam === false) return;
  const mods = settings?.mods;
  if (hasRole(message, mods)) return;
  const roleIds = message.member.roles.cache.map((role) => role.id);

  function isIgnore(channelId, roleIds, userId, settings) {
    if (settings.ignore_channels?.includes(channelId)) return true;
    if (roleIds.some((roleId) => settings.ignore_roles?.includes(roleId))) return true;
    if (settings.ignore_users?.includes(userId)) return true;
    return false;
  }

  if (isIgnore(message.channel.id, roleIds, message.author.id, settings)) return;

  const userSpamData = spamUsers.get(userId);

  if (userSpamData) {
    const timeDifference = message.createdTimestamp - userSpamData.lastMessageTimestamp;
    if (timeDifference > 4000) {
      userSpamData.messageCount = 0;
    }
    userSpamData.messageCount++;
    userSpamData.lastMessageTimestamp = message.createdTimestamp;

    if (userSpamData.messageCount >= 5) {
      try {
        await message.guild.members.fetch();
        const userMessages = message.channel.messages.cache.filter((msg) => {
          return msg.author.id === message.author.id && msg.createdTimestamp >= (message.createdTimestamp - 10000);
        });

        userMessages.forEach(async (msg) => {
          await msg.delete();
        });

        const embed = new MessageEmbed()
          .setTitle("スパムを検出しました")
          .setThumbnail(message.author.displayAvatarURL())
          .setDescription(`実行者: ${message.member}\nName: **${message.author.tag.split('#')[1] === '0' ? message.author.username : message.author.tag}**\nID: ${message.author.id}`)
          .setColor(config.color);

        const ch = message.channel;
        embed.addFields([
          {
            name: "チャンネル",
            value: `${ch} (**${ch.name}**, ID: ${ch.id})`
          }
        ]);
        try{await message.delete()}catch{console.error('x: delete')}
        if (settings.setting?.timeout?.antispam) {
          const time = settings.setting?.timeout;
          const timeout = (time?.days * 86400000) + (time?.hours * 3600000) + (time?.minutes * 60000) + (time?.seconds * 1000);
          try{await message.member.timeout(timeout, "スパム行為")}catch{console.error('x: timeout')}
          embed.setFooter(`${time?.days !== 0 ? `${time?.days} 日 ` : ''}${time?.hours !== 0 ? `${time?.hours} 時間 ` : ''}${time?.minutes !== 0 ? `${time?.minutes} 分 ` : ''}${time?.seconds !== 0 ? `${time?.seconds} 秒 ` : ''}の間タイムアウトしました`);
        }

        await message.channel.send({ embeds: [embed] });

        if (settings.channel?.log && message.guild.channels.cache.get(settings.channel?.log)) {
          const channel = message.guild.channels.cache.get(settings.channel?.log);
          await channel.send({ embeds: [embed] });
          try {
            message.member.send({ embeds: [embed] })
          } catch (e) {
            console.error(e)
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  } else {
    spamUsers.set(userId, {
      messageCount: 1,
      lastMessageTimestamp: message.createdTimestamp,
    });
  }
});

client.on("messageDelete", async (deletedMessage) => {
  if (deletedMessage.author.bot) return;
  const guildId = deletedMessage.guild.id;
  const settingsFilePath = `./settings/${guildId}.json`;
  if (!fs.existsSync(settingsFilePath)) return;
  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
  if (settings.setting?.disable === true) return;
  
  try {
    const embed = new MessageEmbed()
      .setTitle("メッセージが削除されました")
      .setThumbnail(deletedMessage.author.displayAvatarURL())
      .setDescription(`実行者: ${deletedMessage.member}\nName: **${deletedMessage.author.tag.split('#')[1] === '0' ? deletedMessage.author.username : deletedMessage.author.tag}**\nID: ${deletedMessage.author.id}`)
      .setColor('RED');
    const ch = deletedMessage.channel;
    const fields = [
      {
        name: "チャンネル",
        value: `${ch} (**${ch.name}**, ID: ${ch.id})`
      }
    ];
    let content = deletedMessage.content;
    if (content.length > 50) {
      content = content.slice(0, 50) + '...';
    };
    
    fields.push(
      {
        name: 'メッセージ内容',
        value: content || 'メッセージ内容がありません',
      }
    )
    
    if (deletedMessage.attachments.size > 0) {
      const attachments = [];
      let i = 0;
      deletedMessage.attachments.each((attachment) => {
        i = i + 1;
        if (i <= 2) {
          attachments.push(`[attachment ${i}](${attachment.proxyURL})`);
        } else if (i == 3) {
          attachments.push(`+ ${deletedMessage.attachments.size - i} 枚の画像`)
        }
      });
      
      fields.push({
        name: '画像',
        value: attachments.join('\n'),
      });
    }
    
    if (fields.length > 0) {
      embed.addFields(fields)
    }
    
    if (settings.channel?.msglog && deletedMessage.guild.channels.cache.get(settings.channel?.msglog)) {
      const channel = deletedMessage.guild.channels.cache.get(settings.channel?.msglog);
      await channel.send({embeds: [embed]});
    }
  } catch (e) {
    console.error(e);
  }
});

client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (newMessage.author.bot) return;
  const guildId = newMessage.guild.id;
  const settingsFilePath = `./settings/${guildId}.json`;
  if (!fs.existsSync(settingsFilePath)) return;
  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
  if (settings.setting?.disable === true) return;

  try {
    const embed = new MessageEmbed()
      .setTitle("メッセージが編集されました")
      .setThumbnail(newMessage.author.displayAvatarURL())
      .setDescription(`実行者: ${newMessage.member}\nName: **${newMessage.author.tag.split('#')[1] === '0' ? newMessage.author.username : newMessage.author.tag}**\nID: ${newMessage.author.id}`)
      .setColor('YELLOW');
    
    const ch = newMessage.channel;
    const fields = [
      {
        name: "チャンネル",
        value: `${ch} (**${ch.name}**, ID: ${ch.id})`
      }
    ];
    let oldContent = oldMessage.content;
    if (oldContent.length > 50) {
      oldContent = oldContent.slice(0, 50) + '...';
    };
    
    fields.push(
      {
        name: '編集前メッセージ内容',
        value: oldContent || 'メッセージ内容がありません',
      }
    )
    
    if (oldMessage.attachments.size > 0) {
      const attachments = [];
      let i = 0;
      oldMessage.attachments.each((attachment) => {
        i = i + 1;
        if (i <= 2) {
          attachments.push(`[attachment ${i}](${attachment.proxyURL})`);
        } else if (i == 3) {
          attachments.push(`+ ${oldMessage.attachments.size - i} 枚の画像`)
        }
      });
      
      fields.push({
        name: '画像',
        value: attachments.join('\n'),
      });
    }
    
    let newContent = newMessage.content;
    if (newContent.length > 50) {
      newContent = newContent.slice(0, 50) + '...';
    };
    
    fields.push(
      {
        name: '編集後のメッセージ内容',
        value: newContent || 'メッセージ内容がありません',
      }
    )
    
    if (newMessage.attachments.size > 0) {
      const attachments = [];
      let i = 0;
      newMessage.attachments.each((attachment) => {
        i = i + 1;
        if (i <= 2) {
          attachments.push(`[attachment ${i}](${attachment.proxyURL})`);
        } else if (i == 3) {
          attachments.push(`+ ${newMessage.attachments.size - i} 枚の画像`)
        }
      });
      
      fields.push({
        name: '編集後の画像',
        value: attachments.join('\n'),
      });
    }
    
    if (fields.length > 0) {
      embed.addFields(fields)
    }
    
    if (settings.channel?.log && newMessage.guild.channels.cache.get(settings.channel?.msglog)) {
      const channel = newMessage.guild.channels.cache.get(settings.channel?.msglog);
      await channel.send({embeds: [embed]});
    }
  } catch (e) {
    console.error(e);
  }
})

client.on("channelCreate", async channel => {
  const guildId = channel.guild.id;
  const settingsFilePath = `./settings/${guildId}.json`;
  if (!fs.existsSync(settingsFilePath)) return;
  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
  if (settings.setting?.disable === true) return;
  if (!settings.role?.muted || !channel.guild.roles.cache.get(settings.role?.muted)) return;
  await channel.permissionOverwrites.edit(channel.guild.roles.cache.get(settings.role?.muted), {
    VIEW_CHANNEL: false,
    CONNECT: false,
    SEND_MESSAGES: false
  })
})

tracker.on("guildMemberAdd", async (member, inviter, invite, error) => {
  const guild = member.guild;
  const guildId = guild.id;
  const settingsFilePath = `./settings/${guildId}.json`;
  if (!fs.existsSync(settingsFilePath)) return;
  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));  
  if (settings.setting?.disable === true) return;
  if (settings?.muted_users.includes(member.user.id)) {
    const muted_role = await member.guild.roles.cache.get(settings.role.muted);
    if (muted_role) {
      try {
        member.roles.add(muted_role, 'Muted user')
      } catch (e) {
        console.error(e);
      }
    }
  }
  if (settings.role?.autos.length > 0 && !member.user.bot && !settings?.muted_users.includes(member.user.id)) {
    const roleIds = settings.role.autos;
    for (const roleId of roleIds) {
      if (member.guild.roles.cache.get(roleId)) {
        try {
          member.roles.add(roleId, 'Auto role')
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
  
  const embed = new MessageEmbed()
    .setTitle("メンバーが参加しました")
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(config.color);
  if (invite?.code !== `Unknown`) {
    try {
      embed.setDescription(`<@${inviter?.id}> (**${inviter?.tag.split('#')[1] === '0'?inviter.username:inviter.tag}** ID: ${inviter?.id}) の **[${invite?.code}](${invite?.url})** を使用して参加しました\n参加者: ${member}\nName: **${member.user.tag.split('#')[1] === '0' ? member.user.username : member.user.tag}**\nID: ${member.user.id}`)
    } catch (e) {
      console.error(e)
    }
  }
  if (member.user.bot) {
    try {
      embed.setDescription(`<@${inviter?.id}> (**${inviter?.tag.split('#')[1] === '0'?inviter.username:inviter.tag}** ID: ${inviter?.id}) が追加したBotです\n参加者: ${member}\nName: **${member.user.tag.split('#')[1] === '0' ? member.user.username : member.user.tag}**\nID: ${member.user.id}`)
    } catch (e) {
      console.error(e)
    }
  } 
  if (!member.user.bot && invite?.code === `Unknown`) {
    try {
      embed.setDescription(`参加方法は **不明** です\n参加者: ${member}\nName: **${member.user.tag.split('#')[1] === '0' ? member.user.username : member.user.tag}**\nID: ${member.user.id}`)
    } catch (e) {
      console.error(e)
    }
  }
  try {
    const channel = await guild.channels.cache.get(settings.channel?.invite);
    if (!channel) return;
    await channel.send({ embeds: [embed] })
  } catch (e) {
    console.error(e)
  }
});

function hasRole(message, mods) {
  let count = 0;
  const roles = message.member?.roles?.cache;
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

client.on('guildMemberUpdate', (oldMember, newMember) => {
  const guildId = newMember.guild.id;
  const settingsFilePath = `./settings/${guildId}.json`;
  if (!fs.existsSync(settingsFilePath)) return;
  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
  const mutedRole = settings.role.muted;
  if (settings.setting?.disable === true) return;
  const newRoles = newMember.roles.cache;
  const oldRoles = oldMember.roles.cache;  
  const userId = newMember.user.id;
  // add
  if (!oldRoles.has(mutedRole) && newRoles.has(mutedRole)) {
    if (!settings?.muted_users.includes(userId)) {
      settings.muted_users.push(userId);
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
    }
  }
  // remove
  if (oldRoles.has(mutedRole) && !newRoles.has(mutedRole)) {
    if (settings?.muted_users.includes(userId)) {
      settings.muted_users = settings?.muted_users?.filter(id => id !== userId);
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
const fs = require("fs");

module.exports = {
  name: 'rolepanel',
  usage: 'rolepanel {mode} (values...)',
  aliases: ['rp'],
  description: 'ロールパネルを操作します (mode: `help, create, add, remove, copy, change, refresh`)',
  async execute(client, message, args, config) {
    const err_embed = new MessageEmbed()
      .setTitle('ロールパネル');
    const embed = new MessageEmbed()
      .setColor(config.color)
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
    if (args.length < 1) {
      err_embed.setDescription(`❌ 値が不正です`).setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
      return;
    }
    
    try {
      const mode = args[0].toLowerCase();
      const replied = message?.reference;
      
      // help
      if (mode === 'help') {
        const helpContents = [
          {
            usage: 'help',
            description: 'ロールパネルのヘルプを表示します'
          },
          {
            usage: 'create {type} {roles...}',
            description: 'ロールパネルを作成します (type: `normal, single`)'
          },
          {
            usage: 'add {roles...}',
            description: 'ロールパネルにロールを追加します {+reply}'
          },
          {
            usage: 'remove {roles...}',
            description: 'ロールパネルからロールを削除します {+reply}'
          },
          {
            usage: 'copy',
            description: 'ロールパネルをコピーします {+reply}'
          },
          {
            usage: 'change',
            description: 'ロールパネルのタイプを変更します {+reply}'
          },
          {
            usage: 'refresh',
            description: 'ロールパネルを整理します {+reply}'
          }
        ];
        const helpDescription = helpContents.map(content => `**${prefix}rolepanel ${content.usage}** ${content.description ?? '説明がありません'}`).join('\n')
        embed.setTitle('ロールパネルヘルプ');
        embed.setDescription(helpDescription);
        embed.setFooter({ text: `prefix => ${prefix} | {} => required, () => optional` });
        await message.channel.send({ embeds: [embed] });
        return;
      };
    
      if (!fs.existsSync(settingsFilePath)) {
        err_embed.setDescription(`❌ 先に ${prefix}setup を実行してください`).setColor('RED');
        await message.channel.send({ embeds: [err_embed] });
        return;
      };
      
      // create
      if (mode === 'create') {
        if (args.length < 3) {
          err_embed.setDescription(`❌ 値が不正です`).setColor('RED');
          await message.channel.send({ embeds: [err_embed] });
          return;
        }
        const type = args[1].toLowerCase();
        if (type !== 'normal' && type !== 'single') {
          err_embed.setDescription(`❌ {type} の値が不正です`).setColor('RED');
          await message.channel.send({ embeds: [err_embed] });
          return;
        }
        const data = args.slice(2);
        if (data.length > 20) {
          err_embed.setDescription(`❌ 値が不正です`).setColor('RED');
          await message.channel.send({ embeds: [err_embed] });
          return;
        } 
        const roles = [];
        for (const role of data) {
          const roleId = role.replace(/<@&|>/g,'');
          const isExist = await message.guild.roles.cache.get(roleId);
          if (isExist) roles.push(roleId);
        }
        const panelDescription = roles.map(role => `<@&${role}>`).join('\n');
        const options = [];
        for (const role of roles) {
          const roleName = await message.guild.roles.cache.get(role).name;
          options.push(
            {
              label: roleName,
              value: role
            }
          )
        }
        const customId = type === 'single' ? 'single-rp' : 'rp';
        const row = new MessageSelectMenu().setCustomId(customId).setPlaceholder('ロールを選択してください').addOptions(options).setMinValues(1).setMaxValues(1);
        const menu = new MessageActionRow()
          .addComponents(row);
        embed.setTitle(type === 'single' ? 'ロールパネル (複数選択不可)' : 'ロールパネル');
        embed.setDescription(panelDescription);
        embed.setFooter(customId);
        await message.channel.send({ embeds: [embed], components: [menu] });
        await message.delete();
        await message.channel.send('✅ 成功しました')
          .then(msg => {
          setTimeout(async () => {
            await msg.delete();
          }, 3000)
        });
        return;
      }
      
      if (!replied) {
        err_embed.setDescription(`❌ ロールパネルを選択してください`).setColor('RED');
        await message.channel.send({ embeds: [err_embed] });
        return;
      }
      
      const repliedMessage = await message.channel.messages.fetch(replied.messageId);
      
      if (repliedMessage.author.id !== client.user.id || !repliedMessage.embeds[0]?.title?.includes('ロールパネル') || repliedMessage.embeds[0]?.color == 15548997) {
        err_embed.setDescription(`❌ ロールパネルを選択してください`).setColor('RED');
        await message.channel.send({ embeds: [err_embed] });
        return;
      }
      
      if (repliedMessage.embeds[0]?.title === 'ロールパネルヘルプ') {
        err_embed.setDescription(`❌ ロールパネルを選択してください`).setColor('RED');
        await message.channel.send({ embeds: [err_embed] });
        return;
      }
      
      // add
      else if (mode === 'add') {
        const type = repliedMessage.embeds[0].footer.text;
        const roles = args.slice(1);
        if (roles.length < 1) {
          err_embed.setDescription(`❌ 値が不正です`).setColor('RED');
          await message.channel.send({ embeds: [err_embed] });
          return;
        }
        const oldPanel = repliedMessage.embeds[0].description;
        const roleIds = oldPanel.replace(/<@&|>/g,'').split('\n');
        const oldRoleIdsLength = roleIds.length;
        for (const role of roles) {
          const roleId = role.replace(/<@&|>/g,'');
          const isExist = await message.guild.roles.cache.get(roleId) && !roleIds.includes(roleId);
          if (isExist) roleIds.push(roleId);
        }
        if (oldRoleIdsLength == roleIds.length || roleIds.length > 20) {
          err_embed.setDescription(`❌ 値が不正です`).setColor('RED');
          await message.channel.send({ embeds: [err_embed] });
          return;
        }
        const panelDescription = roleIds.map(role => `<@&${role}>`).join('\n');
        const options = [];
        for (const role of roleIds) {
          const roleName = await message.guild.roles.cache.get(role).name;
          options.push(
            {
              label: roleName,
              value: role
            }
          )
        }
        const customId = type === 'single-rp' ? 'single-rp' : 'rp';
        const row = new MessageSelectMenu().setCustomId(customId).setPlaceholder('ロールを選択してください').addOptions(options).setMinValues(1).setMaxValues(1);
        const menu = new MessageActionRow()
          .addComponents(row);
        embed.setTitle(type === 'single-rp' ? 'ロールパネル (複数選択不可)' : 'ロールパネル')
        embed.setDescription(panelDescription);
        embed.setFooter(customId);
        await repliedMessage.edit({ embeds: [embed], components: [menu] });
        await message.delete();
        await message.channel.send('✅ 成功しました')
          .then(msg => {
          setTimeout(async () => {
            await msg.delete();
          }, 3000)
        });
        return;
      }
      
      // remove
      else if (mode === 'remove') {
        const type = repliedMessage.embeds[0].footer.text;
        const roles = args.slice(1);
        const oldPanel = repliedMessage.embeds[0].description;
        const oldRoleIds = oldPanel.replace(/<@&|>/g,'').split('\n');
        const removeRoles = [];
        for (const role of roles) {
          const roleId = role.replace(/<@&|>/g,'');
          const isExist = oldRoleIds.includes(roleId);
          if (isExist) removeRoles.push(roleId);
        }
        const roleIds = oldRoleIds.filter(roleId => !removeRoles.includes(roleId));
        const panelDescription = roleIds.map(role => `<@&${role}>`).join('\n');
        const options = [];
        for (const role of roleIds) {
          const roleName = await message.guild.roles.cache.get(role).name;
          options.push(
            {
              label: roleName,
              value: role
            }
          )
        }
        if (options.length == 0) {
          await repliedMessage.delete();
          await message.channel.send('✅ 成功しました')
            .then(msg => {
            setTimeout(async () => {
              await msg.delete();
            }, 3000)
          });
          return;
        }
        const customId = type === 'single-rp' ? 'single-rp' : 'rp';
        const row = new MessageSelectMenu().setCustomId(customId).setPlaceholder('ロールを選択してください').addOptions(options).setMinValues(1).setMaxValues(1);
        const menu = new MessageActionRow()
          .addComponents(row);
        embed.setTitle(type === 'single-rp' ? 'ロールパネル (複数選択不可)' : 'ロールパネル')
        embed.setDescription(panelDescription);
        embed.setFooter(customId);
        await repliedMessage.edit({ embeds: [embed], components: [menu] });
        await message.delete();
        await message.channel.send('✅ 成功しました')
          .then(msg => {
          setTimeout(async () => {
            await msg.delete();
          }, 3000)
        });
        return;
      }
      
      // copy
      else if (mode === 'copy') {
        const embed = repliedMessage.embeds[0];
        const menu = repliedMessage.components[0];
        await message.channel.send({ embeds: [embed], components: [menu] });
        await message.delete();
        await message.channel.send('✅ 成功しました')
          .then(msg => {
          setTimeout(async () => {
            await msg.delete();
          }, 3000)
        })
        return;
      }
      
      // change
      else if (mode === 'change') {
        const panelEmbed = repliedMessage.embeds[0];
        const type = panelEmbed.footer.text;
        const customId = type !== 'single-rp' ? 'single-rp' : 'rp';
        panelEmbed.setTitle(type !== 'single-rp' ? 'ロールパネル (複数選択不可)' : 'ロールパネル')
        panelEmbed.setFooter(customId);
        const oldPanel = repliedMessage.embeds[0].description;
        const roleIds = oldPanel.replace(/<@&|>/g,'').split('\n');
        const options = [];
        for (const role of roleIds) {
          const roleName = await message.guild.roles.cache.get(role).name;
          options.push(
            {
              label: roleName,
              value: role
            }
          )
        }
        const row = new MessageSelectMenu().setCustomId(customId).setPlaceholder('ロールを選択してください').addOptions(options).setMinValues(1).setMaxValues(1);
        const menu = new MessageActionRow()
          .addComponents(row);
        await repliedMessage.edit({ embeds: [panelEmbed], components: [menu] });
        await message.delete();
        await message.channel.send('✅ 成功しました')
          .then(msg => {
          setTimeout(async () => {
            await msg.delete();
          }, 3000)
        });
        return;  
      }
      
      // refresh
      else if (mode === 'refresh') {
        const type = repliedMessage.embeds[0].footer.text;
        const oldPanel = repliedMessage.embeds[0].description;
        const oldRoleIds = oldPanel.replace(/<@&|>/g,'').split('\n');
        const removeRoles = [];
        for (const roleId of oldRoleIds) {
          const isExist = message.guild.roles.cache.get(roleId);
          if (!isExist) removeRoles.push(roleId);
        }
        const roleIds = oldRoleIds.filter(roleId => !removeRoles.includes(roleId));
        const panelDescription = roleIds.map(role => `<@&${role}>`).join('\n');
        const options = [];
        for (const role of roleIds) {
          const roleName = await message.guild.roles.cache.get(role).name;
          options.push(
            {
              label: roleName,
              value: role
            }
          )
        }
        if (options.length == 0) {
          await repliedMessage.delete();
          await message.channel.send('✅ 成功しました')
            .then(msg => {
            setTimeout(async () => {
              await msg.delete();
            }, 3000)
          });
          return;
        }
        const customId = type === 'single-rp' ? 'single-rp' : 'rp';
        const row = new MessageSelectMenu().setCustomId(customId).setPlaceholder('ロールを選択してください').addOptions(options).setMinValues(1).setMaxValues(1);
        const menu = new MessageActionRow()
          .addComponents(row);
        embed.setTitle(type === 'single-rp' ? 'ロールパネル (複数選択不可)' : 'ロールパネル')
        embed.setDescription(panelDescription);
        embed.setFooter(customId);
        await repliedMessage.edit({ embeds: [embed], components: [menu] });
        await message.delete();
        await message.channel.send('✅ 成功しました')
          .then(msg => {
          setTimeout(async () => {
            await msg.delete();
          }, 3000)
        });
        return;
      }
      
      // other
      else {
        err_embed.setDescription(`❌ {mode} の値が不正です`).setColor('RED');
        await message.channel.send({ embeds: [err_embed] });
        return;
      };
    } catch (e) {
      console.error(e);
      err_embed.setDescription('❌ エラーが発生しました').setColor('RED');
      await message.channel.send({ embeds: [err_embed] });
    }
  },
}
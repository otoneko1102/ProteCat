const { Client, MessageEmbed, MessageActionRow, MessageButton, MessageAttachment } = require("discord.js");
const fs = require("fs");
const Jimp = require('jimp');
const options = { intents: [3276799] };
const client = new Client(options);

const config = JSON.parse(fs.readFileSync("./config.json", 'utf8'));

const ticketCooldowns = new Map();
const verifyCooldowns = new Map();

client.on("ready", () => {
  console.log(`interactions.js OK!`);
});

// delete
client.on("interactionCreate", async int => {
  if (int.customId === 'delete') {
    try {
      const embed = new MessageEmbed()
        .setDescription(`${int.member} によって削除済み`)
        .setColor(config.color);
    
      await int.message.edit({ content: null, embeds: [embed], components: [] })
    } catch (e) {
      console.error(e)
    }
  }
})

// rolepanel
client.on("interactionCreate", async int => {
  // normal
  if (int.customId === 'rp') {
    const guildId = int.guild.id;
    const settingsFilePath = `./settings/${guildId}.json`;
    const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
    const err_embed = new MessageEmbed();
    try {
      if (int.member.roles.cache.has(settings?.role?.muted)) {
        err_embed.setDescription(`❌ あなたはミュートされています`).setColor('RED');
        const reply = await int.channel.send({ embeds: [err_embed] });
        setTimeout(() => {
          reply.delete();
        }, 3000)
        return;
      }
      const roleId = int.values[0];
      const role = await int.guild.roles.cache.get(roleId);
      if (!role) {
        err_embed.setDescription(`❌ ロールが存在しません`).setColor('RED');
        const reply = await int.channel.send({ content: `${int.member}`, embeds: [err_embed] })
        setTimeout(() => {
          reply.delete();
        }, 3000)
        await int.update({
          components: int.message.components.map(row => {
            return {
              type: 'ACTION_ROW',
              components: row.components.map(component => {
                if (component.customId === int.customId) {
                  component.options.forEach(option => option.default = false);
                }
                return component;
              })
            }
          })
        });
        return;
      };
      
      const member = int.guild.members.cache.get(int.user.id);
      
      const hasRole = member.roles.cache.some(role => role.id === roleId);
      const embed = new MessageEmbed()
        .setColor(config.color);
      if (hasRole) {
        try {
          await member.roles.remove(role);
          const reply = await int.channel.send({ content: `${int.member}` ,embeds: [embed.setDescription(`${role} を剥奪しました`)]});
          setTimeout(async () => {
            await reply.delete();
          }, 3000)
        } catch (e) {
          console.error(e);
          err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
          const reply = await int.channel.send({ content: `${int.member}`, embeds: [err_embed] })   
          setTimeout(async () => {
            await reply.delete();
          }, 3000)
        };
      } else {
        try {
          await member.roles.add(role);
          const reply = await int.channel.send({ content: `${int.member}` ,embeds: [embed.setDescription(`${role} を付与しました`)]});
          setTimeout(async () => {
            await reply.delete();
          }, 3000)
        } catch (e) {
          console.error(e);
          err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
          const reply = await int.channel.send({ content: `${int.member}`, embeds: [err_embed] })   
          setTimeout(async () => {
            await reply.delete();
          }, 3000)
        };
      };
      
      await int.update({
        components: int.message.components.map(row => {
          return {
            type: 'ACTION_ROW',
            components: row.components.map(component => {
              if (component.customId === int.customId) {
                component.options.forEach(option => option.default = false);
              }
              return component;
            })
          }
        })
      });
    } catch (e) {
      console.error(e);
      err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
      const reply = await int.channel.send({ content: `${int.member}`, embeds: [err_embed] })   
      setTimeout(async () => {
        await reply.delete();
      }, 3000)  
    }
  };
  
  // single
  if (int.customId === 'single-rp') {
    const guildId = int.guild.id;
    const settingsFilePath = `./settings/${guildId}.json`;
    const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
    const err_embed = new MessageEmbed();
    try {
      if (int.member.roles.cache.has(settings?.role?.muted)) {
        err_embed.setDescription(`❌ あなたはミュートされています`).setColor('RED');
        const reply = await int.channel.send({ embeds: [err_embed] });
        setTimeout(() => {
          reply.delete();
        }, 3000)
        return;
      }
      const roleId = int.values[0];
      const role = await int.guild.roles.cache.get(roleId);
      if (!role) {
        err_embed.setDescription(`❌ ロールが存在しません`).setColor('RED');
        const reply = await int.channel.send({ content: `${int.member}`, embeds: [err_embed] })
        setTimeout(() => {
          reply.delete();
        }, 3000)
        await int.update({
          components: int.message.components.map(row => {
            return {
              type: 'ACTION_ROW',
              components: row.components.map(component => {
                if (component.customId === int.customId) {
                  component.options.forEach(option => option.default = false);
                }
                return component;
              })
            }
          })
        });
        return;
      };
      
      const member = int.guild.members.cache.get(int.user.id);
      
      const hasRole = member.roles.cache.some(role => role.id === roleId);
      const embed = new MessageEmbed()
        .setColor(config.color);
      if (hasRole) {
        try {
          await member.roles.remove(role);
          const reply = await int.channel.send({ content: `${int.member}` ,embeds: [embed.setDescription(`${role} を剥奪しました`)]});
          setTimeout(async () => {
            await reply.delete();
          }, 3000)
        } catch (e) {
          console.error(e);
          err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
          const reply = await int.channel.send({ content: `${int.member}`, embeds: [err_embed] })   
          setTimeout(async () => {
            await reply.delete();
          }, 3000)
        };
      } else {
        try {
          const rembed = int.message.embeds[0];
          const rdescription = rembed.description;
          const rroleIds = rdescription.replace(/<@&|>/g,'').split('\n');
          const rmember = int.member;
          const removedRoleIds = [];
          
          for (const rroleId of rroleIds) {
            try {
              if (removedRoleIds.includes(rroleId)) continue;
              const rrole = int.guild.roles.cache.get(rroleId);
              if (rrole) {
                await rmember.roles.remove(rrole);
                removedRoleIds.push(rroleId);
              }
            } catch (e) {
              console.error(e);
            }
          }
          
          await member.roles.add(role);
          const reply = await int.channel.send({ content: `${int.member}` ,embeds: [embed.setDescription(`${role} を付与しました`)]});
          setTimeout(async () => {
            await reply.delete();
          }, 3000)
        } catch (e) {
          console.error(e);
          err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
          const reply = await int.channel.send({ content: `${int.member}`, embeds: [err_embed] })   
          setTimeout(async () => {
            await reply.delete();
          }, 3000)
        }
        
        await int.update({
          components: int.message.components.map(row => {
            return {
              type: 'ACTION_ROW',
              components: row.components.map(component => {
                if (component.customId === int.customId) {
                  component.options.forEach(option => option.default = false);
                }
                return component;
              })
            }
          })
        });
      }
    } catch (e) {
      console.error(e);
      err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
      const reply = await int.channel.send({ content: `${int.member}`, embeds: [err_embed] })   
      setTimeout(async () => {
        await reply.delete();
      }, 3000)
    }
  }
})

// ticket
client.on("interactionCreate", async int => {
  if (int.customId === 'ticket') {
    await int.deferReply({ ephemeral: true });
    const err_embed = new MessageEmbed()
      .setTitle("チケット")
    const userId = int.user.id;
    const max = 3;
    await int.guild.channels.fetch();
    const ticketChannels = await int.guild.channels.cache.filter(ch => ch?.topic === `in-${int.message.id}-${userId}`);
    if (ticketChannels.size >= max) {
      err_embed.setDescription(`❌ 利用中のチケットが既に上限数あります`).setColor('RED');
      int.editReply({ embeds: [err_embed] });
      return;
    }
    
    if (ticketCooldowns.has(`${userId}-${int.message.id}`)) {
      const cooldown = ticketCooldowns.get(`${userId}-${int.message.id}`);

      if (Date.now() < cooldown) {
        const remainingTime = Math.ceil((cooldown - Date.now()) / 1000);
        const cooldown_embed = new MessageEmbed()
          .setTitle("チケット")
          .setDescription(`❌ クールダウン中です (残り ${remainingTime} 秒)`)
          .setColor('RED');
        int.editReply({ embeds: [cooldown_embed], ephemeral: true });
        return;
      }
    }
    
    const guildId = int.guild.id;
    const settingsFilePath = `./settings/${guildId}.json`;
    const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
    
    if (int.member.roles.cache.has(settings?.role?.muted)) {
      err_embed.setDescription(`❌ あなたはミュートされています`).setColor('RED');
      int.editReply({ embeds: [err_embed] });
      return;
    }

    ticketCooldowns.set(`${userId}-${int.message.id}`, Date.now() + 30000);
    
    try {
      const number = settings?.setting?.ticket_number[int.message.id] || 0;
      const formatnum = formatNumber(number + 1);
            
      function formatNumber(n) {
        let numStr = n.toString();
        while (numStr.length < 6) {
          numStr = '0' + numStr;
        }
        return numStr;
      }
      const p = ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES', 'EMBED_LINKS', 'READ_MESSAGE_HISTORY'];
      const overrides = [
        {
          id: int.guild.roles.everyone,
          deny: p
        },
        {
          id: userId,
          allow: p
        },
      ];
      const mods = settings?.mods;
      if (mods.length > 0) {
        for (const mod of mods) {
          if (int.guild.roles.cache.get(mod)) {
            const opt = {
              id: mod,
              allow: p
            }
            overrides.push(opt);
          }
        }
      }
      function getCategory(int) {
        let category = int.guild.channels.cache.get(settings.setting.ticket_number?.category);
        if (!category) {
          category = int.channel.parent;
        }
        return category;
      }
      const channel = await int.guild.channels.create(`pc-ticket-${formatnum}-${int.message.id}`, {
        type: 'GUILD_TEXT',
        permissionOverwrites: overrides,
        parent: getCategory(int)
      })
      channel.setTopic(`in-${int.message.id}-${userId}`)
      const embed = new MessageEmbed()
        .setTitle('チケット')
        .setDescription(`✅ チケットを作成しました`)
        .setFooter({ text: `あと ${max - ticketChannels.size - 1} チケットが作成可能です` })
        .setColor(config.color);
      await int.editReply({ content: `${channel}`, embeds: [embed], ephemeral: true });
      const ticket_embed = new MessageEmbed()
        .setTitle('チケット')
        .setDescription(`✅ チケットを作成しました\nチケットを閉じたい場合、下のボタンを押してください`)
        .addFields([
          {
            name: '作成者',
            value: `${int.member}\nName: **${int.member.user.tag.split('#')[1] === '0' ? int.member.user.username : int.member.user.tag}**\nID: ${int.member.id}`
          }
        ])
        .setColor(config.color);
      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId(`tclose-${userId}`)
            .setEmoji('🔒')
            .setLabel('Close')
            .setStyle('SECONDARY')
        )
      const msg = await channel.send({ content: `${int.member}`, embeds: [ticket_embed], components: [row] });
      await msg.pin()
      settings.setting.ticket_number[int.message.id] = number + 1;
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
    } catch (e) {
      console.error(e);
      err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
      await int.editReply({ embeds: [err_embed], ephemeral: true });
    }
  }
  if (int.customId.startsWith('tclose')) {
    try {
      const userId = int.customId.split('-')[1];
      const user = int.guild.members.cache.get(userId);
      await int.channel.permissionOverwrites.edit(user, {
        VIEW_CHANNEL: false,
        SEND_MESSAGES: false,
        ATTACH_FILES: false,
        EMBED_LINKS: false,
        READ_MESSAGE_HISTORY: false
      });
      await int.message.edit({ components: [] });
      const row = new MessageActionRow()
          .addComponents(
            new MessageButton()
              .setCustomId(`tdelete`)
              .setEmoji('🗑')
              .setLabel('Delete')
              .setStyle('DANGER')
          )
      await int.reply({content: `チケットが ${int.member} (**${int.member.user.tag.split('#')[1] === '0' ? int.member.user.username : int.member.user.tag}**, ID: ${int.member.id}) によって閉じられました\nチケットを削除する場合は下のボタンを押してください`, components: [row] })
      const tId = int.channel.topic.split('-')[1];
      await int.channel.setTopic(`out-${tId}-${userId}`);
    } catch (e) {
      console.error(e);
      const err_embed = new MessageEmbed()
        .setTitle('チケット')
        .setDescription(`❌ エラーが発生しました`)
        .setColor('RED');
      await int.reply({ embeds: [err_embed], ephemeral: true });
    }
  }
  if (int.customId === 'tdelete') {
    try {
      await int.message.edit({ components: [] });
      const time = 15;
      await int.reply(`${time} 秒後にチケットが削除されます`);
      setTimeout(async () => await int.channel.delete(), time * 1000);
    } catch (e) {
      console.error(e);
      const err_embed = new MessageEmbed()
        .setTitle('チケット')
        .setDescription(`❌ エラーが発生しました`)
        .setColor('RED');
      await int.reply({ embeds: [err_embed], ephemeral: true });
    }
  }
});

// verify
client.on("interactionCreate", async int => {
  try {
    if (int.customId.startsWith('verify')) {
      
      await int.deferReply({ ephemeral: true });
    
      const err_embed = new MessageEmbed()
        .setTitle("認証")
    
      const userId = int.user.id;
      
      const roleId = int.customId.split('-')[1];
      if (int.member.roles.cache.has(roleId)) {
        err_embed.setDescription(`❌ 認証済みです`).setColor('RED');
        await int.editReply({ embeds: [err_embed], ephemeral: true });
        return;
      }
      
      if (verifyCooldowns.has(userId)) {
        const cooldown = verifyCooldowns.get(userId);

        if (Date.now() < cooldown) {
          const remainingTime = Math.ceil((cooldown - Date.now()) / 1000);
          const cooldown_embed = new MessageEmbed()
            .setTitle("認証")
            .setDescription(`❌ クールダウン中です (残り ${remainingTime} 秒)`)
            .setColor('RED');
          int.editReply({ embeds: [cooldown_embed], ephemeral: true });
          return;
        }
      }
      verifyCooldowns.set(userId, Date.now() + 30000);

      const role = await int.guild.roles.cache.get(roleId);
      if (!role) {
        err_embed.setDescription(`❌ ロールが存在しません`).setColor('RED');
        await int.editReply({ embeds: [err_embed], ephemeral: true });
        return;
      }
    
      const guildId = int.guild.id;
      const settingsFilePath = `./settings/${guildId}.json`;
      const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
    
      if (int.member.roles.cache.has(settings?.role?.muted)) {
        err_embed.setDescription(`❌ あなたはミュートされています`).setColor('RED');
        int.editReply({ embeds: [err_embed] });
        return;
      }
    
      const width = 350; // 幅
      const height = 130; // 高さ

      const image = new Jimp(width, height);

      function generateRandomString(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomString = '';
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          randomString += characters.charAt(randomIndex);
        }
        return randomString;
      }

      const correctAnswer = generateRandomString(7);
      console.log(correctAnswer);

      const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
      image.print(font, 10, 10, `${correctAnswer}`);
    
      // 背景を黒にする
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          if (Math.random() < 0.75) { // 75%でノイズを追加
            image.setPixelColor(Jimp.cssColorToHex('#FFFFFF'), x, y);
          } else {
            const pixelColor = image.getPixelColor(x, y);
            if (pixelColor !== Jimp.cssColorToHex('#FFFFFF')) { // 白色以外を背景色に変更
              image.setPixelColor(Jimp.cssColorToHex('#000000'), x, y);
            }
          }
        }
      }
    
      const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
      const attachment = new MessageAttachment(buffer, 'generated.png');
      try {
        const timeLimit = 30
        const embed = new MessageEmbed()
          .setAuthor(int.guild.name, int.guild.iconURL())
          .setTitle("認証")
          .setDescription("画像内の文字列を送信してください\n※大文字か小文字かは問いません")
          .setFooter({text: `${timeLimit} 秒以内に答えを送信してください`})
          .setColor(config.color);
        const dmMsg = await int.member.send({ files: [attachment], content: `${int.member} 画像認証です`, embeds: [embed]})
        const success_embed = new MessageEmbed()
          .setTitle("認証")
          .setDescription(`✅ DMを送信しました`)
          .setColor(config.color);
        await int.editReply({ content: `<#${dmMsg.channel.id}>`, embeds: [success_embed] , ephemeral: true });
      
        const filter = (response) => {
          return response.author.id === int.user.id;
        };
        const collector = dmMsg.channel.createMessageCollector({ filter, time: timeLimit * 1000 });
        collector.on('collect', (msg) => {
          const userAnswer = msg.content;
          if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
            int.member.roles.add(roleId)
              .then(() => {
                const success_embed = new MessageEmbed()
                  .setTitle("認証")
                  .setDescription(`✅ 正解！ **${role.name}** が付与されました`)
                  .setColor(config.color);
                int.user.send({ embeds: [success_embed] });
                collector.stop();
              })
              .catch((error) => {
                console.error(error);
                err_embed.setDescription(`❌ ロールを付与できませんでした`);
                int.user.send({ embeds: [err_embed] });
                collector.stop();
              });
          } else {
            const incorrect_embed = new MessageEmbed()
              .setTitle("認証")
              .setDescription(`❌ 不正解です、もう一度やり直してください`)
              .setColor('RED');
            int.user.send({ embeds: [incorrect_embed] });
            collector.stop();
          }
        });

        collector.on('end', (collected, reason) => {
          if (reason === 'time') {
            const timeout_embed = new MessageEmbed()
              .setTitle("認証")
              .setDescription(`❌ 30秒以内に回答しなかったため、認証に失敗しました`)
              .setColor('RED');
            int.user.send({ embeds: [timeout_embed] });
          }
        });
      } catch (e) {
        console.error(e);
        err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
        await int.editReply({ embeds: [err_embed], ephemeral: true });
      }
    }
  } catch (error) {
    console.error(error);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
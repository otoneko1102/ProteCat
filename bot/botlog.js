const { Client, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const options = { intents: [3276799] };
const client = new Client(options);

const fs = require("fs");
const config = JSON.parse(fs.readFileSync("./config.json", 'utf8'));

//bot join & bot leave
client.on('guildCreate',async guild => {
  try {
    let px = config.prefix;
    const guildId = guild.id;
    const settingsFilePath = `./settings/${guildId}.json`;
    if (fs.existsSync(settingsFilePath)) {
      const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
      if (settings?.prefix) {
        px = settings.prefix;
      }
    }
    const sendEmbed = new MessageEmbed()
      .setTitle("導入ありがとうございます！")
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(`プレフィックスは ${px} です！\n**${px}setup** を実行してサーバーの保護を開始します！`)
      .setFooter({text: `${px}prefix {new prefix} でプレフィックスを変更できます`})
      .addFields([
        {
          name: 'サポートサーバー',
          value: 'https://discord.gg/yKW8wWKCnS'
        }
      ])
      .setColor(config.color);
    const sendCh = guild?.systemChannel;
    if (sendCh) {
      await sendCh.send({ embeds: [sendEmbed] });
    }
  } catch (e) {
    console.error(e);
  }
  const ch = client.channels.cache.get(config.log_channel);
  await ch.send(`**${guild.name}** (${guild.id}) に参加しました`);
  setTimeout(()=>{
    ch.send(`guild_info ${guild.id}`);
  },3000)
})
client.on('interactionCreate', async interaction => {
  const allowedUser = '957885295251034112';
  if (interaction.member.id !== allowedUser) return;
  if (!interaction.isButton()) return;
  if (interaction.customId.startsWith('guild_invite')){
    const guildId = interaction.customId.split('-')[1]
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return interaction.reply({content:'指定されたサーバーが見つかりませんでした',ephemeral:true});
    try{
    const invites = await guild.invites.fetch();
    if (invites.size > 0) {
      const inviteLinks = invites.map(invite => invite.url);
      interaction.reply({ content: inviteLinks.join('\n'), ephemeral: true });
    } else {
      try {
        const channel = guild.channels.cache.find(channel => channel.type === 'GUILD_TEXT' && channel.permissionsFor(guild.me).has('CREATE_INSTANT_INVITE')) || undefined;
        if(!channel) return interaction.reply({content:`Error creating invite.`,ephemeral:true});
        const createdInvite = await guild.invites.create(channel.id, {maxUses: 0, maxAge: 0})
        interaction.reply({content:`No valid invites found. Created a new invite:\nhttps://discord.gg/${createdInvite.code}`,ephemeral:true});
      } catch (error) {
        interaction.reply({content:`Error creating invite.`,ephemeral:true});
        console.error(error)
      }
    }
    }catch(e){
      interaction.reply({content:`Error getting invite.`,ephemeral:true});
      console.error(e)
    }
  }
  if (interaction.customId.startsWith('guild_leave')){
    await interaction.deferReply({ephemeral:true})
    const guildId = interaction.customId.split('-')[1]
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return await interaction.editReply({content:'指定されたサーバーが見つかりませんでした',ephemeral:true});
    try {
      await guild.leave();
      await interaction.editReply({content:`${guild.name} から退出しました`,ephemeral:true});
    } catch (error) {
      console.error(`${guild.name} からの退出に失敗しました:`, error);
      await interaction.editReply({content:`${guild.name} からの退出に失敗しました`,ephemeral:true});
    }
  }
})
client.on('guildDelete', guild => {
  const ch = client.channels.cache.get(config.log_channel);  
  ch.send(`**${guild.name}** (${guild.id}) から退出しました`);
})

function replaces(input, replacements) {
  let output = input;
  
  for (const [search, replace] of replacements) {
    const regex = new RegExp(search, 'g');
    output = output.replace(regex, replace);
  }
  
  return output;
}

// コマンドを実行するユーザーのID
const allowedUser = config.bot_owner;

// m#guild_invite {serverID} というコマンドが入力された場合の処理
client.on('messageCreate', async message => {
  if (!message.content.startsWith('guild_info')) return;
  if (message.author.id === client.user.id){
    if(message.channel.id !== config.log_channel){
      return;
    }
  } else {
    if (message.author.id !== allowedUser) {
      return;
    }
  }
    const args = message.content.slice('guild_info'.length).trim().split(/ +/);
    const guildId = args[0];
    if(!guildId) return message.channel.send('IDを指定してください')
    const guild = await client.guilds.fetch(guildId) || null;
    if(!guild) return message.channel.send('サーバーが見つかりませんでした')
    const ch = message.channel
    const members = await guild.members.fetch();
    let bot = 0;
    members.forEach(member => {
      if (member.user.bot) {
        bot++;
      }
    });
    const owner = await guild.members.fetch(guild.ownerId);
    const embed = new MessageEmbed()
    .setTitle('サーバー情報')
    .setThumbnail(guild.iconURL())
    .addField(`name`,`${guild.name}`)
    .addField(`ID`,`${guild.id}`)
    .addField(`owner`,`${owner.user.tag} (ID: ${guild.ownerId})`)
    .addField(`member count`,`**${guild.memberCount}** members (**${guild.memberCount - bot}** users, **${bot}** bots)`)
    .setColor('GREEN');
    const row = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId(`guild_invite-${guild.id}`)
        .setLabel('Get invite for this server')
        .setStyle('PRIMARY')
    )
    .addComponents(
      new MessageButton()
        .setCustomId(`guild_leave-${guild.id}`)
        .setLabel('Leave bot from this server')
        .setStyle('DANGER')
    )
    ch.send({embeds: [embed],components: [row]});
});

client.login(process.env.DISCORD_BOT_TOKEN);
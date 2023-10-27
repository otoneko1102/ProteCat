const { Client, Collection, MessageEmbed } = require("discord.js");
const options = { intents: [3276799] };
const client = new Client(options);
client.commands = new Collection();
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("./config.json", 'utf8'));

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));


for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
  console.log(`${file} ready!`)
}

client.on("ready", () => {
  console.log(`${client.user.tag} OK!`);
});

client.on('messageCreate', async message => {
  let prefix = config.prefix;
  const guildId = message.guild.id;
  const settingsFilePath = `./settings/${guildId}.json`;
  if (fs.existsSync(settingsFilePath)) {
    const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
    if (settings?.prefix) {
      prefix = settings.prefix;
    }
    if (!settings?.setting.disable) {
      let isMuted;
      try {
        isMuted = settings.muted_users.includes(message.author.id);
      } catch {
        isMuted = false;
      }    
      if (isMuted) {
        await message.delete();
        return;
      }
    }
  }
  
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;
  if (!message.guild.me.permissions.has("ADMINISTRATOR") && !(commandName === 'help' || commandName === 'h')) {
    try {
      message.channel.send('❌ Botには管理者権限が必要です');
      return;
    } catch (e) {
      console.error(e);
    }
  }
  try {
    command.execute(client, message, args, config);
  } catch (error) {
    message.channel.send({ embeds: [new MessageEmbed().setDescription('❌ 想定外のエラーが発生しました').setColor('RED')]});
    const errorChannel = message.guild.channels.cache.get(config.log_channel);
    if (errorChannel) {
      sendErrorToChannel(errorChannel, error);
    }
  }
});

async function sendErrorToChannel(channel, error) {
  try {
    const timestamp = new Date().toISOString();
    const fileName = `error_${timestamp}.txt`;

    fs.writeFileSync(fileName, error.stack, 'utf-8');
    await channel.send({ files: [{ attachment: fileName, name: fileName }] });
    fs.unlinkSync(fileName);
  } catch (err) {
    console.error(err);
  }
}

client.login(process.env.DISCORD_BOT_TOKEN);
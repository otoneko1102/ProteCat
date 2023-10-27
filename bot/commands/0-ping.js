const { MessageEmbed } = require("discord.js");

module.exports = {
  name: 'ping',
  usage: 'ping',
  aliases: [],
  description: 'Ping値を表示します',
  async execute(client, message, args, config) {
    const embed = new MessageEmbed()
      .setTitle('Pong!')
      .addFields(
        [
          {
            name: 'Web Socket',
            value: `${client.ws.ping} ms`
          },
          {
            name: 'API Endpoint',
            value: `${Date.now() - message.createdTimestamp} ms`
          }
        ]
      )
      .setColor(config.color)
      .setTimestamp()
       
    await message.reply({ embeds: [embed] });
  },
};
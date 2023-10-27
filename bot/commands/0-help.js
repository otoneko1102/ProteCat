const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const fs = require('fs')

module.exports = {
  name: 'help',
  usage: 'help',
  aliases: ['h'],
  description: 'ヘルプを表示します',
  async execute(client, message, args, config) {
    
    let prefix = config.prefix;
    const guildId = message.guild.id;
    const settingsFilePath = `./settings/${guildId}.json`;
    if (fs.existsSync(settingsFilePath)) {
      const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
      if (settings?.prefix) {
        prefix = settings.prefix;
      }
    }
    
    const commands = client.commands;
    const pageSize = 5; // 1ページあたりのコマンド数
    const totalPages = Math.ceil(commands.size / pageSize);

    let page = 1;
    
    const generateEmbed = () => {
      const startIdx = (page - 1) * pageSize;
      const endIdx = startIdx + pageSize;
      const currentCommands = Array.from(commands.values()).slice(startIdx, endIdx);
      
      const description = currentCommands.map(cmd => `**${prefix}${cmd.usage}** ${cmd.aliases?.length > 0 ? `(aliases: \`${cmd.aliases.join(', ')}\`)` : ''} ${cmd.description ?? '説明がありません'}`).join('\n');
      const embed = new MessageEmbed()
        .setTitle(`ヘルプ - ${page}/${totalPages} (${commands.size} commands)`)
        .setDescription(description)
        .addFields([
          {
            name: '招待',
            value: `[Invite Link](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands)`
          },
          {
            name: 'サポートサーバー',
            value: config.support
          },
          {
            name: 'ドキュメント',
            value: config.docs
          }
        ])
        .setColor(config.color)
        .setFooter({ text: `prefix => ${prefix} | {} => required, () => optional` });

      return embed;
    };
    
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('prev')
          .setLabel('Prev')
          .setEmoji('1085574066674614272')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('delete')
          .setLabel('Delete')
          .setStyle('DANGER'),
        new MessageButton()
          .setCustomId('next')
          .setLabel('Next')
          .setEmoji('1085573995694395412')
          .setStyle('PRIMARY')
      );

    const messageComponent = await message.channel.send({
      embeds: [generateEmbed()],
      components: [row],
    });

    const filter = (interaction) => {
      return interaction.customId === 'prev' || interaction.customId === 'next';
    };

    const collector = messageComponent.createMessageComponentCollector({ filter, time: 300000 }); // 5分間ボタンが有効

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'prev') {
        page = page > 1 ? page - 1 : totalPages; // 前のページに移動、ページが1の場合は最後のページにループ
      } else if (interaction.customId === 'next') {
        page = page < totalPages ? page + 1 : 1; // 次のページに移動、最後のページの場合は最初のページにループ
      }
      
      await interaction.update({ embeds: [generateEmbed()] });
    });

    collector.on('end', () => {
      row.components.forEach(component => {
        if (component.customId !== 'delete') {
          component.setDisabled(true);
        }
      });
      messageComponent.edit({ components: [row] });
    });
  },
};

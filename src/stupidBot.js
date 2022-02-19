require("dotenv").config();
const path = require('path');
const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');


const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

const commandPath = path.resolve(__dirname, './commands');

client.commands = new Collection();
const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`${commandPath}/${file}`);
	client.commands.set(command.data.name, command);
}

const PREFIX = "!";

client.on('ready', () => {
    console.log(`${client.user.tag} has logged in.`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content == 'Hello Aspie') {
        message.channel.send(`Hello ${message.author.tag}!`);
    }

    if (message.content.startsWith(PREFIX)) {

        //console.log('message', message)

        const [CMD_NAME, ...args] = message.content
            .trim()
            .substring(PREFIX.length)
            .split(/\s+/);
        
        if (CMD_NAME === 'verify') {
            //console.log('args: ', args)
            //console.log(message.guild.members)
        }
    }
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});


client.login(process.env.DISCORDJS_BOT_TOKEN);
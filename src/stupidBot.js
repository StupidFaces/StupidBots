require("dotenv").config({path: `.${process.env.NODE_ENV}.env`});
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

console.log(`StupidBot starting with NODE_ENV=${process.env.NODE_ENV}`);

const client = new Client({
    intents: [GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
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

    const gmRegex = /\b(gm|good morning|guten morgen)\b/gmi
    const matches = gmRegex.exec(message.content);

    if (matches) {
        try {
            const response = await axios.get(`${process.env.BACKEND_URL}/daily-info/${message.author.id}`);

            if (response.status == 200) {
                const data = response.data
                console.log(response.data);

                message.reply(`Good mornin' ${message.author.username},
Aspie guessed your location: ||<${data.weather.location.link}>||

**${data.weather.location.city}** :flag_${data.weather.location.state.toLowerCase()}:
---
:thermometer: ${data.weather.temp}°C   :droplet: ${data.weather.humidity}%   ${data.weather.description}
---
You made **${data.dailyTransactions} tnx** on Algorand in the last 24 hours.
---
Take some wisdom for your day: "${data.stupidQuote.text}" - _${data.stupidQuote.stupidFace.adoptionName || data.stupidQuote.stupidFace.assetName}_
                `)
    
            }
        } catch (error) {
            console.log(error.message)
            
        }

    }

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
require("dotenv").config({path: `.${process.env.NODE_ENV}.env`});
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { get } = require("https");
const { EmbedBuilder } = require('discord.js');

console.log(`StupidBot starting with NODE_ENV=${process.env.NODE_ENV}`);

const client = new Client({
    intents: [GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const cloudMapping = {
    'clear sky': ':sunny:',
    'few clouds': ':white_sun_small_cloud:',
    'scattered clouds': ':white_sun_cloud:',
    'broken clouds': ':cloud:',
    'overcast clouds': ':cloud:',
    'shower rain': ':cloud_rain:',
    'moderate rain': ':cloud_rain:',
    'light rain': ':cloud_rain:',
    'rain': '::cloud_rain:',
    'thunderstorm': ':thunder_cloud_rain:',
    'snow': ':cloud_snow:',
    'light snow': ':cloud_snow:',
    'mist': ':fog:',
}

const flagMapping = {
    'ru': ':rainbow_flag:',
    'uk': ':flag_gb:'
}

const airPollutionMapping = {
    '1': ':grin:',
    '2': ':slight_smile:',
    '3': ':face_with_raised_eyebrow:',
    '4': ':confounded:',
    '5': ':nauseated_face:',

}

const commandPath = path.resolve(__dirname, './commands');

client.commands = new Collection();
const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`${commandPath}/${file}`);
	client.commands.set(command.data.name, command);
}

client.on('ready', () => {
    console.log(`${client.user.tag} has logged in.`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const gmRegex = /\b(gm|good morning|guten morgen)\b/gmi
    const gmMatches = gmRegex.exec(message.content);

    if (gmMatches) {
        let stringCountryCode = getCountryCode(message);

        const gmEmbed = await getDailyInfoEmbed(message, stringCountryCode);
        const persistRequest = await gmPersist(message.author.id);

        if (persistRequest && persistRequest.status == 200) {
            message.reply({ embeds: [gmEmbed] });
        }
    }
});

async function gmPersist(authorId) {
    try {
        console.info(`Trying to persist: ${authorId}`)
        const response = await axios.post(`${process.env.BACKEND_URL}/daily-info/persist`, { authorId });
        return response;
    } catch (error) {
        console.error(error.message);
    }
}

function getCountryCode(message) {
    const countryCode = message.content.match(/[🇦-🇿]{2}/u);
    let stringCountryCode = '';

    console.log(countryCode);
    if (countryCode) {
        stringCountryCode = String.fromCodePoint(...Array.from(`${countryCode}`, char => char.codePointAt() - 127397));
        console.log(stringCountryCode);
    }
    return stringCountryCode;
}

async function getDailyInfoEmbed(message, countryCode) {
    try {
        const data = await getDailyInfo(message, countryCode);
        console.log(data);

        const flagShortCode = await getLocationFlagShortCode(data.weather.location.state.toLowerCase());

        const embed = new EmbedBuilder()
        .setColor(0xfff5db)
        .setTitle(`Good mornin' ${message.author.username},`)
        .setURL(data.weather.location.link)
        //.setThumbnail(`https://stupidface.art/assets/faces/${data.stupidQuote.stupidFace.ipfsHash}.png`)
        .addFields(
            { name: 'Guessed Location', value: `${data.weather.location.city} ${flagShortCode}` },
            { name: `Weather ${cloudMapping[data.weather.description]}`, value: `:thermometer: ${data.weather.temp}°C / ${(data.weather.temp*1.8+32).toFixed(2)}°F   :droplet:${data.weather.humidity}%  `, inline: true },
            { name: `Air Quality`, value: `${airPollutionMapping[data.weather.location.airPollution.main.aqi]}`, inline: true },
            { name: 'Algo Tnx/24 hours', value: `${data.dailyTransactions}`}
        )

        if(data.stupidQuote) {
            embed.setFooter({
                    text: `„${data.stupidQuote.text}“ - ${data.stupidQuote.stupidFace.adoptionName || data.stupidQuote.stupidFace.assetName}`,
                    iconURL: `https://stupidface.art/assets/faces/${data.stupidQuote.stupidFace.ipfsHash}.png`
                })
        }
        return embed;

    } catch (error) {
        console.log(error.message)
    }
}

async function getDailyInfo(message, countryCode) {
    const response = await axios.get(`${process.env.BACKEND_URL}/daily-info/${message.author.id}/${countryCode}`);

    if(response.status != 200) {
        throw Error(`Something went wrong with API Request: ${response.status}`)
    }

    return response.data;
}

async function getLocationFlagShortCode(state) {
    if(Object.keys(flagMapping).includes(state)) {
        return flagMapping[state];
    }
    else {
        return `:flag_${state}:`
    }
}


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


require("dotenv").config({path: `.${process.env.NODE_ENV}.env`});
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const path = require('path');
const rest = new REST({ version: '9' }).setToken(process.env.DISCORDJS_BOT_TOKEN);

const commandPath = path.resolve(__dirname, './commands');

const commands = [];
const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`${commandPath}/${file}`);
	commands.push(command.data.toJSON());
}

console.log('commands: ', commands)

rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);


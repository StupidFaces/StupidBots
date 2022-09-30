const { SlashCommandBuilder } = require('@discordjs/builders');
const { getRandomAsset } = require("../algoIndexer")
const { Pool } = require('pg');
const { EmbedBuilder } = require('discord.js');

const pgPool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
})


module.exports = {
    data: new SlashCommandBuilder()
        .setName('face-of-the-month')
        .setDescription('Shuffle for Face of the Month')
        .setDefaultMemberPermissions(0),
    async execute(interaction) {
        await faceOfTheMonth(interaction);
    },
};

async function faceOfTheMonth(interaction) {
    try {
        const randomStupidFace = await getRandomAsset('stupid-face');
        const randomFaceIpfs = randomStupidFace.asset.params.url.split('/').at(-1);

        const embed = new EmbedBuilder()
            .setColor(0xfff5db)
            .setTitle(randomStupidFace.asset.params.name)
            .setDescription(`Face of the Month: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} :tada:`)
            .setImage(`https://stupidface.art/assets/faces/${randomFaceIpfs}.png`)
            .setTimestamp()

        await interaction.reply({ embeds: [embed] });

        console.log(randomStupidFace)

    } catch (error) {
        interaction.reply('Something went wrong...');
        console.error(error);
        return;
    }
}

const { SlashCommandBuilder } = require('@discordjs/builders');
const { getRandomAsset, getAssetOwnerPublicKey } = require("../algoIndexer")
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
        const owner = await getAssetOwnerPublicKey(randomStupidFace.asset.index);
        await persist(randomStupidFace, owner);
        const trophies = ':trophy: '.repeat(await getFaceOfTheMonthCount(randomStupidFace.asset.index));

        const embed = new EmbedBuilder()
            .setColor(0xfff5db)
            .setTitle(`Face of the Month: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`)
            .setDescription(`${randomStupidFace.asset.params.name}`)
            .addFields(
                {name: 'Trophies', value: trophies },
                { name: 'Owner', value: owner.replace(owner.substring(4,54), "..."), inline: true },
                { name: 'Price', value: 'nuthing', inline: true }
            )
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

async function persist(asset, owner) {
    const connection = await pgPool.connect();
    const insertSql = `INSERT INTO ${process.env.FACE_OF_THE_MONTH_TABLE}(asset_id, month_year, hodler_public_key) VALUES($1, $2, $3)`;

    const values = [
        asset.asset.index,
        new Date().toISOString(),
        owner
    ]

    try {
        await pgPool.query(insertSql, values);
    } catch (error) {
        console.error(error)
    } finally {
        connection.release()
    }
}

async function getFaceOfTheMonthCount(assetId) {
    const connection = await pgPool.connect();
    const countSql = `SELECT COUNT(${assetId}) FROM ${process.env.FACE_OF_THE_MONTH_TABLE} WHERE asset_id=${assetId}`;

    try {
        const countQuery = await pgPool.query(countSql);
        const count = countQuery['rows'][0]['count']
        return count;
    } catch (error) {
        console.error(error)
    } finally {
        connection.release()
    }
    
}

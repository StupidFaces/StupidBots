const { SlashCommandBuilder } = require('@discordjs/builders');
const { getRandomAsset, getAssetOwnerPublicKey } = require("../algoIndexer")
const { Pool } = require('pg');
const { EmbedBuilder } = require('discord.js');

const pgPool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
})

const REWARDS = [
    {
        name: "Shrimp",
        base: 10,
        multiplier: 1,
        assetId: 360019122
    },
    {
        name: "Oats",
        base: 500,
        multiplier: 100,
        assetId: 493895498
    },
    {
        name: "Hoot",
        base: 50,
        multiplier: 5,
        assetId: 797382233
    },
    {
        name: "$Poof",
        base: 50,
        multiplier: 5,
        assetId: 658399558
    },
    {
        name: "Roar",
        base: 100,
        multiplier: 10,
        assetId: 917962457
    },
    {
        name: "$Stache",
        base: 20,
        multiplier: 2,
        assetId: 893109155
    },
]


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
        const trophyCount = await getFaceOfTheMonthCount(randomStupidFace.asset.index) + 1;
        const reward = getReward();
        const rewardAmount = (trophyCount) * reward.multiplier + reward.base;
        await persist(randomStupidFace, owner, reward, rewardAmount);


        const embed = new EmbedBuilder()
            .setColor(0xfff5db)
            .setTitle(`Face of the Month: ${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}`)
            .setDescription(`${randomStupidFace.asset.params.name}`)
            .addFields(
                {name: 'Trophies', value: ':trophy: '.repeat(trophyCount) },
                { name: 'Owner', value: owner.replace(owner.substring(4,54), "..."), inline: true },
                { name: 'Price', value: `${rewardAmount} ${reward.name}`, inline: true }
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

async function persist(asset, owner, reward, rewardAmount) {
    const connection = await pgPool.connect();
    const insertSql = `INSERT INTO ${process.env.FACE_OF_THE_MONTH_TABLE}(asset_id, month_year, hodler_public_key, reward_amount, reward_asset_id) VALUES($1, $2, $3, $4, $5)`;

    const values = [
        asset.asset.index,
        new Date().toISOString(),
        owner,
        rewardAmount,
        reward.assetId
    ]

    console.info(insertSql);

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
        return parseInt(count);
    } catch (error) {
        console.error(error)
    } finally {
        connection.release()
    }
}

function getReward() {
    return REWARDS[Math.floor(Math.random()*REWARDS.length)];
}
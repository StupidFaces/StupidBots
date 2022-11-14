const { SlashCommandBuilder } = require('@discordjs/builders');
const algosdk = require("algosdk");
const { getHoldingAssets, allCollectionAssets } = require("../algoIndexer")
const COLLECTIONS = require("../settings.json").collectionMapping;
const { Pool } = require('pg')

const pgPool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING,
})


module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verifies your holding ASAs')
        .addStringOption(option =>
            option.setName('publickey')
                .setDescription('Your publickey to verify')
                .setRequired(true)
        ),
    async execute(interaction) {
        await verify(interaction);
    },
};

async function verify(interaction) {
    let publicKey;
    try {
        publicKey = interaction.options.get('publickey').value;
        algosdk.decodeAddress(publicKey)
    } catch (error) {
        console.error(error);
        interaction.reply('Wallet address is not valid...');
        return;
    }

    try {
        const member = interaction.member;
        await member.roles.remove(COLLECTIONS.map(collection => collection.roleId));
        const memberHodledAssets = await getHoldingAssets(publicKey);

        const hodler = new Hodler(interaction.member.user.id, interaction.member.user.username, publicKey)

        for (let memberAsset of memberHodledAssets) {
            for (let collectionName of Object.keys(allCollectionAssets)) {
                if (allCollectionAssets[collectionName].includes(memberAsset)) {
                    hodler.addAsset({ 'assetId': memberAsset, 'collectionName': collectionName });
                }
            }
        }

        if (hodler.hasAssets()) {
            
            console.log(hodler);

            try {
                await hodler.persist();
                
            } catch (error) {
                console.error(error);
                interaction.reply('Something went wrong while saving your Data.')
                return;
            }

            
            const roleBindings = hodler.roleBindings;
            const responseMessages = [];

            for (let collectionName of Object.keys(roleBindings)) {
                try {
                    //console.log('MEMBER_ROLES: ', member.roles);
                    
                    await member.roles.add(roleBindings[collectionName].roleId);
                    responseMessages.push(`Found ${roleBindings[collectionName].count} Asset(s) of collection **${collectionName}**. Role <@&${roleBindings[collectionName].roleId}> added.`);

                } catch (error) {
                    responseMessages.push(`Something went when trying to add role for ${collectionName}.`);
                    console.error(error);
                }
            }
            interaction.reply(responseMessages.join('\n'));
        } else {
            interaction.reply(`No Assets found! Nothing to do...`);
        }

    } catch (error) {
        interaction.reply('Something went wrong...');
        console.error(error);
        return;
    }
}


class Hodler {
    assets = [];
    roleBindings = {};
    dbUid;

    constructor(discordId, discordName, publicKey) {
        this.discordId = discordId;
        this.discordName = discordName;
        this.publicKey = publicKey;
    }

    addAsset(asset) {
        this.assets.push(asset);
        const assetCollection = asset['collectionName'];
        if (!this.roleBindings[assetCollection]) {
            this.roleBindings[assetCollection] = {
                roleId: COLLECTIONS.find(collection => collection.name == assetCollection).roleId,
                count: 1
            }
        } else {
            this.roleBindings[assetCollection].count += 1
        }
    }

    hasAssets() {
        return this.assets && this.assets.length > 0;
    }

    async persist() {
        await this.persistHodler();
        this.persistAssets();
    }

    async persistHodler() {
        const connection = await pgPool.connect();
        const updateSql = `UPDATE discord_hodler SET discord_id = $1, discord_name = $2, public_key = $3 WHERE discord_id = $4 RETURNING uid;`;
        const insertSql = `INSERT INTO discord_hodler(discord_id, discord_name, public_key) VALUES($1, $2, $3) RETURNING uid;`;
        const updateValues = [this.discordId, this.discordName, this.publicKey, this.discordId];
        const insertValues = [this.discordId, this.discordName, this.publicKey];

        try {
            let result = await pgPool.query(updateSql, updateValues);

            if (result.rowCount == 0) {
                result = await pgPool.query(insertSql, insertValues);
            }
            this.dbUid = result['rows'][0]['uid'];
        } catch (error) {
            console.error(error);
        } finally {
            connection.release()
        }
    }

    async persistAssets() {
        const connection = await pgPool.connect();
        const updateSql = `UPDATE asset SET asset_id = $1, discord_hodler_id = $2, collection_id = $3 WHERE asset_id = $1`;
        const insertSql = `INSERT INTO asset(asset_id, discord_hodler_id, collection_id) VALUES($1, $2, $3)`;
        const valuesArray = this.assets.map(asset => [
                asset.assetId,
                this.dbUid,
                COLLECTIONS.find(collection => collection.name == asset.collectionName).id
            ]);

        try {
            for (let values of valuesArray) {
                let result = await pgPool.query(updateSql, values);

                if (result.rowCount == 0) {
                    await pgPool.query(insertSql, values);
                }
            }

        } catch (error) {
            console.error(error);
        } finally {
            connection.release()
        }
    }
}

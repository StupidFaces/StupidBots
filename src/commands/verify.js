const { SlashCommandBuilder } = require('@discordjs/builders');
const algosdk = require("algosdk");
const { getHoldingAssets, allCollectionAssets } = require("../algoIndexer")
const COLLECTIONS = require("../settings.json").collectionMapping;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('verify')
		.setDescription('Verifies your holding ASAs')
        .addStringOption(option =>
            option.setName('publickey')
                .setDescription('Your publickey to verify')
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
        const memberHodledAssets = await getHoldingAssets(publicKey);

        const hodler = new Hodler(interaction.member.user.id, interaction.member.user.username, publicKey)

        for (let memberAsset of memberHodledAssets) {
            for (let collectionName of Object.keys(allCollectionAssets)) {
                if (allCollectionAssets[collectionName].includes(memberAsset)) {
                    hodler.addAsset({'assetId': memberAsset, 'collectionName': collectionName});
                }
            }
        }

        if (hodler.hasAssets()) {
            const member = interaction.member;
            console.log(hodler);

            const roleBindings = hodler.roleBindings;
            const responseMessages = [];

            for (let collectionName of Object.keys(roleBindings)) {
                try {
                    await member.roles.add(roleBindings[collectionName].roleId);
                    responseMessages.push(`Found ${roleBindings[collectionName].count} Asset(s) of collection ${collectionName} - Role added`);
                    
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
}

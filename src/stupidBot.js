require("dotenv").config();

const { Client, Intents } = require('discord.js');
const algosdk = require("algosdk");

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

const algoIndexer = new algosdk.Indexer('',"https://algoindexer.algoexplorerapi.io",'443',{'User-Agent':'Stupid-Bot'});
const stupidFaceAssetsIds = [];



(async () =>  {
    const accountWrapper = await algoIndexer.lookupAccountByID('KKBVJLXALCENRXQNEZC44F4NQWGIEFKKIHLDQNBGDHIM73F44LAN7IAE5Q').do();
    const createdAssets = accountWrapper.account['created-assets'];
    for (let asset of createdAssets) {
        if (!asset.deleted) {
            stupidFaceAssetsIds.push(asset['index'])
        }
    }
})();


async function getHoldingAssets(publicKey) {
    const accountWrapper = await algoIndexer.lookupAccountByID(publicKey).do();
    const allAssets = accountWrapper.account['assets'];
    const hodledAssets = [];
    for (let asset of allAssets) {
        if (asset.amount > 0) {
            hodledAssets.push(asset['asset-id']);
        }
    }
    return hodledAssets;
    

}

(async () => {
    const blub = await getHoldingAssets('RIVO6GZHMRARJF7DBHTUMKBEZMNMH5ZNGEC6J3ZAVXV3JCDTJFMNMJZ5YU');
    bla = 'Was'
})();




const PREFIX = "!";
const STUPID_ROLE_ID = '920087263646453851';

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

            try {
                algosdk.decodeAddress(args[0])
            } catch (error) {
                console.log('ERROR: ', error);
                message.channel.send('Wallet address is not valid...');
            }

            try {

                const memberHodledAssets = await getHoldingAssets(args[0]);

                for (let memberAsset of memberHodledAssets) {
                    console.log({memberAsset, stupidFaceAssetsIds})
                    if (stupidFaceAssetsIds.includes(memberAsset)) {
                        const member = message.guild.members.cache.get(message.author.id);
                        member.roles.add(STUPID_ROLE_ID)
                        message.channel.send(`Role added: Your are now "Stupid"`);
                    }
                }


            } catch (error) {
                message.channel.send('Something went wrong...');
                console.log('ERROR: ', error)

                
            }


        }
    }
});


client.login(process.env.DISCORDJS_BOT_TOKEN);
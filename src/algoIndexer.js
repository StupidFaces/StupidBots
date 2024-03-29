const algosdk = require("algosdk");
const COLLECTIONS = require("./settings.json").collectionMapping;
// const algoIndexer = new algosdk.Indexer('',"https://algoindexer.algoexplorerapi.io",'443',{'User-Agent':'Stupid-Bot'});
const algoIndexer = new algosdk.Indexer('',"https://mainnet-idx.algonode.network",'443');
const allCollectionAssets = {};

(async () =>  {
    for (let collection of COLLECTIONS) {
        const indexerResponse = await algoIndexer.lookupAccountCreatedAssets(collection.address).limit(1000).do();
        const createdAssets = indexerResponse['assets'];
        const collectionsAssets = []
        for (let asset of createdAssets) {
            if (!asset.deleted) {
                collectionsAssets.push(asset['index'])
            }
        }
        allCollectionAssets[collection.name] = collectionsAssets;
    }
})();


async function getHoldingAssets(publicKey) {
    const accountWrapper = await algoIndexer.lookupAccountAssets(publicKey).limit(10000).do();
    const allAssets = accountWrapper['assets'];
    const hodledAssets = [];
    for (let asset of allAssets) {
        if (asset.amount > 0) {
            hodledAssets.push(asset['asset-id']);
        }
    }
    return hodledAssets;
}

async function getRandomAsset(collectionName) {
    const collectionAssets = allCollectionAssets[collectionName];
    const randomAssetId = collectionAssets[Math.floor(Math.random() * collectionAssets.length)];
    const randomAsset = await algoIndexer.lookupAssetByID(randomAssetId).do();

    return randomAsset;

}

async function getAssetOwnerPublicKey(assetId) {
    try {
        const assetInfo = await algoIndexer.lookupAssetBalances(assetId).do();
        const holderPublicKey = assetInfo.balances.filter(balance => balance.amount > 0)[0].address;

        return holderPublicKey;

    } catch (error) {
        console.error(error);

    }
}
// (async () => {
//     const blub = await getHoldingAssets('RIVO6GZHMRARJF7DBHTUMKBEZMNMH5ZNGEC6J3ZAVXV3JCDTJFMNMJZ5YU');
//     bla = 'Was'
// })();

module.exports = {
    allCollectionAssets,
    getHoldingAssets,
    getRandomAsset,
    getAssetOwnerPublicKey
}

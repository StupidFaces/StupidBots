const algosdk = require("algosdk");
const COLLECTIONS = require("./settings.json").collectionMapping;

const algoIndexer = new algosdk.Indexer('',"https://algoindexer.algoexplorerapi.io",'443',{'User-Agent':'Stupid-Bot'});
const allCollectionAssets = {};

(async () =>  {
    for (let collection of COLLECTIONS) {
        const accountWrapper = await algoIndexer.lookupAccountByID(collection.address).do();
        const createdAssets = accountWrapper.account['created-assets'];
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

// (async () => {
//     const blub = await getHoldingAssets('RIVO6GZHMRARJF7DBHTUMKBEZMNMH5ZNGEC6J3ZAVXV3JCDTJFMNMJZ5YU');
//     bla = 'Was'
// })();

module.exports = {
    allCollectionAssets,
    getHoldingAssets
}
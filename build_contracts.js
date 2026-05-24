// let fs = require('fs');
// let axios = require('axios');
// process['env']['NODE_ENV'] = process['env']['NODE_ENV'] || 'development'; // development || production

// let envoirments = {
//     development: '3.14.39.143',
//     production: '3.13.112.185'
// };

// for (let env of Object.keys(envoirments)) {
//     axios.get(`http://${envoirments[env]}:4003/contracts/${env}`).then(async ({ data }) => {
//         let required = ['ICO', 'Token'];
//         for (let key of required)
//             if (!data[key] || data[key] == '' || data[key] == undefined || data[key] == null)
//                 return console.log(`Please provide ${key}`);

//         fs.writeFileSync(`./src/store/contract/${env}/ICO.json`, JSON.stringify(data['ICO']));
//         fs.writeFileSync(`./src/store/contract/${env}/Token.json`, JSON.stringify(data['Token']));
//     }).catch(e => console.log(e));
// }
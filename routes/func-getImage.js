const qs = require('querystring');
const fetch = require('node-fetch');

async function getImage(query) {
  console.log("QUERY" + query);
  const params = {
    q: query.replace("/\s/g", '+'),
    searchType: 'image',
    key: process.env['GOOGLE_IMAGES_API'],
    cx: process.env['GOOGLE_SEARCH_KEY'],
  }
  let paramString = qs.stringify(params)
  let url = `https://www.googleapis.com/customsearch/v1?${paramString}`;
  let response = await fetch(url);
  let data = await response.json();
  let i = 2;
  try {
    while (data['error']['code'] > 0 || i <= 5) {
      params['key'] = process.env[`GOOGLE_IMAGES_API${i}`]
      params['cx'] = process.env[`GOOGLE_SEARCH_KEY${i}`]
      console.log("Trying Backup Keys...");
      paramString = qs.stringify(params)
      url = `https://www.googleapis.com/customsearch/v1?${paramString}`;
      response = await fetch(url);
      data = await response.json();
      console.log("Tried with account " + i);
      i++;
    }
  } catch {
    console.log("Successfully got data")
  }
  
  return data['items'][0]['image']['thumbnailLink'];
}

module.exports = { getImage };
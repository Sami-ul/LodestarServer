const qs = require('querystring');
const fetch = require('node-fetch');

async function getImage(query) {
  const params = {
    q: query.replace("/\s/g", '+'),
    searchType: 'image',
    key: process.env['GOOGLE_IMAGES_API'],
    cx: "80339b79108cd435e",
  }
  const paramString = qs.stringify(params)
  const url = `https://www.googleapis.com/customsearch/v1?${paramString}`;
  let response = await fetch(url);
  const data = await response.json();
  try {
    return data['items'][0]['link'];
  } catch {
    console.log("PROBLEMATIC QUERY" + query);
    return "NOIMG";
  }
}

module.exports = { getImage };
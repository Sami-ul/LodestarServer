const express = require('express');
const fs = require('fs'); // file system for logging requests made for debugging purposes
const router = express.Router();
const request = require('request'); // used to make api requests
const log = require('./func-logFile');



// nearby parking
// Required paramters include Long, Lat
router.get('/parking', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // If needed
  res.setHeader('Access-Control-Allow-Credentials', true); // If needed
  var d = new Date();
  var dateTime = d.toLocaleString();
  var inputUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
  var endpoint = "parking";
  inputUrl = inputUrl.split(",").join("%2C");
  log.logFile(dateTime, endpoint, inputUrl);
  long = req.query['long'];
  lat = req.query['lat'];
  let parkingUrl = "https://api.geoapify.com/v2/places/?categories=parking";
  parkingUrl += "&bias=proximity:" + long + "," + lat;
  parkingUrl += "&limit=1"
  parkingUrl += "&apiKey=" + process.env['GEOAPIFY_KEY'];
  request(parkingUrl, { json: true }, (err, result, body) => {
    try {
      res.json(body); // Return body of result as json
    } catch {
      res.send("Error");
    }
  });
  parkingUrl = null;
});

// weather api
// Required parameters include Lat, Long
router.get('/weather', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // If needed
  res.setHeader('Access-Control-Allow-Credentials', true); // If needed
  var d = new Date();
  var dateTime = d.toLocaleString();
  var inputUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
  var endpoint = "weather";
  inputUrl = inputUrl.split(",").join("%2C");
  log.logFile(dateTime, endpoint, inputUrl);
  long = req.query['long'];
  lat = req.query['lat'];
  let weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=${process.env['WEATHER_API_KEY']}&units=imperial`; // add &mode=html for html
  request(weatherUrl, { json: true }, (err, result, body) => {
    try {
      res.json(body); // Return body of result as json
    } catch {
      res.send("Error");
    }
  });
  weatherUrl = null;
});

// The endpoint used to procure the lat/long of the IP Address
// Required parameters include URL
router.get('/ipinfo', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // If needed
  res.setHeader('Access-Control-Allow-Credentials', true); // If needed
  var d = new Date();
  var dateTime = d.toLocaleString();
  var inputUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
  var endpoint = "ipinfo";
  inputUrl = inputUrl.split(",").join("%2C");
  log.logFile(dateTime, endpoint, inputUrl);
  var ipUrl;
  // Appending API key to the url sent in by front end
  ipUrl = req.query['url'] + `?token=${process.env['IPINFO_KEY']}`;
  request(ipUrl, { json: true }, (err, result, body) => {
    try {
      res.json(body); // Return body of result as json
    } catch {
      res.send("Error");
    }
  });
  ipUrl = null;
});

// The endpoint used to procure the lat/long of a street address
// Required parameters incude URL
router.get('/bingmaps', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // If needed
  res.setHeader('Access-Control-Allow-Credentials', true); // If needed
  var d = new Date();
  var dateTime = d.toLocaleString();
  var inputUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
  var endpoint = "bingmaps";
  inputUrl = inputUrl.split(",").join("%2C");
  log.logFile(dateTime, endpoint, inputUrl);
  var bingMapsUrl;
  // Appending API key to the url sent in by front end
  bingMapsUrl = req.query['url'] + `&key=${process.env['BINGMAPS_KEY']}`;
  request(bingMapsUrl, { json: true }, (err, result, body) => {
    try {
      // Gets only the coordinates and sends
      res.json(body['resourceSets'][0]['resources'][0]['point']['coordinates']);
    }
    catch {
      res.send("Error");
    }
  });
  bingMapsUrl = null;
});

module.exports = router;
const express = require('express');
const router = express.Router();

// The endpoint called to procure attractions based on user filters (remember to update the categories in the firebase db)
// required paramters include CPU Serial ID & URL
router.get('/geoapify', (req, res) => { // url must be encoded without api key
  var d = new Date();

  var dateTime = d.toLocaleString();
  var inputUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
  var endpoint = "geoapify";

  inputUrl = inputUrl.split(",").join("%2C");
  fs.appendFile(
    "RequestLogs.csv",
    `${dateTime}, ${endpoint}, ${inputUrl}\n`,
    (err) => {
      if (err) throw err;
    });
  var geoUrl;
  let cpuSerialID = req.query['cpuserialid'];
  ref.child(cpuSerialID).get().then((user) => {
    if (!user.exists()) {
      ref.child(cpuSerialID).set(defaultData);
    }
  }).catch((error) => {
    console.error(error);
  });
  // Decodes url and parses relevant information in order to add to firebase
  // for recommendations
  let decodedUrl = decodeURI(req.query['url']);
  let proxIndex = decodedUrl.indexOf("categories=") + 11;
  let limitIndex = decodedUrl.indexOf("&filter");
  let categoryStr = decodedUrl.substring(proxIndex, limitIndex);
  if (categoryStr.includes(".")) {
    let dotLoc = categoryStr.indexOf(".");
    categoryStr = categoryStr.substring(0, dotLoc)
  }

  ref.child(cpuSerialID).child("categories").get().then((snapshot) => {
    snapshot.forEach((category) => {
      if (category.key == categoryStr) {
        ref.child(cpuSerialID).child("categories").child(category.key).set(category.val() + 1);
      }
    });
  });

  // Appending API key to the url sent in by front end
  geoUrl = req.query['url'] + `&apiKey=${process.env['GEOAPIFY_KEY']}`;
  request(geoUrl, { json: true }, (err, result, body) => {
    try {
      res.json(body); // Return body of result as json
    } catch {
      res.send("Error");
    }
  });
  geoUrl = null;
});

// nearby parking
// Required paramters include Long, Lat
router.get('/parking', (req, res) => {
  var d = new Date();
  var dateTime = d.toLocaleString();
  var inputUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
  var endpoint = "parking";
  inputUrl = inputUrl.split(",").join("%2C");
  fs.appendFile(
    "RequestLogs.csv",
    `${dateTime}, ${endpoint}, ${inputUrl}\n`,
    (err) => {
      if (err) throw err;
    });
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
  var d = new Date();
  var dateTime = d.toLocaleString();
  var inputUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
  var endpoint = "weather";
  inputUrl = inputUrl.split(",").join("%2C");
  fs.appendFile(
    "RequestLogs.csv",
    `${dateTime}, ${endpoint}, ${inputUrl}\n`,
    (err) => {
      if (err) throw err;
    });
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
  var d = new Date();
  var dateTime = d.toLocaleString();
  var inputUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
  var endpoint = "ipinfo";
  inputUrl = inputUrl.split(",").join("%2C");
  fs.appendFile(
    "RequestLogs.csv",
    `${dateTime}, ${endpoint}, ${inputUrl}\n`,
    (err) => {
      if (err) throw err;
    });
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
  var d = new Date();
  var dateTime = d.toLocaleString();
  var inputUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
  var endpoint = "bingmaps";
  inputUrl = inputUrl.split(",").join("%2C");
  fs.appendFile(
    "RequestLogs.csv",
    `${dateTime}, ${endpoint}, ${inputUrl}\n`,
    (err) => {
      if (err) throw err;
    });
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
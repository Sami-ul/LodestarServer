// Packages
const express = require('express'); // Used for incoming API requests
const request = require('request'); // used to make api requests
const firebase = require('firebase-admin'); // used to store user data for recommendations
const bodyParser = require('body-parser'); // middleware for express
const fs = require('fs'); // file system for logging requests made for debugging purposes

// Sets up express
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// Firebase setup
var serviceAccount = {
  "type": process.env['type'],
  "project_id": process.env['project_id'],
  "private_key_id": process.env['private_key_id'],
  "private_key": process.env['private_key'],
  "client_email": process.env['client_email'],
  "client_id": process.env['client_id'],
  "auth_uri": process.env['auth_uri'],
  "token_uri": process.env['token_uri'],
  "auth_provider_x509_cert_url": process.env['auth_provider_x509_cert_url'],
  "client_x509_cert_url": process.env['client_x509_cert_url']
};
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: process.env['firebase_url'],
});
const database = firebase.database();
const ref = database.ref("/");

const defaultData = {
  "categories": {
    "catering": 0,
    "entertainment": 0,
    "commercial": 0,
    "accommodation": 0,
    "tourism": 0,
    "natural": 0,
  }
};

// Shows if the app is online
app.get('/', (req, res) => {
  res.send("online");
});

// The endpoint called during the app start
// Required paramters include CPU Serial ID, Long, Lat
app.get('/recommendations', (req, res) => {
  var d = new Date();
  var dateTime = d.toLocaleString();
  var inputUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
  var endpoint = "recommendations";
  inputUrl = inputUrl.split(",").join("%2C");
  fs.appendFile(
    "RequestLogs.csv",
    `${dateTime}, ${endpoint}, ${inputUrl}\n`,
    (err) => {
      if (err) throw err;
    });
  let cpuSerialID = req.query['cpuserialid'];
  ref.child(cpuSerialID).get().then((user) => {
    if (!user.exists()) {
      ref.child(cpuSerialID).set(defaultData);
    }
  }).catch((error) => {
    console.error(error);
  });

  // update location
  let long = req.query['long'];
  let lat = req.query['lat'];
  let highestCategory = "";
  let highestCategoryCount = 0;
  let secondHighestCategory = "";
  let secondHighestCategoryCount = 0;

  // calculating the optimal category to recommend to the user
  ref.child(cpuSerialID).child("categories").get().then((snapshot) => {
    snapshot.forEach((category) => {
      if (category.val() > 0) {
        if (category.val() >= highestCategoryCount) {
          highestCategoryCount = category.val();
          highestCategory = category.key;
        }
        else if (category.val() >= secondHighestCategoryCount) {
          secondHighestCategoryCount = category.val();
          secondHighestCategory = category.key
        }
      }
    });

    let geoUrl = "https://api.geoapify.com/v2/places/?"
    if (highestCategoryCount == 0 && secondHighestCategoryCount == 0) {
      // if the user has not used the app, and hence has no data, the app will use default categories to recommend to them
      geoUrl += "categories=catering,entertainment,natural,tourism,activity,ski,sport";
    } else {
      if (secondHighestCategoryCount == 0) { // incorporating second highest category allows users to have more variety in selections
        geoUrl += "categories=" + highestCategory;
        // If user has only searched one category in the past
      }
      else {
        geoUrl += "categories=" + highestCategory + "," + secondHighestCategory;
        // If user has used the app multiple times and has a variety of searches in different categories
      }
    }

    // sending requests with computed values
    // Send request to geoapify with highest categories and get all obj
    geoUrl += "&filter=circle:" + long + "," + lat + "," + "80467"; // 50 mile radius
    geoUrl += "&bias=proximity:" + long + "," + lat;
    geoUrl += "&limit=4";
    geoUrl += "&apiKey=" + process.env['GEOAPIFY_KEY'];
    request(geoUrl, { json: true }, (err, result, body) => {
      res.json(body);
    });
  });
});

// The endpoint called to procure attractions based on user filters (remember to update the categories in the firebase db)
// required paramters include CPU Serial ID & URL
app.get('/geoapify', (req, res) => { // url must be encoded without api key
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
app.get('/parking', (req, res) => {
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
app.get('/weather', (req, res) => {
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
app.get('/ipinfo', (req, res) => {
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
app.get('/bingmaps', (req, res) => {
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

// Start server
app.listen(); // Listeing at port 3000
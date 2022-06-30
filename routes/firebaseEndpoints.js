const express = require('express');
const router = express.Router();
const firebase = require('firebase-admin'); // used to store user data for recommendations
const request = require('request'); // used to make api requests
const log = require('./func-logFile');
const image = require('./func-getImage');
const bodyParser = require('body-parser'); // middleware for express\

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

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
  },
  "favorites": {
  }
};

const defaultRecs = {"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"McDonald's","street":"South Mines Drive","suburb":"Near South Side","city":"Chicago","county":"Cook County","state":"Illinois","postcode":"60616","country":"United States","country_code":"us","lon":-87.6158576,"lat":41.8520353,"formatted":"McDonald's, South Mines Drive, Chicago, IL 60616, United States of America","address_line1":"McDonald's","address_line2":"South Mines Drive, Chicago, IL 60616, United States of America","categories":["catering","catering.fast_food","catering.fast_food.burger"],"details":["details","details.catering","details.facilities"],"datasource":{"sourcename":"openstreetmap","attribution":"© OpenStreetMap contributors","license":"Open Database Licence","url":"https://www.openstreetmap.org/copyright"},"distance":179,"place_id":"518ebffe356ae755c059d249237e0fed4440f00103f901e54744ac0100000092030a4d63446f6e616c642773","imgLink":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7KVvSdbzEDyTPm0T-0UMaU953X-PUxieMNWOItw24XnRJEZdHkgGFzo0j&s"},"geometry":{"type":"Point","coordinates":[-87.6158576,41.85203530047478]}},{"type":"Feature","properties":{"name":"Connie's Pizza","street":"Freight Docks North","suburb":"Near South Side","city":"Chicago","county":"Cook County","state":"Illinois","postcode":"60616","country":"United States","country_code":"us","lon":-87.6150426,"lat":41.8522005,"formatted":"Connie's Pizza, Freight Docks North, Chicago, IL 60616, United States of America","address_line1":"Connie's Pizza","address_line2":"Freight Docks North, Chicago, IL 60616, United States of America","categories":["catering","catering.fast_food","catering.fast_food.pizza"],"details":["details.catering","details.facilities"],"datasource":{"sourcename":"openstreetmap","attribution":"© OpenStreetMap contributors","license":"Open Database Licence","url":"https://www.openstreetmap.org/copyright"},"distance":248,"place_id":"516529a3db5ce755c0594996efe714ed4440f00103f901e64744ac0100000092030e436f6e6e696527732050697a7a61","imgLink":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKxrXS7UDASl8gMUGOSljCqeH3eA76iBctJVVfUjm3_FvNtowE40BedqKq&s"},"geometry":{"type":"Point","coordinates":[-87.6150426,41.8522005004748]}},{"type":"Feature","properties":{"name":"22nd Street Cafe","street":"Freight Docks North","suburb":"Near South Side","city":"Chicago","county":"Cook County","state":"Illinois","postcode":"60616","country":"United States","country_code":"us","lon":-87.6149913,"lat":41.8520753,"formatted":"22nd Street Cafe, Freight Docks North, Chicago, IL 60616, United States of America","address_line1":"22nd Street Cafe","address_line2":"Freight Docks North, Chicago, IL 60616, United States of America","categories":["catering","catering.cafe"],"details":[],"datasource":{"sourcename":"openstreetmap","attribution":"© OpenStreetMap contributors","license":"Open Database Licence","url":"https://www.openstreetmap.org/copyright"},"distance":251,"place_id":"51c43478045ce755c05961a2aecd10ed4440f00103f901e74744ac0100000092031032326e64205374726565742043616665","imgLink":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5eQJv1X6i6H76KIJXl812YMaZnIvEMvhH1bW9OMfTYJ20oXU-_R2PLQ&s"},"geometry":{"type":"Point","coordinates":[-87.61499129999999,41.85207530047479]}},{"type":"Feature","properties":{"name":"Showroom Food Hall","housenumber":"2121","street":"South Prairie Avenue","suburb":"Near South Side","city":"Chicago","county":"Cook County","state":"Illinois","postcode":"60616","country":"United States","country_code":"us","lon":-87.6203557,"lat":41.8539444,"formatted":"Showroom Food Hall, 2121 South Prairie Avenue, Chicago, IL 60616, United States of America","address_line1":"Showroom Food Hall","address_line2":"2121 South Prairie Avenue, Chicago, IL 60616, United States of America","categories":["catering","catering.restaurant"],"details":["details","details.contact"],"datasource":{"sourcename":"openstreetmap","attribution":"© OpenStreetMap contributors","license":"Open Database Licence","url":"https://www.openstreetmap.org/copyright"},"distance":307,"place_id":"51c8d864e8b3e755c0593452d40c4eed4440f00103f901d439d1780100000092031253686f77726f6f6d20466f6f642048616c6c","imgLink":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxLNE5YkR6Gx279JaKp82o4ve0mJ8lsxaluZlhUSDTRB7NusWbPVP12rg&s"},"geometry":{"type":"Point","coordinates":[-87.6203557,41.853944400474944]}}]}
// The endpoint called to procure attractions based on user filters (remember to update the categories in the firebase db)
// required paramters include CPU Serial ID & URL
router.get('/geoapify', (req, res) => { // url must be encoded without api key
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // If needed
  res.setHeader('Access-Control-Allow-Credentials', true); // If needed
  var d = new Date();

  var dateTime = d.toLocaleString();
  var inputUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
  var endpoint = "geoapify";

  inputUrl = inputUrl.split(",").join("%2C");
  log.logFile(dateTime, endpoint, inputUrl);
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
  request(geoUrl, { json: true }, async (err, result, body) => {
    try {
      for (var i = 0; i < body['features'].length; i++) {
        var link = await image.getImage(body['features'][i]['properties']['name']).then((data) => {
          return data;
        }, reason => {
          console.error(reason)
        });
        body['features'][i]['properties']['imgLink'] = link;
      }
      res.json(body); // Return body of result as json
    } catch {
      res.send(err);
    }
  });
  geoUrl = null;
});

// The endpoint called during the app start
// Required paramters include CPU Serial ID, Long, Lat
router.get('/recommendations', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // If needed
  res.setHeader('Access-Control-Allow-Credentials', true); // If needed
  var d = new Date();
  var dateTime = d.toLocaleString();
  var inputUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
  var endpoint = "recommendations";
  inputUrl = inputUrl.split(",").join("%2C");
  log.logFile(dateTime, endpoint, inputUrl);
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
  let count = 0;
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
      } else {
        count++;
      }
    });

    if (count != 6){
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
    request(geoUrl, { json: true }, async (err, result, body) => {
      console.log("BODY"+ body);
      if (err) {
        res.error(err);
      }
      for (var i = 0; i < body['features'].length; i++) {
        var link = await image.getImage(body['features'][i]['properties']['name']).then((data) => {
          return data;
        }, reason => {
          console.error(reason)
        });
        body['features'][i]['properties']['imgLink'] = link;
      }
      res.json(body);
    });
    }
    else {
      res.json(defaultRecs);
    }
  });
});  

router.get('/getFavorites', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);

  // logging
  var d = new Date();

  var dateTime = d.toLocaleString();
  var inputUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
  var endpoint = "getFavorites";


  inputUrl = inputUrl.split(",").join("%2C");
  log.logFile(dateTime, endpoint, inputUrl);

  // favorites
  var geoUrl;
  let cpuSerialID = req.query['cpuserialid'];
  ref.child(cpuSerialID).get().then((user) => {
    if (!user.exists()) {
      ref.child(cpuSerialID).set(defaultData);
    }
  }).catch((error) => {
    console.error(error);
  });
  let results = {
    "favorites": [
      
    ]
  };
  let count = 0;
  ref.child(cpuSerialID).child("favorites").get().then((snapshot) => {
    snapshot.forEach((favorite) => {
      results['favorites'].push(favorite.val());
      results['favorites'][count]['placeID'] = favorite.key;
      count++;
      //placeId - favorite.key:
      // json with rest of stuff - favorite.val()
    });
    return results;
  }).then((res1) => {
    res.json(res1)
  });
});

router.post('/addFavorite', (req, res) => {
  /*

  */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);

  // logging
  var d = new Date();

  var dateTime = d.toLocaleString();
  var inputUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
  var endpoint = "addFavorite";

  inputUrl = inputUrl.split(",").join("%2C");
  log.logFile(dateTime, endpoint, inputUrl);

  // favorites
  let cpuSerialID = req.query['cpuserialid'];
  ref.child(cpuSerialID).get().then((user) => {
    if (!user.exists()) {
      ref.child(cpuSerialID).set(defaultData);
    }
  }).catch((error) => {
    console.error(error);
  });
  body = req.body;
  let placeID = body['placeID'];
  let address = body['address'];
  let name = body['name'];
  let imgLink = body['imgLink'];
  let lat = body['lat'];
  let lon = body['lon'];
  ref.child(cpuSerialID).child("favorites").child(placeID).child("address").set(address); 
  ref.child(cpuSerialID).child("favorites").child(placeID).child("name").set(name);  
  ref.child(cpuSerialID).child("favorites").child(placeID).child("imgLink").set(imgLink);
  ref.child(cpuSerialID).child("favorites").child(placeID).child("lat").set(lat);
  ref.child(cpuSerialID).child("favorites").child(placeID).child("lon").set(lon);
  res.send("added");
});

router.post('/removeFavorite', (req, res) => {
  /*

  */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);

  // logging
  var d = new Date();

  var dateTime = d.toLocaleString();
  var inputUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
  var endpoint = "removeFavorite";

  inputUrl = inputUrl.split(",").join("%2C");
  log.logFile(dateTime, endpoint, inputUrl);

  // favorites
  let cpuSerialID = req.query['cpuserialid'];
  let placeID = req.body['placeID'];

  ref.child(cpuSerialID).child("favorites").child(placeID).remove();
  ref.child(`${cpuSerialID}/favorites`).get().then((user) => {
    if (!user.exists()) {
      ref.child(cpuSerialID).child('favorites');
    }
  }).catch((error) => {
    console.error(error);
  });
  console.log("Removing" + placeID);
  res.send("removed");
});



module.exports = router;
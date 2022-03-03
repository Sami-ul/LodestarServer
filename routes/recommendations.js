const express = require('express');
const router = express.Router();

// The endpoint called during the app start
// Required paramters include CPU Serial ID, Long, Lat
router.get('/recommendations', (req, res) => {
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


module.exports = router;
// Packages
const express = require('express'); // Used for incoming API requests
const request = require('request'); // used to make api requests
const firebase = require('firebase-admin'); // used to store user data for recommendations
const bodyParser = require('body-parser'); // middleware for express
const fs = require('fs'); // file system for logging requests made for debugging purposes
const online = require('./routes/online.js');
const apiEndpoints = require('./routes/apiEndpoints.js');


// Sets up express
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
pathWalk('./routes/');

async function pathWalk(dir) {
  const directory = await fs.promises.readdir(dir);
  directory.forEach((file) => {
    console.log("./routes/" + file + "online");
    app.use(require("./routes/" + file));
  });
}

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
// Start server
app.listen(); // Listeing at port 3000
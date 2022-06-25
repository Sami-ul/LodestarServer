// Packages
const express = require('express'); // Used for incoming API requests
const bodyParser = require('body-parser'); // middleware for express
const online = require('./routes/online.js');
const fs = require('fs');

// Sets up express
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
pathWalk('./routes/');

async function pathWalk(dir) {
  // Walks the routes folder and turns on all endpoints, ignoring files marked func-
  const directory = await fs.promises.readdir(dir);
  directory.forEach((file) => {
    if (!file.startsWith("func-")) {
      console.log("./routes/" + file + " online");
      app.use(require("./routes/" + file));
    }
  });
}

// Start server
app.listen(); // Listeing at port 3000
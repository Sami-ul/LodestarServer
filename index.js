// Packages
const express = require('express'); // Used for incoming API requests
const bodyParser = require('body-parser'); // middleware for express
const online = require('./routes/online.js');
const fs = require('fs');
var cors = require('cors');

// Sets up express
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
pathWalk('./routes/');
app.get('/products/:id', function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for all origins!'});
});

app.listen(80, function () {
  console.log('CORS-enabled web server listening on port 80');
});
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
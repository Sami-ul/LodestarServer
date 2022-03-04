const fs = require('fs');

async function logFile(dateTime, endpoint, url) {
  fs.appendFile(
    "RequestLogs.csv",
    `${dateTime}, ${endpoint}, ${url}\n`,
    (err) => {
      if (err) throw err;
    });
}

module.exports = { logFile };
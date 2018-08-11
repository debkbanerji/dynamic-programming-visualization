const express = require("express");
const os = require('os');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

const port = process.env.PORT || 3000;
/*
 To set a port other than 3000:
 in Unix:

 $ PORT=1234 node server.js

 in Windows:

 set PORT=1234
 node server.js
 */

const ifaces = os.networkInterfaces();

Object.keys(ifaces).forEach(function (ifname) {
    let alias = 0;

    ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            return;
        }

        if (alias >= 1) {
            // this single interface has multiple ipv4 addresses
            console.log(ifname + ':' + alias, iface.address);
        } else {
            // this interface has only one ipv4 adress
            console.log(ifname, iface.address);
        }
        ++alias;
    });
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// parse application/json
app.use(bodyParser.json());

const frontendFolder = path.join(__dirname, 'dp-vis');
// Point static path to frontend folder
app.use(express.static(frontendFolder));
console.log("Serving static from " + frontendFolder);

// Catch all other routes and return the index file
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendFolder, 'index.html'));
});

app.listen(port, function () {
    console.log('listening on port ' + port);
    console.log('press Ctrl + C to shut down server');
});

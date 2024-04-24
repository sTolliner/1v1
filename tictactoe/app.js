'use strict';

//Filen app.js är den enda ni skall och tillåts skriva kod i.
const globalObject = require('/servermodules/game-modul.js');
const fs = require('fs');
const express = require('express');
const jsDOM = require('jsdom');
const cookieParser = require('cookie-parser')

let app = express();

app.listen(3000, function () {
    console.log(":3")
} );
app.use("/static", express.static(__dirname + "/static"));
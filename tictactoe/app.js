'use strict';

//Filen app.js är den enda ni skall och tillåts skriva kod i.
const globalObject = require("./servermodules/game-modul.js");
const fs = require('fs');
const express = require('express');
const jsDOM = require('jsdom');
const cookieParser = require('cookie-parser');

let app = express();

app.listen(3000, function () {
    console.log(":3")
});
app.use("/static", express.static(__dirname + "/static"));
app.use(express.urlencoded({ extended: true }));

app.get("/", function(request, response) {

});

app.get("/reset", function(request, response) {

});

app.post("/", function(request, response) {
    try{

        console.log(request.body);
        if(globalObject.playerOneNick===undefined){
            throw new Error('Nickname saknas!');
        }

        if(globalObject.playerOneColor===undefined){
            throw new Error('Färg saknas!');
        }
        
        if(globalObject.playerOneNick.value.length < 3) {
            throw new Error("Nickname skall vara minst tre tecken långt");
        }

        if (globalObject.playerOneColor.value.length !== 7 ) {
            throw new Error("Färg skall innehålla sju tecken");
        }

        if (globalObject.playerONeColor.value === '#000000' || globalObject.playerONeColor.value === '#ffffff'){
            throw new Error("Ogiltig färg!");
        }

    }catch(oError) {
        response.send(oError.message);
    }
});


 
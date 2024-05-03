'use strict';

//Filen app.js är den enda ni skall och tillåts skriva kod i.
const globalObject = require("./servermodules/game-modul.js");
const fs = require('fs');
const express = require('express');
const jsDOM = require('jsdom');
const cookieParser = require('cookie-parser');

let app = express();

app.listen(3000, function () {
    console.log(":3");
});
app.use("/static", express.static(__dirname + "/static"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser('secret'));

app.get("/", function (request, response) {
    response.sendFile(__dirname + '/static/html/loggain.html', function(err) {
        if( err ) {
            console.log( err );
            request.send( err );
        } else {
            console.log('Allt ok!');
        }
    });
});

app.get("/reset", function (request, response) {

});

app.post("/", function (request, response) {
    try {


        let nick1 = request.body.nick_1;
        let color1 = request.body.color_1;

        console.log(request.body);

        if (nick1 === "") {
            console.log("nickname är undefined");
            throw new Error('Nickname saknas!');
        }

        if (color1 === "") {
            console.log("färg är undefined");
            throw new Error('Färg saknas!');
        }

        if (nick1.length < 3) {
            console.log("nickname är för kort");
            throw new Error("Nickname skall vara minst tre tecken långt");
        }
        
        if (color1.length !== 7) {
            console.log("färg är måste ha 7 tecken");
            throw new Error("Färg skall innehålla sju tecken");
        }

        if (color1 === '#000000' || color1 === '#ffffff') {
            console.log("färg får inte vara svart eller vit");
            throw new Error("Ogiltig färg!");
        }

        globalObject.playerOneNick = nick1;
        globalObject.playerOneColor = color1;

        
        if(nick1 === globalObject.playerTwoNick){
                throw new Error('Nickname redan taget!');
        }

        if(color1 === globalObject.playerTwoColor){
            throw new Error('Färg redan tagen!');
        }

        response.cookie('nickName', nick1, {maxAge:1000*60*60*2, signed:true});
        response.cookie('color', color1, {maxAge:1000*60*60*2, signed:true});
        response.redirect('/');

    } 
    catch (oError) {
        response.send(oError.message);
    }

});



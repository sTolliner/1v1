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

    if(request.signedCookies.nickName !== undefined || request.signedCookies.color !== undefined){
        response.sendFile(__dirname + '/static/html/index.html', function(err, data){
            if( err ) {
                console.log( err );
                request.send( err );
            } else {
                console.log('Allt ok!');
            }
        });
    }else{
        response.sendFile(__dirname + '/static/html/loggain.html', function(err) {
            if( err ) {
                console.log( err );
                request.send( err );
            } else {
                console.log('Allt ok!');
            }
        });
    }
});

app.get("/reset", function (request, response) {
    console.log(request.cookies);

    if( request.signedCookies.nickName !== undefined && request.signedCookies.color !== undefined) {

        response.clearCookie('nickName');
        response.clearCookie('color');
        console.log("kakor borta");

        globalObject.playerOneColor = null;
        globalObject.playerOneNick = null;
        console.log(globalObject.playerOneColor);
        console.log(globalObject.playerOneNick);
    } 
    

    response.redirect('/');
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

        if(globalObject.playerOneNick == null) {
            globalObject.playerOneNick = nick1;
            globalObject.playerOneColor = color1;
            console.log(globalObject.playerOneColor);
            console.log(globalObject.playerOneNick);
        }
        else {
            globalObject.playerTwoNick = nick1;
            globalObject.playerTwoColor = color1;
            console.log(globalObject.playerTwoNick);
            console.log(globalObject.playerTwoColor);
        }
        
        
        
        if(globalObject.playerTwoNick === globalObject.playerOneNick){
            console.log("nickname är redan taget");
            throw new Error('Nickname redan taget!');
        }

        if(globalObject.playerTwoColor === globalObject.playerOneColor){
            console.log("färg är redan taget");
            throw new Error('Färg redan tagen!');
        } 

        response.cookie('nickName', nick1, {maxAge:1000*60*60*2, signed:true, httpOnly: true});
        response.cookie('color', color1, {maxAge:1000*60*60*2, signed:true, httpOnly: true});
        response.redirect('/');

    } 
    catch (oError) {
        fs.readFile(__dirname + '/static/html/loggain.html', function(err, data){
            if(err){
                console.log( err );
                response.send( err );
            }else{
                let serverDOM = new jsDOM.JSDOM( data );

                if(request.body.nick_1 !== undefined){
                    serverDOM.window.document.querySelector('#nick_1').setAttribute('value', request.body.nick_1);
                }
                if(request.body.color_1 !== undefined){
                    serverDOM.window.document.querySelector('#color_1').setAttribute('value', request.body.color_1);
                }

                serverDOM.window.document.querySelector('#errorMsg').textContent = oError.message;
                data = serverDOM.serialize();
                response.send(data);
            }
        })
    }

});



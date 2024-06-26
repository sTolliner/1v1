'use strict';

//Filen app.js är den enda ni skall och tillåts skriva kod i.
const globalObject = require("./servermodules/game-modul.js");
const fs = require('fs');
const express = require('express');
let app = express();
const jsDOM = require('jsdom');
const cookieParser = require('cookie-parser');
const http = require('http').createServer(app);
const io = require('socket.io')(http);



//app.listen(3000, function () {
//    console.log(":3");
//});
let server = http.listen(3000, function () {
    console.log(':3');
});
app.use("/public", express.static(__dirname + "/static"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//kollar om det finns kakor, skickar då till index annars loggain
app.get("/", function (request, response) {

    if (request.cookies.nickName !== undefined || request.cookies.color !== undefined) {
        response.sendFile(__dirname + '/static/html/index.html', function (err, data) {
            if (err) {
                console.log(err);
                request.send(err);
            } else {
                console.log('Allt ok!');
            }
        });
    } else {
        response.sendFile(__dirname + '/static/html/loggain.html', function (err) {
            if (err) {
                console.log(err);
                request.send(err);
            } else {
                console.log('Allt ok!');
            }
        });
    }
});

//resettar kakor och attribut i globalobject
app.get("/reset", function (request, response) {
    console.log(request.cookies);

    if (request.cookies.nickName !== undefined && request.cookies.color !== undefined) {

        response.clearCookie('nickName');
        response.clearCookie('color');
        console.log("kakor borta");

        globalObject.playerOneColor = null;
        globalObject.playerOneNick = null;
        globalObject.playerTwoNick = null;
        globalObject.playerTwoColor = null;
        console.log(globalObject.playerOneColor);
        console.log(globalObject.playerOneNick);
    }


    response.redirect('/');
});

//kollar om nickname och color uppfyller krav för att få spela
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

        if (globalObject.playerOneNick == null) {
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



        if (globalObject.playerTwoNick === globalObject.playerOneNick) {
            console.log("nickname är redan taget");
            throw new Error('Nickname redan taget!');
        }

        if (globalObject.playerTwoColor === globalObject.playerOneColor) {
            console.log("färg är redan taget");
            throw new Error('Färg redan tagen!');
        }

        response.cookie('nickName', nick1, { maxAge: 1000 * 60 * 60 * 2, httpOnly: true });
        response.cookie('color', color1, { maxAge: 1000 * 60 * 60 * 2, httpOnly: true });
        response.redirect('/');

    }
    catch (oError) {
        fs.readFile(__dirname + '/static/html/loggain.html', function (err, data) {
            if (err) {
                console.log(err);
                response.send(err);
            } else {
                let serverDOM = new jsDOM.JSDOM(data);

                if (request.body.nick_1 !== undefined) {
                    serverDOM.window.document.querySelector('#nick_1').setAttribute('value', request.body.nick_1);
                }
                if (request.body.color_1 !== undefined) {
                    serverDOM.window.document.querySelector('#color_1').setAttribute('value', request.body.color_1);
                }

                serverDOM.window.document.querySelector('#errorMsg').textContent = oError.message;
                data = serverDOM.serialize();
                response.send(data);
            }
        })
    }

});

//kollar om spelare har anslutit till servern
io.on("connection", (socket) => {
    console.log("connection");

    let cookiestring = socket.handshake.headers.cookie;

    let cookies = globalObject.parseCookies(cookiestring);

    //console.log(cookies);
    //kollar om cookies finns
    if (cookies.nickName != undefined && cookies.color != undefined) {
        console.log(globalObject.playerOneNick, globalObject.playerTwoNick);
        console.log("cookies finns", cookies.nickName, cookies.color);
        if (io.engine.clientsCount == 1) {
            console.log("player 1 connected");
            globalObject.playerOneNick = cookies.nickName;
            globalObject.playerOneColor = cookies.color;
            globalObject.playerOneSocketId = socket.id;

            console.log("socket p1", globalObject.playerOneSocketId);
            console.log("cookies p1", cookies);
        }
        else if (io.engine.clientsCount == 2) {
            console.log("player 2 connected");
            globalObject.playerTwoNick = cookies.nickName;
            globalObject.playerTwoColor = cookies.color;
            globalObject.playerTwoSocketId = socket.id;

            console.log("socket p2", globalObject.playerTwoSocketId);
            console.log("cookies p2", cookies);
            //återställer spelplanen
            globalObject.resetGameArea();
            console.log(io.engine.clientsCount);
            console.log("Båda spelare connected", globalObject.playerOneNick, globalObject.playerTwoNick);
            //startar nytt spel
            io.to(globalObject.playerOneSocketId).emit("newGame", { opponentNick: globalObject.playerTwoNick, opponentColor: globalObject.playerTwoColor, myColor: globalObject.playerOneColor });
            io.to(globalObject.playerTwoSocketId).emit("newGame", { opponentNick: globalObject.playerOneNick, opponentColor: globalObject.playerOneColor, myColor: globalObject.playerTwoColor });

            globalObject.currentPlayer = 1;
            //startar timern och gör så spelare ett börjar
            io.to(globalObject.playerOneSocketId).emit("yourMove", null);
            globalObject.timerId = setInterval(timeout, 5000);

            console.log("yourmove to p1");

            

        }
        else {
            console.log("finns redan 2 spelare");
            socket.disconnect();
        }
    }
    else {
        console.log("cookies finns inte");
        socket.disconnect();
    }
    //vid drag av spelare starta timer och byt spelare
    socket.on("newMove", (data) => {
        console.log("inne i newmove");

        clearInterval(globalObject.timerId);
        globalObject.timerId = setInterval(timeout, 5000);
        

        globalObject.gameArea[data.cellId] = globalObject.currentPlayer;
        
        if (globalObject.currentPlayer == 1) {
            console.log("cuurent player 1");
            globalObject.currentPlayer = 2;
            io.to(globalObject.playerTwoSocketId).emit("yourMove", { "cellId": data.cellId })

        }
        else {
            console.log("current player 2");
            globalObject.currentPlayer = 1;
            io.to(globalObject.playerOneSocketId).emit("yourMove", { "cellId": data.cellId });
            
        }
        //kollar om en vinnare finns och vem det är isåfall
        let answer = globalObject.checkForWinner();
        
        if (answer != 0) {
            if (answer = 1) {
                io.emit("gameover", "Vinnaren är " + globalObject.playerOneNick);
            }
            else if (answer = 2) {
                io.emit("gameover", "Vinnaren är " + globalObject.playerTwoNick);
            }
            else if (answer = 3) {
                io.emit("gameover", "Det blev oavgjort");
            }
        }
        
    });
})
//byter spelare om tiden går ut
function timeout() {
    if(globalObject.currentPlayer == 1) {

        io.to(globalObject.playerOneSocketId).emit("timeout");
        io.to(globalObject.playerTwoSocketId).emit("yourMove", null);
        globalObject.currentPlayer = 2;

    }
    else {

        io.to(globalObject.playerTwoSocketId).emit("timeout");
        io.to(globalObject.playerOneSocketId).emit("yourMove", null);
        globalObject.currentPlayer = 1;

    }
}


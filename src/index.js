import express from 'express'
import http from 'http'
import { Server, Socket } from 'socket.io'
import cors from 'cors'
import router from './router.js'
import * as matchinfo from './matchinfo'
//port
const port = 8080;
const app= express();
const server = http.createServer(app);
const io = new Server(server, {
    allowEIO3: true,
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
})
//middleware
app.use(cors());
app.use(router);

io.on('connection', (socket) => {
    console.log("nuevo socket");
    socket.on("createMatch", (args, callback) => {
        const { roomName, playerName, wordToguess } = JSON.parse(args);
        const { errorMatch, match } = matchinfo.addMatch({ roomName, wordToguess, rounds:2 });
        const { errorUser, user } = matchinfo.addUser({ name: playerName, id: socket.id, rol: 'admin', room: roomName, points: 0, typePlayer: "crafter", });
        if (errorMatch) return callback(
            {
                eventName: "createMatch",
                status: "error",
                data: errorMatch
            }
        );
        if (errorUser) return callback(
            {
                eventName: "createMatch",
                status: "error",
                data: errorUser
            }
        );
        console.log("match created: " + JSON.stringify(match));
        console.log("new admin: " + JSON.stringify(user));
        socket.join(roomName);
        return callback(
            {
                eventName: "createMatch",
                status: "success",
            }
        );

    });
    socket.on("joinMatch", (args, callback) => {
        const { roomName, playerName } = JSON.parse(args);
        const { errorUser, user } = matchinfo.addUser({ name: playerName, id: socket.id, rol: 'player', room: roomName, points: 0, typePlayer: "guesser" });
        if (errorUser) return callback({
            eventName: "joinMatch",
            status: "error",
            data: errorUser
        });
        console.log("new player: " + JSON.stringify(user));
        socket.join(roomName);
        const roomPlayers = matchinfo.giveRoomPlayers(socket.id);
        io.in(roomName).emit("giveRoomPlayers", {
            eventName: "giveRoomPlayers",
            status: "success",
            data:roomPlayers
        });
        return callback( 
            {
                eventName: "joinMatch",
                status: "success",
                data:roomPlayers
            }
        );
    });
    socket.on("startMatch", (args, callback) => {
        const startMatchRes = matchinfo.startMatch(socket.id);
        const roomName = matchinfo.getRoomName(socket.id);
        if(startMatchRes){
            io.in(roomName).emit("matchStarted", {
                eventName: "matchStarted",
                status: "success",
            });
        }
    });
    socket.on("getUserInfo", (args, callback) => {
        const user = matchinfo.getUser(socket.id);
        return callback( 
            {
                eventName: "getUserInfo",
                status: "success",
                data:user.typePlayer,
            }
        );
    });
    socket.on("guessWord", (args, callback) => {
        const { guessWord } = JSON.parse(args);
        const room = matchinfo.getRoomName(socket.id);
        matchinfo.setguessWord(socket.id, guessWord);
        if (matchinfo.allCorrect(socket.id)) {
            matchinfo.discountRound(socket.id);
            if (matchinfo.RoundsLeft(socket.id)) {
                io.in(room).emit("endRound",    {
                    eventName: "RoundEnded",
                    status: "success",
                });
                return io.to(matchinfo.getRandomPlayer(socket.id)).emit('newCrafter',     {
                    eventName: "newCrafter",
                    status: "success",
                });
            }
            io.in(room).emit("endMatch", matchinfo.endMatch(socket.id));
            console.log(`match on room ${room} has ended`)
            return io.socketsLeave(room);
        }
        const guesses = matchinfo.giveGuesses(socket.id);
        io.in(room).emit("giveGuesses", {
                eventName: "giveGuesses",
                status: "success",
                data:guesses,
        });
    });
    socket.on("startNextRound", (args, callback) => {
        const { wordToguess } = JSON.parse(args);
        const room = matchinfo.getRoomName(socket.id);
        matchinfo.startNextRound(socket.id, wordToguess);
        io.in(room).emit("startNextRound",     {
            eventName: "roundStarted",
            status: "success",
        });
    });
    socket.on("draw", (args, callback) => {
        const { dx, dy, color } = JSON.parse(args);
        console.log(dx+" "+dy+" "+color);
        const room = matchinfo.getRoomName(socket.id);
        matchinfo.addDrawPoint(socket.id, dx, dy, color);
        const drawPoints = matchinfo.giveDrawPoints(socket.id)
        io.in(room).emit("giveDrawPoints",{
            eventName: "giveDrawPoints",
            status: "success",
            data:drawPoints,
        });
    });   
    socket.on("clearDraw", (args, callback) => {
        const { dx, dy, color } = JSON.parse(args);
        const room = matchinfo.getRoomName(socket.id);    
        matchinfo.clearDrawPoints(socket.id);
        const drawPoints = matchinfo.giveDrawPoints(socket.id)
        io.in(room).emit("giveDrawPoints",{
            eventName: "giveDrawPoints",
            status: "success",
            data:drawPoints,
        });
    });
    socket.on('disconnect', function () {
        const roomName = matchinfo.getRoomName(socket.id);
        const roomPlayers =  matchinfo.deletePlayer(socket.id);
        console.log(roomPlayers);
        io.in(roomName).emit("giveRoomPlayers", {
            eventName: "giveRoomPlayers",
            status: "success",
            data:roomPlayers
        });
    });
});

server.listen(port, () => {
    console.log(`listening at http://localhost:${port}`)

})


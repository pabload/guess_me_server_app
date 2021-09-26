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
        const { errorMatch, match } = matchinfo.addMatch({ roomName, wordToguess });
        const { errorUser, user } = matchinfo.addUser({ name: playerName, id: socket.id, rol: 'admin', room: roomName, points: 0, typePlayer: "crafter" });
        if (errorMatch) return callback(
            {
                message: "createMatch",
                status: "error",
                error: errorMatch
            }
        );
        if (errorUser) return callback(
            {
                message: "createMatch",
                status: "error",
                error: errorUser
            }
        );
        console.log("match created: " + JSON.stringify(match));
        console.log("new admin: " + JSON.stringify(user));
        socket.join(roomName);
        return callback(
            {
                message: "createMatch",
                status: "success",
            }
        );

    });
    socket.on("joinMatch", (args, callback) => {
        const { roomName, playerName } = JSON.parse(args);
        const { errorUser, user } = matchinfo.addUser({ name: playerName, id: socket.id, rol: 'player', room: roomName, points: 0, typePlayer: "guesser" });
        if (errorUser) return callback({
            message: "joinMatch",
            status: "error",
            error: errorUser
        });
        console.log("new player: " + JSON.stringify(user));
        socket.join(roomName);
        const roomPlayers = matchinfo.giveRoomPlayers(socket.id);
        io.in(roomName).emit("giveRoomPlayers", {
            message: "giveRoomPlayers",
            status: "success",
            roomPlayers
        });
        return callback(
            {
                message: "joinMatch",
                status: "success",
            }
        );
    });
    socket.on("startMatch", (args, callback) => {
        matchinfo.startMatch(socket.id);
    });
    socket.on("guessWord", (args, callback) => {
        const { guessWord } = JSON.parse(args);
        const room = matchinfo.getRoomName(socket.id);
        matchinfo.setguessWord(socket.id, guessWord);
        if (matchinfo.allCorrect(socket.id)) {
            matchinfo.discountRound(socket.id);
            if (matchinfo.RoundsLeft(socket.id)) {
                io.in(room).emit("endRound", 'round ended');
                return io.to(matchinfo.getRandomPlayer(socket.id)).emit('newCrafter', 'you are the crafter');
            }
            io.sockets.in(room).leave(room);
            return io.in(room).emit("endMatch", matchinfo.endMatch(socket.id));

        }
        const guesses = matchinfo.giveGuesses(socket.id);
        io.in(room).emit("giveGuesses", guesses);
    });
    socket.on("startNextRound", (args, callback) => {
        const { wordToguess } = JSON.parse(args);
        const room = matchinfo.getRoomName(socket.id);
        matchinfo.startNextRound(socket.id, wordToguess);
        io.in(room).emit("newRound", 'round started');
    });
    socket.on("draw", (args, callback) => {
        const { dx, dy, color } = JSON.parse(args);
        const room = matchinfo.getRoomName(socket.id);
        matchinfo.addDrawPoint(socket.id, dx, dy, color);
        const drawPoints = matchinfo.giveDrawPoints(socket.id)
        io.in(room).emit("giveDrawPoints", drawPoints);
    });
    socket.on("clearDraw", (args, callback) => {
        const { dx, dy, color } = JSON.parse(args);
        const room = matchinfo.getRoomName(socket.id);
        matchinfo.clearDrawPoints(socket.id);
        const drawPoints = matchinfo.giveDrawPoints(socket.id)
        io.in(room).emit("giveDrawPoints", drawPoints);
    });
});

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)

})


import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import router from './router.js'
import { addMatch, addUser } from './matchinfo.js'
//port
const port = 8080;
const app = express();
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
    //io.emit("test","hola mundo");
    socket.on("createMatch", (args,callback) => {
        const { roomName,playerName} = JSON.parse(args);
        const {errorMatch, match} = addMatch({roomName});
        const {errorUser,user} = addUser({name:playerName,id:socket.id,rol:'admin',room:roomName,points:0});
        if(errorMatch) return callback(errorMatch);
        if(errorUser) return callback(errorUser);
        console.log("match created: " + JSON.stringify(match));
        console.log("new admin: " + JSON.stringify(user));
        socket.join(roomName);
        return callback('success'); 
         
    })
});

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})


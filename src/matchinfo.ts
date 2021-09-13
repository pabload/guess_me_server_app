interface User {
    id: string,
    name: string,
    room: string,
    rol: string,
    points: number,
    correctGuess:boolean
    typePlayer: string
}
interface Match {
    roomName: string,
    wordToguess: string,
    guesses: Array<string>,
    correctGuesses: number;
    started: boolean;
    drawPoints: Array<Point>,
    rounds: number,
}
interface Point {
    dx: number,
    dy: number
    color: string
}
let users: Array<User> = [];
let matches: Array<Match> = [];
////users///////
export const addUser = ({ id, name, room, rol, points, typePlayer }: any) => {
    const match = matches.find((match) => { return match.roomName === room; });
    if (rol === "player" && !match) { return { errorUser: "room doesnt exist" } }
    if (match?.started) { return { errorUser: "the match has already started" } }
    let existingUser;
    users.forEach(user => { if (user.name === name && user.room === room) { existingUser = true; } });
    if (existingUser === true) {
        return { errorUser: "usarname is taken" }
    }

    const user: User = { id, name, room, rol, points, typePlayer,correctGuess:false};
    users.push(user);
    return { user };
}
///matches//////
export const addMatch = ({ roomName, wordToguess, rounds }: any) => {
    let existingMatch = false;
    matches.forEach(
        (match) => {
            if (match.roomName === roomName) {
                existingMatch = true;
            }
        }
    )
    if (existingMatch) {
        return { errorMatch: "room is taken" }
    }
    const match: Match = { roomName, wordToguess, guesses: [], started: false, drawPoints: [], rounds, correctGuesses: 0 };
    console.log('match:' + match.roomName);
    matches.push(match);
    return { match };
}
export const giveRoomPlayers = (socketId: string) => {
    let roomPlayers: Array<User> = [];
    const user: User | undefined = users.find((user) => {
        return user.id === socketId;
    });
    if (user) {
        users.forEach((u) => {
            if (u.room === user.room)
                roomPlayers.push(u);
        });
        console.log(roomPlayers);
        return roomPlayers;
    }
}
export const setWordToGuess = (socketId: string, word: string) => {
    const user: User | undefined = users.find((user) => { return user.id === socketId; });
    if (user) {
        matches = matches.map((match) =>
            match.roomName === user.room ? { ...match, wordToguess: word } : match
        );
    }
}
export const setguessWord = (socketId: string, word: string) => {
    console.log(word);
    const user: User | undefined = users.find((user) => { return user.id === socketId });
    if (user) {
        matches = matches.map((match: Match) => {
            if (match.roomName === user.room) {
                if (word === match.wordToguess) {
                    match.guesses.push(`${user.name} has guessed the word`);
                    addPoint(user.id);
                    if(match.correctGuesses === getNumPlayers(user.room)){
                        nextRound(socketId);
                    }
                }else{
                    match.guesses.push(`${user.name}: ${word}`);
                }
            }
            return match;
        })
    }
}
export const addPoint=(socketId:string)=>{
  users = users.map((user)=>{
      if(user.id==socketId){
          user.points+10;
      }
      return user;
  })
}
export const getNumPlayers = (roomName: string) => {
    let playersInRoom = users.map((user) => {
        return user.room == roomName ? user : null;
    })
    return playersInRoom.length;
}

export const giveGuesses = (socketId: string) => {
    const user: User | undefined = users.find((user) => { return user.id === socketId });
    if (user) {
        const match: Match | undefined = matches.find((match) => match.roomName == user.room);
        return match ? match.guesses : null;
    }
}
export const getRoomName = (socketId: string) => {
    const user = users.find((user) => {
        return user.id === socketId;
    })
    return user ? user.room : null;
}
export const addDrawPoint = (socketId: string, dx: number, dy: number, color: string) => {
    const user: User | undefined = users.find((user) => { return user.id === socketId });
    if (user) {
        matches = matches.map((match: Match) => {
            if (match.roomName === user.room) {
                const point: Point = { dx, dy, color }
                match.drawPoints.push(point)
            }
            return match;
        })
    }
}
export const clearDrawPoints = (socketId: string) => {
    const user: User | undefined = users.find((user) => { return user.id === socketId });
    if (user) {
        matches = matches.map((match: Match) => {
            if (match.roomName === user.room) {
                match.drawPoints = [];
            }
            return match;
        })
    }
}
export const giveDrawPoints = (socketId: string) => {
    const user: User | undefined = users.find((user) => { return user.id === socketId });
    if (user) {
        const match: Match | undefined = matches.find((match) => match.roomName == user.room);
        return match ? match.drawPoints : null;
    }
}
////////pendientes
export const startMatch = (socketId: string) => {
    const user: User | undefined = users.find((user) => { return user.id === socketId });
    if (user) {
        matches = matches.map((match)=>{
            if(user.room=== match.roomName){
                match.started=true;
            }
            return match;
        })
    }
}
export const nextRound = (socketId: string) => {
    const user: User | undefined = users.find((user) => { return user.id === socketId });
    if (user) {
       matches = matches.map((match)=>{
           match.rounds--;
           if(match.rounds===0){
               endMatch()
           }
           return match;
       })
        
    }
}
export const endMatch = () => {

}
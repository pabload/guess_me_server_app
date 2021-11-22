interface User {
    id: string,
    name: string,
    room: string,
    rol: string,
    points: number,
    correctGuess: boolean
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

    const user: User = { id, name, room, rol, points, typePlayer, correctGuess: false };
    users.push(user);
    return { user };
}
export const getUser = (socketId: string) =>{
    const user: User | undefined = users.find((user) => {
        return user.id === socketId;
    });
    return user;
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
                    match.correctGuesses++;
                    match.guesses.push(`${user.name} has guessed the word`);
                    addPoint(user.id);
                } else {
                    match.guesses.push(`${user.name}: ${word}`);
                }
            }
            return match;
        })
    }
}
export const allCorrect = (socketId: string): boolean => {
    const user: User | undefined = users.find((user) => { return user.id === socketId });
    const match: Match | undefined = matches.find((match) => match.roomName == user?.room);
    if (user) {
        if (match?.correctGuesses === getNumPlayers(user.room) - 1) {
            return true;
        }
    }
    return false;
}
export const addPoint = (socketId: string) => {
    users = users.map((user) => {
        if (user.id === socketId) {
            user.points = + 10;
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
export const startMatch = (socketId: string) => {
    try {
        const user: User | undefined = users.find((user) => { return user.id === socketId });
        if (user) {
            matches = matches.map((match) => {
                if (user.room === match.roomName) {
                    match.started = true;
                }
                return match;
            })
        }
        return true;
    } catch (error) {
        console.log(error);
        return false;

    }
}
export const getRandomPlayer = (socketId: string) => {
    const user: User | undefined = users.find((user) => { return user.id === socketId });
    const usersInRoom = users.map((u) => {
        if (u.room == user?.room && u.typePlayer === "guesser") {
            return user;
        }
    })
    users = users.map((u) => {
        if (u.room == user?.room && user.typePlayer == "crafter") {
            u.typePlayer == "guesser";
        }
        return u;
    })
    const randomUser = usersInRoom[Math.floor(Math.random() * usersInRoom.length)];
    if (randomUser) {
        users = users.map((user) => {
            if (user.id == randomUser.id) {
                console.log(`user: ${user.name} new crafter`)
                user.typePlayer = "crafter";
            }
            return user;
        })
        return randomUser.id;
    }
    return "";
}
export const discountRound = (socketId: string) => {
    const user: User | undefined = users.find((user) => { return user.id === socketId });
    if (user) {
        matches = matches.map((match: Match) => {
            if (match.roomName === user.room) {
                match.rounds--;
            }
            return match;
        })
    }
}
export const RoundsLeft = (socketId: string) => {
    const user: User | undefined = users.find((user) => { return user.id === socketId });
    const match: Match | undefined = matches.find((match) => match.roomName == user?.room);
    if (user && match) {
        if (match?.rounds > 0) {
            return true;
        }
    }
    return false;
}
export const startNextRound = (socketId: string, wordToguess: string) => {
    const user: User | undefined = users.find((user) => { return user.id === socketId });
    if (user && user.typePlayer == "crafter") {
        matches = matches.map((match: Match) => {
            if (match.roomName === user.room) {
                match.correctGuesses = 0;
                match.drawPoints = [];
                match.guesses = [];
                match.wordToguess = wordToguess;
            }
            return match;
        })
    } else {
        console.log(user);
        console.log("player is not a crafter")
    }
}
export const endMatch = (socketId: string) => {
    const user: User | undefined = users.find((user) => { return user.id === socketId });
    const usersInRoom = users.map((u) => {
        if (u.room == user?.room) {
            return user;
        }
    })
    if (user) {
        matches = matches.filter(match => match.roomName != user.room);
        users = users.filter(u => u.room != user.room);
        return usersInRoom;
    }
}
export const deletePlayer = (socketId:string) =>{
    let roomPlayers: Array<User> = [];
    const user: User | undefined = users.find((user) => {
        return user.id === socketId;
    });
    if (user) {
        users.forEach((u) => {
            if (u.room === user.room && u.id != socketId)
                roomPlayers.push(u);
        });
        console.log(roomPlayers);
        users = users.filter(u => u.id != socketId);
        return roomPlayers;
    }
}
const users = [];
const matches = [];

////users///////
export const addUser = ({ id, name, room, rol, points }) => {
    let existingUser;
    users.forEach(user => { if (user.name === name && user.room === room) { existingUser = true; } });
    if (existingUser === true) {
        return { errorUser: "usarname is taken" }
    }
    const user = { id, name, room, rol, points };
    users.push(user);
    return { user };
}
///matches//////
export const addMatch = ({ roomName }) => {
    let existingMatch=false;
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
    const match = { roomName };
    console.log('match:' + match.roomName);
    matches.push(match);
    return { match };
}

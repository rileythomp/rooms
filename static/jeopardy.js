function joinJeopardy(username) {
    let joinroom = prompt('Enter a room code to create or join an existing room, or just hit enter to join a random room')
    while (joinroom == null || joinroom.length < 2 || joinroom.length > 20) {
        joinroom = prompt('Enter a room code to create or join an existing room, or just hit enter to join a random room')
    }
    socket.emit('join-jeopardy', username, joinroom, (game) => {
        console.log('joined game')
        console.log(game)
    })
}
function joinGame(socket, username, game) {
    if (game == Jeopardy) {
        joinJeopardy(username)

        return
    }
    game = kebabGame(game)
    let joinroom = prompt('Enter a room code to create or join an existing room, or just hit enter to join a random room')
    if (joinroom == null || joinroom.length < 2 || joinroom.length > 20) {
        socket.emit('join-public', {name: username, game: game})
    } else {
        socket.emit('join-private', {name: username, game: game, code: joinroom})
    }
}

function leaveGame(socket) {
    app.message = ''
    setButtonDisplay('none')
    socket.emit('leave-game')
}

function clearGame(game, gameComponent) {
    if (game == TicTacToe) {
        gameComponent.clearBoard()
    } else if (game == TypingRace) {
        gameComponent.clearGame()
    } else if (game == Wordle) {
        gameComponent.clearGame()
    }
}

function setButtonDisplay(rematch, newgame) {
    if (newgame == null) {
        newgame = rematch
    }
    document.getElementById('rematch').style.display = rematch
    document.getElementById('newgame').style.display = newgame
}

function kebabGame(game) {
    return game.split(' ').map(word => word.toLowerCase()).join('-')
}

function formatGame(game) {
    return game.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}
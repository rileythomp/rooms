function joinGame(socket, username, game) {
    game = kebabGame(game)
    let joinroom = prompt('Enter a room code if you have one, or click cancel to join a random game')
    if (joinroom == null || joinroom == '') {
        socket.emit('join-public', {name: username, game: game})
    } else {
        socket.emit('join-private', {name: username, game: game, code: joinroom})
    }
}

function leaveGame(socket) {
    this.message = ''
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
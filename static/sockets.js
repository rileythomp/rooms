socket.on('join-success', (game) => {
    game = formatGame(game)
    clearGame(game, app.$refs.gameComponent)
    setButtonDisplay('none')
    app.chats = []
    app.message = 'Ready to start'
})

socket.on('join-waiting', (roomcode) => {
    setButtonDisplay('none', 'inline')
    app.message = `Waiting for another player to join <span class='glow'>${roomcode}</span>`
})

socket.on('room-dne', () => {
    setButtonDisplay('none', 'inline')
    app.message = `Sorry you were disconnected, please join a new game`
})

socket.on('room-full', (roomcode) => {
    setButtonDisplay('none', 'inline')
    app.message = `Sorry <span class='glow'>${roomcode}</span> is full`
})

socket.on('peer-disconnect', (res) => {
    let opponent = res.username || 'Opponent'
    game = formatGame(res.game)
    clearGame(game, app.$refs.gameComponent)
    setButtonDisplay('none', 'inline')
    app.message = `<span class='glow'>${opponent}</span> left the game, waiting for another player to join <span class='glow'>${res.roomcode}</span>`
})

socket.on('request-rematch', () => {
    let rematch = confirm('Would you like a rematch?')
    socket.emit('rematch-response', rematch)
})

socket.on('rematch-accepted', (game) => {
    game = formatGame(game)
    clearGame(game, app.$refs.gameComponent);
    setButtonDisplay('none')
    app.message = 'Ready to start'
})

socket.on('rematch-declined', (opponent) => {
    app.message = `<span class='glow'>${opponent}</span> declined a rematch`
})

socket.on('rcv-msg', (res) => {
    app.chats.push({msg: res.msg, sender: res.sender})
    app.$nextTick(() => {
        let messages = document.getElementById('messages');
        document.getElementById('chatbox').style.display = 'block';
        messages.scrollTo(0, messages.scrollHeight);
    })
});

// tic tac toe handlers

socket.on('new-move', (res) => {
    document.querySelectorAll(`#board td`)[res.pos].innerHTML = res.letter;
})

socket.on('not-your-turn', () => {
    app.message = 'It\'s not your turn yet'
})

socket.on('bad-move', () => {
    app.message = 'You can\'t go there'
})

socket.on('game-won', (letter) => {
    app.message = `${letter}'s won!`
    setButtonDisplay('inline')
})

socket.on('tie-game', () => {
    app.message = `Cat's game!`
    setButtonDisplay('inline')
})

// typing race handlers

socket.on('start-race', (words) => {
    app.$refs.gameComponent.startRace(words)
})

socket.on('race-won', (res) => {
    document.getElementById('typing-input').disabled = true;
    let elapsed = res.elapsed-4
    let wpm = Math.round((60/elapsed)*res.numwords)
    app.message = res.won
        ? `You won in ${elapsed.toFixed(2)} seconds (${wpm} WPM)`
        : `Opponent finished first in ${elapsed.toFixed(2)} seconds (${wpm} WPM)`;
    setButtonDisplay('inline')
})

// wordle handlers

socket.on('start-wordle', (word) => {
    app.$refs.gameComponent.startRace(word)
})

socket.on('wordle-won', (res) => {
    window.removeEventListener('keydown', app.$refs.gameComponent.handleKeypress)
    let elapsed = Math.round(res.elapsed)-4
    let mins = Math.floor(elapsed/60)
    let secs = elapsed%60 < 10 ? '0' + elapsed%60 : elapsed%60
    app.message = res.won
        ? `You won with ${app.$refs.gameComponent.guesses.length-1} guesses in ${mins}:${secs}`
        : `Opponent finished first in ${mins}:${secs}, word was ${app.$refs.gameComponent.word}`;
    setButtonDisplay('inline')
})

socket.on('word-valid', (valid, word) => {
    app.message = ''
    if (valid) {
        app.$refs.gameComponent.handleGuess(word);
    } else {
        app.message = 'Guess must be a valid word'
    }
})
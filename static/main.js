const TicTacToe = 'Tic Tac Toe';
const TypingRace = 'Typing Race';
const Wordle = 'Wordle';
const Jeopardy = 'Jeopardy'

let app = new Vue({
    el: '#app',
    data: {
        message: '',
        username: '',
        chats: [],
        curGame: 'tic-tac-toe',
        games: [TicTacToe, TypingRace, Wordle, Jeopardy],
    },
    mounted: function() {
        let saved = localStorage.getItem('username')
        if (saved != null && saved.length > 1 && saved.length < 21) {
            this.username = saved
        } else {
            let username = prompt('Welcome rooms, please enter a username')
            while (username == null || username.length < 2 || username.length > 20) {
                alert('Username must be between 2 and 20 characters')
                username = prompt('Welcome rooms, please enter a username')
            }
            this.username = username
            localStorage.setItem('username', this.username)
        }
        joinGame(socket, this.username, this.curGame)
    },
    computed: {
        getGame: function() {
            return kebabGame(this.curGame)
        }
    },
    methods: {
        toggleMenu: () => {
            let cur =  document.getElementById('menu').style.display
            document.getElementById('menu').style.display = (cur == 'block' ? 'none': 'block');
        },
        changeName: () => {
            let username = prompt('Please enter a username')
            if (username == null || username.length < 2 || username.length > 20) {
                alert('Username must be between 2 and 20 characters')
                return
            }
            this.username = username
            document.getElementById('username').innerHTML = this.username
            localStorage.setItem('username', this.username)
        },
        openChat: () => {
            document.getElementById('chatbox').style.display = 'block';
        },
        closeChat: () => {
            document.getElementById('chatbox').style.display = 'none';
        },
        sendChat: function(ev) {
            ev.preventDefault();
            let chatmsg = document.getElementById('chatmsg');
            if (chatmsg.value) {
                socket.emit('send-msg', {msg: chatmsg.value, sender: this.username});
                chatmsg.value = '';
            }
        },
        requestRematch: function() {
            socket.emit('request-rematch')
			this.message = 'Requested a rematch'
        },
        newGame: function() {
            clearGame(this.curGame, this.$refs.gameComponent)
            leaveGame(socket)
            joinGame(socket, this.username, this.curGame)
        },
        switchGame: function() {
            leaveGame(socket)
            joinGame(socket, this.username, this.curGame)
        }
    }
})

Vue.component('jeopardy', {
    methods: {
    },
    template: ``
})

Vue.component('tic-tac-toe', {
    methods: {
        makeMove: function(ev) {
            let cell = ev.target.closest('td')
            socket.emit('make-move', cell.id)
            app.message = ''
        },
        clearBoard: function() {
            let cells = document.querySelectorAll(`#board td`)
            for (let cell of cells) {
                cell.innerHTML = '';
            }
        }
    },
    template: `
      <table id='board' v-on:click='makeMove'>
        <tr>
            <td id='0'></td>
            <td id='1'></td>
            <td id='2'></td>
        </tr>
        <tr>
            <td id='3'></td>
            <td id='4'></td>
            <td id='5'></td>
        </tr>
        <tr>
            <td id='6'></td>
            <td id='7'></td>
            <td id='8'></td>
        </tr>
    </table>`
})

Vue.component('typing-race', {
    data: function () {
        return {
            words: '',
            typed: '',
            totype: '',
            mistyped: ''
        }
    },
    mounted: function() {
        this.words = ''
        this.totype = this.words
        this.typed = ''
        this.mistyped = ''
        this.$refs.typingInput.value = ''
        this.$refs.typingInput.disabled = true
    },
    methods: {
        updateTypingRace: function(ev) {
            app.message = '';
            let typed = ev.target.value;
            if (typed == this.words.slice(0, typed.length)) {
                this.typed = typed
                this.totype = this.words.slice(typed.length)
                this.mistyped = ''
                if (typed.length == this.words.length) {
                    socket.emit('done-race');
                }
            } else {
                this.mistyped = this.words.slice(this.typed.length, typed.length)
                this.totype = this.words.slice(typed.length)
            }
        },
        // An opponent leaving is still not handled gracefully
        startRace: function(words) {
            this.words = words
            this.totype = words
            let refs = this.$refs          
            setTimeout(function() {
                let time = 3;
                // to gracefully handle player leaving mid countdown
                if (refs.typingInput) {
                    app.message = time
                }
                let countdown = setInterval(function() {
                    time--;
                    if (time < 1) {
                        // to gracefully handle player leaving mid countdown
                        if (refs.typingInput) {
                            app.message = 'Go!'
                            refs.typingInput.disabled = false
                            refs.typingInput.focus()
                        }
                        clearInterval(countdown)
                    } else {
                        // to gracefully handle player leaving mid countdown
                        if (refs.typingInput) {
                            app.message = time
                        }
                    }
                }, 1000);
            }, 1000)
        },
        clearGame: function() {
            this.words = ''
            this.totype = this.words
            this.typed = ''
            this.mistyped = ''
            this.$refs.typingInput.value = ''
            this.$refs.typingInput.disabled = true
        },
    },
    template: `
        <div id='typing-race'>
            <p><span class='glow'>{{ typed }}</span><span class='mistyped'>{{ mistyped }}</span>{{ totype }}</p>
            <input ref='typingInput' id='typing-input' type='text' v-on:input='updateTypingRace'>
        </div>`
})

Vue.component('wordle', {
    data: function () {
        return {
            word: '',
            guesses: ['']
        }
    },
    methods: {
        handleKeypress: function(ev) {
            if (document.activeElement.tagName != "BODY") {
                return
            }
            let key = ev.key.toUpperCase()
            let guess = this.guesses[this.guesses.length-1]
            if (key == 'BACKSPACE' && guess.length > 0 && this.guesses.length < 7) {
                this.guesses[this.guesses.length-1] = guess.slice(0, -1)
                let row = this.guesses.length-1
                let col = this.guesses[this.guesses.length-1].length
                this.$refs.wordle.children[row].children[col].innerHTML = ''
            }
            else if (key == 'ENTER' && guess.length == 5) {
                socket.emit('check-word', guess)
            }
            else if ('A' <= key && key <= 'Z' && key.length == 1 && guess.length < 5 && this.guesses.length < 7) {
                this.guesses[this.guesses.length-1] += key
                let row = this.guesses.length-1
                let col = this.guesses[this.guesses.length-1].length - 1
                this.$refs.wordle.children[row].children[col].innerHTML = key
            }
        },
        handleGuess: function(guess) {
            let correct = 0
            for (let i = 0; i < guess.length; i++) {
                let row = this.guesses.length-1
                let color = 'crimson'
                if (guess[i] == this.word[i]) {
                    color = '#00cc00'
                    correct++
                } else if (this.word.includes(guess[i])) {
                    color = '#ccff15'
                }
                this.$refs.wordle.children[row].children[i].style.color = color
                this.$refs.wordle.children[row].children[i].style.textShadow = `0 0 2px ${color}, 0 0 5px ${color}`
            }
            if (correct == guess.length) {
                socket.emit('done-wordle')
            } else if (this.guesses.length == 6) {
                app.message = `Uh oh, you've run out of guesses. Word was ${this.word}`
                window.removeEventListener('keydown', this.handleKeypress)
            }
            this.guesses.push('')
        },
        startRace: function(word) {
            this.word = word
            let refs = this.$refs  
            let handleKeypress = this.handleKeypress        
            setTimeout(function() {
                let time = 3;
                // to gracefully handle player leaving mid countdown
                if (refs.wordle) {
                    app.message = time
                }
                let countdown = setInterval(function() {
                    time--;
                    if (time < 1) {
                        // to gracefully handle player leaving mid countdown
                        if (refs.wordle) {
                            app.message = 'Go!'
                            window.addEventListener('keydown', handleKeypress)
                        }
                        clearInterval(countdown)
                    } else {
                        // to gracefully handle player leaving mid countdown
                        if (refs.wordle) {
                            app.message = time
                        }
                    }
                }, 1000);
            }, 1000)
        },
        clearGame: function() {
            this.guesses = ['']
            let cells = document.querySelectorAll(`#wordle-board td`)
            for (let cell of cells) {
                cell.innerHTML = '';
                cell.style.color = 'inherit'
                cell.style.textShadow = 'inherit'
            }
            window.removeEventListener('keydown', this.handleKeypress)
        },
    },
    template: `
    <table id='wordle-board' ref='wordle'>
        <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
        <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
        <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
        <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
        <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
        <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
    </table>`
})

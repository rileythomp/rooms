import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

import { Roomcodes } from 'src/model/roomcodes';
import { Words, AvgWordLength } from 'src/model/typingwords';
import { WordleWords, AllowableWords } from 'src/model/wordle';
import { Room } from 'src/model/models';

import { RoomsService } from './rooms/rooms.service';

@WebSocketGateway()
export class AppGateway {
	constructor(private rooms: RoomsService) {}
	
	@WebSocketServer() io: Server;
	private logger: Logger = new Logger('AppGateway');
	private readonly WordCount: number = 30;
	private readonly TypingRace: string = 'typing-race';
	private readonly Wordle: string = 'wordle'

	afterInit() {
		this.logger.log('Initialized web socket server')
	}

	handleDisconnect(socket: Socket) {
		this.leaveRoom(socket)
		this.logger.log(`Client disconnected: ${socket.id}`)
	}

	handleConnection(socket: Socket, ...args: any[]) {
		this.logger.log(`Client connected: ${socket.id}`)

		// room sockets

		socket.on('join-public', (req) => {
			socket.data.username = req.name
			let room = this.rooms.availableRoom(req.game)
			if (room != null) {
				this.joinRoom(room, socket);
			} else {
				this.createRoom(
					socket,
					Roomcodes[Math.floor(Math.random()*Roomcodes.length)],
					false,
					req.game
				)
			}
		});

		socket.on('join-private', (req) => {
			socket.data.username = req.name
			let room = this.rooms.getByCodeAndGame(req.code, req.game)
			if (room == null) {
				this.createRoom(socket, req.code, true, req.game)
			} else if (room.full) {
				socket.emit('room-full', req.code)
			} else {
				this.joinRoom(room, socket)
			}
		});

		socket.on('leave-game', () => {
			this.leaveRoom(socket)
		})

		socket.on('request-rematch', () => {
			let room = this.rooms.getById(socket.id)
			if (room == null) {
				socket.emit('room-dne')
				return
			}
			let userid = (room.user1 == socket.id ? room.user2 : room.user1)
			this.io.to(userid).emit('request-rematch')
		})

		socket.on('rematch-response', (rematch) => {
			let room = this.rooms.getById(socket.id)
			if (room == null) {
				socket.emit('room-dne')
				return
			}
			if (rematch) {
				room.game.turn = room.user1
				if (room.game.name == 'tic-tac-toe') {
					room.game.board = [
						0,0,0,
						0,0,0,
						0,0,0
					]
				}
				this.io.to(room.id).emit('rematch-accepted', room.game.name)
				this.initGame(room)
			} else {
				let userid = (room.user1 == socket.id ? room.user2 : room.user1)
				this.io.to(userid).emit('rematch-declined', socket.data.username)
			}
		})

		// chat socket

		socket.on('send-msg', (req) => {  
			let room = this.rooms.getById(socket.id)
			if (room == null) {
				socket.emit('rcv-msg', req)
				return
			}
			this.io.to(room.id).emit('rcv-msg', req)
		});

		// tic tac toe sockets

		socket.on('make-move', (cell) => {  
			let room = this.rooms.getById(socket.id)
			if (room == null) {
				socket.emit('room-dne')
				return
			} else if (!room.full) {
				socket.emit('join-waiting', room.code)
				return
			}
			if (room.game.turn == socket.id) {
				if (room.game.board[cell] != 0 ) {
					socket.emit('bad-move')
				} else {
					room.game.board[cell] = (socket.id == room.user1 ? 1 : -1)
					let letter = (socket.id == room.user1 ? 'X' : 'O')
					this.io.to(room.id).emit('new-move', {pos: cell, letter: letter} )
					if (socket.id == room.user1) {
						room.game.turn = room.user2
					} else {
						room.game.turn = room.user1
					}
					if (this.hasWinner(room.game.board)) {
						this.io.to(room.id).emit('game-won', letter)
					} else if (room.game.board.reduce((tot, v) => tot + Math.abs(v), 0) == 9) {
						this.io.to(room.id).emit('tie-game')
					}
				}
			} else {
				socket.emit('not-your-turn')
			}
		});

		// typing race socket

		socket.on('done-race', () => {
			let room = this.rooms.getById(socket.id)
			let elapsed = (Date.now() - room.game.start)/1000
			let numwords = room.game.words.length/AvgWordLength
			let peer = socket.id == room.user1 ? room.user2 : room.user1
			this.io.to(peer).emit('race-won', {elapsed: elapsed, numwords: numwords,  won: false})
			socket.emit('race-won', {elapsed: elapsed, numwords: numwords, won: true})
		})

		// wordle socket

		socket.on('check-word', (word) => {
			socket.emit(
				'word-valid',
				AllowableWords.includes(word.toLowerCase()) ||
				WordleWords.includes(word.toLowerCase()),
				word
			)
		})
		
		socket.on('done-wordle', () => {
			let room = this.rooms.getById(socket.id)
			let elapsed = (Date.now() - room.game.start)/1000
			let peer = socket.id == room.user1 ? room.user2 : room.user1
			this.io.to(peer).emit('wordle-won', {elapsed: elapsed, won: false})
			socket.emit('wordle-won', {elapsed: elapsed, won: true})
		})
	}

	createRoom(socket: Socket, code: string, priv: boolean, game: string) {
		let room = this.rooms.create(socket, code, priv, game)
		socket.join(room.id)
		this.io.to(room.id).emit('join-waiting', room.code)
	}

	joinRoom(room: Room, socket: Socket) {
		room = this.rooms.join(room, socket)
		socket.join(room.id)
		this.io.to(room.id).emit('join-success', room.game.name)
		this.initGame(room)
	}

	leaveRoom(socket: Socket) {
		let res = this.rooms.leave(socket)
		if (res == null) {
			return
		}
		socket.leave(res.room.id)
		if (res.peer != null && res.peer.length > 0) {
			this.io.to(res.peer).emit(
				'peer-disconnect',
				{username: socket.data.username, roomcode: res.room.code, game: res.room.game.name}
			)
		}
	}

	initGame(room: Room) {
		if (room.game.name == this.TypingRace) {
			this.initTypingRace(room)
		} else if (room.game.name == this.Wordle) {
			this.initWordle(room)
		}
	}

	initTypingRace(room: Room) {
		room.game.words = Words.sort(() => 0.5 - Math.random()).slice(0, this.WordCount).join(' ')
		room.game.start = Date.now()
		this.io.to(room.id).emit('start-race', room.game.words)
	}

	initWordle(room: Room) {
		room.game.word = WordleWords[Math.floor(Math.random()*WordleWords.length)].toUpperCase()
		room.game.start = Date.now()
		this.io.to(room.id).emit('start-wordle', room.game.word)
	}

	hasWinner(board: number[]): boolean {
		let lines = [
			[0,1,2],
			[3,4,5],
			[6,7,8],
			[0,3,6],
			[1,4,7],
			[2,5,8],
			[0,4,8],
			[2,4,6],
		]
		for (let line of lines) {
			let score = 0;
			for (let val of line) {
				score += board[val];
			}
			if (Math.abs(score) == 3) {
				return true
			}
		}
		return false
	}
}

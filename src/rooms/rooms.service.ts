import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import {v4 as uuid} from 'uuid'

import {Room, Game} from '../model/models'

@Injectable()
export class RoomsService {
    private rooms: Room[] = [
        {
            id: 'defaultroom',
            code: 'defaultcode',
            private: false,
            user1: 0,
            user2 : 1,
            full: true,
            game: {
                name: 'tic-tac-toe',
                board: [
                    0,0,0,
                    0,0,0,
                    0,0,0
                ],
                turn: 0
            }
        }
    ]

    create(socket: Socket, code: string, priv: boolean, game: string): Room {
        let roomGame: Game = {
            name: game,
            turn: 0
        }
        if (game == 'tic-tac-toe') {
            roomGame.board = [
                0,0,0,
                0,0,0,
                0,0,0
            ]
        }
        let room = {
            id: uuid(),
            code: code,
            private: priv,
            user1: socket.id,
            user2 : '',
            full: false,
            game: roomGame
        }
        this.rooms.push(room);
        return room
    }

    availableRoom(game: string): Room {
        for (let room of this.rooms) {
            if (!room.private && !room.full && room.game.name == game) {
                return room
            }
        }
        return null
    }

    join(room: Room, socket: Socket): Room {
        if (room.user1 == null || room.user1 == '') {
            room.user1 = socket.id
        } else if (room.user2 == null || room.user2 == '') {
            room.user2 = socket.id
        }
        let peer = this.getPeer(socket, room)
        room.full = true
        room.game.turn = peer
        return room
    }

	leave(socket: Socket): {room: Room, peer: any} {
		let room = this.getById(socket.id)
		if (room == null) {
			return null
		}
		room.full = false
        room.game.turn = 0
        if (room.game.name == 'tic-tac-toe') {
            room.game.board = [
                0,0,0,
                0,0,0,
                0,0,0
            ]
        }
		let peer = this.getPeer(socket, room)
		if (socket.id == room.user1) {
			room.user1 = ''
		} else if (socket.id == room.user2) {
			room.user2 = ''
		}
		if (peer == null || peer == '') {
			this.rooms = this.rooms.filter(r => r.id != room.id)
		}
        return {room: room, peer: peer}
	}

    getById(id: string): Room {
		for (let room of this.rooms) {
			if (room.user1 == id || room.user2 == id) {
				return room
			}
		}
		return null
	}

    getByCodeAndGame(code: string, game: string): Room {
		for (let room of this.rooms) {
			if (room.code == code && room.game.name == game) {
				return room
			}
		}
		return null
	}

    private getPeer(socket: Socket, room: Room): any {
		return socket.id == room.user1 ? room.user2 : room.user1
	}
}

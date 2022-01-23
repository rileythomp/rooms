import { Injectable } from '@nestjs/common';

import {Game} from './models'

@Injectable()
export class JeopardyService {
    private games: Game[] = [
        {
            id: 'defaultroom',
            code: 'defaultcode',
            players: [{name: 'p1', score: 0}, {name: 'p2', score: 0}, {name: 'p3', score: 0}]
        }
    ]

    createGame(name: string, code: string): Game {
        return this.games[0]
    }

    joinGame(game: Game): Game {
        return game
    }

    getGameByCode(code: string): Game {
		for (let game of this.games) {
			if (game.code == code && game.players.length < 3) {
				return game
			}
		}
		return null
	}
}

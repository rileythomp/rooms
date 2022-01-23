import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Logger } from '@nestjs/common';

import { JeopardyService } from './jeopardy.service';

@WebSocketGateway()
export class JeopardyGateway {
	constructor(private jeopardy: JeopardyService) {}

	@WebSocketServer() io: Server;
	private logger: Logger = new Logger('JeopardyGateway');

	@SubscribeMessage('join-jeopardy')
	joinJeopardy(socket: Socket, name: string, code: string): any {
		socket.data.username = name
		let game = this.jeopardy.getGameByCode(code)
		if (game != null) {
			game = this.jeopardy.joinGame(game);
		} else {
			game = this.jeopardy.createGame(name, code)
		}
		return game
	}

	afterInit() {
		this.logger.log('Initialized web socket server')
	}

	handleDisconnect(socket: Socket) {
		this.logger.log(`Client disconnected: ${socket.id}`)
	}

	handleConnection(socket: Socket, ...args: any[]) {
		this.logger.log(`Client connected: ${socket.id}`)
	}
}

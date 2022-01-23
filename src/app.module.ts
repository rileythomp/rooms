import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { RoomsService } from './rooms/rooms.service';
import { JeopardyGateway } from './jeopardy/jeopardy.gateway';
import { JeopardyService } from './jeopardy/jeopardy.service';

@Module({
  imports: [],
  controllers: [],
  providers: [AppGateway, RoomsService, JeopardyGateway, JeopardyService],
})
export class AppModule {}

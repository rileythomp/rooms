import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { RoomsService } from './rooms/rooms.service';

@Module({
  imports: [],
  controllers: [],
  providers: [AppGateway, RoomsService],
})
export class AppModule {}

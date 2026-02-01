import { Module } from '@nestjs/common';
import { MessagesWsService } from './messages-ws.service';
import { MessagesWsGateway } from './messages-ws.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';

@Module({
  providers: [MessagesWsGateway, MessagesWsService],
  imports: [AuthModule, TypeOrmModule.forFeature([User])], // <--- Importamos AuthModule para tener acceso al JwtService y Passport
  exports: [MessagesWsGateway]
})
export class MessagesWsModule { }

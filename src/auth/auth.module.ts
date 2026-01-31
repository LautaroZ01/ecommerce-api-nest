import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module'; // Importamos UsersModule
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule, // A veces necesario si usas entidades directo, pero mejor usar el UsersModule
    UsersModule, // ¡Importante! Para poder usar UsersService dentro de AuthService
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Configuración asíncrona del JWT (para leer variables de entorno)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '2h',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [TypeOrmModule, JwtModule, PassportModule, AuthService], // Exportamos lo que otros módulos necesiten
})
export class AuthModule { }
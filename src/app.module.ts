import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { MessagesWsModule } from './messages-ws/messages-ws.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', // 👈 Truco Senior
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT!,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.STAGE === 'prod', // Solo activar SSL en producción
      extra: {
        ssl: process.env.STAGE === 'prod'
          ? { rejectUnauthorized: false }
          : null,
      },
      autoLoadEntities: true, // Carga las entidades automáticamente
      synchronize: true, // Solo para desarrollo (crea las tablas por ti)
    }),
    ProductsModule,
    UsersModule,
    AuthModule,
    OrdersModule,
    MessagesWsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

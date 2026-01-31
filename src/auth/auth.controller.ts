import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
    ) { }

    @Post('register')
    register(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Post('login')
    async login(
        @Body() loginUserDto: LoginUserDto,
        @Res({ passthrough: true }) res: Response // Inyectamos Response con passthrough
    ) {
        // 1. Obtenemos el token del servicio (que ya tienes programado)
        const { token } = await this.authService.login(loginUserDto);

        // 2. Configuramos la cookie
        res.cookie('Authentication', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 2, // 2 horas
        });

        // 3. Devolvemos una respuesta limpia (sin el token visible)
        return { message: 'Login successful' };
    }

    @Get('logout') // Puede ser Post también, pero Get es práctico para links directos
    logout(@Res({ passthrough: true }) res: Response) {
        res.cookie('Authentication', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: new Date(0), // expira en el año 1970
        });

        return { message: 'Logout successful' };
    }

    @Get('check-status')
    @UseGuards(AuthGuard()) // <--- Aquí está la magia. Si falla, devuelve 401.
    checkStatus(
        @GetUser() user: User, // <--- Usamos nuestro decorador
        // @GetUser('email') userEmail: string <--- Ejemplo de cómo sacar solo un campo
    ) {
        return {
            user // Devolvemos el usuario decodificado desde el token/DB
        };
    }
}

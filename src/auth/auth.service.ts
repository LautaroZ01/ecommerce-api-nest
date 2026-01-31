import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { LoginUserDto } from './dto/login-user.dto'; // Importa el DTO

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async login(loginUserDto: LoginUserDto) { // Corrige el nombre del tipo
        // 1. Desestructurar para tener las variables disponibles
        const { password, email } = loginUserDto;

        // 2. Buscar usuario (trayendo el password)
        const user = await this.usersService.findOneByEmail(email);

        // 3. Si no existe, error
        if (!user) {
            throw new UnauthorizedException('Credentials are not valid (email)');
        }

        // 4. Verificar password
        // user.password podría ser undefined según TS, pero sabemos que la DB lo trajo.
        if (!bcrypt.compareSync(password, user.password!)) {
            throw new UnauthorizedException('Credentials are not valid (password)');
        }

        // 5. Generar JWT
        // OJO: Nunca metas información sensible en el payload
        const payload = { email: user.email, id: user.id, roles: user.roles };

        return {
            token: this.jwtService.sign(payload),
        };
    }
}
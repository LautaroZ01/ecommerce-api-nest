import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';

export const GetUser = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {

        // 1. Obtenemos la request
        const req = ctx.switchToHttp().getRequest();

        // 2. Obtenemos el usuario (que el AuthGuard inyectó antes)
        const user = req.user;

        // 3. Validación de seguridad interna
        if (!user)
            throw new InternalServerErrorException('User not found in request (AuthGuard called?)');

        // 4. Si pasamos un argumento @GetUser('email'), devolvemos solo ese campo
        return data ? user[data] : user;
    },
);
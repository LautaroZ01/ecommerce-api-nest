import { Reflector } from '@nestjs/core';
import { CanActivate, ExecutionContext, Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { User } from 'src/users/entities/user.entity';
import { META_ROLES } from '../decorators/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {

    constructor(
        private readonly reflector: Reflector // 1. Herramienta para leer metadata
    ) { }

    canActivate(
        ctx: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {

        // 2. Obtener los roles permitidos (metadata) de ese controlador/método
        const validRoles: string[] = this.reflector.get(META_ROLES, ctx.getHandler());

        // 3. Si no hay roles definidos, significa que es público (o solo requiere estar logueado)
        if (!validRoles) return true;
        if (validRoles.length === 0) return true;

        // 4. Obtener el usuario de la Request (el AuthGuard ya debió ponerlo ahí)
        const req = ctx.switchToHttp().getRequest();
        const user = req.user as User;

        if (!user)
            throw new BadRequestException('User not found (AuthGuard called?)');

        // 5. Verificar si el usuario tiene ALGUNO de los roles permitidos
        for (const role of user.roles) {
            if (validRoles.includes(role)) {
                return true; // ¡Pase usted!
            }
        }

        // 6. Si llegamos aquí, no tiene permisos
        throw new ForbiddenException(
            `User ${user.fullname} needs a valid role: [${validRoles}]`
        );
    }
}
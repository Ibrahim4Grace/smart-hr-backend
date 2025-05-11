import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@modules/auth/interfaces/auth.interface';
import { ROLES_KEY } from '@shared/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles are required, allow access
        if (!requiredRoles || requiredRoles.length === 0) return true;

        const { user } = context.switchToHttp().getRequest();

        // Check if user exists and has a role
        if (!user || !user.role) throw new ForbiddenException('User has no role assigned');

        // Check if the user's role is in the required roles list
        const hasRole = requiredRoles.some(role => user.role === role);

        if (!hasRole) throw new ForbiddenException(`Access denied: Required role(s): ${requiredRoles.join(', ')}`);

        return true;
    }
}
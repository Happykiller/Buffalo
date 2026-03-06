import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

function normalizeHost(value: string): string {
    return value.trim().toLowerCase();
}

function isLoopbackHost(hostname: string): boolean {
    const host = normalizeHost(hostname);
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
}

function isLoopbackIp(ip: string): boolean {
    const normalized = normalizeHost(ip);
    return normalized === '127.0.0.1' || normalized === '::1' || normalized === '::ffff:127.0.0.1';
}

function hostFromOrigin(origin: string): string | null {
    try {
        return new URL(origin).hostname;
    } catch {
        return null;
    }
}

function firstForwardedIp(xForwardedFor: string): string | null {
    const first = xForwardedFor.split(',')[0]?.trim();
    return first || null;
}

@Injectable()
export class LocalhostAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const gqlCtx = GqlExecutionContext.create(context);
        const req = gqlCtx.getContext()?.req;
        const originHeader = req?.headers?.origin as string | undefined;
        const xForwardedFor = req?.headers?.['x-forwarded-for'] as string | undefined;
        const clientIp =
            (xForwardedFor ? firstForwardedIp(xForwardedFor) : null) ||
            req?.ip ||
            req?.socket?.remoteAddress ||
            '';

        if (originHeader) {
            const originHost = hostFromOrigin(originHeader);
            if (originHost && isLoopbackHost(originHost)) {
                return true;
            }
        }

        if (clientIp && isLoopbackIp(clientIp)) {
            return true;
        }

        throw new ForbiddenException('Admin access is allowed only from localhost');
    }
}

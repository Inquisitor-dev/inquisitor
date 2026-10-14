import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUser {
  userId: string;
  email: string;
  isAdmin: boolean;
  username: string | null;
  avatar: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext): JwtUser | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtUser | undefined;
    return data && user ? user[data] : user;
  },
);

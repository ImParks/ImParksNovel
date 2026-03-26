import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtPayload } from '../types/context';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const gqlCtx = GqlExecutionContext.create(ctx);
    const { req } = gqlCtx.getContext();
    return req.user;
  },
);

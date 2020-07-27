import {
  Controller,
  UnauthorizedException,
  Post,
  Body,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt.payload';

import { SignUpCredentialsDto } from './dtos/sign-up.dto';
import { SignInCredentialsDto } from './dtos/sign-in.dto';

import { AuthService } from './auth.service';
import { User } from 'src/api/users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  @Post('/sign-up')
  async signUp(
    @Body()
    payload: SignUpCredentialsDto,
  ): Promise<User> {
    return this.authService.signUp(payload);
  }

  @Post('/sign-in')
  async signIn(
    @Body()
    payload: SignInCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const user = await this.authService.validateUserPassword(payload);
    if (!user) {
      throw new UnauthorizedException('invalid Credentials');
    }
    const userPayload: JwtPayload = { user };
    const accessToken = await this.jwtService.sign(userPayload);

    return { accessToken };
  }
}

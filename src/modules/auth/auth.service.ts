import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { throwError } from '../../common/helpers/response.helper';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<Omit<User, 'password'>> {
    try {
      const user = await this.usersService.findByUsername(username);
      if (!user) {
        throwError('Please check your account or password!', 404);
      }

      const isMatch = await bcrypt.compare(pass, user.password);
      if (!isMatch) {
        throwError('Please check your account or password!', 404);
      }

      const { password, ...result } = user;
      return result;
    } catch (error) {
      throwError(error?.message || 'Something went wrong while validating user', error?.status || 500);
    }
  }

  async login(user: UserPayload) {
    try {
      const payload = { username: user.username, sub: user.id };

      const access_token = await this.jwtService.signAsync(payload, { expiresIn: process.env.JWT_EXPIRES_IN });
      const refresh_token = await this.jwtService.signAsync(payload, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

      return { access_token, refresh_token };
    } catch (error) {
      throwError(error?.message || 'Something went wrong while generating token', error?.status || 500);
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(refreshToken);
      const payload = { username: decoded.username, sub: decoded.sub };

      const newAccessToken = await this.jwtService.signAsync(payload, { expiresIn: process.env.JWT_EXPIRES_IN });

      return { access_token: newAccessToken };
    } catch (error) {
      throwError('Invalid or expired refresh token', 401);
    }
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { successResponse } from '../../common/helpers/response.helper';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(
      body.username,
      body.password,
    );
    const exec = this.authService.login(user);
    return successResponse(exec, 'Login succesfully!');
  }
}

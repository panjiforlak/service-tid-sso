import { Controller, Post, Body, HttpCode, Get, Put, UseGuards, Request, Headers } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { successResponse } from '@/common/helpers/response.helper';
import { JwtAuthGuard } from '@/common/guard/jwt-auth.guard';
import {
  ApiAuthTags,
  ApiRegister,
  ApiLogin,
  ApiForgotPassword,
  ApiResetPassword,
  ApiChangePassword,
  ApiUpdateProfile,
  ApiLogout,
} from './auth.swagger';

@ApiAuthTags()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  @ApiRegister()
  async register(@Body() body: RegisterDto) {
    const user = await this.authService.register(body);
    return successResponse(user, 'User registered successfully!');
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({
    default: {
      limit: parseInt(process.env.LOGIN_RATE_LIMIT ?? '2', 10),
      ttl: parseInt(process.env.LOGIN_RATE_TTL ?? '60000', 10),
    },
  })
  @ApiLogin()
  async login(@Body() body: LoginDto, @Headers('x-forwarded-for') ipAddress?: string) {
    try {
      const user = await this.authService.validateUser(body.username, body.password);
      const token = await this.authService.login(user);
      await this.authService.clearFailedLogins(body.username);
      return successResponse(token, 'Login successfully!');
    } catch (error) {
      await this.authService.trackFailedLogin(body.username, ipAddress);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiLogout()
  async logout(@Request() req) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const result = await this.authService.logout(token);
    return successResponse(result, 'Logout successfully!');
  }

  @Post('forgot-password')
  @HttpCode(200)
  @ApiForgotPassword()
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(body);
    return successResponse(result, 'Password reset instructions sent to email!');
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiResetPassword()
  async resetPassword(@Body() body: ResetPasswordDto) {
    const result = await this.authService.resetPassword(body);
    return successResponse(result, 'Password reset successfully!');
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiChangePassword()
  async changePassword(@Request() req, @Body() body: ChangePasswordDto) {
    const userId = req.user.sub;
    const result = await this.authService.changePassword(userId, body);
    return successResponse(result, 'Password changed successfully!');
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiUpdateProfile()
  async getProfile(@Request() req) {
    const userId = req.user.sub;
    const user = await this.authService.getProfile(userId);
    return successResponse(user, 'Profile retrieved successfully!');
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiUpdateProfile()
  async updateProfile(@Request() req, @Body() body: UpdateProfileDto) {
    const userId = req.user.sub;
    const user = await this.authService.updateProfile(userId, body);
    return successResponse(user, 'Profile updated successfully!');
  }

  @Post('refresh')
  @HttpCode(200)
  async refreshToken(@Body() body: { refresh_token: string }) {
    const result = await this.authService.refreshToken(body.refresh_token);
    return successResponse(result, 'Token refreshed successfully!');
  }

  @Get('session-info')
  @UseGuards(JwtAuthGuard)
  async getSessionInfo(@Request() req) {
    const userId = req.user.sub;
    const sessionCount = await this.authService.getActiveSessionCount(userId);
    return successResponse(
      {
        user_id: userId,
        active_sessions: sessionCount,
        message: 'Session info retrieved successfully',
      },
      'Session info retrieved successfully!',
    );
  }

  @Post('cleanup-sessions')
  @UseGuards(JwtAuthGuard)
  async cleanupSessions() {
    await this.authService.cleanupExpiredSessions();
    return successResponse({ message: 'Expired sessions cleaned up' }, 'Sessions cleaned up successfully!');
  }
}

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/modules/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { throwError } from '@/common/helpers/response.helper';
import { User } from '@/modules/users/entities/user.entity';
import { UserSession } from '@/modules/users/entities/user-session.entity';
import { PasswordReset } from '@/modules/users/entities/password-reset.entity';
import { FailedLogin } from '@/modules/users/entities/failed-login.entity';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
    @InjectRepository(PasswordReset)
    private passwordResetRepository: Repository<PasswordReset>,
    @InjectRepository(FailedLogin)
    private failedLoginRepository: Repository<FailedLogin>,
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
      const payload = {
        username: user.username,
        sub: user.id,
        role: user.role,
        permissions: user.permissions,
      };

      const access_token = await this.jwtService.signAsync(payload, { expiresIn: process.env.JWT_EXPIRES_IN });
      const refresh_token = await this.jwtService.signAsync(payload, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

      const existingSession = await this.userSessionRepository.findOne({
        where: {
          user_id: user.id,
          is_active: true,
        },
      });

      if (existingSession) {
        await this.userSessionRepository.update(
          { id: existingSession.id },
          {
            session_token: access_token,
            refresh_token: refresh_token,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            is_active: true,
          },
        );
      } else {
        const session = this.userSessionRepository.create({
          user_id: user.id,
          session_token: access_token,
          refresh_token: refresh_token,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });
        await this.userSessionRepository.save(session);
      }

      return { access_token, refresh_token };
    } catch (error) {
      throwError(error?.message || 'Something went wrong while generating token', error?.status || 500);
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(refreshToken);
      const payload = {
        username: decoded.username,
        sub: decoded.sub,
        role: decoded.role,
        permissions: decoded.permissions,
      };

      const newAccessToken = await this.jwtService.signAsync(payload, { expiresIn: process.env.JWT_EXPIRES_IN });

      return { access_token: newAccessToken };
    } catch (error) {
      throwError('Invalid or expired refresh token', 401);
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      const { full_name, email, username, password, role = 'user' } = registerDto;

      const existingUser = await this.usersService.findByUsername(username);
      if (existingUser) {
        throwError('Username already exists', 400);
      }

      const existingEmail = await this.usersService.findByEmail(email);
      if (existingEmail) {
        throwError('Email already exists', 400);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.usersService.create({
        full_name,
        email,
        username,
        password: hashedPassword,
        role,
        is_active: true,
        email_verified: false,
      });

      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      throwError(error?.message || 'Something went wrong while registering user', error?.status || 500);
    }
  }

  async logout(sessionToken: string) {
    try {
      await this.userSessionRepository.update({ session_token: sessionToken }, { is_active: false });
      return { message: 'Logged out successfully' };
    } catch (error) {
      throwError('Something went wrong while logging out', 500);
    }
  }

  async cleanupExpiredSessions() {
    try {
      await this.userSessionRepository.update(
        {
          expires_at: LessThan(new Date()),
          is_active: true,
        },
        { is_active: false },
      );
    } catch (error) {
      // Failed to cleanup expired sessions
    }
  }

  async getActiveSessionCount(userId: number): Promise<number> {
    try {
      return await this.userSessionRepository.count({
        where: {
          user_id: userId,
          is_active: true,
        },
      });
    } catch (error) {
      return 0;
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      const { email } = forgotPasswordDto;
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        throwError('Email not found', 404);
      }

      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const passwordReset = this.passwordResetRepository.create({
        user_id: user.id,
        reset_token: resetToken,
        expires_at: expiresAt,
      });
      await this.passwordResetRepository.save(passwordReset);

      return {
        message: 'Password reset token sent to email',
        reset_token: resetToken, // Nanti klo udah live gausa dipake.
      };
    } catch (error) {
      throwError(error?.message || 'Something went wrong while processing forgot password', error?.status || 500);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const { reset_token, new_password } = resetPasswordDto;

      const passwordReset = await this.passwordResetRepository.findOne({
        where: {
          reset_token,
          is_used: false,
        },
        relations: ['user'],
      });

      if (!passwordReset) {
        throwError('Invalid or expired reset token', 400);
      }

      if (passwordReset.expires_at < new Date()) {
        throwError('Reset token has expired', 400);
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);

      await this.usersService.updatePassword(passwordReset.user.id, hashedPassword);
      await this.passwordResetRepository.update({ id: passwordReset.id }, { is_used: true });

      return { message: 'Password reset successfully' };
    } catch (error) {
      throwError(error?.message || 'Something went wrong while resetting password', error?.status || 500);
    }
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    try {
      const { current_password, new_password } = changePasswordDto;

      const user = await this.usersService.findById(userId);
      if (!user) {
        throwError('User not found', 404);
      }

      const isMatch = await bcrypt.compare(current_password, user.password);
      if (!isMatch) {
        throwError('Current password is incorrect', 400);
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);
      await this.usersService.updatePassword(userId, hashedPassword);

      return { message: 'Password changed successfully' };
    } catch (error) {
      throwError(error?.message || 'Something went wrong while changing password', error?.status || 500);
    }
  }
  s;
  async getProfile(userId: number) {
    try {
      const user = await this.usersService.findById(userId);
      if (!user) {
        throwError('User not found', 404);
      }

      const { password, ...result } = user;
      return result;
    } catch (error) {
      throwError(error?.message || 'Something went wrong while getting profile', error?.status || 500);
    }
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    try {
      const user = await this.usersService.updateProfile(userId, updateProfileDto);
      const { password, ...result } = user;
      return result;
    } catch (error) {
      throwError(error?.message || 'Something went wrong while updating profile', error?.status || 500);
    }
  }

  async trackFailedLogin(username: string, ipAddress?: string) {
    try {
      const existing = await this.failedLoginRepository.findOne({
        where: { username },
      });

      if (existing) {
        const attemptCount = existing.attempt_count + 1;
        const isLocked = attemptCount >= 5; // Lock after 5 attempts

        await this.failedLoginRepository.update(
          { id: existing.id },
          {
            attempt_count: attemptCount,
            is_locked: isLocked,
            last_attempt: new Date(),
            ip_address: ipAddress,
          },
        );

        if (isLocked) {
          throwError('Account locked due to too many failed attempts', 423);
        }
      } else {
        await this.failedLoginRepository.save({
          username,
          ip_address: ipAddress,
          attempt_count: 1,
        });
      }
    } catch (error) {
      if (error.status === 423) {
        throw error;
      }
    }
  }

  async clearFailedLogins(username: string) {
    try {
      await this.failedLoginRepository.delete({ username });
    } catch (error) {
      // Failed to clear failed logins
    }
  }
}

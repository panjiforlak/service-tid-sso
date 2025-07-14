import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Delete,
  NotFoundException,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import {
  successResponse,
  throwError,
} from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '@/integrations/s3/s3.service';
import { UploadDto } from '@/integrations/s3/dto/upload.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth('jwt')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard) // sample menggunakan token
  @Get()
  async findAll(): Promise<any> {
    const users = await this.usersService.findAll();
    return successResponse(users);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<any> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throwError('User not found', 404);
    }
    return successResponse(user);
  }

  @Post()
  async create(@Body() body: Partial<User>) {
    const result = await this.usersService.create(body);
    return successResponse(result);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    const result = await this.usersService.delete(id);
    if (!result.affected) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted successfully' };
  }
}

@Controller('upload')
export class UploadController {
  constructor(private readonly s3Service: S3Service) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadDto,
  ) {
    const url = await this.s3Service.uploadFile(file, body.folder);
    return { url };
  }
}

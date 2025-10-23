import { Controller, Get, UseGuards } from '@nestjs/common';
import { MenusService } from './menus.service';
import { successResponse, throwError } from '@/common/helpers/response.helper';
import { JwtAuthGuard } from '@/common/guard/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('jwt')
@Controller('menu')
export class MenusController {
  constructor(private readonly menuService: MenusService) {}

  @UseGuards(JwtAuthGuard)
  @Get('sidebar')
  async menuAll(): Promise<any> {
    const menus = await this.menuService.menuAll();
    return successResponse(menus);
  }
}

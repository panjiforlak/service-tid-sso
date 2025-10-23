import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menus } from './entities/menus.entity';
import { RabbitmqService } from '@/integrations/rabbitmq/rabbitmq.service';
import { throwError } from '@/common/helpers/response.helper';
import { generateTrxId } from '@/common/helpers/common.helper';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menus)
    private readonly menuRepository: Repository<Menus>,
  ) {}

  async menuAll(): Promise<any[]> {
    try {
      const modules = await this.menuRepository.find({
        where: { is_active: true },
        order: { id: 'ASC' },
      });

      // Helper: bikin map sub menu berdasarkan parent_id
      const buildMenuTree = (parentId: number | null) => {
        return modules
          .filter((m) => m.parent_id === parentId)
          .map((m) => ({
            id: m.id,
            name: m.module_name,
            cta: m.cta || '',
            icon: m.icon,
            sub_menu: buildMenuTree(m.id),
          }));
      };

      // Grouping logic
      const menuGroup = [
        {
          group: 'MENU',
          menu: buildMenuTree(0).filter((m) => ['Dashboard', 'Entry Data', 'View Data'].includes(m.name)),
        },
        {
          group: 'OPTION',
          menu: buildMenuTree(0).filter((m) => ['Data Master', 'Settings'].includes(m.name)),
        },
      ];

      return menuGroup;
    } catch (error) {
      throwError(error?.message || 'Failed to fetch menu sidebar');
    }
  }
}

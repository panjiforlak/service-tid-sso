import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'm_modules' })
@Unique(['module_slug'])
export class Menus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  module_name: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  module_slug: string;

  @Column({ type: 'int', nullable: true })
  parent_id: number;

  @Column({ type: 'text', nullable: true })
  cta: string;

  @Column({ type: 'text', nullable: true })
  icon: string;

  @Column({ type: 'text', default: 'MENU' })
  group: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}

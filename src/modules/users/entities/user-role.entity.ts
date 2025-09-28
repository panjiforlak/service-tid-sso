import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity('m_user_roles')
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  role_id: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.user_roles)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, (role) => role.user_roles)
  @JoinColumn({ name: 'role_id' })
  role: Role;
}

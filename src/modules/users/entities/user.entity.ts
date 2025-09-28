import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserSession } from './user-session.entity';
import { PasswordReset } from './password-reset.entity';
import { UserRole } from './user-role.entity';

@Entity('m_users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  full_name: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ default: 'user' })
  role: string;

  @Column('json', { nullable: true })
  permissions: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];

  @OneToMany(() => PasswordReset, (reset) => reset.user)
  password_resets: PasswordReset[];

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  user_roles: UserRole[];
}

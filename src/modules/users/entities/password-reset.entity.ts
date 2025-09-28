import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('m_password_resets')
export class PasswordReset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ unique: true })
  reset_token: string;

  @Column()
  expires_at: Date;

  @Column({ default: false })
  is_used: boolean;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.password_resets)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

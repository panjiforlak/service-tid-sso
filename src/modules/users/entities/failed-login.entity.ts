import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('m_failed_logins')
export class FailedLogin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ default: 1 })
  attempt_count: number;

  @CreateDateColumn()
  last_attempt: Date;

  @Column({ default: false })
  is_locked: boolean;
}

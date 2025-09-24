import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('m_users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  full_name: string;

  @Column()
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  is_active: boolean;
}

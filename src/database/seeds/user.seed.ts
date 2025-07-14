import { AppDataSource } from '../data-source';
import { User } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);

  const exist = await userRepository.findOne({ where: { username: 'admin' } });

  if (exist) {
    console.log('👤 Admin user already exists. Skipping...');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = userRepository.create({
    username: 'admin',
    password: hashedPassword,
  });

  await userRepository.save(adminUser);

  console.log('✅ Admin user seeded successfully');
  process.exit();
}

seed().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});

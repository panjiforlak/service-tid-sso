src/
├── app.module.ts
├── common/ <-- helper, interceptor, guard, constants
├── config/ <-- config env dan TypeORM config
│ └── typeorm.config.ts
├── database/ <-- migration & seeder
│ ├── migrations/
│ ├── seeds/
│ └── data-source.ts <-- DataSource utama
├── modules/ <-- fitur modular
│ ├── auth/
│ │ ├── auth.module.ts
│ │ ├── auth.service.ts
│ │ ├── auth.controller.ts
│ │ └── entities/ <-- auth.entity.ts
│ └── users/
│ ├── users.module.ts
│ ├── users.service.ts
│ ├── users.controller.ts
│ └── entities/ <-- user.entity.ts
└── main.ts

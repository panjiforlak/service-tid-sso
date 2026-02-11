# iti-shared

shared/
├── http/
│ ├── interceptors/
│ │ └── trx-id.interceptor.ts
│ ├── filters/
│ │ ├── all-exception.filter.ts
│ │ └── rate-limiter.filter.ts
│ └── index.ts
│
├── database/
│ └── base.repository.ts
│
├── helpers/
│ ├── response.helper.ts
│ ├── trx-id.helper.ts
│ └── string.helper.ts
│
├── index.ts
└── tests/

cd src/common
git submodule add <repo-url> shared

interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  full_name: string;
  role: string;
  permissions: string[];
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

interface UserPayload {
  id: number;
  username: string;
  role: string;
  permissions: string[];
}

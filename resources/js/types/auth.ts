export type User = {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  email_verified_at: string | null;
  two_factor_enabled?: boolean;
  roles: string[];
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
};

export type Auth = {
  user: User;
  unreadNotificationsCount: number;
};

export type AppNotification = {
  id: string;
  data: {
    title: string;
    message: string;
    order_id: number;
    status: string;
  };
  read_at: string | null;
  created_at: string;
};

export type TwoFactorSetupData = {
  svg: string;
  url: string;
};

export type TwoFactorSecretKey = {
  secretKey: string;
};

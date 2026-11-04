export type Env = Record<string, string | undefined>;

export type BackendConfig = {
  db: {
    host: string;
    name: string;
    user: string;
    pass: string;
    charset: string;
  };
  cors: {
    origin: string;
  };
  app: {
    baseUrl: string;
  };
  session: {
    samesite: string;
    secure: boolean;
  };
  mail: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    fromName: string;
    secure: string;
    timeout: number;
  };
};

function boolFromEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

export function loadConfig(env: Env): BackendConfig {
  return {
    db: {
      host: env.DB_HOST ?? 'localhost',
      name: env.DB_NAME ?? '',
      user: env.DB_USER ?? '',
      pass: env.DB_PASS ?? '',
      charset: 'utf8mb4',
    },
    cors: {
      origin: env.APP_ORIGIN ?? '*',
    },
    app: {
      baseUrl: (env.APP_BASE_URL ?? '').replace(/\/+$/, ''),
    },
    session: {
      samesite: env.SESSION_SAMESITE ?? 'Lax',
      secure: boolFromEnv(env.SESSION_SECURE, true),
    },
    mail: {
      host: env.SMTP_HOST ?? 'smtp.titan.email',
      port: Number(env.SMTP_PORT ?? 587),
      user: env.SMTP_USER ?? '',
      pass: env.SMTP_PASS ?? '',
      from: env.SMTP_FROM ?? '',
      fromName: env.SMTP_FROM_NAME ?? 'Amigo Secreto',
      secure: env.SMTP_SECURE ?? 'tls',
      timeout: Number(env.SMTP_TIMEOUT ?? 10),
    },
  };
}

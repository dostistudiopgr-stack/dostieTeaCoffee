const env = import.meta.env;

export const PUBLIC_CONFIG = {
  appEnv: env.VITE_APP_ENV?.trim() || 'local',
} as const;

export function validatePublicConfig(): string[] {
  const warnings: string[] = [];
  warnings.forEach((warning) => console.warn(`[Dosti configuration] ${warning}`));
  return warnings;
}

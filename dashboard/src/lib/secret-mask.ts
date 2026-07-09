export const SECRET_MASK = "********";

export function isSecretConfigKey(key: string): boolean {
  return /token|secret|password|webhook|apiKey/i.test(key);
}

export function isMaskedSecret(value: unknown): boolean {
  return typeof value === "string" && value.trim() === SECRET_MASK;
}

export function maskConfigSecrets(keys: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(keys)) {
    masked[key] = value && isSecretConfigKey(key) ? SECRET_MASK : value;
  }
  return masked;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeAuthEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function getAuthEmailError(email: string) {
  if (!email) return "Email is required.";
  if (email.length > 254 || !emailPattern.test(email)) return "Email is not valid.";
  return null;
}

export function getPasswordError(password: string, label = "Password") {
  if (!password) return `${label} is required.`;
  if (password.length < 6) return `${label} must be at least 6 characters.`;
  if (password.length > 128) return `${label} is too long.`;
  return null;
}

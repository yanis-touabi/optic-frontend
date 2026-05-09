import { z } from "zod";

export interface PasswordCriterion {
  key: string;
  label: string;
  test: (pwd: string) => boolean;
}

export const passwordCriteria: PasswordCriterion[] = [
  { key: "len", label: "Au moins 8 caractères", test: (p) => p.length >= 8 },
  { key: "upper", label: "Au moins une majuscule (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { key: "lower", label: "Au moins une minuscule (a-z)", test: (p) => /[a-z]/.test(p) },
  { key: "digit", label: "Au moins un chiffre (0-9)", test: (p) => /\d/.test(p) },
  { key: "special", label: "Au moins un caractère spécial (!@#$…)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function evaluatePassword(pwd: string) {
  return passwordCriteria.map((c) => ({ ...c, ok: c.test(pwd) }));
}

export function isPasswordValid(pwd: string) {
  return passwordCriteria.every((c) => c.test(pwd));
}

export const strongPasswordSchema = z
  .string()
  .max(72, "Maximum 72 caractères")
  .refine(isPasswordValid, "Le mot de passe ne respecte pas la politique de sécurité");

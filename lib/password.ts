import "server-only";
import bcrypt from "bcryptjs";

const BCRYPT_COST = 10;

// Constant-time timing protection: kullanıcı yokken bile gerçek bir bcrypt
// karşılaştırması yapmak için sabit bir dummy hash tutuluyor. Login route'u
// kullanıcıyı bulamadığında bu hash'e compare çalıştırır ve sonucu atar.
// Üretildiği parola gerçek değildir.
export const DUMMY_PASSWORD_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8gQiL5j9k8oWlEhqgBhEjQbgz7s9Z2";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

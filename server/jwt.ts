import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.SESSION_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required for JWT token signing");
}
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export interface AccessTokenPayload {
  userId: number;
  roles: string[];
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getRefreshTokenExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  return d;
}

// Stateless password-reset tokens: no DB table needed. The token embeds a
// fragment of the current password hash, so resetting the password (or an
// admin changing it) invalidates any outstanding link automatically.
function passwordFingerprint(passwordHash: string): string {
  return crypto.createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

export function generatePasswordResetToken(userId: number, passwordHash: string): string {
  return jwt.sign({ userId, purpose: "password-reset", pwd: passwordFingerprint(passwordHash) }, JWT_SECRET, { expiresIn: "30m" });
}

// Verifies signature + expiry and returns the payload; the caller must fetch
// the user and confirm the fingerprint still matches via matchesPasswordFingerprint.
export function decodePasswordResetToken(token: string): { userId: number; pwd: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.purpose !== "password-reset" || typeof decoded.userId !== "number") return null;
    return { userId: decoded.userId, pwd: decoded.pwd };
  } catch {
    return null;
  }
}

export function matchesPasswordFingerprint(pwd: string, passwordHash: string): boolean {
  return pwd === passwordFingerprint(passwordHash);
}

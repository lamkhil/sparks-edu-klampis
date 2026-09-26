import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { appSecret } from "./env";

// Cookie bertanda tangan yang membuktikan pengisi sudah memasukkan kode + email yang cocok.
const COOKIE = "cek_access";
const MAX_AGE = 60 * 60; // 1 jam

const secret = appSecret;

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function grantAccess(code: string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${code}.${exp}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function hasAccess(code: string) {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const parts = raw.split(".");
  if (parts.length !== 3) return false;
  const [c, exp, sig] = parts;
  if (c !== code || Number(exp) < Date.now() / 1000) return false;
  const expected = Buffer.from(sign(`${c}.${exp}`));
  const got = Buffer.from(sig);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

/** Token link pribadi untuk membuka isian pendaftar langsung (tanpa mengetik No. HP). */
export function viewToken(code: string) {
  return sign(`view:${code}`).slice(0, 22);
}

export function verifyViewToken(code: string, token: string | null) {
  if (!token) return false;
  const expected = Buffer.from(viewToken(code));
  const got = Buffer.from(token);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

import { redirect } from "next/navigation";
import { grantAccess, verifyViewToken } from "@/lib/access";
import { normalizeCode } from "@/lib/data";

/** Link pribadi dari pesan/pengingat: buka isian pendaftar langsung jika token cocok. */
export async function GET(req: Request, ctx: RouteContext<"/r/[code]">) {
  const code = normalizeCode(decodeURIComponent((await ctx.params).code));
  const token = new URL(req.url).searchParams.get("t");
  if (!verifyViewToken(code, token)) redirect(`/cek?kode=${encodeURIComponent(code)}`);
  await grantAccess(code);
  redirect(`/cek/${encodeURIComponent(code)}`);
}

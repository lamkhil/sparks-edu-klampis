"use client";

import { useActionState } from "react";
import { Alert, Button, Input, Label } from "@/components/kit";
import { lookup, type LookupState } from "./actions";

export function LookupForm({ defaultKode }: { defaultKode?: string }) {
  const [state, action, pending] = useActionState<LookupState, FormData>(lookup, null);
  return (
    <form action={action} className="space-y-4">
      {state?.message && <Alert>{state.message}</Alert>}
      <div>
        <Label htmlFor="kode" required>
          Kode submission
        </Label>
        <Input id="kode" name="kode" required placeholder="SK-XXXXXX" defaultValue={state?.kode ?? defaultKode} className="font-mono uppercase" />
      </div>
      <div>
        <Label htmlFor="contact" required>
          Email atau No. HP
        </Label>
        <Input id="contact" name="contact" required defaultValue={state?.contact} placeholder="08xxxxxxxxxx atau email" autoComplete="email" />
        <p className="mt-1 text-xs text-muted-foreground">Gunakan yang kamu isi saat mendaftar.</p>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Mencari…" : "Cek isian"}
      </Button>
    </form>
  );
}

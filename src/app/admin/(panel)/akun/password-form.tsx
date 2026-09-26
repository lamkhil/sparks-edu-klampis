"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword, type PwState } from "./actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PwState, FormData>(changePassword, null);
  return (
    <Card className="max-w-lg">
      <form action={action}>
        <CardHeader>
          <CardTitle>Ganti password</CardTitle>
          <CardDescription>Minimal 10 karakter.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password baru</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Ulangi password baru</Label>
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={10} />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.ok && <p className="text-sm text-brand-700">✓ {state.ok}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

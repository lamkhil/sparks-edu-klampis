"use client";

import { useActionState } from "react";
import { Alert, Button, Input, Label } from "@/components/kit";
import { login } from "../actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="username" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Masuk…" : "Masuk"}
      </Button>
    </form>
  );
}

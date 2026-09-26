"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/kit";

export function ConfirmButton({ children, message, variant = "danger" }: { children: React.ReactNode; message: string; variant?: "danger" | "secondary" }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}

import { Card } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata = { title: "Login admin" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center px-4">
      <Card className="w-full">
        <h1 className="mb-6 text-xl font-bold">Login admin</h1>
        <LoginForm />
      </Card>
    </main>
  );
}

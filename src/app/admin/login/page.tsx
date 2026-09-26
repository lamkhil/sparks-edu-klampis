import { Logo, ShootingStar, Sparkle } from "@/components/brand";
import { Card } from "@/components/kit";
import { getSite } from "@/lib/site-data";
import { LoginForm } from "./login-form";

export const metadata = { title: "Login admin" };

export default async function LoginPage() {
  const site = await getSite();
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-sun-200/60 blur-3xl" aria-hidden />
      <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl" aria-hidden />
      <div className="relative w-full max-w-sm">
        <ShootingStar className="absolute -right-6 -top-10 h-20 w-20 animate-twinkle" />
        <Sparkle className="absolute -left-4 top-24 h-5 w-5 text-leaf-500" />
        <Card className="rounded-leaf">
          <Logo className="mb-2" src={site.logo_url} alt={site.brand} />
          <h1 className="mb-6 text-sm font-semibold text-muted-foreground">Panel admin {site.event_name}</h1>
          <LoginForm />
        </Card>
      </div>
    </main>
  );
}

import { AppSidebar } from "@/components/admin/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar email={user.email ?? ""} />
        <SidebarInset className="bg-background">{children}</SidebarInset>
      </SidebarProvider>
      <Toaster theme="light" richColors position="top-right" />
    </TooltipProvider>
  );
}

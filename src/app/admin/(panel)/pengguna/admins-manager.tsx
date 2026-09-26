"use client";

import { Copy, KeyRound, MoreHorizontal, Trash2, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtDate } from "@/lib/format";
import { addAdmin, removeAdmin, resetAdminPassword, type AdminRow } from "./actions";

type Reveal = { email: string; password: string; emailed?: boolean; emailError?: string };

export function AdminsManager({ admins, meId }: { admins: AdminRow[]; meId: string }) {
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "remove" | "reset"; admin: AdminRow } | null>(null);
  const [pending, start] = useTransition();

  const onAdd = () =>
    start(async () => {
      const r = await addAdmin({ email, sendEmail });
      if (!r.ok) return void toast.error(r.error);
      setAdding(false);
      setEmail("");
      if (r.password) setReveal({ email: email.trim().toLowerCase(), password: r.password, emailed: r.emailed, emailError: r.emailError });
      else toast.success("Akun sudah ada, sekarang menjadi admin. Password tetap yang lama.");
    });

  const onConfirm = () =>
    start(async () => {
      if (!confirm) return;
      const { kind, admin } = confirm;
      const r = kind === "remove" ? await removeAdmin(admin.id) : await resetAdminPassword(admin.id, true);
      setConfirm(null);
      if (!r.ok) return void toast.error(r.error);
      if (kind === "remove") toast.success(`${admin.email} dihapus dari admin`);
      else if (r.password) setReveal({ email: admin.email, password: r.password, emailed: r.emailed, emailError: r.emailError });
    });

  return (
    <>
      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex items-center justify-between gap-3 border-b p-4">
          <p className="text-sm text-muted-foreground">{admins.length} admin</p>
          <Button onClick={() => setAdding(true)}>
            <UserPlus /> Tambah admin
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-4">Admin</TableHead>
              <TableHead className="hidden md:table-cell">Ditambahkan</TableHead>
              <TableHead className="hidden md:table-cell">Login terakhir</TableHead>
              <TableHead className="w-12 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-sun-100 text-xs font-bold text-sun-700">{a.email.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{a.email}</span>
                    {a.id === meId && <Badge variant="secondary">Kamu</Badge>}
                  </div>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{fmtDate(a.createdAt)}</TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{a.lastSignIn ? fmtDate(a.lastSignIn) : "Belum pernah"}</TableCell>
                <TableCell className="pr-4 text-right">
                  {a.id !== meId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="Aksi">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onSelect={() => setConfirm({ kind: "reset", admin: a })}>
                          <KeyRound /> Reset password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setConfirm({ kind: "remove", admin: a })}>
                          <Trash2 /> Hapus admin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah admin</DialogTitle>
            <DialogDescription>Akun login dibuat otomatis dengan password sementara. Admin baru bisa menggantinya setelah login.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onAdd();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="new-admin-email">Email</Label>
              <Input id="new-admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@contoh.com" autoFocus />
            </div>
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>
                <span className="block font-medium">Kirim info login via email</span>
                <span className="block text-xs text-muted-foreground">Memakai SMTP di Pengaturan.</span>
              </span>
              <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdding(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={pending || !email}>
                {pending ? "Menambahkan…" : "Tambah admin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={reveal !== null} onOpenChange={(o) => !o && setReveal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Password sementara</DialogTitle>
            <DialogDescription>Password ini hanya ditampilkan sekali. Simpan atau bagikan ke {reveal?.email}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-xl bg-sun-50 p-4 ring-1 ring-sun-200">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium">{reveal?.email}</p>
            <p className="pt-2 text-xs text-muted-foreground">Password</p>
            <div className="flex items-center justify-between gap-2">
              <code className="text-lg font-bold tracking-wider">{reveal?.password}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`Email: ${reveal?.email}\nPassword: ${reveal?.password}\nLogin: ${window.location.origin}/admin/login`);
                  toast.success("Disalin");
                }}
              >
                <Copy /> Salin
              </Button>
            </div>
          </div>
          {reveal?.emailed && <p className="text-sm text-brand-700">✓ Info login juga sudah dikirim ke email.</p>}
          {reveal?.emailError && <p className="text-sm text-destructive">Email gagal dikirim: {reveal.emailError}</p>}
          <DialogFooter>
            <Button onClick={() => setReveal(null)}>Selesai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.kind === "remove" ? `Hapus ${confirm.admin.email}?` : `Reset password ${confirm?.admin.email}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "remove"
                ? "Akun ini tidak bisa login lagi ke panel admin. Akun loginnya juga dihapus."
                : "Password lama tidak berlaku lagi. Password baru akan ditampilkan dan dikirim ke email admin tersebut."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant={confirm?.kind === "remove" ? "destructive" : "default"}
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
            >
              {confirm?.kind === "remove" ? "Hapus admin" : "Reset password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Dirender ulang tiap navigasi admin: transisi masuk yang halus. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-svh flex-1 flex-col animate-page-enter">{children}</div>;
}

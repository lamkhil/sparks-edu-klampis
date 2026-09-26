/** Dirender ulang tiap navigasi: memberi transisi masuk yang halus. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-enter">{children}</div>;
}

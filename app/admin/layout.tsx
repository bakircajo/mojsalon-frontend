import { AuthProvider } from "@/components/AuthProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

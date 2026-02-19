import { AuthButton } from "@/components/auth-button";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        {/* Header */}
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Bookmark className="h-5 w-5 text-primary" />
              Markly
            </Link>
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 w-full max-w-5xl p-5 py-8">{children}</div>

        {/* Footer */}
        <footer className="w-full flex items-center justify-center border-t text-center text-xs gap-8 py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bookmark className="h-3.5 w-3.5" />
            <span>Markly &copy;</span>
          </div>
        </footer>
      </div>
    </main>
  );
}

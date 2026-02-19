import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Bookmark, Zap, RefreshCw, Search } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import { Suspense } from "react";

const features = [
  {
    icon: Zap,
    title: "Instant Save",
    description: "Add bookmarks in seconds with a simple URL paste.",
  },
  {
    icon: RefreshCw,
    title: "Real-time Sync",
    description: "Your bookmarks stay in sync across all your devices.",
  },
  {
    icon: Search,
    title: "Organize & Search",
    description: "Find any bookmark instantly with fast full-text search.",
  },
];

export default function Home() {
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

        {/* Hero */}
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5 py-16">
          <Hero />

          {/* Features */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <f.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>{f.title}</CardTitle>
                  <CardDescription>{f.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </section>
        </div>

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

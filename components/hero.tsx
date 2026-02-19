import Link from "next/link";
import { Bookmark, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const mockBookmarks = [
  { title: "React Documentation", url: "react.dev" },
  { title: "Tailwind CSS", url: "tailwindcss.com" },
  { title: "Supabase Docs", url: "supabase.com/docs" },
];

export function Hero() {
  return (
    <div className="flex flex-col gap-12 items-center">
      <div className="flex flex-col gap-6 items-center text-center max-w-2xl">
        <div className="flex items-center gap-2 text-primary">
          <Bookmark className="h-8 w-8" />
          <span className="text-2xl font-bold">Markly</span>
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold !leading-tight">
          Save, organize, and access your bookmarks anywhere
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg">
          A fast, minimal bookmark manager that keeps your links organized and
          always within reach.
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link href="/auth/login">Get Started</Link>
        </Button>
      </div>

      {/* Mock dashboard preview */}
      <div className="w-full max-w-xl rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            My Bookmarks
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {mockBookmarks.map((b) => (
            <Card key={b.url}>
              <CardHeader className="flex flex-row items-center justify-between p-3 space-y-0">
                <div className="min-w-0">
                  <CardTitle className="text-sm">{b.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {b.url}
                  </CardDescription>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

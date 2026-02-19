import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookmarkSection } from "@/components/bookmark-section";

async function BookmarkLoader() {
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }

  const userId = authData.claims.sub as string;

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return <BookmarkSection initialBookmarks={bookmarks ?? []} userId={userId} />;
}

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div>
        <h1 className="font-bold text-3xl mb-2">My Bookmarks</h1>
        <p className="text-muted-foreground text-sm">
          Save and organize your favorite links.
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm">
            Loading bookmarks...
          </p>
        }
      >
        <BookmarkLoader />
      </Suspense>
    </div>
  );
}

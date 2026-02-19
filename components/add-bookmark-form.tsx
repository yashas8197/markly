"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Bookmark } from "@/components/bookmark-section";

export function AddBookmarkForm({
  onBookmarkAdded,
}: {
  onBookmarkAdded: (bookmark: Bookmark) => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !url.trim()) {
      setError("Both title and URL are required.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("bookmarks")
      .insert({
        user_id: user.id,
        url: url.trim(),
        title: title.trim(),
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    onBookmarkAdded(data as Bookmark);
    setUrl("");
    setTitle("");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex flex-col gap-1.5">
          <Label htmlFor="bookmark-title">Title</Label>
          <Input
            id="bookmark-title"
            type="text"
            placeholder="My favorite site"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <Label htmlFor="bookmark-url">URL</Label>
          <Input
            id="bookmark-url"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Bookmark"}
          </Button>
        </div>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </form>
  );
}

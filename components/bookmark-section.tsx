"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { AddBookmarkForm } from "@/components/add-bookmark-form";
import { BookmarkList } from "@/components/bookmark-list";

export interface Bookmark {
  id: string;
  url: string;
  title: string | null;
  created_at: string;
}

export function BookmarkSection({
  initialBookmarks,
  userId,
}: {
  initialBookmarks: Bookmark[];
  userId: string;
}) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);

  const handleBookmarkAdded = useCallback((bookmark: Bookmark) => {
    setBookmarks((prev) => [bookmark, ...prev]);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      setBookmarks((prev) => prev.filter((b) => b.id !== id));

      const supabase = createClient();
      supabase
        .from("bookmarks")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .then(({ error }) => {
          if (error) {
            console.error("Failed to delete bookmark:", error.message);
            supabase
              .from("bookmarks")
              .select("*")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .then(({ data }) => {
                if (data) setBookmarks(data);
              });
          }
        });
    },
    [userId],
  );

  useEffect(() => {
    console.log("[Realtime] Setting up subscription for userId:", userId);
    const supabase = createClient();

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("[Realtime] Auth session error:", error.message);
      } else {
        console.log("[Realtime] Auth session exists:", !!data.session);
        console.log("[Realtime] Auth user ID:", data.session?.user?.id);
        console.log(
          "[Realtime] Token expires at:",
          data.session?.expires_at
            ? new Date(data.session.expires_at * 1000).toISOString()
            : "N/A",
        );
      }
    });

    const channel = supabase
      .channel(`bookmarks:user:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[Realtime] Payload received:", payload);
          console.log("[Realtime] Event type:", payload.eventType);
          console.log("[Realtime] New:", JSON.stringify(payload.new));
          console.log("[Realtime] Old:", JSON.stringify(payload.old));
          console.log("[Realtime] Errors:", payload.errors);

          if (payload.eventType === "INSERT") {
            const incoming = payload.new as Bookmark;
            console.log("[Realtime] INSERT — incoming bookmark id:", incoming.id);
            setBookmarks((prev) => {
              const isDuplicate = prev.some((b) => b.id === incoming.id);
              console.log("[Realtime] INSERT — isDuplicate:", isDuplicate);
              if (isDuplicate) return prev;
              return [incoming, ...prev];
            });
          }

          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            console.log("[Realtime] DELETE — bookmark id:", deletedId);
            setBookmarks((prev) => prev.filter((b) => b.id !== deletedId));
          }
        },
      )
      .subscribe((status, err) => {
        console.log("[Realtime] Subscription status:", status);
        if (err) console.error("[Realtime] Subscription error:", err);
      });

    channel.on("system", {}, (payload) => {
      console.log("[Realtime] System event:", payload);
    });

    // DEBUG: unfiltered channel to compare — does INSERT arrive without filter?
    const debugChannel = supabase
      .channel("debug-bookmarks-unfiltered")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookmarks",
        },
        (payload) => {
          console.log("[DEBUG-UNFILTERED] INSERT received:", payload);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "bookmarks",
        },
        (payload) => {
          console.log("[DEBUG-UNFILTERED] DELETE received:", payload);
        },
      )
      .subscribe((status, err) => {
        console.log("[DEBUG-UNFILTERED] Subscription status:", status);
        if (err) console.error("[DEBUG-UNFILTERED] Subscription error:", err);
      });

    return () => {
      console.log("[Realtime] Cleaning up channels");
      supabase.removeChannel(channel);
      supabase.removeChannel(debugChannel);
    };
  }, [userId]);

  return (
    <>
      <AddBookmarkForm onBookmarkAdded={handleBookmarkAdded} />
      <BookmarkList bookmarks={bookmarks} onDelete={handleDelete} />
    </>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Bookmark as BookmarkIcon, ExternalLink, Trash2 } from "lucide-react";

type BookmarkItem = {
  id: string;
  title: string | null;
  url: string;
};

export function BookmarkList({
  bookmarks,
  onDelete,
}: {
  bookmarks: BookmarkItem[];
  onDelete: (id: string) => void;
}) {
  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <BookmarkIcon className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground text-sm">
          No bookmarks yet. Add your first one above!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {bookmarks.map((bookmark) => (
        <Card key={bookmark.id}>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 p-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">
                {bookmark.title || bookmark.url}
              </CardTitle>
              {bookmark.title && (
                <CardDescription className="truncate">
                  {bookmark.url}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(bookmark.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function CategoriesManager() {
  const { user } = useUser();
  const categories = useQuery(api.categories.listCategories, user?.id ? { clerkId: user.id } : "skip");
  const createCategory = useMutation(api.categories.createCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);
  const relabel = useMutation(api.subscriptions.relabelCategory);

  const [newName, setNewName] = useState("");
  const [renameFrom, setRenameFrom] = useState<string>("");
  const [renameTo, setRenameTo] = useState<string>("");

  if (!user?.id) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans">Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="font-sans"
          />
          <Button
            className="font-sans"
            onClick={async () => {
              const name = newName.trim();
              if (!name) return;
              await createCategory({ clerkId: user.id!, name });
              setNewName("");
            }}
          >
            Add
          </Button>
        </div>

        <Separator />

        <div className="grid gap-3">
          {categories?.length ? (
            categories.map((c) => (
              <div key={c._id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-sans">{c.name}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-sans"
                    onClick={async () => {
                      setRenameFrom(c.name);
                      setRenameTo(c.name);
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="font-sans"
                    onClick={async () => {
                      await relabel({ clerkId: user.id!, from: c.name, to: undefined });
                      await deleteCategory({ clerkId: user.id!, categoryId: c._id });
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground text-sm font-sans">No categories yet.</div>
          )}
        </div>

        {renameFrom && (
          <div className="flex items-center gap-2">
            <Input
              value={renameTo}
              onChange={(e) => setRenameTo(e.target.value)}
              className="font-sans"
            />
            <Button
              className="font-sans"
              onClick={async () => {
                const to = renameTo.trim();
                if (!to) return;
                await relabel({ clerkId: user.id!, from: renameFrom, to });
                // optionally update category record label
                const cat = categories?.find((x) => x.name === renameFrom);
                if (cat) await updateCategory({ clerkId: user.id!, categoryId: cat._id, name: to });
                setRenameFrom("");
                setRenameTo("");
              }}
            >
              Save rename
            </Button>
            <Button variant="ghost" className="font-sans" onClick={() => { setRenameFrom(""); setRenameTo(""); }}>Cancel</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



"use client";

import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Tag } from "lucide-react";

interface CategorySelectorProps {
  value?: string;
  onChange: (value?: string) => void;
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const { user } = useUser();
  const categories = useQuery(api.categories.listCategories, user?.id ? { clerkId: user.id } : "skip");
  const createCategory = useMutation(api.categories.createCategory);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!categories) return [];
    if (!query) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  }, [categories, query]);

  const handleCreate = async () => {
    if (!user?.id) return;
    const name = query.trim();
    if (!name) return;
    await createCategory({ clerkId: user.id, name });
    // Use the name directly on subscriptions; categories table is for management/filters/colors later
    onChange(name);
    setQuery("");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-start w-full font-sans" type="button">
          <Tag className="mr-2 h-4 w-4" />
          {value || "Select category"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <div className="p-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or create..."
            className="h-8 font-sans"
          />
        </div>
        <DropdownMenuSeparator />
        {filtered && filtered.length > 0 ? (
          filtered.map((c) => (
            <DropdownMenuItem key={c._id} className="font-sans" onClick={() => onChange(c.name)}>
              {c.name}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuLabel className="text-xs text-muted-foreground font-sans">No matches. Type to create.</DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="font-sans" onClick={handleCreate} disabled={!query.trim()}>
          <Plus className="mr-2 h-4 w-4" />
          Create &ldquo;{query || ""}&rdquo;
        </DropdownMenuItem>
        {value && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="font-sans" onClick={() => onChange(undefined)}>
              Clear
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/candidate/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useT } from "@/components/locale-provider";

interface SearchResult {
  id: string;
  name: string;
  email: string;
  title: string | null;
  matchReason: string;
}

export function SearchHub() {
  const t = useT();
  const s = t.recruiter.search;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  async function runSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const res = await fetch(`/api/recruiter/candidates/search?q=${encodeURIComponent(value.trim())}`);
    if (res.ok) {
      const json = await res.json();
      setResults(json.results ?? []);
    }
    setSearching(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader title={s.title} description={s.description} />
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder={s.placeholder}
          value={query}
          onChange={(e) => runSearch(e.target.value)}
        />
      </div>
      {searching && <p className="text-sm text-muted-foreground">{t.common.loading}</p>}
      {!searching && query.length >= 2 && results.length === 0 && (
        <p className="text-sm text-muted-foreground">{s.noResults}</p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {results.map((r) => (
          <Link key={r.id} href={`/recruiter/candidates/${r.id}`}>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <p className="font-medium">{r.name}</p>
                <p className="text-sm text-muted-foreground">{r.title ?? r.email}</p>
                <p className="text-xs text-muted-foreground mt-1">{r.matchReason}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

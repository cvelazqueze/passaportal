"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/candidate/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useT } from "@/components/locale-provider";

interface PoolMember {
  id: string;
  candidateProfile: {
    id: string;
    user: { firstName: string; lastName: string; email: string };
    talentPassport: { professionalTitle: string | null } | null;
  };
}

interface Pool {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
  members: PoolMember[];
}

interface CandidateOption {
  id: string;
  firstName: string;
  lastName: string;
}

export function PoolsHub() {
  const t = useT();
  const p = t.recruiter.pools;
  const [pools, setPools] = useState<Pool[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [addToPoolId, setAddToPoolId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState("");

  const load = useCallback(async () => {
    const [poolsRes, candidatesRes] = await Promise.all([
      fetch("/api/recruiter/pools"),
      fetch("/api/recruiter/candidates"),
    ]);
    if (poolsRes.ok) {
      const json = await poolsRes.json();
      setPools(json.pools ?? []);
    }
    if (candidatesRes.ok) {
      const json = await candidatesRes.json();
      setCandidates(
        (json.candidates ?? []).map((c: CandidateOption & { lastName: string }) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createPool(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/recruiter/pools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: (form.get("name") as string).trim(),
        description: (form.get("description") as string).trim() || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? p.addFailed);
      setSubmitting(false);
      return;
    }
    setPools((prev) => [...prev, json.pool].sort((a, b) => a.name.localeCompare(b.name)));
    setShowForm(false);
    setSubmitting(false);
  }

  async function addMember(poolId: string) {
    if (!selectedCandidate) return;
    const res = await fetch(`/api/recruiter/pools/${poolId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateProfileId: selectedCandidate }),
    });
    if (res.ok) {
      await load();
      setAddToPoolId(null);
      setSelectedCandidate("");
    }
  }

  async function removeMember(poolId: string, candidateProfileId: string) {
    await fetch(
      `/api/recruiter/pools/${poolId}/members?candidateProfileId=${candidateProfileId}`,
      { method: "DELETE" }
    );
    await load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={p.title}
        description={p.description}
        action={
          !showForm ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {p.newPool}
            </Button>
          ) : undefined
        }
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{p.newPool}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createPool} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{p.poolName}</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{p.poolDesc}</Label>
                <Input id="description" name="description" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {p.newPool}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {t.common.cancel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {pools.map((pool) => (
          <Card key={pool.id}>
            <CardHeader>
              <CardTitle className="text-base">{pool.name}</CardTitle>
              {pool.description && (
                <p className="text-sm text-muted-foreground">{pool.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {pool._count.members} {p.members}
              </p>
              {pool.members.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <Link
                      href={`/recruiter/candidates/${m.candidateProfile.id}`}
                      className="font-medium text-sm hover:underline"
                    >
                      {m.candidateProfile.user.firstName} {m.candidateProfile.user.lastName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {m.candidateProfile.talentPassport?.professionalTitle ??
                        m.candidateProfile.user.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMember(pool.id, m.candidateProfile.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {addToPoolId === pool.id ? (
                <div className="flex flex-wrap gap-2 items-end">
                  <select
                    value={selectedCandidate}
                    onChange={(e) => setSelectedCandidate(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">{p.selectCandidate}</option>
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" onClick={() => addMember(pool.id)} disabled={!selectedCandidate}>
                    {p.addMember}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAddToPoolId(null)}>
                    {t.common.cancel}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setAddToPoolId(pool.id)}>
                  {p.addMember}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

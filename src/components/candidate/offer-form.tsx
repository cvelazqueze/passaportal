"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { OFFER_CURRENCIES, parseBenefits } from "@/lib/candidate/offer-schema";

export interface OpportunityOption {
  id: string;
  title: string | null;
  company: string | null;
}

export interface Offer {
  id: string;
  applicationId: string;
  baseSalary: number | null;
  currency: string;
  bonus: string | null;
  ptoDays: number | null;
  remotePolicy: string | null;
  benefits: string[];
  contractType: string | null;
  equipment: string | null;
  insurance: string | null;
  flexibility: string | null;
  notes: string | null;
  isAccepted: boolean;
  application: { title: string | null; company: string | null; id: string };
}

interface OfferFormProps {
  mode: "add" | "edit";
  opportunities: OpportunityOption[];
  existingOfferAppIds: Set<string>;
  initial?: Offer;
  onSuccess: (offer: Offer) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function opportunityLabel(o: OpportunityOption): string {
  const title = o.title?.trim() || "—";
  const company = o.company?.trim();
  return company ? `${title} @ ${company}` : title;
}

export function OfferForm({
  mode,
  opportunities,
  existingOfferAppIds,
  initial,
  onSuccess,
  onCancel,
  onDelete,
}: OfferFormProps) {
  const t = useT();
  const o = t.offers;
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const isEdit = mode === "edit";
  const availableOpportunities = isEdit
    ? opportunities
    : opportunities.filter((opp) => !existingOfferAppIds.has(opp.id));

  const defaultOpportunityId =
    initial?.applicationId ?? availableOpportunities[0]?.id ?? "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const salaryRaw = form.get("baseSalary") as string;
    const ptoRaw = form.get("ptoDays") as string;

    const payload = {
      applicationId: form.get("applicationId") as string,
      baseSalary: salaryRaw ? Number(salaryRaw) : null,
      currency: (form.get("currency") as string) || "USD",
      bonus: (form.get("bonus") as string).trim() || null,
      ptoDays: ptoRaw ? Number(ptoRaw) : null,
      remotePolicy: (form.get("remotePolicy") as string).trim() || null,
      contractType: (form.get("contractType") as string).trim() || null,
      equipment: (form.get("equipment") as string).trim() || null,
      insurance: (form.get("insurance") as string).trim() || null,
      flexibility: (form.get("flexibility") as string).trim() || null,
      notes: (form.get("notes") as string).trim() || null,
      benefits: parseBenefits(form.get("benefits") as string),
      isAccepted: form.get("isAccepted") === "on",
    };

    try {
      const url = isEdit
        ? `/api/candidate/offers/${initial!.id}`
        : "/api/candidate/offers";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? (isEdit ? o.editFailed : o.addFailed));
        return;
      }
      onSuccess(json.offer);
    } catch {
      setError(isEdit ? o.editFailed : o.addFailed);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !initial || !onDelete) return;
    if (!window.confirm(o.deleteConfirm)) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/candidate/offers/${initial.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? o.deleteFailed);
        return;
      }
      onDelete();
    } catch {
      setError(o.deleteFailed);
    } finally {
      setDeleting(false);
    }
  }

  if (availableOpportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? o.editOffer : o.addOffer}</CardTitle>
          <CardDescription>
            {isEdit ? o.editOfferDesc : o.noOpportunitiesForOffer}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t.common.cancel}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? o.editOffer : o.addOffer}</CardTitle>
        <CardDescription>
          {isEdit ? o.editOfferDesc : o.addOfferDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="applicationId">{o.opportunity}</Label>
            <select
              id="applicationId"
              name="applicationId"
              required
              defaultValue={defaultOpportunityId}
              disabled={isEdit}
              className={selectClassName}
            >
              {availableOpportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opportunityLabel(opp)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="baseSalary">{o.baseSalary}</Label>
              <Input
                id="baseSalary"
                name="baseSalary"
                type="number"
                min={0}
                defaultValue={initial?.baseSalary ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{o.currency}</Label>
              <select
                id="currency"
                name="currency"
                defaultValue={initial?.currency ?? "USD"}
                className={selectClassName}
              >
                {OFFER_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bonus">{o.bonus}</Label>
              <Input
                id="bonus"
                name="bonus"
                defaultValue={initial?.bonus ?? ""}
                placeholder={o.bonusPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptoDays">{o.pto}</Label>
              <Input
                id="ptoDays"
                name="ptoDays"
                type="number"
                min={0}
                defaultValue={initial?.ptoDays ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remotePolicy">{o.remote}</Label>
              <Input
                id="remotePolicy"
                name="remotePolicy"
                defaultValue={initial?.remotePolicy ?? ""}
                placeholder={o.remotePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractType">{o.contract}</Label>
              <Input
                id="contractType"
                name="contractType"
                defaultValue={initial?.contractType ?? ""}
                placeholder={o.contractPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment">{o.equipment}</Label>
              <Input
                id="equipment"
                name="equipment"
                defaultValue={initial?.equipment ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance">{o.insurance}</Label>
              <Input
                id="insurance"
                name="insurance"
                defaultValue={initial?.insurance ?? ""}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="flexibility">{o.flexibility}</Label>
              <Input
                id="flexibility"
                name="flexibility"
                defaultValue={initial?.flexibility ?? ""}
                placeholder={o.flexibilityPlaceholder}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="benefits">{o.benefits}</Label>
            <Input
              id="benefits"
              name="benefits"
              defaultValue={initial?.benefits.join(", ") ?? ""}
              placeholder={o.benefitsPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{o.notes}</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={initial?.notes ?? ""}
              placeholder={o.notesPlaceholder}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isAccepted"
              defaultChecked={initial?.isAccepted ?? false}
              className="h-4 w-4 rounded border-input"
            />
            {o.markAccepted}
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={submitting || deleting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? t.common.save : o.addOffer}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting || deleting}
            >
              {t.common.cancel}
            </Button>
            {isEdit && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={submitting || deleting}
                className="ml-auto"
              >
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {t.common.delete}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

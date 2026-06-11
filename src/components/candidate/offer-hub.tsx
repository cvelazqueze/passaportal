"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/candidate/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Pencil } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import {
  OfferForm,
  type Offer,
  type OpportunityOption,
} from "@/components/candidate/offer-form";

function formatSalary(
  amount: number | null | undefined,
  currency: string,
  locale: string
) {
  if (!amount) return "—";
  const tag = locale === "es" ? "es-ES" : "en-US";
  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function OfferHub() {
  const { t, locale } = useLocale();
  const o = t.offers;

  const [offers, setOffers] = useState<Offer[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const existingOfferAppIds = useMemo(
    () => new Set(offers.map((offer) => offer.applicationId)),
    [offers]
  );

  const loadData = useCallback(async () => {
    const [offersRes, opportunitiesRes] = await Promise.all([
      fetch("/api/candidate/offers"),
      fetch("/api/candidate/opportunities"),
    ]);

    if (offersRes.ok) {
      const json = await offersRes.json();
      setOffers(json.offers ?? []);
    }

    if (opportunitiesRes.ok) {
      const json = await opportunitiesRes.json();
      setOpportunities(json.opportunities ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const editingOffer = editingId
    ? offers.find((offer) => offer.id === editingId)
    : undefined;

  const comparisonFields = [
    {
      key: "baseSalary",
      label: o.baseSalary,
      format: (offer: Offer) => formatSalary(offer.baseSalary, offer.currency, locale),
    },
    {
      key: "bonus",
      label: o.bonus,
      format: (offer: Offer) => offer.bonus ?? t.common.empty,
    },
    {
      key: "ptoDays",
      label: o.pto,
      format: (offer: Offer) =>
        offer.ptoDays ? `${offer.ptoDays} ${t.common.days}` : t.common.empty,
    },
    {
      key: "remotePolicy",
      label: o.remote,
      format: (offer: Offer) => offer.remotePolicy ?? t.common.empty,
    },
    {
      key: "contractType",
      label: o.contract,
      format: (offer: Offer) => offer.contractType ?? t.common.empty,
    },
    {
      key: "equipment",
      label: o.equipment,
      format: (offer: Offer) => offer.equipment ?? t.common.empty,
    },
    {
      key: "insurance",
      label: o.insurance,
      format: (offer: Offer) => offer.insurance ?? t.common.empty,
    },
    {
      key: "flexibility",
      label: o.flexibility,
      format: (offer: Offer) => offer.flexibility ?? t.common.empty,
    },
  ] as const;

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function handleOfferSaved(offer: Offer) {
    setOffers((prev) => {
      const idx = prev.findIndex((item) => item.id === offer.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = offer;
        return next;
      }
      return [offer, ...prev];
    });
    closeForm();
  }

  function handleOfferDeleted() {
    if (!editingId) return;
    setOffers((prev) => prev.filter((item) => item.id !== editingId));
    closeForm();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={o.title}
        description={o.description}
        action={
          !showForm && !editingId ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {o.addOffer}
            </Button>
          ) : undefined
        }
      />

      {(showForm || editingId) && (
        <OfferForm
          mode={editingId ? "edit" : "add"}
          opportunities={opportunities}
          existingOfferAppIds={existingOfferAppIds}
          initial={editingOffer}
          onSuccess={handleOfferSaved}
          onCancel={closeForm}
          onDelete={editingId ? handleOfferDeleted : undefined}
        />
      )}

      {opportunities.length === 0 && !showForm && !editingId && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{o.noOpportunitiesDesc}</p>
            <Button asChild variant="link" className="mt-2 h-auto p-0">
              <Link href="/candidate/opportunities">{o.addOpportunityFirst}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {offers.length === 0 && !showForm && !editingId ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{o.noOffers}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <Card
                key={offer.id}
                className={offer.isAccepted ? "border-success/50" : ""}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">
                        {offer.application.title}
                      </CardTitle>
                      <CardDescription>{offer.application.company}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {offer.isAccepted && (
                        <Badge className="bg-success/10 text-success">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {o.accepted}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setShowForm(false);
                          setEditingId(offer.id);
                        }}
                        aria-label={o.editOffer}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{o.baseSalary}</span>
                    <span className="font-medium">
                      {formatSalary(offer.baseSalary, offer.currency, locale)}
                    </span>
                  </div>
                  {offer.bonus && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{o.bonus}</span>
                      <span>{offer.bonus}</span>
                    </div>
                  )}
                  {offer.ptoDays && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{o.pto}</span>
                      <span>
                        {offer.ptoDays} {t.common.days}
                      </span>
                    </div>
                  )}
                  {offer.remotePolicy && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{o.remote}</span>
                      <span>{offer.remotePolicy}</span>
                    </div>
                  )}
                  {offer.notes && (
                    <p className="pt-1 text-muted-foreground">{offer.notes}</p>
                  )}
                  {offer.benefits.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1">
                      {offer.benefits.map((b) => (
                        <Badge key={b} variant="outline" className="text-xs">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {offers.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle>{o.comparison}</CardTitle>
                <CardDescription>{o.comparisonDesc}</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium text-muted-foreground">
                        {o.field}
                      </th>
                      {offers.map((offer) => (
                        <th key={offer.id} className="py-2 text-left font-medium px-4">
                          {offer.application.company ?? offer.application.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFields.map((field) => (
                      <tr key={field.key} className="border-b">
                        <td className="py-2 text-muted-foreground">{field.label}</td>
                        {offers.map((offer) => (
                          <td key={offer.id} className="py-2 px-4 font-medium">
                            {field.format(offer)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApplications } from "@/lib/actions/applications";
import { getOfferReviews, upsertOfferReview } from "@/lib/actions/offers";
import { toast } from "sonner";

type Application = Awaited<ReturnType<typeof getApplications>>[number];
type OfferReview = Awaited<ReturnType<typeof getOfferReviews>>[number];

export default function OffersPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [reviews, setReviews] = useState<OfferReview[]>([]);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [scores, setScores] = useState({
    compensationScore: 70,
    growthScore: 70,
    flexibilityScore: 70,
    stabilityScore: 70,
  });
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      setApplications(await getApplications());
      setReviews(await getOfferReviews());
    })();
  }, []);

  function handleSave() {
    if (!selectedAppId) {
      toast.error("Select an application first");
      return;
    }
    startTransition(async () => {
      await upsertOfferReview({
        applicationId: selectedAppId,
        ...scores,
        notes: notes || undefined,
      });
      setReviews(await getOfferReviews());
      toast.success("Offer review saved");
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Offer Readiness Workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Application</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
            >
              <option value="">Select application</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.jobTitle} {app.company ? `— ${app.company}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {(
              [
                ["compensationScore", "Compensation"],
                ["growthScore", "Growth"],
                ["flexibilityScore", "Flexibility"],
                ["stabilityScore", "Stability"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label} (0-100)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={scores[key]}
                  onChange={(e) =>
                    setScores((prev) => ({
                      ...prev,
                      [key]: Number(e.target.value || 0),
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Negotiation notes, concerns, and highlights..."
            />
          </div>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save Offer Review"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Offer Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {reviews.length === 0 && (
            <p className="text-sm text-muted-foreground">No offer reviews yet.</p>
          )}
          {reviews.map((review) => (
            <div key={review.id} className="rounded-md border p-3">
              <p className="text-sm font-medium">
                {review.jobTitle} {review.company ? `— ${review.company}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Weighted score: {review.weightedScore ?? 0} · Recommendation: {review.recommendation ?? "n/a"}
              </p>
              {review.notes && <p className="mt-2 text-xs">{review.notes}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

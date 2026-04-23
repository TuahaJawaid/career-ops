"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { getProfile, upsertProfile } from "@/lib/actions/settings";

export default function SettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState("Aimun Naeem");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [targetRoles, setTargetRoles] = useState<string[]>([
    "Senior Accountant",
    "Senior Revenue Accountant",
    "Revenue Accountant",
  ]);
  const [targetRegions, setTargetRegions] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await getProfile();
        if (!mounted) return;
        if (profile) {
          setFullName(profile.fullName);
          setEmail(profile.email ?? "");
          setPhone(profile.phone ?? "");
          setLocation(profile.location ?? "");
          setTargetRoles((profile.targetRoles as string[]) ?? []);
          setTargetRegions((profile.targetRegions as string[]) ?? []);
        }
      } catch {
        if (!mounted) return;
        setLoadError("Failed to load settings.");
      } finally {
        if (mounted) setLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function handleSave() {
    startTransition(async () => {
      await upsertProfile({
        fullName,
        email: email || undefined,
        phone: phone || undefined,
        location: location || undefined,
        targetRoles,
        targetRegions,
      });
      toast.success("Profile saved");
    });
  }

  function handleResetTargeting() {
    setTargetRoles([
      "Senior Accountant",
      "Senior Revenue Accountant",
      "Revenue Accountant",
    ]);
    setTargetRegions([]);
    toast.success("Target roles and regions reset");
  }

  function addRole() {
    if (newRole.trim() && !targetRoles.includes(newRole.trim())) {
      setTargetRoles([...targetRoles, newRole.trim()]);
      setNewRole("");
    }
  }

  function addRegion() {
    if (newRegion.trim() && !targetRegions.includes(newRegion.trim())) {
      setTargetRegions([...targetRegions, newRegion.trim()]);
      setNewRegion("");
    }
  }

  if (!loaded) return <div className="text-sm text-muted-foreground">Loading settings...</div>;
  if (loadError) return <div className="text-sm text-destructive">{loadError}</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Dubai, UAE" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Target Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {targetRoles.map((role) => (
              <Badge key={role} variant="secondary" className="gap-1">
                {role}
                <button onClick={() => setTargetRoles(targetRoles.filter((r) => r !== role))}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Add a target role"
              onKeyDown={(e) => e.key === "Enter" && addRole()}
            />
            <Button size="icon" variant="outline" onClick={addRole}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Target Regions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {targetRegions.length === 0 && (
              <span className="text-sm text-muted-foreground">Global (all regions)</span>
            )}
            {targetRegions.map((region) => (
              <Badge key={region} variant="secondary" className="gap-1">
                {region}
                <button onClick={() => setTargetRegions(targetRegions.filter((r) => r !== region))}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newRegion}
              onChange={(e) => setNewRegion(e.target.value)}
              placeholder="Add a region (leave empty for global)"
              onKeyDown={(e) => e.key === "Enter" && addRegion()}
            />
            <Button size="icon" variant="outline" onClick={addRegion}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy & Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-medium">Export profile snapshot</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Export your settings/profile as JSON for backups.
            </p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => {
                const payload = {
                  fullName,
                  email,
                  phone,
                  location,
                  targetRoles,
                  targetRegions,
                };
                const blob = new Blob([JSON.stringify(payload, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "career-ops-settings.json";
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
                URL.revokeObjectURL(url);
                toast.success("Settings exported");
              }}
            >
              Export JSON
            </Button>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-medium">Reset preferences</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Resets target roles and target regions to sensible defaults.
            </p>
            <Button variant="outline" className="mt-3" onClick={handleResetTargeting}>
              Reset Targeting
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isPending} className="gap-2">
        <Save className="h-4 w-4" />
        {isPending ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}

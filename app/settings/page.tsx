"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

  useEffect(() => {
    getProfile().then((profile) => {
      if (profile) {
        setFullName(profile.fullName);
        setEmail(profile.email ?? "");
        setPhone(profile.phone ?? "");
        setLocation(profile.location ?? "");
        setTargetRoles((profile.targetRoles as string[]) ?? []);
        setTargetRegions((profile.targetRegions as string[]) ?? []);
      }
      setLoaded(true);
    });
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

  if (!loaded) return null;

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

      <Button onClick={handleSave} disabled={isPending} className="gap-2">
        <Save className="h-4 w-4" />
        {isPending ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Compass,
  RefreshCw,
  BookmarkPlus,
  X,
  MapPin,
  Building2,
  ExternalLink,
  Filter,
  Globe,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDiscoveredJobs,
  saveDiscoveredJob,
  dismissDiscoveredJob,
  getCareerPages,
  addCareerPage,
  removeCareerPage,
  seedDefaultCareerPages,
} from "@/lib/actions/discover";
import { EmptyState } from "@/components/shared/empty-state";

type DiscoveredJob = Awaited<ReturnType<typeof getDiscoveredJobs>>[number];
type CareerPage = Awaited<ReturnType<typeof getCareerPages>>[number];

const REGIONS = [
  { value: "all", label: "All Regions" },
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "ae", label: "UAE" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "sg", label: "Singapore" },
  { value: "in", label: "India" },
];

const DATE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "3days", label: "Last 3 Days" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

const EMPLOYMENT_TYPES = [
  { value: "all", label: "All Types" },
  { value: "FULLTIME", label: "Full-time" },
  { value: "CONTRACTOR", label: "Contract" },
  { value: "PARTTIME", label: "Part-time" },
  { value: "INTERN", label: "Internship" },
];

export default function DiscoverPage() {
  const [jobs, setJobs] = useState<DiscoveredJob[]>([]);
  const [careerPages, setCareerPages] = useState<CareerPage[]>([]);
  const [isPending, startTransition] = useTransition();
  const [searching, setSearching] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Search params
  const [query, setQuery] = useState("Senior Accountant");
  const [region, setRegion] = useState("all");
  const [datePosted, setDatePosted] = useState("week");
  const [employmentType, setEmploymentType] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Add career page dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    Promise.all([
      getDiscoveredJobs(),
      seedDefaultCareerPages().then(() => getCareerPages()),
    ]).then(([j, cp]) => {
      setJobs(j);
      setCareerPages(cp);
      setLoaded(true);
    });
  }, []);

  async function handleSearch() {
    setSearching(true);
    try {
      const res = await fetch("/api/discover/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          country: region,
          remoteOnly,
          datePosted,
          employmentTypes: employmentType,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Found ${data.count} new jobs`);
        const updated = await getDiscoveredJobs();
        setJobs(updated);
      } else {
        toast.error(data.error || "Search failed");
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  }

  function handleSave(id: string) {
    startTransition(async () => {
      await saveDiscoveredJob(id);
      setJobs(jobs.filter((j) => j.id !== id));
      toast.success("Job saved to your pipeline");
    });
  }

  function handleDismiss(id: string) {
    startTransition(async () => {
      await dismissDiscoveredJob(id);
      setJobs(jobs.filter((j) => j.id !== id));
    });
  }

  function handleAddCareerPage() {
    if (!newCompany.trim() || !newUrl.trim()) {
      toast.error("Company name and URL are required");
      return;
    }
    startTransition(async () => {
      await addCareerPage({
        company: newCompany.trim(),
        url: newUrl.trim(),
        category: newCategory.trim() || "Custom",
      });
      const updated = await getCareerPages();
      setCareerPages(updated);
      setAddDialogOpen(false);
      setNewCompany("");
      setNewUrl("");
      setNewCategory("");
      toast.success("Career page added");
    });
  }

  function handleRemoveCareerPage(id: string) {
    startTransition(async () => {
      await removeCareerPage(id);
      setCareerPages(careerPages.filter((cp) => cp.id !== id));
    });
  }

  if (!loaded) return null;

  // Group career pages by category
  const careerPagesByCategory = careerPages.reduce<Record<string, CareerPage[]>>(
    (acc, page) => {
      const cat = page.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(page);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {/* Search + Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for roles..."
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              title="Toggle filters"
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={handleSearch} disabled={searching} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${searching ? "animate-spin" : ""}`} />
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Region</Label>
                <Select value={region} onValueChange={(v) => setRegion(v ?? "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date Posted</Label>
                <Select value={datePosted} onValueChange={(v) => setDatePosted(v ?? "week")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_OPTIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Employment Type</Label>
                <Select value={employmentType} onValueChange={(v) => setEmploymentType(v ?? "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Remote Only</Label>
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background">
                  <Switch
                    checked={remoteOnly}
                    onCheckedChange={setRemoteOnly}
                  />
                  <span className="text-sm">{remoteOnly ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Searches LinkedIn, Indeed, Glassdoor, and more globally. Jobs also auto-fetch daily.
          </p>
        </CardContent>
      </Card>

      {/* Job Results */}
      {jobs.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No discovered jobs"
          description="Search for jobs above or wait for the daily auto-fetch."
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{jobs.length} jobs discovered</p>
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{job.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {job.company && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" /> {job.company}
                        </span>
                      )}
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {job.location}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {job.locationType && (
                        <Badge variant="outline" className="text-[10px]">
                          {job.locationType}
                        </Badge>
                      )}
                      {job.salary && (
                        <Badge variant="secondary" className="text-[10px]">
                          {job.salary}
                        </Badge>
                      )}
                      {job.source && (
                        <Badge variant="outline" className="text-[10px]">
                          {job.source}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleSave(job.id)}
                      disabled={isPending}
                      title="Save to My Jobs"
                    >
                      <BookmarkPlus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDismiss(job.id)}
                      disabled={isPending}
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Company Career Pages */}
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Company Career Pages
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Browse career pages directly — find jobs not listed on job boards
            </p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger>
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Career Page</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g. Stripe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Career Page URL</Label>
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://stripe.com/jobs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category (optional)</Label>
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Fintech"
                  />
                </div>
                <Button onClick={handleAddCareerPage} disabled={isPending}>
                  {isPending ? "Adding..." : "Add"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {Object.entries(careerPagesByCategory).map(([category, pages]) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {category}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="group relative flex items-center gap-2 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
                >
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0"
                  >
                    <span className="text-sm font-medium truncate block">
                      {page.company}
                    </span>
                  </a>
                  <div className="flex gap-1 shrink-0">
                    <a href={page.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    {page.isCustom && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={() => handleRemoveCareerPage(page.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

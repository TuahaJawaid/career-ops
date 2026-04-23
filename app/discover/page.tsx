"use client";

import { useEffect, useState, useMemo, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
  Clock,
  Search,
  SlidersHorizontal,
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
import {
  createRoleSubscription,
  deleteRoleSubscription,
  getRoleAlerts,
  getRoleSubscriptions,
  markRoleAlertRead,
} from "@/lib/actions/subscriptions";
import {
  followCompany,
  getFollowedCompanies,
  getFollowedCompanyAlerts,
  markFollowedCompanyAlertRead,
  unfollowCompany,
} from "@/lib/actions/follows";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDistanceToNow } from "date-fns";

type DiscoveredJob = Awaited<ReturnType<typeof getDiscoveredJobs>>[number];
type CareerPage = Awaited<ReturnType<typeof getCareerPages>>[number];
type RoleSubscription = Awaited<ReturnType<typeof getRoleSubscriptions>>[number];
type RoleAlert = Awaited<ReturnType<typeof getRoleAlerts>>[number];
type FollowedCompany = Awaited<ReturnType<typeof getFollowedCompanies>>[number];
type FollowedCompanyAlert = Awaited<ReturnType<typeof getFollowedCompanyAlerts>>[number];

const REGIONS = [
  { value: "all", label: "All Regions" },
  { value: "gb", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "ae", label: "UAE" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "sg", label: "Singapore" },
  { value: "in", label: "India" },
  { value: "fr", label: "France" },
  { value: "nl", label: "Netherlands" },
  { value: "sa", label: "Saudi Arabia" },
  { value: "my", label: "Malaysia" },
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

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "company", label: "Company A-Z" },
];

export default function DiscoverPage() {
  const [jobs, setJobs] = useState<DiscoveredJob[]>([]);
  const [careerPages, setCareerPages] = useState<CareerPage[]>([]);
  const [subscriptions, setSubscriptions] = useState<RoleSubscription[]>([]);
  const [roleAlerts, setRoleAlerts] = useState<RoleAlert[]>([]);
  const [followedCompanies, setFollowedCompanies] = useState<FollowedCompany[]>([]);
  const [followedAlerts, setFollowedAlerts] = useState<FollowedCompanyAlert[]>([]);
  const [isPending, startTransition] = useTransition();
  const [searching, setSearching] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search params (sent to API)
  const [query, setQuery] = useState(
    "Senior Accountant, Revenue Accountant, Senior Revenue Accountant"
  );
  const [region, setRegion] = useState("all");
  const [datePosted, setDatePosted] = useState("month");
  const [employmentType, setEmploymentType] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [matchModeValue, setMatchModeValue] = useState([1]);
  const [showFilters, setShowFilters] = useState(true);

  // Source stats from last search
  const [sourceCounts, setSourceCounts] = useState<{ name: string; count: number }[]>([]);

  // Client-side result filters (instant, no API call)
  const [locationFilter, setLocationFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [hasSalaryFilter, setHasSalaryFilter] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [showResultFilters, setShowResultFilters] = useState(false);

  // Add career page dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSubscriptionName, setNewSubscriptionName] = useState("");
  const [newSubscriptionQuery, setNewSubscriptionQuery] = useState("");
  const [newFollowCompany, setNewFollowCompany] = useState("");

  async function refreshOptionalFeatureData() {
    try {
      const [subs, rAlerts, follows, fAlerts] = await Promise.all([
        getRoleSubscriptions(),
        getRoleAlerts(),
        getFollowedCompanies(),
        getFollowedCompanyAlerts(),
      ]);
      setSubscriptions(subs);
      setRoleAlerts(rAlerts);
      setFollowedCompanies(follows);
      setFollowedAlerts(fAlerts);
      return true;
    } catch {
      // New feature tables may not exist yet in some environments.
      setSubscriptions([]);
      setRoleAlerts([]);
      setFollowedCompanies([]);
      setFollowedAlerts([]);
      return false;
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [j, cp] = await Promise.all([
          getDiscoveredJobs(),
          seedDefaultCareerPages().then(() => getCareerPages()),
        ]);
        if (!mounted) return;
        setJobs(j);
        setCareerPages(cp);
        await refreshOptionalFeatureData();
      } catch {
        if (!mounted) return;
        setLoadError("Failed to load discover data.");
      } finally {
        if (mounted) setLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Get unique sources from current results
  const availableSources = useMemo(() => {
    const sources = new Set(jobs.map((j) => j.source).filter(Boolean));
    return Array.from(sources) as string[];
  }, [jobs]);

  // Client-side filtered + sorted results
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Location text filter
    if (locationFilter.trim()) {
      const lf = locationFilter.toLowerCase();
      result = result.filter((j) =>
        j.location?.toLowerCase().includes(lf) ||
        j.company?.toLowerCase().includes(lf)
      );
    }

    // Source filter
    if (sourceFilter !== "all") {
      result = result.filter((j) => j.source === sourceFilter);
    }

    // Location type filter
    if (typeFilter !== "all") {
      result = result.filter((j) => j.locationType === typeFilter);
    }

    // Has salary filter
    if (hasSalaryFilter) {
      result = result.filter((j) => j.salary);
    }

    // Sort
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.discoveredAt).getTime() - new Date(b.discoveredAt).getTime());
    } else if (sortBy === "company") {
      result.sort((a, b) => (a.company ?? "").localeCompare(b.company ?? ""));
    }

    return result;
  }, [jobs, locationFilter, sourceFilter, typeFilter, hasSalaryFilter, sortBy]);

  async function handleSearch() {
    setSearching(true);
    try {
      const matchMode = matchModeValue[0] === 0 ? "focused" : matchModeValue[0] === 2 ? "broad" : "balanced";
      const res = await fetch("/api/discover/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          country: region,
          remoteOnly,
          datePosted,
          employmentTypes: employmentType,
          matchMode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Found ${data.count} jobs from ${data.sources?.length ?? 0} sources`
        );
        setSourceCounts(data.sources ?? []);
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

  function handleCreateSubscription() {
    if (!newSubscriptionName.trim() || !newSubscriptionQuery.trim()) {
      toast.error("Subscription name and query are required");
      return;
    }
    startTransition(async () => {
      try {
        await createRoleSubscription({
          name: newSubscriptionName.trim(),
          query: newSubscriptionQuery.trim(),
        });
        await refreshOptionalFeatureData();
        setNewSubscriptionName("");
        setNewSubscriptionQuery("");
        toast.success("Role subscription added");
      } catch {
        toast.error("Role subscriptions are temporarily unavailable.");
      }
    });
  }

  function handleDeleteSubscription(id: string) {
    startTransition(async () => {
      try {
        await deleteRoleSubscription(id);
        await refreshOptionalFeatureData();
        toast.success("Subscription removed");
      } catch {
        toast.error("Unable to remove subscription right now.");
      }
    });
  }

  function handleMarkRoleAlertRead(id: string) {
    startTransition(async () => {
      try {
        await markRoleAlertRead(id);
        await refreshOptionalFeatureData();
      } catch {
        toast.error("Unable to update alert right now.");
      }
    });
  }

  function handleFollowCompany() {
    if (!newFollowCompany.trim()) {
      toast.error("Company name is required");
      return;
    }
    startTransition(async () => {
      try {
        await followCompany({ company: newFollowCompany.trim() });
        await refreshOptionalFeatureData();
        setNewFollowCompany("");
        toast.success("Company followed");
      } catch {
        toast.error("Company follows are temporarily unavailable.");
      }
    });
  }

  function handleUnfollowCompany(id: string) {
    startTransition(async () => {
      try {
        await unfollowCompany(id);
        await refreshOptionalFeatureData();
        toast.success("Company unfollowed");
      } catch {
        toast.error("Unable to unfollow company right now.");
      }
    });
  }

  function handleMarkFollowedAlertRead(id: string) {
    startTransition(async () => {
      try {
        await markFollowedCompanyAlertRead(id);
        await refreshOptionalFeatureData();
      } catch {
        toast.error("Unable to update alert right now.");
      }
    });
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

  if (!loaded) return <div className="text-sm text-muted-foreground">Loading discover jobs...</div>;
  if (loadError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{loadError}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const careerPagesByCategory = careerPages.reduce<Record<string, CareerPage[]>>(
    (acc, page) => {
      const cat = page.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(page);
      return acc;
    },
    {}
  );

  const sourceLabels: Record<string, string> = {
    jsearch: "LinkedIn / Indeed / Glassdoor",
    remotive: "Remotive",
    arbeitnow: "Arbeitnow (EU)",
    adzuna: "Adzuna (Global)",
    weworkremotely: "WeWorkRemotely",
  };

  return (
    <div className="space-y-6">
      {/* Search + API Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for roles (e.g. Senior Accountant, Revenue Accountant)..."
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              title="Toggle search filters"
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={handleSearch} disabled={searching} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${searching ? "animate-spin" : ""}`} />
              {searching ? "Searching..." : "Search All Sources"}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Region</Label>
                <Select value={region} onValueChange={(v) => setRegion(v ?? "all")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date Posted</Label>
                <Select value={datePosted} onValueChange={(v) => setDatePosted(v ?? "week")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DATE_OPTIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Employment Type</Label>
                <Select value={employmentType} onValueChange={(v) => setEmploymentType(v ?? "all")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((e) => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Remote Only</Label>
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background">
                  <Switch checked={remoteOnly} onCheckedChange={setRemoteOnly} />
                  <span className="text-sm">{remoteOnly ? "Yes" : "No"}</span>
                </div>
              </div>
              <div className="space-y-1.5 col-span-2 md:col-span-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Relevance Breadth</Label>
                  <span className="text-xs text-muted-foreground">
                    {matchModeValue[0] === 0 ? "Focused" : matchModeValue[0] === 2 ? "Broad" : "Balanced"}
                  </span>
                </div>
                <div className="px-2 py-2 rounded-md border border-input bg-background">
                  <Slider
                    value={matchModeValue}
                    onValueChange={setMatchModeValue}
                    min={0}
                    max={2}
                    step={1}
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>Focused</span>
                    <span>Balanced</span>
                    <span>Broad</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Source indicators */}
          {sourceCounts.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {sourceCounts.map((s) => (
                <Badge key={s.name} variant="outline" className="text-xs gap-1">
                  {sourceLabels[s.name] || s.name}: {s.count}
                </Badge>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Searches LinkedIn, Indeed, Glassdoor, ZipRecruiter, Remotive, WeWorkRemotely, Arbeitnow, and more.
            Jobs auto-fetch daily at 8 AM UTC.
          </p>
        </CardContent>
      </Card>

      {/* Client-side Result Filters */}
      {jobs.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setShowResultFilters(!showResultFilters)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filter Results ({filteredJobs.length} of {jobs.length})
              </button>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "newest")}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showResultFilters && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Location / Company</Label>
                  <Input
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="Type to filter..."
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Source</Label>
                  <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v ?? "all")}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {availableSources.map((s) => (
                        <SelectItem key={s} value={s}>
                          {sourceLabels[s] || s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Work Type</Label>
                  <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">Onsite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Salary</Label>
                  <div className="flex items-center gap-2 h-8 px-2 rounded-md border border-input bg-background">
                    <Switch
                      checked={hasSalaryFilter}
                      onCheckedChange={setHasSalaryFilter}
                    />
                    <span className="text-xs">{hasSalaryFilter ? "With salary" : "Any"}</span>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => {
                      setLocationFilter("");
                      setSourceFilter("all");
                      setTypeFilter("all");
                      setHasSalaryFilter(false);
                      setSortBy("newest");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Job Results */}
      {filteredJobs.length === 0 && jobs.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No discovered jobs"
          description="Search for jobs above or wait for the daily auto-fetch."
        />
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching jobs"
          description="Try adjusting your filters to see more results."
        >
          <Button
            variant="outline"
            onClick={() => {
              setLocationFilter("");
              setSourceFilter("all");
              setTypeFilter("all");
              setHasSalaryFilter(false);
            }}
          >
            Clear Filters
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{job.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                      {job.company && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 shrink-0" /> {job.company}
                        </span>
                      )}
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" /> {job.location}
                        </span>
                      )}
                      {job.postedDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {(() => {
                            try {
                              return formatDistanceToNow(new Date(job.postedDate), { addSuffix: true });
                            } catch {
                              return job.postedDate;
                            }
                          })()}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {job.locationType && (
                        <Badge
                          variant={job.locationType === "remote" ? "default" : "outline"}
                          className="text-[10px]"
                        >
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
                          {sourceLabels[job.source] || job.source}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" title="Open listing">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Role Alert Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
              <Input
                value={newSubscriptionName}
                onChange={(e) => setNewSubscriptionName(e.target.value)}
                placeholder="Name (e.g. Revenue Core)"
              />
              <Input
                value={newSubscriptionQuery}
                onChange={(e) => setNewSubscriptionQuery(e.target.value)}
                placeholder="Role query"
              />
              <Button onClick={handleCreateSubscription} disabled={isPending}>Add</Button>
            </div>
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between rounded-md border p-2">
                  <div>
                    <p className="text-sm font-medium">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">{sub.query}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteSubscription(sub.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {subscriptions.length === 0 && (
                <p className="text-xs text-muted-foreground">No role subscriptions yet.</p>
              )}
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Latest role alerts</p>
              {roleAlerts.slice(0, 6).map((alert) => (
                <button
                  key={alert.id}
                  className="w-full rounded-md border p-2 text-left"
                  onClick={() => handleMarkRoleAlertRead(alert.id)}
                >
                  <p className="text-sm font-medium">
                    {alert.jobTitle} <span className="text-muted-foreground">at {alert.jobCompany}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{alert.subscriptionName}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Follow Tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newFollowCompany}
                onChange={(e) => setNewFollowCompany(e.target.value)}
                placeholder="Follow company (e.g. Stripe)"
              />
              <Button onClick={handleFollowCompany} disabled={isPending}>Follow</Button>
            </div>
            <div className="space-y-2">
              {followedCompanies.filter((c) => c.isActive).map((company) => (
                <div key={company.id} className="flex items-center justify-between rounded-md border p-2">
                  <div>
                    <p className="text-sm font-medium">{company.company}</p>
                    <p className="text-xs text-muted-foreground">
                      {company.lastMatchedAt ? `Last match ${formatDistanceToNow(new Date(company.lastMatchedAt), { addSuffix: true })}` : "No matches yet"}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleUnfollowCompany(company.id)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {followedCompanies.filter((c) => c.isActive).length === 0 && (
                <p className="text-xs text-muted-foreground">No followed companies yet.</p>
              )}
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Latest company alerts</p>
              {followedAlerts.slice(0, 6).map((alert) => (
                <button
                  key={alert.id}
                  className="w-full rounded-md border p-2 text-left"
                  onClick={() => handleMarkFollowedAlertRead(alert.id)}
                >
                  <p className="text-sm font-medium">
                    {alert.jobTitle} <span className="text-muted-foreground">at {alert.jobCompany}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Followed: {alert.company}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Company Career Pages
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Browse career pages directly — find jobs not listed on aggregators
            </p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              <Plus className="h-3.5 w-3.5" /> Add Company
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Career Page</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="e.g. Stripe" />
                </div>
                <div className="space-y-2">
                  <Label>Career Page URL</Label>
                  <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://stripe.com/jobs" />
                </div>
                <div className="space-y-2">
                  <Label>Category (optional)</Label>
                  <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Fintech" />
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
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{category}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="group relative flex items-center gap-2 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
                >
                  <a href={page.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{page.company}</span>
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


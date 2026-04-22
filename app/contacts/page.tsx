"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Link2, Mail, Phone, Building2, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { getContacts, createContact, deleteContact, getInteractionsForContact, addInteraction } from "@/lib/actions/contacts";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDistanceToNow } from "date-fns";

type Contact = Awaited<ReturnType<typeof getContacts>>[number];
type Interaction = Awaited<ReturnType<typeof getInteractionsForContact>>[number];

const INTERACTION_TYPES = [
  { value: "email", label: "Email" },
  { value: "linkedin", label: "LinkedIn Message" },
  { value: "call", label: "Phone Call" },
  { value: "meeting", label: "Meeting" },
  { value: "referral", label: "Referral" },
];

export default function ContactsPage() {
  const [contactsList, setContactsList] = useState<Contact[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Interaction form
  const [interactionType, setInteractionType] = useState("email");
  const [interactionNote, setInteractionNote] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const c = await getContacts();
        if (!mounted) return;
        setContactsList(c);
      } catch {
        if (!mounted) return;
        setLoadError("Failed to load contacts.");
      } finally {
        if (mounted) setLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function handleAdd() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    startTransition(async () => {
      await createContact({
        name: name.trim(), role: role.trim() || undefined, company: company.trim() || undefined,
        email: email.trim() || undefined, linkedin: linkedin.trim() || undefined,
        phone: phone.trim() || undefined, notes: notes.trim() || undefined,
      });
      const updated = await getContacts();
      setContactsList(updated);
      setAddDialogOpen(false);
      setName(""); setRole(""); setCompany(""); setEmail(""); setLinkedin(""); setPhone(""); setNotes("");
      toast.success("Contact added");
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteContact(id);
      setContactsList(contactsList.filter((c) => c.id !== id));
      if (selectedContact === id) setSelectedContact(null);
      toast.success("Contact removed");
    });
  }

  function handleSelectContact(id: string) {
    setSelectedContact(id);
    getInteractionsForContact(id).then(setInteractions);
  }

  function handleAddInteraction() {
    if (!selectedContact) return;
    startTransition(async () => {
      await addInteraction({
        contactId: selectedContact!,
        type: interactionType,
        note: interactionNote.trim() || undefined,
      });
      const updated = await getInteractionsForContact(selectedContact!);
      setInteractions(updated);
      setInteractionNote("");
      toast.success("Interaction logged");
    });
  }

  if (!loaded) return <div className="text-sm text-muted-foreground">Loading contacts...</div>;
  if (loadError) {
    return (
      <EmptyState
        icon={Users}
        title="Could not load contacts"
        description={loadError}
      />
    );
  }

  const selected = contactsList.find((c) => c.id === selectedContact);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{contactsList.length} contacts</p>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Contact
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" /></div>
                <div className="space-y-1"><Label>Role</Label><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Recruiter" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Deloitte" /></div>
                <div className="space-y-1"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>LinkedIn</Label><Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="linkedin.com/in/..." /></div>
                <div className="space-y-1"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              </div>
              <div className="space-y-1"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How you know them, context..." rows={2} /></div>
              <Button onClick={handleAdd} disabled={isPending}>{isPending ? "Adding..." : "Add Contact"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {contactsList.length === 0 ? (
        <EmptyState icon={Users} title="No contacts yet" description="Add recruiters, hiring managers, and referrals to track your network." />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Contact list */}
          <div className="md:col-span-1 space-y-2">
            {contactsList.map((c) => (
              <Card
                key={c.id}
                className={`cursor-pointer transition-all ${selectedContact === c.id ? "ring-2 ring-primary shadow-glass" : "glass shadow-card border-white/30 hover:shadow-glass"}`}
                onClick={() => handleSelectContact(c.id)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      {c.role && <p className="text-xs text-muted-foreground">{c.role}</p>}
                      {c.company && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" /> {c.company}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact detail */}
          <div className="md:col-span-2">
            {selected ? (
              <Card className="glass shadow-card border-white/30">
                <CardHeader>
                  <CardTitle className="text-base">{selected.name}</CardTitle>
                  {selected.role && <p className="text-sm text-muted-foreground">{selected.role} {selected.company ? `at ${selected.company}` : ""}</p>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3 flex-wrap">
                    {selected.email && (
                      <Badge variant="outline" className="gap-1"><Mail className="h-3 w-3" /> {selected.email}</Badge>
                    )}
                    {selected.linkedin && (
                      <a href={selected.linkedin.startsWith("http") ? selected.linkedin : `https://${selected.linkedin}`} target="_blank" rel="noopener noreferrer">
                        <Badge variant="outline" className="gap-1"><Link2 className="h-3 w-3" /> LinkedIn</Badge>
                      </a>
                    )}
                    {selected.phone && (
                      <Badge variant="outline" className="gap-1"><Phone className="h-3 w-3" /> {selected.phone}</Badge>
                    )}
                  </div>
                  {selected.notes && <p className="text-sm text-muted-foreground">{selected.notes}</p>}

                  {/* Log interaction */}
                  <div className="flex gap-2 items-end pt-2 border-t border-border">
                    <Select value={interactionType} onValueChange={(v) => setInteractionType(v ?? "email")}>
                      <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INTERACTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input value={interactionNote} onChange={(e) => setInteractionNote(e.target.value)} placeholder="Note..." className="flex-1 h-9" onKeyDown={(e) => e.key === "Enter" && handleAddInteraction()} />
                    <Button size="sm" onClick={handleAddInteraction} disabled={isPending}>Log</Button>
                  </div>

                  {/* Interaction history */}
                  {interactions.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-medium text-muted-foreground">History</p>
                      {interactions.map((i) => (
                        <div key={i.id} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <Badge variant="secondary" className="text-[10px]">{i.type}</Badge>
                          {i.note && <span className="text-muted-foreground truncate">{i.note}</span>}
                          <span className="text-xs text-muted-foreground ml-auto font-mono shrink-0">
                            {formatDistanceToNow(new Date(i.date), { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                Select a contact to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

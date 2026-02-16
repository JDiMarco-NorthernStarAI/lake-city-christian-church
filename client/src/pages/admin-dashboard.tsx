import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Play, Calendar, Users, Mail, FileText, Settings, LogOut,
  Plus, Pencil, Trash2, BarChart3, Eye, TrendingUp,
} from "lucide-react";
import type { Sermon, Event, TeamMember, ContactSubmission, ConnectCard, SiteSetting } from "@shared/schema";
import wordsLogoPath from "@assets/Words_and_Logo_1770933488639.png";

type Tab = "dashboard" | "analytics" | "sermons" | "events" | "team" | "messages" | "connect" | "settings";

const navItems: { id: Tab; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "sermons", label: "Sermons", icon: Play },
  { id: "events", label: "Events", icon: Calendar },
  { id: "team", label: "Team", icon: Users },
  { id: "messages", label: "Messages", icon: Mail },
  { id: "connect", label: "Connect Cards", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const { data: user, isLoading: authLoading, error: authError } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/admin");
    }
  }, [authLoading, user, setLocation]);

  async function handleLogout() {
    try {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.clear();
      setLocation("/admin");
    } catch {
      toast({ title: "Error", description: "Failed to logout", variant: "destructive" });
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-auth">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const sidebarStyle = { "--sidebar-width": "16rem" } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle} data-testid="admin-dashboard">
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <img
              src={wordsLogoPath}
              alt="Lake City Christian Church"
              className="h-10 object-contain"
              data-testid="img-sidebar-logo"
            />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeTab === item.id}
                        onClick={() => setActiveTab(item.id)}
                        data-testid={`nav-${item.id}`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} data-testid="nav-logout">
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "sermons" && <SermonsTab />}
          {activeTab === "events" && <EventsTab />}
          {activeTab === "team" && <TeamTab />}
          {activeTab === "messages" && <MessagesTab />}
          {activeTab === "connect" && <ConnectCardsTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </div>
    </SidebarProvider>
  );
}

function DashboardTab() {
  const { data: sermons } = useQuery<Sermon[]>({ queryKey: ["/api/sermons"] });
  const { data: events } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const { data: team } = useQuery<TeamMember[]>({ queryKey: ["/api/team"] });
  const { data: messages } = useQuery<ContactSubmission[]>({ queryKey: ["/api/contact"] });

  const stats = [
    { label: "Sermons", count: sermons?.length ?? 0, icon: Play },
    { label: "Events", count: events?.length ?? 0, icon: Calendar },
    { label: "Team Members", count: team?.length ?? 0, icon: Users },
    { label: "Messages", count: messages?.length ?? 0, icon: Mail },
  ];

  return (
    <div data-testid="tab-dashboard">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`count-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                {stat.count}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const { data: stats, isLoading } = useQuery<{
    totalViews: number;
    uniqueVisitors: number;
    todayViews: number;
    topPages: { path: string; count: number }[];
    recentDays: { date: string; count: number }[];
  }>({ queryKey: ["/api/analytics/stats"] });

  if (isLoading) return <p className="text-muted-foreground">Loading analytics...</p>;
  if (!stats) return <p className="text-muted-foreground">No analytics data available.</p>;

  const maxDayCount = Math.max(...stats.recentDays.map(d => d.count), 1);

  const pageNames: Record<string, string> = {
    "/": "Home",
    "/about": "About",
    "/about/story": "Our Story",
    "/about/beliefs": "What We Believe",
    "/about/leadership": "Leadership",
    "/ministries": "Ministries",
    "/ministries/kids": "Kids Ministry",
    "/ministries/students": "Students",
    "/ministries/small-groups": "Small Groups",
    "/ministries/connect-serve": "Connect & Serve",
    "/encounter": "Encounter (Sermons)",
    "/announcements": "What's Happening",
    "/give": "Give",
    "/plan-a-visit": "Plan a Visit",
    "/contact": "Contact",
  };

  return (
    <div data-testid="tab-analytics">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-views">{stats.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-unique-visitors">{stats.uniqueVisitors.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Views</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-today-views">{stats.todayViews.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Page Views - Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-48" data-testid="chart-views">
            {stats.recentDays.map((day) => {
              const height = maxDayCount > 0 ? (day.count / maxDayCount) * 100 : 0;
              const dateObj = new Date(day.date + "T12:00:00");
              const label = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div
                    className="w-full rounded-t-sm"
                    style={{
                      height: `${Math.max(height, 2)}%`,
                      background: "linear-gradient(to top, #0033AA, #00D4FF)",
                      minHeight: day.count > 0 ? "4px" : "2px",
                    }}
                    data-testid={`bar-${day.date}`}
                  />
                  <div className="invisible group-hover:visible absolute -top-8 bg-popover border rounded-md px-2 py-1 text-xs whitespace-nowrap z-10">
                    {label}: {day.count} views
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{new Date(stats.recentDays[0]?.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Pages</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topPages.length === 0 ? (
            <p className="text-muted-foreground text-sm">No page view data yet. Analytics will appear as visitors browse your site.</p>
          ) : (
            <Table data-testid="table-top-pages">
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topPages.map((page) => (
                  <TableRow key={page.path} data-testid={`row-page-${page.path.replace(/\//g, "-")}`}>
                    <TableCell className="font-medium">{pageNames[page.path] || page.path}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{page.path}</TableCell>
                    <TableCell className="text-right">{page.count.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SermonsTab() {
  const { toast } = useToast();
  const { data: sermons, isLoading } = useQuery<Sermon[]>({ queryKey: ["/api/sermons"] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Sermon | null>(null);
  const [form, setForm] = useState({ title: "", youtubeUrl: "", date: "", series: "", description: "" });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("POST", "/api/sermons", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sermons"] });
      toast({ title: "Sermon created" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { await apiRequest("PATCH", `/api/sermons/${id}`, data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sermons"] });
      toast({ title: "Sermon updated" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/sermons/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sermons"] });
      toast({ title: "Sermon deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function openAdd() {
    setEditing(null);
    setForm({ title: "", youtubeUrl: "", date: "", series: "", description: "" });
    setDialogOpen(true);
  }

  function openEdit(sermon: Sermon) {
    setEditing(sermon);
    setForm({
      title: sermon.title,
      youtubeUrl: sermon.youtubeUrl,
      date: sermon.date,
      series: sermon.series || "",
      description: sermon.description || "",
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { ...form, series: form.series || null, description: form.description || null };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  return (
    <div data-testid="tab-sermons">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-bold">Sermons</h1>
        <Button onClick={openAdd} data-testid="button-add-sermon">
          <Plus className="w-4 h-4 mr-2" /> Add Sermon
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <Table data-testid="table-sermons">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>YouTube URL</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sermons?.map((sermon) => (
              <TableRow key={sermon.id} data-testid={`row-sermon-${sermon.id}`}>
                <TableCell>{sermon.title}</TableCell>
                <TableCell>{sermon.date}</TableCell>
                <TableCell className="max-w-[200px] truncate">{sermon.youtubeUrl}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(sermon)} data-testid={`button-edit-sermon-${sermon.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(sermon.id)} data-testid={`button-delete-sermon-${sermon.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-sermon">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Sermon" : "Add Sermon"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="input-sermon-title" />
            </div>
            <div className="space-y-2">
              <Label>YouTube URL</Label>
              <Input value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} required data-testid="input-sermon-youtube" />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required data-testid="input-sermon-date" />
            </div>
            <div className="space-y-2">
              <Label>Series</Label>
              <Input value={form.series} onChange={(e) => setForm({ ...form, series: e.target.value })} data-testid="input-sermon-series" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-sermon-description" />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-sermon">
              {editing ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventsTab() {
  const { toast } = useToast();
  const { data: events, isLoading } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState({ title: "", subtitle: "", date: "", body: "", imageUrl: "", isUpcoming: true });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("POST", "/api/events", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event created" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { await apiRequest("PATCH", `/api/events/${id}`, data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event updated" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/events/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function openAdd() {
    setEditing(null);
    setForm({ title: "", subtitle: "", date: "", body: "", imageUrl: "", isUpcoming: true });
    setDialogOpen(true);
  }

  function openEdit(event: Event) {
    setEditing(event);
    setForm({ title: event.title, subtitle: event.subtitle || "", date: event.date, body: event.body, imageUrl: event.imageUrl || "", isUpcoming: event.isUpcoming });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      subtitle: form.subtitle || null,
      imageUrl: form.imageUrl || null,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <div data-testid="tab-events">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <Button onClick={openAdd} data-testid="button-add-event">
          <Plus className="w-4 h-4 mr-2" /> Add Event
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <Table data-testid="table-events">
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Upcoming</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events?.map((event) => (
              <TableRow key={event.id} data-testid={`row-event-${event.id}`}>
                <TableCell>
                  {event.imageUrl ? (
                    <img src={event.imageUrl} alt="" className="w-12 h-9 object-cover rounded-sm" />
                  ) : (
                    <span className="text-muted-foreground text-xs">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium">{event.title}</span>
                    {event.subtitle && <span className="block text-xs text-muted-foreground">{event.subtitle}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-xs">{event.date}</TableCell>
                <TableCell>{event.isUpcoming ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(event)} data-testid={`button-edit-event-${event.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(event.id)} data-testid={`button-delete-event-${event.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-event">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Event" : "Add Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="input-event-title" />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="e.g. Middle & High School Students" data-testid="input-event-subtitle" />
            </div>
            <div className="space-y-2">
              <Label>Date / Time</Label>
              <Input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="e.g. SATURDAY MARCH 7TH @ 8:30AM" required data-testid="input-event-date" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required data-testid="input-event-body" />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://example.com/image.jpg" data-testid="input-event-image" />
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-md mt-2" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isUpcoming"
                checked={form.isUpcoming}
                onCheckedChange={(checked) => setForm({ ...form, isUpcoming: !!checked })}
                data-testid="checkbox-event-upcoming"
              />
              <Label htmlFor="isUpcoming">Upcoming</Label>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-event">
              {editing ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeamTab() {
  const { toast } = useToast();
  const { data: team, isLoading } = useQuery<TeamMember[]>({ queryKey: ["/api/team"] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({ name: "", role: "", bio: "", sortOrder: 0, isFeatured: false });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("POST", "/api/team", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({ title: "Team member added" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { await apiRequest("PATCH", `/api/team/${id}`, data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({ title: "Team member updated" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/team/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({ title: "Team member removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function openAdd() {
    setEditing(null);
    setForm({ name: "", role: "", bio: "", sortOrder: 0, isFeatured: false });
    setDialogOpen(true);
  }

  function openEdit(member: TeamMember) {
    setEditing(member);
    setForm({
      name: member.name,
      role: member.role,
      bio: member.bio || "",
      sortOrder: member.sortOrder,
      isFeatured: member.isFeatured,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { ...form, bio: form.bio || null };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  return (
    <div data-testid="tab-team">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-bold">Team</h1>
        <Button onClick={openAdd} data-testid="button-add-team">
          <Plus className="w-4 h-4 mr-2" /> Add Member
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {team?.map((member) => (
            <Card key={member.id} data-testid={`card-team-${member.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{member.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(member)} data-testid={`button-edit-team-${member.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(member.id)} data-testid={`button-delete-team-${member.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              {member.bio && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{member.bio}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-team">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="input-team-name" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required data-testid="input-team-role" />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} data-testid="input-team-bio" />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} data-testid="input-team-sort" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isFeatured"
                checked={form.isFeatured}
                onCheckedChange={(checked) => setForm({ ...form, isFeatured: !!checked })}
                data-testid="checkbox-team-featured"
              />
              <Label htmlFor="isFeatured">Featured</Label>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-team">
              {editing ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessagesTab() {
  const { data: messages, isLoading } = useQuery<ContactSubmission[]>({ queryKey: ["/api/contact"] });

  return (
    <div data-testid="tab-messages">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <Table data-testid="table-messages">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages?.map((msg) => (
              <TableRow key={msg.id} data-testid={`row-message-${msg.id}`}>
                <TableCell>{msg.name}</TableCell>
                <TableCell>{msg.email}</TableCell>
                <TableCell className="max-w-[300px] truncate">{msg.message}</TableCell>
                <TableCell>{msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function ConnectCardsTab() {
  const { data: cards, isLoading } = useQuery<ConnectCard[]>({ queryKey: ["/api/connect"] });

  return (
    <div data-testid="tab-connect">
      <h1 className="text-2xl font-bold mb-6">Connect Cards</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <Table data-testid="table-connect">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Interests</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards?.map((card) => (
              <TableRow key={card.id} data-testid={`row-connect-${card.id}`}>
                <TableCell>{card.firstName} {card.lastName}</TableCell>
                <TableCell>{card.email}</TableCell>
                <TableCell>{card.phone || "-"}</TableCell>
                <TableCell>{card.interests?.join(", ") || "-"}</TableCell>
                <TableCell>{card.createdAt ? new Date(card.createdAt).toLocaleDateString() : ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function SettingsTab() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<SiteSetting[]>({ queryKey: ["/api/settings"] });

  const settingKeys = ["church_name", "address", "service_time", "giving_url", "instagram", "facebook", "youtube"];
  const [values, setValues] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (settings && !initialized) {
      const map: Record<string, string> = {};
      settings.forEach((s) => { map[s.key] = s.value; });
      settingKeys.forEach((k) => { if (!map[k]) map[k] = ""; });
      setValues(map);
      setInitialized(true);
    }
  }, [settings, initialized]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await apiRequest("PUT", `/api/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  async function handleSave() {
    try {
      for (const key of settingKeys) {
        if (values[key]) {
          await apiRequest("PUT", `/api/settings/${key}`, { value: values[key] });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  const labelMap: Record<string, string> = {
    church_name: "Church Name",
    address: "Address",
    service_time: "Service Time",
    giving_url: "Giving URL",
    instagram: "Instagram",
    facebook: "Facebook",
    youtube: "YouTube",
  };

  return (
    <div data-testid="tab-settings">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="max-w-lg space-y-4">
          {settingKeys.map((key) => (
            <div key={key} className="space-y-2">
              <Label>{labelMap[key] || key}</Label>
              <Input
                value={values[key] || ""}
                onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                data-testid={`input-setting-${key}`}
              />
            </div>
          ))}
          <Button onClick={handleSave} data-testid="button-save-settings">
            Save Settings
          </Button>
        </div>
      )}
    </div>
  );
}

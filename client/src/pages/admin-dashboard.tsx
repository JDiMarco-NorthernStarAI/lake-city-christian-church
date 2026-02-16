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
  Plus, Pencil, Trash2, BarChart3, Eye, TrendingUp, FileEdit, Save, ChevronRight,
} from "lucide-react";
import type { Sermon, Event, TeamMember, ContactSubmission, ConnectCard, SiteSetting } from "@shared/schema";
import wordsLogoPath from "@assets/Words_and_Logo_1770933488639.png";

type Tab = "dashboard" | "analytics" | "sermons" | "events" | "team" | "messages" | "connect" | "pages" | "settings";

const navItems: { id: Tab; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "pages", label: "Page Content", icon: FileEdit },
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
          {activeTab === "pages" && <PagesTab />}
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
    "/encounter": "Watch",
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

type PageFieldConfig = {
  key: string;
  label: string;
  type: "input" | "textarea";
  placeholder?: string;
};

type PageConfig = {
  id: string;
  label: string;
  fields: PageFieldConfig[];
};

const pageConfigs: PageConfig[] = [
  {
    id: "home",
    label: "Home",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "Lake City Christian Church" },
      { key: "hero_tagline", label: "Hero Tagline", type: "input", placeholder: "Connecting people to a life-changing relationship with Jesus." },
      { key: "service_time", label: "Service Time", type: "input", placeholder: "Sunday @ 10:00 AM" },
      { key: "service_location", label: "Service Location", type: "input", placeholder: "6717 Fry Road, Middleburg Heights, OH" },
      { key: "numbers_heading", label: "By the Numbers - Heading", type: "input", placeholder: "Lake City in Numbers" },
      { key: "connect_heading", label: "Connect Section - Heading", type: "input", placeholder: "Get Connected" },
      { key: "connect_description", label: "Connect Section - Description", type: "textarea", placeholder: "We would love for you to be a part of what God is doing at Lake City." },
    ],
  },
  {
    id: "about",
    label: "Who We Are",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "Who We Are" },
      { key: "mission_heading", label: "Mission Heading", type: "input", placeholder: "Lake City Christian Church exists to connect people to a life-changing relationship with Jesus." },
      { key: "mission_description", label: "Mission Description", type: "textarea", placeholder: "We are a community of Christ-followers committed to making disciples, serving our neighbors, and growing together in faith." },
    ],
  },
  {
    id: "our-story",
    label: "Our Story",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "Our Story" },
      { key: "story_p1", label: "Story - Paragraph 1", type: "textarea", placeholder: "In the fall of 2022, Jeff Linger felt a calling..." },
      { key: "story_p2", label: "Story - Paragraph 2", type: "textarea", placeholder: "After connecting with other like-minded leaders..." },
      { key: "kln_heading", label: "KLN Section - Heading", type: "input", placeholder: "Kingdom Leaders Network" },
      { key: "kln_description", label: "KLN Section - Description", type: "textarea", placeholder: "Lake City Christian Church is affiliated with..." },
      { key: "memorial_heading", label: "Memorial - Heading", type: "input", placeholder: "In Loving Memory" },
      { key: "memorial_year", label: "Memorial - Year", type: "input", placeholder: "1958 - 2024" },
      { key: "memorial_description", label: "Memorial - Description", type: "textarea", placeholder: "In memory of John Linger..." },
    ],
  },
  {
    id: "what-we-believe",
    label: "What We Believe",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "What We Believe" },
      { key: "intro_text", label: "Intro Text", type: "textarea", placeholder: "These are the core convictions that shape our faith and guide our community." },
      { key: "belief_god", label: "Belief: God", type: "textarea", placeholder: "We believe in one God \u2013 Father, Son and Holy Spirit." },
      { key: "belief_god_the_father", label: "Belief: God the Father", type: "textarea", placeholder: "We believe in God the Father Almighty, Creator of all things visible and invisible." },
      { key: "belief_jesus_christ", label: "Belief: Jesus Christ", type: "textarea", placeholder: "We believe Jesus Christ is God's Son, born fully human and fully divine. He was crucified for the sins of the world, buried, and rose again on the third day." },
      { key: "belief_holy_spirit", label: "Belief: The Holy Spirit", type: "textarea", placeholder: "We believe the Holy Spirit is personal and active, indwelling every Christian from the moment of salvation, empowering believers for service and growth." },
      { key: "belief_the_bible", label: "Belief: The Bible", type: "textarea", placeholder: "We believe the Bible is God's Holy Word, inspired by the Holy Spirit, and is the final authority for all matters of faith and practice." },
      { key: "belief_humanity_and_sin", label: "Belief: Humanity & Sin", type: "textarea", placeholder: "We believe people were created by God but have willfully sinned and are lost without Jesus Christ." },
      { key: "belief_salvation", label: "Belief: Salvation", type: "textarea", placeholder: "We believe forgiveness of sins comes through the blood of Jesus Christ and by God's grace \u2014 not by works or human effort." },
      { key: "belief_our_response", label: "Belief: Our Response", type: "textarea", placeholder: "We believe in admitting our sin, believing and confessing Jesus as Lord, repenting of sin, trusting fully in Jesus, and being baptized by immersion." },
      { key: "belief_the_church", label: "Belief: The Church", type: "textarea", placeholder: "We believe the Church consists of all Christians everywhere who have placed their faith in Jesus Christ." },
      { key: "belief_lords_supper", label: "Belief: The Lord's Supper", type: "textarea", placeholder: "We celebrate the Lord's Supper weekly as a proclamation of Christ's death, burial, and resurrection until He comes again." },
      { key: "belief_great_commission", label: "Belief: The Great Commission", type: "textarea", placeholder: "We are called to go and make disciples of all people groups, baptizing them and teaching them to obey everything Jesus commanded." },
    ],
  },
  {
    id: "leadership",
    label: "Leadership",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "Leadership" },
      { key: "intro_text", label: "Intro Text", type: "textarea", placeholder: "Meet the pastors and leaders serving our church community." },
    ],
  },
  {
    id: "ministries",
    label: "Ministries",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "Ministries" },
    ],
  },
  {
    id: "kids-ministry",
    label: "Kids Ministry",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "Lake City Kids" },
      { key: "welcome_heading", label: "Welcome Heading", type: "input", placeholder: "Welcome to Lake City Kids" },
      { key: "welcome_description", label: "Welcome Description", type: "textarea", placeholder: "A place where your child will feel comfortable, cared for and loved!" },
      { key: "cta_heading", label: "Bottom Section - Heading", type: "input", placeholder: "Have Questions?" },
      { key: "cta_description", label: "Bottom Section - Description", type: "textarea", placeholder: "We would love to hear from you and help your family get connected." },
    ],
  },
  {
    id: "student-ministry",
    label: "Student Ministry",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "Club 419" },
      { key: "hero_subtitle", label: "Hero Subtitle", type: "input", placeholder: "Student Ministry" },
      { key: "scripture_text", label: "Scripture Quote", type: "textarea", placeholder: '"Come, follow me," Jesus said, "and I will send you out to fish for people."' },
      { key: "scripture_ref", label: "Scripture Reference", type: "input", placeholder: "Matthew 4:19" },
      { key: "description", label: "Description", type: "textarea", placeholder: "Students have the ability to impact their schools, clubs, families, and other communities in a huge way." },
      { key: "schedule", label: "Meeting Schedule", type: "input", placeholder: "Wednesday 6:30 PM - 8:00 PM" },
      { key: "meal_heading", label: "Meal Section - Heading", type: "input", placeholder: "Sponsor a Meal for Students" },
      { key: "meal_description", label: "Meal Section - Description", type: "textarea", placeholder: "Providing an opportunity for students to sit around the table and cultivate meaningful conversation and grow in friendship." },
      { key: "meal_sponsor_url", label: "Meal Sponsor Form URL", type: "input", placeholder: "https://docs.google.com/forms/d/e/1FAIpQLSdxoQ6sz59iAQPAJ_uuTo7PZTv7MzetKynFFzWVFP0ADTM7AQ/viewform" },
      { key: "student_info_heading", label: "Student Info Form - Heading", type: "input", placeholder: "Student Info Form" },
      { key: "student_info_description", label: "Student Info Form - Description", type: "textarea", placeholder: "Please fill out this form if your student is attending a Club 419 Wednesday gathering." },
      { key: "student_info_url", label: "Student Info Form URL", type: "input", placeholder: "https://docs.google.com/forms/d/e/1FAIpQLSe3Bp5P6JjCL4ramNFwoOsEqHg0ABZbd0QS9rKyyGvdB9rAvQ/viewform" },
      { key: "cta_heading", label: "Bottom Section - Heading", type: "input", placeholder: "Get Involved" },
      { key: "cta_description", label: "Bottom Section - Description", type: "textarea", placeholder: "We would love for your student to be a part of Club 419." },
    ],
  },
  {
    id: "small-groups",
    label: "Small Groups",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "City Small Groups" },
      { key: "intro_text", label: "Intro Text", type: "textarea", placeholder: "Small group gatherings exist as a way for people to engage in community and develop a closer relationship with Jesus." },
      { key: "cta_heading", label: "Bottom Section - Heading", type: "input", placeholder: "Find Your Group" },
      { key: "cta_description", label: "Bottom Section - Description", type: "textarea", placeholder: "Take the next step and connect with a small group near you." },
    ],
  },
  {
    id: "connect-serve",
    label: "Connect & Serve",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "Connect & Serve" },
      { key: "intro_heading", label: "Intro Heading", type: "input", placeholder: "We would like to get to know you better!" },
      { key: "intro_description", label: "Intro Description", type: "textarea", placeholder: "We are all a team and we lead together to create a warm and inviting atmosphere for people to encounter Jesus." },
      { key: "volunteer_heading", label: "Volunteer Section - Heading", type: "input", placeholder: "Ready to Serve?" },
      { key: "volunteer_description", label: "Volunteer Section - Description", type: "textarea", placeholder: "There is a place for everyone to serve at Lake City." },
    ],
  },
  {
    id: "give",
    label: "Give",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "Give" },
      { key: "hero_subtitle", label: "Hero Subtitle", type: "textarea", placeholder: "Your generosity helps us connect people to a life-changing relationship with Jesus." },
      { key: "scripture_text", label: "Scripture Quote", type: "textarea", placeholder: "Each of you should give what you have decided in your heart to give..." },
      { key: "scripture_ref", label: "Scripture Reference", type: "input", placeholder: "2 Corinthians 9:7" },
    ],
  },
  {
    id: "plan-a-visit",
    label: "Plan a Visit",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "Plan Your Visit" },
      { key: "hero_subtitle", label: "Hero Subtitle", type: "textarea", placeholder: "We would love to meet you! Here is everything you need to know..." },
      { key: "service_time", label: "Service Time", type: "input", placeholder: "Sunday @ 10:00 AM" },
      { key: "location", label: "Location", type: "input", placeholder: "6717 Fry Road, Middleburg Heights, OH 44130" },
      { key: "dress_code", label: "Dress Code", type: "textarea", placeholder: "Come as you are! You will see everything from jeans to dress clothes." },
      { key: "kids_info", label: "Kids Info", type: "textarea", placeholder: "We have a safe, fun environment for your kids!" },
      { key: "cta_heading", label: "Bottom Section - Heading", type: "input", placeholder: "Ready to Visit?" },
      { key: "cta_description", label: "Bottom Section - Description", type: "textarea", placeholder: "We can't wait to meet you and your family." },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "Contact Us" },
      { key: "address", label: "Address", type: "input", placeholder: "6717 Fry Road, Middleburg Heights, OH" },
      { key: "service_time", label: "Service Time", type: "input", placeholder: "Sunday @ 10:00 AM" },
      { key: "email", label: "Email", type: "input", placeholder: "info@lakecitycc.org" },
      { key: "phone", label: "Phone", type: "input", placeholder: "(216) 555-0123" },
    ],
  },
  {
    id: "encounter",
    label: "Watch (Sermons)",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "Watch" },
      { key: "hero_subtitle", label: "Hero Subtitle", type: "textarea", placeholder: "Watch & Listen" },
    ],
  },
  {
    id: "announcements",
    label: "Announcements",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "What's Happening" },
    ],
  },
];

function PagesTab() {
  const [selectedPage, setSelectedPage] = useState(pageConfigs[0].id);
  const { toast } = useToast();

  const config = pageConfigs.find((p) => p.id === selectedPage)!;

  const { data: content, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/content", selectedPage],
    queryFn: async () => {
      const res = await fetch(`/api/content/${selectedPage}`);
      if (!res.ok) return {};
      return res.json();
    },
  });

  const [values, setValues] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState<string | null>(null);

  useEffect(() => {
    if (content && initialized !== selectedPage) {
      const newValues: Record<string, string> = {};
      config.fields.forEach((f) => {
        newValues[f.key] = content[f.key] || "";
      });
      setValues(newValues);
      setInitialized(selectedPage);
    }
  }, [content, selectedPage, initialized, config.fields]);

  useEffect(() => {
    setInitialized(null);
  }, [selectedPage]);

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      await apiRequest("PUT", `/api/content/${selectedPage}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content", selectedPage] });
      toast({ title: "Saved", description: `${config.label} content updated.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
    },
  });

  function handleSave() {
    saveMutation.mutate(values);
  }

  return (
    <div data-testid="tab-pages">
      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Page Content</h1>
      <p className="text-muted-foreground mb-6">Edit the text content on each page of the website. Leave a field blank to use the default text.</p>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-56 shrink-0">
          <div className="space-y-1">
            {pageConfigs.map((page) => (
              <button
                key={page.id}
                onClick={() => setSelectedPage(page.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 transition-colors ${
                  selectedPage === page.id
                    ? "bg-primary text-primary-foreground"
                    : "hover-elevate text-foreground"
                }`}
                data-testid={`button-page-${page.id}`}
              >
                <span>{page.label}</span>
                {selectedPage === page.id && <ChevronRight className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle style={{ fontFamily: "Montserrat, sans-serif" }}>{config.label}</CardTitle>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                data-testid="button-save-page-content"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <div className="space-y-5">
                  {config.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label data-testid={`label-${field.key}`}>{field.label}</Label>
                      {field.type === "textarea" ? (
                        <Textarea
                          value={values[field.key] || ""}
                          onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                          placeholder={field.placeholder || ""}
                          rows={3}
                          className="resize-none"
                          data-testid={`input-content-${field.key}`}
                        />
                      ) : (
                        <Input
                          value={values[field.key] || ""}
                          onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                          placeholder={field.placeholder || ""}
                          data-testid={`input-content-${field.key}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
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

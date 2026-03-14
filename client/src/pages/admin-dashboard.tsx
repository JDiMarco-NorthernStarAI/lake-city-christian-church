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
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Play, Calendar, Users, Mail, FileText, Settings, LogOut,
  Plus, Pencil, Trash2, BarChart3, Eye, TrendingUp, FileEdit, Save, ChevronRight,
  Shield, UserCog, ClipboardList, ArrowUp, ArrowDown, Heart, DollarSign, Bell, Send, Link2, Copy, UserPlus,
  Camera, Loader2, ExternalLink, Download, Search, Filter, LogIn, Monitor, Smartphone, Globe,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Sermon, Event, TeamMember, ContactSubmission, ConnectCard, SiteSetting, RolePermission, Form, FormField, FormSubmission, Donation, DonationFund, SignupEvent, SignupSubmission, LoginActivity } from "@shared/schema";
import { AVAILABLE_ROLES, ROLE_LABELS, AVAILABLE_FEATURES, FEATURE_LABELS, FORM_FIELD_TYPES, FORM_FIELD_TYPE_LABELS, FORM_STATUSES, SIGNUP_CATEGORIES, SIGNUP_CATEGORY_LABELS, SIGNUP_EVENT_STATUSES, SIGNUP_VISIBILITY, SIGNUP_DISPLAY_TYPES } from "@shared/schema";
import { clearTokens } from "@/lib/v1Api";
import wordsLogoPath from "@assets/Lake_City_Words_Logo_No_Background_1771426068577.png";
import AdminSmsTab from "@/pages/admin-sms";
import { MessageSquare, Inbox } from "lucide-react";

type Tab = "dashboard" | "analytics" | "sermons" | "events" | "team" | "messages" | "connect" | "forms" | "donations" | "notifications" | "sms" | "signups" | "pages" | "settings" | "users" | "roles" | "submissions";

const allNavItems: { id: Tab; label: string; icon: any; feature: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, feature: "dashboard" },
  { id: "analytics", label: "Analytics", icon: BarChart3, feature: "analytics" },
  { id: "connect", label: "Connect Cards", icon: FileText, feature: "connect" },
  { id: "donations", label: "Donations", icon: Heart, feature: "donations" },
  { id: "events", label: "Events", icon: Calendar, feature: "events" },
  { id: "forms", label: "Form Builder", icon: ClipboardList, feature: "forms" },
  { id: "messages", label: "Messages", icon: Mail, feature: "messages" },
  { id: "notifications", label: "Notifications", icon: Bell, feature: "notifications" },
  { id: "pages", label: "Page Content", icon: FileEdit, feature: "pages" },
  { id: "roles", label: "Role Permissions", icon: Shield, feature: "roles" },
  { id: "sermons", label: "Sermons", icon: Play, feature: "sermons" },
  { id: "settings", label: "Settings", icon: Settings, feature: "settings" },
  { id: "signups", label: "Sign Ups", icon: UserPlus, feature: "signups" },
  { id: "sms", label: "SMS Messaging", icon: MessageSquare, feature: "sms" },
  { id: "submissions", label: "Submissions", icon: Inbox, feature: "forms" },
  { id: "team", label: "Team", icon: Users, feature: "team" },
  { id: "users", label: "Users", icon: UserCog, feature: "users" },
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const { data: user, isLoading: authLoading, error: authError } = useQuery<{
    id: number;
    username: string;
    roles: string[];
    features: string[];
  }>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  async function handleLogout() {
    try {
      await apiRequest("POST", "/api/auth/logout");
      clearTokens();
      queryClient.clear();
      setLocation("/");
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

  const userFeatures = user.features || [];
  const navItems = allNavItems.filter((item) => userFeatures.includes(item.feature));

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
            <a href="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mt-2" data-testid="link-back-to-site">
              <ExternalLink className="w-3 h-3" />
              Back to Site
            </a>
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

        <div className="flex-1 overflow-auto flex flex-col">
          <header className="flex items-center gap-2 p-3 border-b md:hidden sticky top-0 z-50 bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <span className="text-sm font-medium truncate">
              {navItems.find(item => item.id === activeTab)?.label || "Dashboard"}
            </span>
          </header>
          <div className="flex-1 p-6">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "sermons" && <SermonsTab />}
          {activeTab === "events" && <EventsTab />}
          {activeTab === "team" && <TeamTab />}
          {activeTab === "messages" && <MessagesTab />}
          {activeTab === "connect" && <ConnectCardsTab />}
          {activeTab === "forms" && <FormsTab />}
          {activeTab === "submissions" && <SubmissionsTab />}
          {activeTab === "donations" && <DonationsTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "sms" && <AdminSmsTab />}
          {activeTab === "signups" && <SignupsTab />}
          {activeTab === "pages" && <PagesTab />}
          {activeTab === "settings" && <SettingsTab />}
          {activeTab === "users" && <UsersTab currentUser={user} />}
          {activeTab === "roles" && <RolesTab isSuperAdmin={user.roles.includes("super_admin")} />}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

function DashboardTab() {
  const { data: sermons } = useQuery<Sermon[]>({ queryKey: ["/api/sermons"] });
  const { data: events } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const { data: team } = useQuery<TeamMember[]>({ queryKey: ["/api/team"] });

  const lastSeen = localStorage.getItem("admin_dashboard_last_seen") || new Date(0).toISOString();

  const { data: dashStats } = useQuery<{
    connectCards: { total: number; new: number };
    formSubmissions: { total: number; new: number };
    signupSubmissions: { total: number; new: number };
    messages: { total: number; new: number };
  }>({
    queryKey: ["/api/admin/dashboard-stats", lastSeen],
    queryFn: async () => {
      const res = await fetch(`/api/admin/dashboard-stats?since=${encodeURIComponent(lastSeen)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  useEffect(() => {
    localStorage.setItem("admin_dashboard_last_seen", new Date().toISOString());
  }, []);

  const contentStats = [
    { label: "Sermons", count: sermons?.length ?? 0, icon: Play },
    { label: "Events", count: events?.length ?? 0, icon: Calendar },
    { label: "Team Members", count: team?.length ?? 0, icon: Users },
  ];

  const activityItems = [
    { label: "Messages", total: dashStats?.messages.total ?? 0, newCount: dashStats?.messages.new ?? 0, icon: Mail },
    { label: "Connect Cards", total: dashStats?.connectCards.total ?? 0, newCount: dashStats?.connectCards.new ?? 0, icon: FileText },
    { label: "Sign Ups", total: dashStats?.signupSubmissions.total ?? 0, newCount: dashStats?.signupSubmissions.new ?? 0, icon: UserPlus },
    { label: "Form Submissions", total: dashStats?.formSubmissions.total ?? 0, newCount: dashStats?.formSubmissions.new ?? 0, icon: ClipboardList },
  ];

  return (
    <div data-testid="tab-dashboard">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Content</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {contentStats.map((stat) => (
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

      <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Recent Activity</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activityItems.map((item) => (
          <Card key={item.label} data-testid={`stat-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
              <item.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl font-bold" data-testid={`count-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  {item.total}
                </span>
                {item.newCount > 0 && (
                  <Badge variant="default" data-testid={`badge-new-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    {item.newCount} new
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const PAGE_NAMES: Record<string, string> = {
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

function AnalyticsTab() {
  const [analyticsView, setAnalyticsView] = useState<"overview" | "reports">("overview");

  return (
    <div data-testid="tab-analytics">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          <Button
            variant={analyticsView === "overview" ? "default" : "outline"}
            onClick={() => setAnalyticsView("overview")}
            data-testid="button-analytics-overview"
          >
            <Eye className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={analyticsView === "reports" ? "default" : "outline"}
            onClick={() => setAnalyticsView("reports")}
            data-testid="button-analytics-reports"
          >
            <Filter className="w-4 h-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {analyticsView === "overview" ? <AnalyticsOverview /> : <AnalyticsReports />}
    </div>
  );
}

function AnalyticsOverview() {
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

  return (
    <>
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

      <Card className="mb-8">
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
                    <TableCell className="font-medium">{PAGE_NAMES[page.path] || page.path}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{page.path}</TableCell>
                    <TableCell className="text-right">{page.count.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LoginActivitySection />
    </>
  );
}

type ReportData = {
  totalViews: number;
  uniqueVisitors: number;
  topPages: { path: string; count: number }[];
  dailyBreakdown: { date: string; count: number }[];
  totalLogins: number;
  logins: LoginActivity[];
  uniquePages: string[];
};

function AnalyticsReports() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [selectedPage, setSelectedPage] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [reportTab, setReportTab] = useState<"pageviews" | "logins">("pageviews");

  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (selectedPage !== "all") params.set("path", selectedPage);
  if (selectedSource !== "all") params.set("source", selectedSource);

  const { data: report, isLoading } = useQuery<ReportData>({
    queryKey: ["/api/analytics/report", startDate, endDate, selectedPage, selectedSource],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/report?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
  });

  const exportCsv = () => {
    if (!report) return;
    if (reportTab === "pageviews") {
      const rows = [["Date", "Page Views"]];
      for (const day of report.dailyBreakdown) {
        rows.push([day.date, String(day.count)]);
      }
      rows.push([]);
      rows.push(["Page", "Views"]);
      for (const page of report.topPages) {
        rows.push([PAGE_NAMES[page.path] || page.path, String(page.count)]);
      }
      rows.push([]);
      rows.push(["Total Views", String(report.totalViews)]);
      rows.push(["Unique Visitors", String(report.uniqueVisitors)]);
      const csv = rows.map(r => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-pageviews-${startDate}-to-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const rows = [["Date/Time", "User", "Email", "Source", "Method"]];
      for (const login of report.logins) {
        rows.push([
          login.createdAt ? new Date(login.createdAt).toLocaleString() : "",
          login.displayName || login.username || "",
          login.email || "",
          login.source,
          login.loginMethod,
        ]);
      }
      const csv = rows.map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-logins-${startDate}-to-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const maxBarCount = report?.dailyBreakdown ? Math.max(...report.dailyBreakdown.map(d => d.count), 1) : 1;

  return (
    <div data-testid="analytics-reports">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-report-start-date"
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-report-end-date"
              />
            </div>
            <div>
              <Label>Page</Label>
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger data-testid="select-report-page">
                  <SelectValue placeholder="All Pages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pages</SelectItem>
                  {Object.entries(PAGE_NAMES).map(([path, name]) => (
                    <SelectItem key={path} value={path}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Login Source</Label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger data-testid="select-report-source">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="app">Web App</SelectItem>
                  <SelectItem value="ios">iOS</SelectItem>
                  <SelectItem value="android">Android</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Generating report...</div>
      ) : !report ? (
        <p className="text-muted-foreground">No data available for the selected filters.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                <Eye className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="report-total-views">{report.totalViews.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="report-unique-visitors">{report.uniqueVisitors.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pages Visited</CardTitle>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="report-pages-count">{report.uniquePages.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
                <LogIn className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="report-total-logins">{report.totalLogins.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex gap-2">
              <Button
                variant={reportTab === "pageviews" ? "default" : "outline"}
                onClick={() => setReportTab("pageviews")}
                data-testid="button-report-pageviews"
              >
                Page Views
              </Button>
              <Button
                variant={reportTab === "logins" ? "default" : "outline"}
                onClick={() => setReportTab("logins")}
                data-testid="button-report-logins"
              >
                Logins
              </Button>
            </div>
            <Button variant="outline" onClick={exportCsv} data-testid="button-export-report-csv">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {reportTab === "pageviews" ? (
            <>
              {report.dailyBreakdown.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Daily Page Views</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-1 h-48" data-testid="report-chart">
                      {report.dailyBreakdown.map((day) => {
                        const height = maxBarCount > 0 ? (day.count / maxBarCount) * 100 : 0;
                        const dateObj = new Date(day.date + "T12:00:00");
                        const label = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        return (
                          <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full group relative" style={{ minWidth: "4px" }}>
                            <div
                              className="w-full rounded-t-sm"
                              style={{
                                height: `${Math.max(height, 2)}%`,
                                background: "linear-gradient(to top, #0033AA, #00D4FF)",
                                minHeight: day.count > 0 ? "4px" : "2px",
                              }}
                            />
                            <div className="invisible group-hover:visible absolute -top-8 bg-popover border rounded-md px-2 py-1 text-xs whitespace-nowrap z-10">
                              {label}: {day.count} views
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {report.dailyBreakdown.length > 1 && (
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>{new Date(report.dailyBreakdown[0].date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <span>{new Date(report.dailyBreakdown[report.dailyBreakdown.length - 1].date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pages Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.topPages.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No page view data for this period.</p>
                  ) : (
                    <Table data-testid="report-table-pages">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Page</TableHead>
                          <TableHead>Path</TableHead>
                          <TableHead className="text-right">Views</TableHead>
                          <TableHead className="text-right">% of Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.topPages.map((page) => (
                          <TableRow key={page.path}>
                            <TableCell className="font-medium">{PAGE_NAMES[page.path] || page.path}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{page.path}</TableCell>
                            <TableCell className="text-right">{page.count.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {report.totalViews > 0 ? ((page.count / report.totalViews) * 100).toFixed(1) : 0}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Login Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {report.logins.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No login activity for this period.</p>
                ) : (
                  <Table data-testid="report-table-logins">
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Date/Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.logins.map((login) => (
                        <TableRow key={login.id}>
                          <TableCell className="font-medium">{login.displayName || login.username}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{login.email || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {login.source === "admin" ? "Admin" : login.source === "app" ? "Web App" : login.source}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{login.loginMethod}</TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {login.createdAt ? new Date(login.createdAt).toLocaleString() : ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function LoginActivitySection() {
  const { data: logins, isLoading } = useQuery<LoginActivity[]>({
    queryKey: ["/api/analytics/logins"],
  });

  const sourceIcon = (source: string) => {
    if (source === "admin") return <Monitor className="w-4 h-4 text-muted-foreground" />;
    if (source === "ios" || source === "android") return <Smartphone className="w-4 h-4 text-muted-foreground" />;
    return <Globe className="w-4 h-4 text-muted-foreground" />;
  };

  const sourceLabel = (source: string) => {
    const labels: Record<string, string> = { admin: "Admin", app: "Web App", ios: "iOS", android: "Android" };
    return labels[source] || source;
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  };

  return (
    <Card data-testid="card-login-activity">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <LogIn className="w-5 h-5" />
          Recent Logins
        </CardTitle>
        {logins && <span className="text-sm text-muted-foreground">{logins.length} total</span>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading login activity...</p>
        ) : !logins || logins.length === 0 ? (
          <p className="text-muted-foreground text-sm">No login activity yet. Logins will appear here as users sign in.</p>
        ) : (
          <Table data-testid="table-login-activity">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logins.map((login) => (
                <TableRow key={login.id} data-testid={`row-login-${login.id}`}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{login.displayName || login.username}</span>
                      {login.email && <span className="text-xs text-muted-foreground">{login.email}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {sourceIcon(login.source)}
                      <span className="text-sm">{sourceLabel(login.source)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{login.loginMethod}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatTime(login.createdAt as string | null)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/team", data);
      const member = await res.json();
      if (photoFile) await uploadTeamPhoto(member.id, photoFile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({ title: "Team member added" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PATCH", `/api/team/${id}`, data);
      if (photoFile) await uploadTeamPhoto(id, photoFile);
    },
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

  function getTeamPhotoSrc(path: string | null | undefined) {
    if (!path) return undefined;
    if (path.startsWith("http")) return path;
    return `/objects${path.startsWith("/") ? path : `/${path}`}`;
  }

  async function uploadTeamPhoto(memberId: number, file: File) {
    try {
      setUploadingPhoto(true);
      const uploadRes = await apiRequest("POST", `/api/team/${memberId}/photo`);
      const { uploadURL, objectPath } = await uploadRes.json();
      await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      await apiRequest("PUT", `/api/team/${memberId}/photo`, { objectPath });
    } catch (err: any) {
      toast({ title: "Photo upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: "", role: "", bio: "", sortOrder: 0, isFeatured: false });
    setPhotoFile(null);
    setPhotoPreview(null);
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
    setPhotoFile(null);
    setPhotoPreview(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    setPhotoFile(null);
    setPhotoPreview(null);
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
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                    {member.photoUrl ? (
                      <img src={getTeamPhotoSrc(member.photoUrl)} alt={member.name} className="w-full h-full object-cover" data-testid={`img-team-photo-${member.id}`} />
                    ) : (
                      <Users className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{member.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
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
            <div className="flex justify-center">
              <label className="relative cursor-pointer group" data-testid="label-team-photo">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {photoPreview || editing?.photoUrl ? (
                    <img src={photoPreview || getTeamPhotoSrc(editing?.photoUrl) || ""} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} data-testid="input-team-photo" />
              </label>
            </div>
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
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending || uploadingPhoto} data-testid="button-submit-team">
              {(createMutation.isPending || updateMutation.isPending || uploadingPhoto) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
  const { toast } = useToast();
  const { data: cards, isLoading } = useQuery<ConnectCard[]>({ queryKey: ["/api/connect"] });
  const [selectedCard, setSelectedCard] = useState<ConnectCard | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardCardId, setForwardCardId] = useState<number | null>(null);
  const [forwardEmail, setForwardEmail] = useState("");
  const [forwarding, setForwarding] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/connect/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connect"] });
      toast({ title: "Connect card deleted" });
      setSelectedCard(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    },
  });

  async function handleForward() {
    if (!forwardCardId || !forwardEmail) return;
    setForwarding(true);
    try {
      const res = await apiRequest("POST", `/api/connect/${forwardCardId}/forward`, { recipientEmail: forwardEmail });
      const data = await res.json();
      toast({ title: "Forwarded", description: data.message });
      setForwardOpen(false);
      setForwardEmail("");
      setForwardCardId(null);
    } catch {
      toast({ title: "Error", description: "Failed to forward", variant: "destructive" });
    } finally {
      setForwarding(false);
    }
  }

  return (
    <div data-testid="tab-connect">
      <h1 className="text-2xl font-bold mb-6">Connect Cards</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !cards?.length ? (
        <p className="text-muted-foreground">No connect cards yet.</p>
      ) : (
        <div className="space-y-4">
          <Table data-testid="table-connect">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Interests</TableHead>
                <TableHead>Prayer Request</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((card) => (
                <TableRow key={card.id} data-testid={`row-connect-${card.id}`}>
                  <TableCell className="font-medium">{card.firstName} {card.lastName}</TableCell>
                  <TableCell>{card.email}</TableCell>
                  <TableCell>{card.phone || "-"}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{card.address || "-"}</TableCell>
                  <TableCell>{card.interests?.join(", ") || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{card.prayerRequest || "-"}</TableCell>
                  <TableCell>{card.createdAt ? new Date(card.createdAt).toLocaleDateString() : ""}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setSelectedCard(card)} data-testid={`button-view-connect-${card.id}`}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { setForwardCardId(card.id); setForwardOpen(true); }} data-testid={`button-forward-connect-${card.id}`}>
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this connect card?")) deleteMutation.mutate(card.id); }} data-testid={`button-delete-connect-${card.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selectedCard} onOpenChange={(open) => { if (!open) setSelectedCard(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect Card Details</DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="space-y-4" data-testid="dialog-connect-detail">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">First Name</Label>
                  <p className="font-medium" data-testid="text-connect-firstname">{selectedCard.firstName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Last Name</Label>
                  <p className="font-medium" data-testid="text-connect-lastname">{selectedCard.lastName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="font-medium" data-testid="text-connect-email">{selectedCard.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Phone</Label>
                  <p className="font-medium" data-testid="text-connect-phone">{selectedCard.phone || "-"}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Address</Label>
                <p className="font-medium" data-testid="text-connect-address">{selectedCard.address || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Interests</Label>
                <p className="font-medium" data-testid="text-connect-interests">{selectedCard.interests?.join(", ") || "-"}</p>
              </div>
              {selectedCard.prayerRequest && (
                <div>
                  <Label className="text-muted-foreground text-xs">Prayer Request</Label>
                  <p className="font-medium whitespace-pre-wrap" data-testid="text-connect-prayer">{selectedCard.prayerRequest}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground text-xs">Submitted</Label>
                <p className="font-medium">{selectedCard.createdAt ? new Date(selectedCard.createdAt).toLocaleString() : "-"}</p>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => { setForwardCardId(selectedCard.id); setForwardOpen(true); setSelectedCard(null); }} data-testid="button-forward-from-detail">
                  <Send className="w-4 h-4 mr-2" />
                  Forward
                </Button>
                <Button variant="destructive" onClick={() => { if (confirm("Delete this connect card?")) { deleteMutation.mutate(selectedCard.id); } }} data-testid="button-delete-from-detail">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={forwardOpen} onOpenChange={(open) => { if (!open) { setForwardOpen(false); setForwardEmail(""); setForwardCardId(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Forward Connect Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter the email address to forward this connect card to (e.g. the pastor).</p>
            <div className="space-y-2">
              <Label htmlFor="forward-email">Recipient Email</Label>
              <Input id="forward-email" type="email" placeholder="pastor@example.com" value={forwardEmail} onChange={(e) => setForwardEmail(e.target.value)} data-testid="input-forward-email" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setForwardOpen(false); setForwardEmail(""); setForwardCardId(null); }}>Cancel</Button>
              <Button onClick={handleForward} disabled={!forwardEmail || forwarding} data-testid="button-confirm-forward">
                {forwarding ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
      { key: "volunteer_heading", label: "Volunteer Section - Heading", type: "input", placeholder: "Volunteer and Connect" },
      { key: "volunteer_description", label: "Volunteer Section - Description", type: "textarea", placeholder: "There is a place for everyone to serve at Lake City. Whether you love greeting people, working with kids, or serving behind the scenes, we would love to have you on the team." },
      { key: "volunteer_url", label: "Volunteer Form URL", type: "input", placeholder: "https://docs.google.com/forms/d/e/1FAIpQLSd4-YBkgZV6FI76SNW7ijofq5TDCdXaaD5fj2-P5iHx4A9EIg/viewform" },
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
  {
    id: "login",
    label: "Login",
    fields: [
      { key: "title", label: "Title", type: "input", placeholder: "Sign In" },
      { key: "subtitle", label: "Subtitle", type: "input", placeholder: "Welcome back to Lake City Christian Church" },
    ],
  },
  {
    id: "register",
    label: "Register",
    fields: [
      { key: "title", label: "Title", type: "input", placeholder: "Create Account" },
      { key: "subtitle", label: "Subtitle", type: "input", placeholder: "Join the Lake City Christian Church community" },
    ],
  },
  {
    id: "signups",
    label: "Sign Ups",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "Sign Ups" },
      { key: "hero_subtitle", label: "Hero Subtitle", type: "textarea", placeholder: "Browse and register for upcoming events, classes, and volunteer opportunities" },
    ],
  },
  {
    id: "give-success",
    label: "Give - Success",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "input", placeholder: "Thank You!" },
      { key: "heading", label: "Heading", type: "input", placeholder: "Your Donation Was Successful" },
      { key: "message", label: "Message", type: "textarea", placeholder: "Thank you for your generous gift to Lake City Christian Church. Your support helps us connect people to a life-changing relationship with Jesus." },
      { key: "receipt_note", label: "Receipt Note", type: "input", placeholder: "A receipt has been sent to your email address. Your donation may be tax-deductible." },
    ],
  },
  {
    id: "account",
    label: "My Account",
    fields: [
      { key: "title", label: "Page Title", type: "input", placeholder: "My Account" },
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

type AdminUser = {
  id: number;
  username: string;
  roles: string[];
  email: string | null;
  name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  maritalStatus: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  profilePhotoUrl: string | null;
};

function UsersTab({ currentUser }: { currentUser: { id: number; username: string; roles: string[] } }) {
  const { toast } = useToast();
  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/users"],
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({
    username: "", password: "", email: "", name: "", phone: "",
    address: "", city: "", state: "", zip: "",
    gender: "", dateOfBirth: "", maritalStatus: "",
    emergencyContactName: "", emergencyContactPhone: "",
    roles: ["member"] as string[],
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const isSuperAdmin = currentUser.roles.includes("super_admin");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/users", data);
      return res.json();
    },
    onSuccess: async (newUser: AdminUser) => {
      if (photoFile) {
        await uploadPhotoForUser(newUser.id, photoFile);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User created" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { await apiRequest("PATCH", `/api/users/${id}`, data); },
    onSuccess: async () => {
      if (photoFile && editing) {
        await uploadPhotoForUser(editing.id, photoFile);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User updated" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/users/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  async function uploadPhotoForUser(userId: number, file: File) {
    try {
      setUploadingPhoto(true);
      const uploadRes = await apiRequest("POST", `/api/users/${userId}/photo`);
      const { uploadURL, objectPath } = await uploadRes.json();
      await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      await apiRequest("PUT", `/api/users/${userId}/photo`, { objectPath });
    } catch (err: any) {
      toast({ title: "Photo upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setForm({
      username: "", password: "", email: "", name: "", phone: "",
      address: "", city: "", state: "", zip: "",
      gender: "", dateOfBirth: "", maritalStatus: "",
      emergencyContactName: "", emergencyContactPhone: "",
      roles: ["member"],
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setDialogOpen(true);
  }

  function openEdit(user: AdminUser) {
    setEditing(user);
    setForm({
      username: user.username,
      password: "",
      email: user.email || "",
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      zip: user.zip || "",
      gender: user.gender || "",
      dateOfBirth: user.dateOfBirth || "",
      maritalStatus: user.maritalStatus || "",
      emergencyContactName: user.emergencyContactName || "",
      emergencyContactPhone: user.emergencyContactPhone || "",
      roles: [...user.roles],
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setDialogOpen(true);
  }

  function openView(user: AdminUser) {
    setViewingUser(user);
    setViewDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  }

  function toggleRole(role: string) {
    setForm((prev) => {
      const has = prev.roles.includes(role);
      const newRoles = has ? prev.roles.filter((r) => r !== role) : [...prev.roles, role];
      return { ...prev, roles: newRoles.length > 0 ? newRoles : ["member"] };
    });
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = {
      username: form.username,
      roles: form.roles,
      email: form.email || null,
      name: form.name || null,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      zip: form.zip || null,
      gender: form.gender || null,
      dateOfBirth: form.dateOfBirth || null,
      maritalStatus: form.maritalStatus || null,
      emergencyContactName: form.emergencyContactName || null,
      emergencyContactPhone: form.emergencyContactPhone || null,
    };
    if (editing) {
      if (form.password) payload.password = form.password;
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      payload.password = form.password;
      createMutation.mutate(payload);
    }
  }

  const assignableRoles = AVAILABLE_ROLES.filter((r) => {
    if (r === "super_admin" && !isSuperAdmin) return false;
    return true;
  });

  function getPhotoSrc(path: string | null) {
    if (!path) return undefined;
    if (path.startsWith("http")) return path;
    return `/objects${path.startsWith("/") ? path : `/${path}`}`;
  }

  function getInitials(user: AdminUser) {
    if (user.name) {
      return user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    }
    return user.username.slice(0, 2).toUpperCase();
  }

  return (
    <div data-testid="tab-users">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={openAdd} data-testid="button-add-user">
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground" data-testid="loading-users">Loading...</p>
      ) : (
        <Table data-testid="table-users">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((u) => (
              <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={getPhotoSrc(u.profilePhotoUrl)} alt={u.name || u.username} />
                      <AvatarFallback className="text-xs">{getInitials(u)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium" data-testid={`text-user-name-${u.id}`}>{u.name || u.username}</div>
                      {u.name && <div className="text-xs text-muted-foreground" data-testid={`text-user-username-${u.id}`}>@{u.username}</div>}
                    </div>
                  </div>
                </TableCell>
                <TableCell data-testid={`text-user-email-${u.id}`}>{u.email || "—"}</TableCell>
                <TableCell data-testid={`text-user-phone-${u.id}`}>{u.phone || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {u.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="text-xs" data-testid={`badge-role-${u.id}-${r}`}>
                        {ROLE_LABELS[r] || r}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openView(u)} data-testid={`button-view-user-${u.id}`}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(u)} data-testid={`button-edit-user-${u.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {u.id !== currentUser.id && (
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this user?")) deleteMutation.mutate(u.id); }} data-testid={`button-delete-user-${u.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto" data-testid="dialog-view-user">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={getPhotoSrc(viewingUser.profilePhotoUrl)} alt={viewingUser.name || viewingUser.username} />
                  <AvatarFallback>{getInitials(viewingUser)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold" data-testid="view-user-name">{viewingUser.name || viewingUser.username}</h3>
                  <p className="text-sm text-muted-foreground" data-testid="view-user-username">@{viewingUser.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p data-testid="view-user-email">{viewingUser.email || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone</span>
                  <p data-testid="view-user-phone">{viewingUser.phone || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Gender</span>
                  <p data-testid="view-user-gender">{viewingUser.gender || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date of Birth</span>
                  <p data-testid="view-user-dob">{viewingUser.dateOfBirth || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Marital Status</span>
                  <p data-testid="view-user-marital">{viewingUser.maritalStatus || "—"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Address</span>
                  <p data-testid="view-user-address">
                    {[viewingUser.address, viewingUser.city, viewingUser.state, viewingUser.zip].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Emergency Contact</span>
                  <p data-testid="view-user-emergency-name">{viewingUser.emergencyContactName || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Emergency Phone</span>
                  <p data-testid="view-user-emergency-phone">{viewingUser.emergencyContactPhone || "—"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Roles</span>
                  <div className="flex gap-1 flex-wrap mt-1" data-testid="view-user-roles">
                    {viewingUser.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="text-xs">{ROLE_LABELS[r] || r}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg" data-testid="dialog-user">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={photoPreview || getPhotoSrc(editing?.profilePhotoUrl ?? null)} alt="Profile" />
                  <AvatarFallback>{editing ? getInitials(editing) : "?"}</AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 cursor-pointer">
                  <div className="rounded-full bg-primary p-1 text-primary-foreground">
                    {uploadingPhoto ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} data-testid="input-user-photo" />
                </label>
              </div>
              <div className="flex-1 space-y-2">
                <Label>Username</Label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  data-testid="input-user-username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{editing ? "New Password (leave blank to keep)" : "Password"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editing}
                data-testid="input-user-password"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  data-testid="input-user-email"
                />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="input-user-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                data-testid="input-user-phone"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2 space-y-2">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  data-testid="input-user-address"
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  data-testid="input-user-city"
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  data-testid="input-user-state"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Zip</Label>
                <Input
                  value={form.zip}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })}
                  data-testid="input-user-zip"
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger data-testid="select-user-gender">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  data-testid="input-user-dob"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Marital Status</Label>
              <Select value={form.maritalStatus} onValueChange={(v) => setForm({ ...form, maritalStatus: v })}>
                <SelectTrigger data-testid="select-user-marital">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Emergency Contact Name</Label>
                <Input
                  value={form.emergencyContactName}
                  onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                  data-testid="input-user-emergency-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact Phone</Label>
                <Input
                  value={form.emergencyContactPhone}
                  onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                  data-testid="input-user-emergency-phone"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="space-y-2">
                {assignableRoles.map((role) => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.roles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="rounded"
                      data-testid={`checkbox-role-${role}`}
                    />
                    <span className="text-sm">{ROLE_LABELS[role] || role}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending || uploadingPhoto} data-testid="button-submit-user">
              {(createMutation.isPending || updateMutation.isPending || uploadingPhoto) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RolesTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const { toast } = useToast();
  const { data: permissions, isLoading } = useQuery<RolePermission[]>({
    queryKey: ["/api/role-permissions"],
  });

  const [localPerms, setLocalPerms] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    if (permissions) {
      const map: Record<string, Record<string, boolean>> = {};
      for (const role of AVAILABLE_ROLES) {
        map[role] = {};
        for (const feature of AVAILABLE_FEATURES) {
          map[role][feature] = role === "super_admin" ? true : false;
        }
      }
      for (const p of permissions) {
        if (map[p.role] && p.role !== "super_admin") {
          map[p.role][p.feature] = p.enabled;
        }
      }
      setLocalPerms(map);
    }
  }, [permissions]);

  const saveMutation = useMutation({
    mutationFn: async (perms: { role: string; feature: string; enabled: boolean }[]) => {
      await apiRequest("PUT", "/api/role-permissions", { permissions: perms });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/role-permissions"] });
      toast({ title: "Permissions saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function togglePerm(role: string, feature: string) {
    setLocalPerms((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [feature]: !prev[role]?.[feature],
      },
    }));
  }

  function handleSave() {
    const perms: { role: string; feature: string; enabled: boolean }[] = [];
    for (const [role, features] of Object.entries(localPerms)) {
      for (const [feature, enabled] of Object.entries(features)) {
        perms.push({ role, feature, enabled });
      }
    }
    saveMutation.mutate(perms);
  }

  const editableRoles = AVAILABLE_ROLES.filter((r) => r !== "super_admin");
  const allDisplayRoles = [...AVAILABLE_ROLES];

  if (!isSuperAdmin) {
    return (
      <div data-testid="tab-roles">
        <h1 className="text-2xl font-bold mb-6">Role Permissions</h1>
        <p className="text-muted-foreground">Only super admins can modify role permissions. You can view the current configuration below.</p>
        {isLoading ? (
          <p className="text-muted-foreground mt-4">Loading...</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <Table data-testid="table-roles-readonly">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-[999]">Feature</TableHead>
                  {allDisplayRoles.map((role) => (
                    <TableHead key={role} className="text-center">{ROLE_LABELS[role] || role}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {AVAILABLE_FEATURES.map((feature) => (
                  <TableRow key={feature}>
                    <TableCell className="font-medium sticky left-0 bg-background z-[999]">{FEATURE_LABELS[feature] || feature}</TableCell>
                    {allDisplayRoles.map((role) => (
                      <TableCell key={role} className="text-center">
                        {role === "super_admin" ? (
                          <Badge variant="default" className="text-xs">Always On</Badge>
                        ) : localPerms[role]?.[feature] ? (
                          <Badge variant="default" className="text-xs">On</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Off</Badge>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div data-testid="tab-roles">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-bold">Role Permissions</h1>
        <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-permissions">
          <Save className="w-4 h-4 mr-2" /> Save Permissions
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <Table data-testid="table-roles">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-[999]">Feature</TableHead>
                {allDisplayRoles.map((role) => (
                  <TableHead key={role} className="text-center">{ROLE_LABELS[role] || role}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {AVAILABLE_FEATURES.map((feature) => (
                <TableRow key={feature}>
                  <TableCell className="font-medium sticky left-0 bg-background z-[999]">{FEATURE_LABELS[feature] || feature}</TableCell>
                  {allDisplayRoles.map((role) => (
                    <TableCell key={role} className="text-center">
                      {role === "super_admin" ? (
                        <Badge variant="default" className="text-xs no-default-hover-elevate no-default-active-elevate">Always On</Badge>
                      ) : (
                        <Switch
                          checked={localPerms[role]?.[feature] ?? false}
                          onCheckedChange={() => togglePerm(role, feature)}
                          data-testid={`switch-${role}-${feature}`}
                        />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function FormsTab() {
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "editor" | "submissions">("list");
  const [editingFormId, setEditingFormId] = useState<number | null>(null);
  const [viewingSubmissionsFormId, setViewingSubmissionsFormId] = useState<number | null>(null);

  function goToList() {
    setView("list");
    setEditingFormId(null);
    setViewingSubmissionsFormId(null);
  }

  function goToEditor(id: number | null) {
    setEditingFormId(id);
    setView("editor");
  }

  function goToSubmissions(id: number) {
    setViewingSubmissionsFormId(id);
    setView("submissions");
  }

  if (view === "editor") {
    return <FormEditor formId={editingFormId} onBack={goToList} />;
  }

  if (view === "submissions" && viewingSubmissionsFormId) {
    return <FormSubmissionsView formId={viewingSubmissionsFormId} onBack={goToList} />;
  }

  return <FormListView onCreate={() => goToEditor(null)} onEdit={goToEditor} onViewSubmissions={goToSubmissions} />;
}

function FormListView({ onCreate, onEdit, onViewSubmissions }: { onCreate: () => void; onEdit: (id: number) => void; onViewSubmissions: (id: number) => void }) {
  const { toast } = useToast();
  const { data: forms, isLoading } = useQuery<(Form & { submissionCount: number; fieldCount: number })[]>({ queryKey: ["/api/forms"] });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/forms/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({ title: "Form deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/forms/${id}/duplicate`);
      return res.json();
    },
    onSuccess: (newForm: Form) => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({ title: "Form duplicated", description: `"${newForm.title}" created as draft` });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusVariant = (status: string) => {
    if (status === "published") return "default" as const;
    if (status === "archived") return "secondary" as const;
    return "outline" as const;
  };

  return (
    <div data-testid="tab-forms">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-bold">Form Builder</h1>
        <Button onClick={onCreate} data-testid="button-create-form">
          <Plus className="w-4 h-4 mr-2" /> Create Form
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !forms?.length ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No forms yet. Create your first form to get started.
          </CardContent>
        </Card>
      ) : (
        <Table data-testid="table-forms">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.map((form) => {
              const formPath = `/forms/${form.slug}`;
              return (
              <TableRow key={form.id} data-testid={`row-form-${form.id}`}>
                <TableCell className="font-medium">{form.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded" data-testid={`text-form-url-${form.id}`}>{formPath}</code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}${formPath}`);
                        toast({ title: "URL copied to clipboard" });
                      }}
                      data-testid={`button-copy-url-${form.id}`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <a href={formPath} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="ghost" data-testid={`button-open-form-${form.id}`}>
                        <Link2 className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(form.status)} data-testid={`badge-status-${form.id}`}>
                    {form.status}
                  </Badge>
                </TableCell>
                <TableCell>{form.fieldCount ?? 0}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => onViewSubmissions(form.id)} data-testid={`button-submissions-${form.id}`}>
                    {form.submissionCount ?? 0} submissions
                  </Button>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : ""}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => onEdit(form.id)} data-testid={`button-edit-form-${form.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => duplicateMutation.mutate(form.id)} disabled={duplicateMutation.isPending} data-testid={`button-duplicate-form-${form.id}`}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(form.id)} data-testid={`button-delete-form-${form.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function FormEditor({ formId, onBack }: { formId: number | null; onBack: () => void }) {
  const { toast } = useToast();
  const isNew = formId === null;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    slug: "",
    status: "draft",
    submitButtonText: "Submit",
    successMessage: "Thank you for your submission!",
    requireAuth: false,
    allowMultiple: true,
  });
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [fieldForm, setFieldForm] = useState({
    label: "",
    fieldType: "text",
    required: false,
    placeholder: "",
    helpText: "",
    options: "",
    optionItems: [{ label: "", capacity: "" }] as { label: string; capacity: string }[],
  });

  const { data: formWithFields, isLoading } = useQuery<Form & { fields: FormField[] }>({
    queryKey: ["/api/forms", formId],
    enabled: !isNew && formId !== null,
  });

  useEffect(() => {
    if (formWithFields) {
      setFormData({
        title: formWithFields.title,
        description: formWithFields.description || "",
        slug: formWithFields.slug,
        status: formWithFields.status,
        submitButtonText: formWithFields.submitButtonText || "Submit",
        successMessage: formWithFields.successMessage || "Thank you for your submission!",
        requireAuth: formWithFields.requireAuth,
        allowMultiple: formWithFields.allowMultiple,
      });
    }
  }, [formWithFields]);

  function generateSlug(title: string) {
    return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  function handleTitleChange(title: string) {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: isNew || prev.slug === generateSlug(prev.title) ? generateSlug(title) : prev.slug,
    }));
  }

  const createFormMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/forms", data);
      return await res.json();
    },
    onSuccess: (newForm: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({ title: "Form created" });
      onBack();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateFormMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("PATCH", `/api/forms/${formId}`, data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forms", formId] });
      toast({ title: "Form updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createFieldMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("POST", `/api/forms/${formId}/fields`, data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms", formId] });
      toast({ title: "Field added" });
      setFieldDialogOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateFieldMutation = useMutation({
    mutationFn: async ({ fieldId, data }: { fieldId: number; data: any }) => {
      await apiRequest("PATCH", `/api/forms/${formId}/fields/${fieldId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms", formId] });
      toast({ title: "Field updated" });
      setFieldDialogOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: number) => { await apiRequest("DELETE", `/api/forms/${formId}/fields/${fieldId}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms", formId] });
      toast({ title: "Field deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const reorderFieldsMutation = useMutation({
    mutationFn: async (fieldIds: number[]) => {
      await apiRequest("PUT", `/api/forms/${formId}/fields/reorder`, { fieldIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms", formId] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function handleSaveForm() {
    const payload = {
      ...formData,
      description: formData.description || null,
    };
    if (isNew) {
      createFormMutation.mutate(payload);
    } else {
      updateFormMutation.mutate(payload);
    }
  }

  function openAddField() {
    setEditingField(null);
    setFieldForm({ label: "", fieldType: "text", required: false, placeholder: "", helpText: "", options: "", optionItems: [{ label: "", capacity: "" }] });
    setFieldDialogOpen(true);
  }

  function openEditField(field: FormField) {
    setEditingField(field);
    let opts = "";
    const items: { label: string; capacity: string }[] = [];
    if (Array.isArray(field.options)) {
      for (const o of field.options as any[]) {
        if (typeof o === "string") {
          items.push({ label: o, capacity: "" });
        } else if (o && typeof o === "object" && o.label) {
          items.push({ label: o.label, capacity: o.capacity ? String(o.capacity) : "" });
        }
      }
      opts = items.map((i) => i.capacity ? `${i.label}|${i.capacity}` : i.label).join("\n");
    }
    if (items.length === 0) items.push({ label: "", capacity: "" });
    setFieldForm({
      label: field.label,
      fieldType: field.fieldType,
      required: field.required,
      placeholder: field.placeholder || "",
      helpText: field.helpText || "",
      options: opts,
      optionItems: items,
    });
    setFieldDialogOpen(true);
  }

  function handleFieldSubmit(e: React.FormEvent) {
    e.preventDefault();
    const optionTypes = ["select", "radio", "checkbox_group"];
    let parsedOptions: any = null;
    if (optionTypes.includes(fieldForm.fieldType)) {
      if (fieldForm.fieldType === "checkbox_group") {
        parsedOptions = fieldForm.optionItems
          .filter((item) => item.label.trim())
          .map((item) => {
            const cap = parseInt(item.capacity, 10);
            return item.capacity && !isNaN(cap) && cap > 0
              ? { label: item.label.trim(), capacity: cap }
              : { label: item.label.trim() };
          });
      } else {
        parsedOptions = fieldForm.options.split("\n").map((o) => o.trim()).filter(Boolean).map((line) => {
          return { label: line };
        });
      }
    }
    const data: any = {
      label: fieldForm.label,
      fieldType: fieldForm.fieldType,
      required: fieldForm.required,
      placeholder: fieldForm.placeholder || null,
      helpText: fieldForm.helpText || null,
      options: parsedOptions,
    };

    if (editingField) {
      updateFieldMutation.mutate({ fieldId: editingField.id, data });
    } else {
      const fields = formWithFields?.fields || [];
      data.sortOrder = fields.length;
      createFieldMutation.mutate(data);
    }
  }

  function moveField(fieldId: number, direction: "up" | "down") {
    const fields = formWithFields?.fields || [];
    const sorted = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((f) => f.id === fieldId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const newOrder = sorted.map((f) => f.id);
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    reorderFieldsMutation.mutate(newOrder);
  }

  const fields = formWithFields?.fields ? [...formWithFields.fields].sort((a, b) => a.sortOrder - b.sortOrder) : [];
  const showOptionsField = ["select", "radio", "checkbox_group"].includes(fieldForm.fieldType);

  if (!isNew && isLoading) {
    return <p className="text-muted-foreground">Loading form...</p>;
  }

  return (
    <div data-testid="form-editor">
      <div className="flex items-center gap-4 flex-wrap mb-6">
        <Button variant="ghost" onClick={onBack} data-testid="button-back-forms">
          <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Back to Forms
        </Button>
        <h1 className="text-2xl font-bold">{isNew ? "Create Form" : "Edit Form"}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                data-testid="input-form-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-form-description"
              />
            </div>
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                data-testid="input-form-slug"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger data-testid="select-form-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORM_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Submit Button Text</Label>
              <Input
                value={formData.submitButtonText}
                onChange={(e) => setFormData({ ...formData, submitButtonText: e.target.value })}
                data-testid="input-form-submit-text"
              />
            </div>
            <div className="space-y-2">
              <Label>Success Message</Label>
              <Textarea
                value={formData.successMessage}
                onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })}
                data-testid="input-form-success-message"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.requireAuth}
                onCheckedChange={(v) => setFormData({ ...formData, requireAuth: v })}
                data-testid="switch-form-require-auth"
              />
              <Label>Require authentication</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.allowMultiple}
                onCheckedChange={(v) => setFormData({ ...formData, allowMultiple: v })}
                data-testid="switch-form-allow-multiple"
              />
              <Label>Allow multiple submissions</Label>
            </div>
            <Button
              onClick={handleSaveForm}
              className="w-full"
              disabled={createFormMutation.isPending || updateFormMutation.isPending}
              data-testid="button-save-form"
            >
              <Save className="w-4 h-4 mr-2" /> {isNew ? "Create Form" : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {!isNew && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle>Fields</CardTitle>
              <Button size="sm" onClick={openAddField} data-testid="button-add-field">
                <Plus className="w-4 h-4 mr-2" /> Add Field
              </Button>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <p className="text-muted-foreground text-sm">No fields yet. Add fields to build your form.</p>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-2 p-3 border rounded-md"
                      data-testid={`field-row-${field.id}`}
                    >
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => moveField(field.id, "up")}
                          disabled={idx === 0}
                          data-testid={`button-move-up-${field.id}`}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => moveField(field.id, "down")}
                          disabled={idx === fields.length - 1}
                          data-testid={`button-move-down-${field.id}`}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{field.label}</div>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <Badge variant="secondary">{FORM_FIELD_TYPE_LABELS[field.fieldType] || field.fieldType}</Badge>
                          {field.required && <Badge variant="outline">Required</Badge>}
                          {Array.isArray(field.options) && (field.options as any[]).some((o: any) => typeof o === "object" && o?.capacity) && (
                            <Badge variant="outline">Has Limits</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEditField(field)} data-testid={`button-edit-field-${field.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteFieldMutation.mutate(field.id)} data-testid={`button-delete-field-${field.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent data-testid="dialog-field">
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit Field" : "Add Field"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFieldSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={fieldForm.label}
                onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                required
                data-testid="input-field-label"
              />
            </div>
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select value={fieldForm.fieldType} onValueChange={(v) => setFieldForm({ ...fieldForm, fieldType: v })}>
                <SelectTrigger data-testid="select-field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORM_FIELD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{FORM_FIELD_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={fieldForm.required}
                onCheckedChange={(v) => setFieldForm({ ...fieldForm, required: !!v })}
                data-testid="checkbox-field-required"
              />
              <Label>Required</Label>
            </div>
            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input
                value={fieldForm.placeholder}
                onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                data-testid="input-field-placeholder"
              />
            </div>
            <div className="space-y-2">
              <Label>Help Text</Label>
              <Input
                value={fieldForm.helpText}
                onChange={(e) => setFieldForm({ ...fieldForm, helpText: e.target.value })}
                data-testid="input-field-help-text"
              />
            </div>
            {showOptionsField && fieldForm.fieldType === "checkbox_group" && (
              <div className="space-y-2">
                <Label>Items</Label>
                <p className="text-xs text-muted-foreground">
                  Add items people can sign up for. Set a quantity limit or leave blank for unlimited.
                </p>
                <div className="space-y-2">
                  {fieldForm.optionItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2" data-testid={`option-item-${idx}`}>
                      <Input
                        value={item.label}
                        onChange={(e) => {
                          const updated = [...fieldForm.optionItems];
                          updated[idx] = { ...updated[idx], label: e.target.value };
                          setFieldForm({ ...fieldForm, optionItems: updated });
                        }}
                        placeholder="Item name (e.g., Milk)"
                        className="flex-1"
                        data-testid={`input-option-label-${idx}`}
                      />
                      <Input
                        value={item.capacity}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          const updated = [...fieldForm.optionItems];
                          updated[idx] = { ...updated[idx], capacity: val };
                          setFieldForm({ ...fieldForm, optionItems: updated });
                        }}
                        placeholder="Qty"
                        className="w-20"
                        data-testid={`input-option-capacity-${idx}`}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          const updated = fieldForm.optionItems.filter((_, i) => i !== idx);
                          if (updated.length === 0) updated.push({ label: "", capacity: "" });
                          setFieldForm({ ...fieldForm, optionItems: updated });
                        }}
                        disabled={fieldForm.optionItems.length <= 1}
                        data-testid={`button-remove-option-${idx}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFieldForm({ ...fieldForm, optionItems: [...fieldForm.optionItems, { label: "", capacity: "" }] })}
                    data-testid="button-add-option-item"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Item
                  </Button>
                </div>
              </div>
            )}
            {showOptionsField && fieldForm.fieldType !== "checkbox_group" && (
              <div className="space-y-2">
                <Label>Options (one per line)</Label>
                <Textarea
                  value={fieldForm.options}
                  onChange={(e) => setFieldForm({ ...fieldForm, options: e.target.value })}
                  placeholder={"Option 1\nOption 2\nOption 3"}
                  data-testid="input-field-options"
                />
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={createFieldMutation.isPending || updateFieldMutation.isPending}
              data-testid="button-submit-field"
            >
              {editingField ? "Update Field" : "Add Field"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubmissionsTab() {
  const { toast } = useToast();
  const [selectedFormId, setSelectedFormId] = useState<string>("");

  const { data: forms, isLoading: formsLoading } = useQuery<(Form & { submissionCount: number; fieldCount: number })[]>({
    queryKey: ["/api/forms"],
  });

  const formId = selectedFormId ? Number(selectedFormId) : null;

  const { data: formWithFields } = useQuery<Form & { fields: FormField[] }>({
    queryKey: ["/api/forms", formId],
    enabled: formId !== null,
  });

  const { data: submissions, isLoading: subsLoading } = useQuery<FormSubmission[]>({
    queryKey: ["/api/forms", formId, "submissions"],
    queryFn: async () => {
      const res = await fetch(`/api/forms/${formId}/submissions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return res.json();
    },
    enabled: formId !== null,
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: async (subId: number) => { await apiRequest("DELETE", `/api/forms/${formId}/submissions/${subId}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms", formId, "submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({ title: "Submission deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const fields = formWithFields?.fields ? [...formWithFields.fields].sort((a, b) => a.sortOrder - b.sortOrder) : [];

  const publishedForms = (forms || []).filter((f) => f.submissionCount > 0 || f.status === "published");

  return (
    <div data-testid="tab-submissions">
      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Submissions</h1>
      <p className="text-muted-foreground mb-6">View and manage responses collected from your forms.</p>

      <div className="flex items-end gap-4 flex-wrap mb-6">
        <div className="w-full max-w-sm space-y-2">
          <Label>Select a Form</Label>
          <Select value={selectedFormId} onValueChange={setSelectedFormId}>
            <SelectTrigger data-testid="select-submission-form">
              <SelectValue placeholder={formsLoading ? "Loading forms..." : "Choose a form to view"} />
            </SelectTrigger>
            <SelectContent>
              {publishedForms.map((form) => (
                <SelectItem key={form.id} value={form.id.toString()} data-testid={`option-form-${form.id}`}>
                  {form.title} ({form.submissionCount ?? 0})
                </SelectItem>
              ))}
              {publishedForms.length === 0 && !formsLoading && (
                <SelectItem value="__none" disabled>No forms with submissions</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!formId && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Inbox className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>Select a form above to view its submissions.</p>
          </CardContent>
        </Card>
      )}

      {formId && subsLoading && (
        <p className="text-muted-foreground">Loading submissions...</p>
      )}

      {formId && !subsLoading && (!submissions || submissions.length === 0) && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No submissions yet for this form.
          </CardContent>
        </Card>
      )}

      {formId && submissions && submissions.length > 0 && (
        <div>
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <p className="text-sm text-muted-foreground">
              {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
            </p>
            <Badge variant="outline">{formWithFields?.title}</Badge>
          </div>
          <div className="overflow-x-auto">
            <Table data-testid="table-submissions">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  {fields.map((f) => (
                    <TableHead key={f.id}>{f.label}</TableHead>
                  ))}
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub, idx) => {
                  const data = (sub.data || {}) as Record<string, any>;
                  return (
                    <TableRow key={sub.id} data-testid={`row-submission-${sub.id}`}>
                      <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                      {fields.map((f) => (
                        <TableCell key={f.id}>
                          {data[f.id.toString()] !== undefined
                            ? Array.isArray(data[f.id.toString()])
                              ? (data[f.id.toString()] as string[]).join(", ")
                              : String(data[f.id.toString()])
                            : data[f.label] !== undefined
                              ? String(data[f.label])
                              : ""}
                        </TableCell>
                      ))}
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : ""}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteSubmissionMutation.mutate(sub.id)}
                          data-testid={`button-delete-submission-${sub.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

function FormSubmissionsView({ formId, onBack }: { formId: number; onBack: () => void }) {
  const { toast } = useToast();

  const { data: formWithFields } = useQuery<Form & { fields: FormField[] }>({
    queryKey: ["/api/forms", formId],
  });

  const { data: submissions, isLoading } = useQuery<FormSubmission[]>({
    queryKey: ["/api/forms", formId, "submissions"],
    queryFn: async () => {
      const res = await fetch(`/api/forms/${formId}/submissions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return res.json();
    },
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: async (subId: number) => { await apiRequest("DELETE", `/api/forms/${formId}/submissions/${subId}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms", formId, "submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({ title: "Submission deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const fields = formWithFields?.fields ? [...formWithFields.fields].sort((a, b) => a.sortOrder - b.sortOrder) : [];
  const fieldLabels = fields.reduce((acc, f) => { acc[f.id.toString()] = f.label; return acc; }, {} as Record<string, string>);

  return (
    <div data-testid="form-submissions">
      <div className="flex items-center gap-4 flex-wrap mb-6">
        <Button variant="ghost" onClick={onBack} data-testid="button-back-submissions">
          <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Back to Forms
        </Button>
        <h1 className="text-2xl font-bold">Submissions: {formWithFields?.title || ""}</h1>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading submissions...</p>
      ) : !submissions?.length ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No submissions yet for this form.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Table data-testid="table-submissions">
            <TableHeader>
              <TableRow>
                {fields.map((f) => (
                  <TableHead key={f.id}>{f.label}</TableHead>
                ))}
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub) => {
                const data = (sub.data || {}) as Record<string, any>;
                return (
                  <TableRow key={sub.id} data-testid={`row-submission-${sub.id}`}>
                    {fields.map((f) => (
                      <TableCell key={f.id}>
                        {data[f.id.toString()] !== undefined
                          ? Array.isArray(data[f.id.toString()])
                            ? (data[f.id.toString()] as string[]).join(", ")
                            : String(data[f.id.toString()])
                          : data[f.label] !== undefined
                            ? String(data[f.label])
                            : ""}
                      </TableCell>
                    ))}
                    <TableCell className="text-muted-foreground text-sm">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : ""}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteSubmissionMutation.mutate(sub.id)}
                        data-testid={`button-delete-submission-${sub.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function NotificationsTab() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("general");
  const [url, setUrl] = useState("");

  const { data: stats } = useQuery<{ subscriberCount: number; totalSent: number; lastSent: string | null }>({
    queryKey: ["/api/notifications/stats"],
  });

  const { data: logs, isLoading: logsLoading } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { title: string; body: string; type: string; url?: string }) => {
      const res = await apiRequest("POST", "/api/notifications/send", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Notification Sent", description: `Delivered to ${data.successCount} subscriber(s)` });
      setTitle("");
      setBody("");
      setType("general");
      setUrl("");
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/stats"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send notification", variant: "destructive" });
    },
  });

  function handleSend() {
    if (!title.trim() || !body.trim()) {
      toast({ title: "Error", description: "Title and message are required", variant: "destructive" });
      return;
    }
    sendMutation.mutate({ title: title.trim(), body: body.trim(), type, url: url.trim() || undefined });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" data-testid="text-notifications-heading">Push Notifications</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-subscriber-count">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-subscriber-count">{stats?.subscriberCount || 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-total-sent">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-sent">{stats?.totalSent || 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-last-sent">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sent</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-last-sent">
              {stats?.lastSent ? new Date(stats.lastSent).toLocaleDateString() : "Never"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notif-title">Title</Label>
            <Input
              id="notif-title"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-notif-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notif-body">Message</Label>
            <Textarea
              id="notif-body"
              placeholder="Notification message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              data-testid="input-notif-body"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notif-type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-notif-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="sermon">New Sermon</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-url">Link (optional)</Label>
              <Input
                id="notif-url"
                placeholder="/announcements or full URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                data-testid="input-notif-url"
              />
            </div>
          </div>
          <Button
            onClick={handleSend}
            disabled={sendMutation.isPending || !title.trim() || !body.trim()}
            data-testid="button-send-notification"
          >
            <Send className="mr-2 h-4 w-4" />
            {sendMutation.isPending ? "Sending..." : "Send Notification"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : !logs || logs.length === 0 ? (
            <p className="text-muted-foreground" data-testid="text-no-notifications">No notifications sent yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id} data-testid={`row-notification-${log.id}`}>
                    <TableCell className="font-medium">{log.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{log.body}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.type}</Badge>
                    </TableCell>
                    <TableCell>{log.successCount}</TableCell>
                    <TableCell>{log.failureCount}</TableCell>
                    <TableCell>{new Date(log.sentAt).toLocaleDateString()}</TableCell>
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

function DonationsTab() {
  const { toast } = useToast();
  const [view, setView] = useState<"history" | "funds" | "reports">("history");
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [manualDonationOpen, setManualDonationOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<DonationFund | null>(null);
  const [fundForm, setFundForm] = useState({ name: "", slug: "", description: "", isActive: true });
  const [manualForm, setManualForm] = useState({ donorName: "", donorEmail: "", amountDollars: "", fundId: "", paymentMethod: "cash", notes: "", donationDate: new Date().toISOString().split("T")[0] });

  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportDonorEmail, setReportDonorEmail] = useState("");
  const [reportFundId, setReportFundId] = useState("");

  function buildReportQueryKey() {
    const params = new URLSearchParams();
    if (reportStartDate) params.set("startDate", reportStartDate);
    if (reportEndDate) params.set("endDate", reportEndDate);
    if (reportDonorEmail) params.set("donorEmail", reportDonorEmail);
    if (reportFundId && reportFundId !== "all") params.set("fundId", reportFundId);
    return `/api/donations/report?${params.toString()}`;
  }

  const { data: stats } = useQuery<{ totalAmount: number; totalCount: number; monthlyAmount: number; monthlyCount: number }>({
    queryKey: ["/api/donations/stats"],
  });

  const { data: donations, isLoading: donationsLoading } = useQuery<Donation[]>({
    queryKey: ["/api/donations"],
  });

  const { data: funds, isLoading: fundsLoading } = useQuery<DonationFund[]>({
    queryKey: ["/api/donation-funds"],
  });

  const { data: reportData, isLoading: reportLoading, refetch: refetchReport } = useQuery<{ donations: Donation[]; totalAmount: number; totalCount: number }>({
    queryKey: ["/api/donations/report", reportStartDate, reportEndDate, reportDonorEmail, reportFundId],
    queryFn: async () => {
      const res = await fetch(buildReportQueryKey(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
    enabled: view === "reports",
  });

  const createFundMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("POST", "/api/donation-funds", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/donation-funds"] });
      toast({ title: "Fund created" });
      closeFundDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateFundMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { await apiRequest("PATCH", `/api/donation-funds/${id}`, data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/donation-funds"] });
      toast({ title: "Fund updated" });
      closeFundDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteFundMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/donation-funds/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/donation-funds"] });
      toast({ title: "Fund deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const manualDonationMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("POST", "/api/donations/manual", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/donations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/donations/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/donations/report"] });
      toast({ title: "Donation recorded" });
      setManualDonationOpen(false);
      setManualForm({ donorName: "", donorEmail: "", amountDollars: "", fundId: "", paymentMethod: "cash", notes: "", donationDate: new Date().toISOString().split("T")[0] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function openAddFund() {
    setEditingFund(null);
    setFundForm({ name: "", slug: "", description: "", isActive: true });
    setFundDialogOpen(true);
  }

  function openEditFund(fund: DonationFund) {
    setEditingFund(fund);
    setFundForm({ name: fund.name, slug: fund.slug, description: fund.description || "", isActive: fund.isActive });
    setFundDialogOpen(true);
  }

  function closeFundDialog() {
    setFundDialogOpen(false);
    setEditingFund(null);
  }

  function handleFundSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { ...fundForm, description: fundForm.description || null };
    if (editingFund) {
      updateFundMutation.mutate({ id: editingFund.id, data });
    } else {
      createFundMutation.mutate(data);
    }
  }

  function handleManualDonationSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(manualForm.amountDollars);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    manualDonationMutation.mutate({
      donorName: manualForm.donorName || "Anonymous",
      donorEmail: manualForm.donorEmail || null,
      amountDollars: amount,
      fundId: manualForm.fundId && manualForm.fundId !== "none" ? Number(manualForm.fundId) : null,
      paymentMethod: manualForm.paymentMethod,
      notes: manualForm.notes || null,
      donationDate: manualForm.donationDate || null,
    });
  }

  function handleDeleteFund(id: number) {
    if (confirm("Are you sure you want to delete this fund?")) {
      deleteFundMutation.mutate(id);
    }
  }

  function getFundName(fundId: number | null) {
    if (!fundId || !funds) return "—";
    const fund = funds.find((f) => f.id === fundId);
    return fund ? fund.name : "Unknown";
  }

  function formatCents(cents: number) {
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case "completed": return "default";
      case "pending": return "secondary";
      case "refunded": return "destructive";
      case "failed": return "destructive";
      default: return "outline";
    }
  }

  function exportCSV() {
    if (!reportData?.donations?.length) return;
    const headers = ["Date", "Donor Name", "Donor Email", "Amount", "Fund", "Payment Method", "Frequency", "Status", "Notes"];
    const rows = reportData.donations.map((d) => [
      d.donationDate ? formatDate(d.donationDate.toString()) : (d.createdAt ? formatDate(d.createdAt.toString()) : ""),
      d.donorName || "Anonymous",
      d.donorEmail || "",
      (d.amountCents / 100).toFixed(2),
      getFundName(d.fundId),
      d.paymentMethod || "stripe",
      d.frequency,
      d.status,
      d.notes || "",
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `donations-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div data-testid="tab-donations">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-bold">Donations</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={view === "history" ? "default" : "outline"}
            onClick={() => setView("history")}
            data-testid="button-view-history"
          >
            <DollarSign className="w-4 h-4 mr-2" /> History
          </Button>
          <Button
            variant={view === "funds" ? "default" : "outline"}
            onClick={() => setView("funds")}
            data-testid="button-view-funds"
          >
            <Heart className="w-4 h-4 mr-2" /> Funds
          </Button>
          <Button
            variant={view === "reports" ? "default" : "outline"}
            onClick={() => setView("reports")}
            data-testid="button-view-reports"
          >
            <BarChart3 className="w-4 h-4 mr-2" /> Reports
          </Button>
        </div>
      </div>

      {view === "history" && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card data-testid="stat-total-donated">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="value-total-donated">
                  {stats ? formatCents(stats.totalAmount) : "$0.00"}
                </div>
              </CardContent>
            </Card>
            <Card data-testid="stat-total-donations">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                <Heart className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="value-total-donations">
                  {stats?.totalCount ?? 0}
                </div>
              </CardContent>
            </Card>
            <Card data-testid="stat-monthly-amount">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="value-monthly-amount">
                  {stats ? formatCents(stats.monthlyAmount) : "$0.00"}
                </div>
              </CardContent>
            </Card>
            <Card data-testid="stat-monthly-count">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Count</CardTitle>
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="value-monthly-count">
                  {stats?.monthlyCount ?? 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-end mb-4">
            <Button onClick={() => setManualDonationOpen(true)} data-testid="button-add-manual-donation">
              <Plus className="w-4 h-4 mr-2" /> Record Donation
            </Button>
          </div>

          {donationsLoading ? (
            <p className="text-muted-foreground">Loading donations...</p>
          ) : (
            <Table data-testid="table-donations">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Fund</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations?.map((donation) => (
                  <TableRow key={donation.id} data-testid={`row-donation-${donation.id}`}>
                    <TableCell>{donation.donationDate ? formatDate(donation.donationDate.toString()) : (donation.createdAt ? formatDate(donation.createdAt.toString()) : "—")}</TableCell>
                    <TableCell>
                      <div>{donation.donorName || "Anonymous"}</div>
                      {donation.donorEmail && (
                        <div className="text-sm text-muted-foreground">{donation.donorEmail}</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{formatCents(donation.amountCents)}</TableCell>
                    <TableCell>{getFundName(donation.fundId)}</TableCell>
                    <TableCell className="capitalize">{(donation.paymentMethod || "stripe").replace("_", " ")}</TableCell>
                    <TableCell className="capitalize">{donation.frequency.replace("_", " ")}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(donation.status)} data-testid={`badge-status-${donation.id}`}>
                        {donation.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {view === "funds" && (
        <div>
          <div className="flex items-center justify-end mb-4">
            <Button onClick={openAddFund} data-testid="button-add-fund">
              <Plus className="w-4 h-4 mr-2" /> Add Fund
            </Button>
          </div>

          {fundsLoading ? (
            <p className="text-muted-foreground">Loading funds...</p>
          ) : (
            <Table data-testid="table-funds">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funds?.map((fund) => (
                  <TableRow key={fund.id} data-testid={`row-fund-${fund.id}`}>
                    <TableCell className="font-medium">{fund.name}</TableCell>
                    <TableCell className="text-muted-foreground">{fund.slug}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{fund.description || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={fund.isActive ? "default" : "secondary"} data-testid={`badge-fund-status-${fund.id}`}>
                        {fund.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEditFund(fund)} data-testid={`button-edit-fund-${fund.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteFund(fund.id)} data-testid={`button-delete-fund-${fund.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {view === "reports" && (
        <div>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} data-testid="input-report-start-date" />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} data-testid="input-report-end-date" />
                </div>
                <div className="space-y-2">
                  <Label>Donor Email</Label>
                  <Input placeholder="Filter by email" value={reportDonorEmail} onChange={(e) => setReportDonorEmail(e.target.value)} data-testid="input-report-donor-email" />
                </div>
                <div className="space-y-2">
                  <Label>Fund</Label>
                  <Select value={reportFundId} onValueChange={setReportFundId}>
                    <SelectTrigger data-testid="select-report-fund">
                      <SelectValue placeholder="All funds" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Funds</SelectItem>
                      {funds?.map((fund) => (
                        <SelectItem key={fund.id} value={fund.id.toString()}>{fund.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button onClick={() => refetchReport()} data-testid="button-run-report">
                  <Filter className="w-4 h-4 mr-2" /> Run Report
                </Button>
                <Button variant="outline" onClick={() => { setReportStartDate(""); setReportEndDate(""); setReportDonorEmail(""); setReportFundId(""); }} data-testid="button-clear-filters">
                  Clear Filters
                </Button>
                {reportData?.donations?.length ? (
                  <Button variant="outline" onClick={exportCSV} data-testid="button-export-csv">
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {reportData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Report Total</CardTitle>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="value-report-total">{formatCents(reportData.totalAmount)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Donations Found</CardTitle>
                  <Heart className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="value-report-count">{reportData.totalCount}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {reportLoading ? (
            <p className="text-muted-foreground">Loading report...</p>
          ) : reportData?.donations?.length ? (
            <Table data-testid="table-report">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Fund</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.donations.map((d) => (
                  <TableRow key={d.id} data-testid={`row-report-${d.id}`}>
                    <TableCell>{d.donationDate ? formatDate(d.donationDate.toString()) : (d.createdAt ? formatDate(d.createdAt.toString()) : "—")}</TableCell>
                    <TableCell>
                      <div>{d.donorName || "Anonymous"}</div>
                      {d.donorEmail && <div className="text-sm text-muted-foreground">{d.donorEmail}</div>}
                    </TableCell>
                    <TableCell className="font-medium">{formatCents(d.amountCents)}</TableCell>
                    <TableCell>{getFundName(d.fundId)}</TableCell>
                    <TableCell className="capitalize">{(d.paymentMethod || "stripe").replace("_", " ")}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(d.status)}>{d.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">{d.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : reportData ? (
            <p className="text-muted-foreground text-center py-8">No donations found matching your filters.</p>
          ) : null}
        </div>
      )}

      <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
        <DialogContent data-testid="dialog-fund">
          <DialogHeader>
            <DialogTitle>{editingFund ? "Edit Fund" : "Add Fund"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFundSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={fundForm.name} onChange={(e) => setFundForm({ ...fundForm, name: e.target.value })} required data-testid="input-fund-name" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={fundForm.slug} onChange={(e) => setFundForm({ ...fundForm, slug: e.target.value })} required data-testid="input-fund-slug" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={fundForm.description} onChange={(e) => setFundForm({ ...fundForm, description: e.target.value })} data-testid="input-fund-description" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="fund-active"
                checked={fundForm.isActive}
                onCheckedChange={(checked) => setFundForm({ ...fundForm, isActive: !!checked })}
                data-testid="checkbox-fund-active"
              />
              <Label htmlFor="fund-active">Active</Label>
            </div>
            <Button type="submit" className="w-full" disabled={createFundMutation.isPending || updateFundMutation.isPending} data-testid="button-submit-fund">
              {editingFund ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={manualDonationOpen} onOpenChange={setManualDonationOpen}>
        <DialogContent data-testid="dialog-manual-donation">
          <DialogHeader>
            <DialogTitle>Record Donation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManualDonationSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Donor Name</Label>
                <Input placeholder="Anonymous" value={manualForm.donorName} onChange={(e) => setManualForm({ ...manualForm, donorName: e.target.value })} data-testid="input-manual-donor-name" />
              </div>
              <div className="space-y-2">
                <Label>Donor Email</Label>
                <Input type="email" placeholder="Optional" value={manualForm.donorEmail} onChange={(e) => setManualForm({ ...manualForm, donorEmail: e.target.value })} data-testid="input-manual-donor-email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input type="number" step="0.01" min="0.01" placeholder="0.00" value={manualForm.amountDollars} onChange={(e) => setManualForm({ ...manualForm, amountDollars: e.target.value })} required data-testid="input-manual-amount" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={manualForm.donationDate} onChange={(e) => setManualForm({ ...manualForm, donationDate: e.target.value })} data-testid="input-manual-date" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={manualForm.paymentMethod} onValueChange={(v) => setManualForm({ ...manualForm, paymentMethod: v })}>
                  <SelectTrigger data-testid="select-manual-payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fund</Label>
                <Select value={manualForm.fundId} onValueChange={(v) => setManualForm({ ...manualForm, fundId: v })}>
                  <SelectTrigger data-testid="select-manual-fund">
                    <SelectValue placeholder="No fund" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Fund</SelectItem>
                    {funds?.filter((f) => f.isActive).map((fund) => (
                      <SelectItem key={fund.id} value={fund.id.toString()}>{fund.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Optional notes about this donation" value={manualForm.notes} onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })} data-testid="input-manual-notes" />
            </div>
            <Button type="submit" className="w-full" disabled={manualDonationMutation.isPending} data-testid="button-submit-manual-donation">
              {manualDonationMutation.isPending ? "Recording..." : "Record Donation"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubmissionsView({ event, onBack }: { event: SignupEvent; onBack: () => void }) {
  const { toast } = useToast();
  const { data: submissions, isLoading } = useQuery<SignupSubmission[]>({
    queryKey: ["/api/signups", event.id, "submissions"],
    queryFn: async () => {
      const res = await fetch(`/api/signups/${event.id}/submissions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const checkinMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("POST", `/api/signups/submissions/${id}/checkin`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signups", event.id, "submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
      toast({ title: "Checked in" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/signups/submissions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signups", event.id, "submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
      toast({ title: "Status updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSubMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/signups/submissions/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signups", event.id, "submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
      toast({ title: "Submission deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const confirmed = submissions?.filter(s => s.status === "confirmed") || [];
  const waitlisted = submissions?.filter(s => s.status === "waitlisted") || [];
  const cancelled = submissions?.filter(s => s.status === "cancelled") || [];
  const checkedInCount = confirmed.filter(s => s.checkedIn).length;

  return (
    <div data-testid="tab-signups-submissions">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="text-muted-foreground text-sm">Submissions & Check-In</p>
        </div>
        <Button variant="outline" onClick={onBack} data-testid="button-back-submissions">
          Back to List
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold" data-testid="text-total-confirmed">{confirmed.length}</div>
            <div className="text-sm text-muted-foreground">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold" data-testid="text-total-waitlisted">{waitlisted.length}</div>
            <div className="text-sm text-muted-foreground">Waitlisted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold" data-testid="text-total-checkedin">{checkedInCount}</div>
            <div className="text-sm text-muted-foreground">Checked In</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold" data-testid="text-total-cancelled">{cancelled.length}</div>
            <div className="text-sm text-muted-foreground">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading submissions...</p>
      ) : !submissions?.length ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No submissions yet.
          </CardContent>
        </Card>
      ) : (
        <Table data-testid="table-submissions">
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Checked In</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((sub) => (
              <TableRow key={sub.id} data-testid={`row-submission-${sub.id}`}>
                <TableCell data-testid={`text-sub-number-${sub.id}`}>#{sub.signupNumber}</TableCell>
                <TableCell data-testid={`text-sub-status-${sub.id}`}>
                  <Badge variant={sub.status === "confirmed" ? "default" : sub.status === "waitlisted" ? "secondary" : "outline"}>
                    {sub.status}
                  </Badge>
                </TableCell>
                <TableCell data-testid={`text-sub-checkin-${sub.id}`}>
                  {sub.checkedIn ? (
                    <Badge variant="default">Yes</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => checkinMutation.mutate(sub.id)} disabled={checkinMutation.isPending} data-testid={`button-checkin-${sub.id}`}>
                      Check In
                    </Button>
                  )}
                </TableCell>
                <TableCell data-testid={`text-sub-guests-${sub.id}`}>{sub.guestCount}</TableCell>
                <TableCell data-testid={`text-sub-date-${sub.id}`}>
                  {new Date(sub.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {sub.status === "waitlisted" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: sub.id, status: "confirmed" })} data-testid={`button-promote-${sub.id}`}>
                        Promote
                      </Button>
                    )}
                    {sub.status === "confirmed" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: sub.id, status: "cancelled" })} data-testid={`button-cancel-${sub.id}`}>
                        Cancel
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => deleteSubMutation.mutate(sub.id)} data-testid={`button-delete-sub-${sub.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function SignupsTab() {
  const { toast } = useToast();
  const { data: signups, isLoading } = useQuery<SignupEvent[]>({ queryKey: ["/api/signups"] });
  const { data: formsList } = useQuery<Form[]>({ queryKey: ["/api/forms"] });
  const [view, setView] = useState<"list" | "editor" | "submissions">("list");
  const [editing, setEditing] = useState<SignupEvent | null>(null);
  const [viewingSubmissions, setViewingSubmissions] = useState<SignupEvent | null>(null);
  const [displayType, setDisplayType] = useState("thank_you");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    category: "event" as string,
    status: "draft" as string,
    visibility: "public" as string,
    formId: 0,
    imageUrl: "",
    thumbnailUrl: "",
    signupStartDate: "",
    signupEndDate: "",
    eventDate: "",
    eventEndDate: "",
    location: "",
    cost: "",
    maxSignups: "",
    waitlistEnabled: false,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    successMessage: "",
    redirectUrl: "",
  });

  function generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function openCreate() {
    setEditing(null);
    setForm({
      title: "", slug: "", description: "", category: "event", status: "draft", visibility: "public",
      formId: 0, imageUrl: "", thumbnailUrl: "", signupStartDate: "", signupEndDate: "",
      eventDate: "", eventEndDate: "", location: "", cost: "", maxSignups: "",
      waitlistEnabled: false, contactName: "", contactEmail: "", contactPhone: "",
      successMessage: "", redirectUrl: "",
    });
    setDisplayType("thank_you");
    setView("editor");
  }

  function openEdit(signup: SignupEvent) {
    setEditing(signup);
    const pss = (signup.postSubmissionSettings || {}) as any;
    setForm({
      title: signup.title,
      slug: signup.slug,
      description: signup.description || "",
      category: signup.category,
      status: signup.status,
      visibility: signup.visibility,
      formId: signup.formId,
      imageUrl: signup.imageUrl || "",
      thumbnailUrl: signup.thumbnailUrl || "",
      signupStartDate: signup.signupStartDate ? new Date(signup.signupStartDate).toISOString().slice(0, 16) : "",
      signupEndDate: signup.signupEndDate ? new Date(signup.signupEndDate).toISOString().slice(0, 16) : "",
      eventDate: signup.eventDate ? new Date(signup.eventDate).toISOString().slice(0, 16) : "",
      eventEndDate: signup.eventEndDate ? new Date(signup.eventEndDate).toISOString().slice(0, 16) : "",
      location: signup.location || "",
      cost: signup.cost || "",
      maxSignups: signup.maxSignups != null ? String(signup.maxSignups) : "",
      waitlistEnabled: signup.waitlistEnabled,
      contactName: signup.contactName || "",
      contactEmail: signup.contactEmail || "",
      contactPhone: signup.contactPhone || "",
      successMessage: pss.successMessage || "",
      redirectUrl: pss.redirectUrl || "",
    });
    setDisplayType(pss.displayType || "thank_you");
    setView("editor");
  }

  function closeEditor() {
    setView("list");
    setEditing(null);
  }

  function openSubmissions(signup: SignupEvent) {
    setViewingSubmissions(signup);
    setView("submissions");
  }

  const createMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("POST", "/api/signups", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
      toast({ title: "Sign up created" });
      closeEditor();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { await apiRequest("PATCH", `/api/signups/${id}`, data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
      toast({ title: "Sign up updated" });
      closeEditor();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/signups/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
      toast({ title: "Sign up deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!form.formId) {
      toast({ title: "Please select a form", variant: "destructive" });
      return;
    }
    const payload: any = {
      title: form.title,
      slug: form.slug || generateSlug(form.title),
      description: form.description || null,
      category: form.category,
      status: form.status,
      visibility: form.visibility,
      formId: form.formId,
      imageUrl: form.imageUrl || null,
      thumbnailUrl: form.thumbnailUrl || null,
      signupStartDate: form.signupStartDate || null,
      signupEndDate: form.signupEndDate || null,
      eventDate: form.eventDate || null,
      eventEndDate: form.eventEndDate || null,
      location: form.location || null,
      cost: form.cost || null,
      maxSignups: form.maxSignups ? parseInt(form.maxSignups) : null,
      waitlistEnabled: form.waitlistEnabled,
      contactName: form.contactName || null,
      contactEmail: form.contactEmail || null,
      contactPhone: form.contactPhone || null,
      postSubmissionSettings: {
        displayType: displayType,
        successMessage: form.successMessage || null,
        redirectUrl: form.redirectUrl || null,
      },
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  if (view === "submissions" && viewingSubmissions) {
    return <SubmissionsView event={viewingSubmissions} onBack={() => { setView("list"); setViewingSubmissions(null); }} />;
  }

  if (view === "editor") {
    return (
      <div data-testid="tab-signups-editor">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <h1 className="text-2xl font-bold">{editing ? "Edit Sign Up" : "Create Sign Up"}</h1>
          <Button variant="outline" onClick={closeEditor} data-testid="button-cancel-signup">
            Back to List
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setForm({ ...form, title, slug: editing ? form.slug : generateSlug(title) });
                    }}
                    required
                    data-testid="input-signup-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} data-testid="input-signup-slug" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-signup-description" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger data-testid="select-signup-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIGNUP_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{SIGNUP_CATEGORY_LABELS[cat] || cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger data-testid="select-signup-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIGNUP_EVENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                    <SelectTrigger data-testid="select-signup-visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIGNUP_VISIBILITY.map((v) => (
                        <SelectItem key={v} value={v}>{v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Form *</Label>
                <Select value={form.formId ? String(form.formId) : ""} onValueChange={(v) => setForm({ ...form, formId: parseInt(v) })}>
                  <SelectTrigger data-testid="select-signup-form">
                    <SelectValue placeholder="Select a form" />
                  </SelectTrigger>
                  <SelectContent>
                    {formsList?.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} data-testid="input-signup-image-url" />
                </div>
                <div className="space-y-2">
                  <Label>Thumbnail URL</Label>
                  <Input value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} data-testid="input-signup-thumbnail-url" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Signup Start Date</Label>
                  <Input type="datetime-local" value={form.signupStartDate} onChange={(e) => setForm({ ...form, signupStartDate: e.target.value })} data-testid="input-signup-start-date" />
                </div>
                <div className="space-y-2">
                  <Label>Signup End Date</Label>
                  <Input type="datetime-local" value={form.signupEndDate} onChange={(e) => setForm({ ...form, signupEndDate: e.target.value })} data-testid="input-signup-end-date" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Date</Label>
                  <Input type="datetime-local" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} data-testid="input-signup-event-date" />
                </div>
                <div className="space-y-2">
                  <Label>Event End Date</Label>
                  <Input type="datetime-local" value={form.eventEndDate} onChange={(e) => setForm({ ...form, eventEndDate: e.target.value })} data-testid="input-signup-event-end-date" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} data-testid="input-signup-location" />
                </div>
                <div className="space-y-2">
                  <Label>Cost</Label>
                  <Input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} data-testid="input-signup-cost" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Signups</Label>
                  <Input type="number" value={form.maxSignups} onChange={(e) => setForm({ ...form, maxSignups: e.target.value })} data-testid="input-signup-max" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox
                    id="waitlist-enabled"
                    checked={form.waitlistEnabled}
                    onCheckedChange={(checked) => setForm({ ...form, waitlistEnabled: !!checked })}
                    data-testid="checkbox-signup-waitlist"
                  />
                  <Label htmlFor="waitlist-enabled">Waitlist Enabled</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} data-testid="input-signup-contact-name" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} data-testid="input-signup-contact-email" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} data-testid="input-signup-contact-phone" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Post-Submission Display Type</Label>
                <Select value={displayType} onValueChange={(v) => setDisplayType(v)}>
                  <SelectTrigger data-testid="select-signup-display-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIGNUP_DISPLAY_TYPES.map((dt) => (
                      <SelectItem key={dt} value={dt}>{dt.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Post-Submission Success Message</Label>
                <Textarea value={form.successMessage} onChange={(e) => setForm({ ...form, successMessage: e.target.value })} data-testid="input-signup-success-message" />
              </div>

              {displayType === "redirect" && (
                <div className="space-y-2">
                  <Label>Post-Submission Redirect URL</Label>
                  <Input value={form.redirectUrl} onChange={(e) => setForm({ ...form, redirectUrl: e.target.value })} data-testid="input-signup-redirect-url" />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-signup">
                {editing ? "Update Sign Up" : "Create Sign Up"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div data-testid="tab-signups">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-bold">Sign Ups</h1>
        <Button onClick={openCreate} data-testid="button-create-signup">
          <Plus className="w-4 h-4 mr-2" /> Create Sign Up
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <Table data-testid="table-signups">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Signups</TableHead>
              <TableHead>Event Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signups?.map((signup) => (
              <TableRow key={signup.id} data-testid={`row-signup-${signup.id}`}>
                <TableCell className="font-medium" data-testid={`text-signup-title-${signup.id}`}>{signup.title}</TableCell>
                <TableCell data-testid={`text-signup-category-${signup.id}`}>
                  <Badge variant="secondary">{SIGNUP_CATEGORY_LABELS[signup.category] || signup.category}</Badge>
                </TableCell>
                <TableCell data-testid={`text-signup-status-${signup.id}`}>
                  <Badge variant={signup.status === "published" ? "default" : "secondary"}>{signup.status}</Badge>
                </TableCell>
                <TableCell data-testid={`text-signup-count-${signup.id}`}>
                  {signup.currentSignupCount}{signup.maxSignups != null ? `/${signup.maxSignups}` : ""}
                </TableCell>
                <TableCell data-testid={`text-signup-date-${signup.id}`}>
                  {signup.eventDate ? new Date(signup.eventDate).toLocaleDateString() : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(signup)} data-testid={`button-edit-signup-${signup.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openSubmissions(signup)} data-testid={`button-submissions-signup-${signup.id}`}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(signup.id)} data-testid={`button-delete-signup-${signup.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

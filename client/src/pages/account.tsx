import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { v1Fetch, v1Put } from "@/lib/v1Api";
import { Loader2, User, ClipboardList, DollarSign, FileText, LogOut, Check, X, Clock } from "lucide-react";

type TabKey = "profile" | "signups" | "giving" | "forms";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    confirmed: "default",
    registered: "default",
    completed: "default",
    waitlisted: "secondary",
    pending: "secondary",
    cancelled: "destructive",
    canceled: "destructive",
    failed: "destructive",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
}

export default function Account() {
  const [, navigate] = useLocation();
  const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    gender: "" as string,
    dateOfBirth: "",
    maritalStatus: "" as string,
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const [signupSubs, setSignupSubs] = useState<any[]>([]);
  const [donationsList, setDonationsList] = useState<any[]>([]);
  const [formSubs, setFormSubs] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        zip: user.zip || "",
        gender: (user as any).gender || "",
        dateOfBirth: (user as any).dateOfBirth || "",
        maritalStatus: (user as any).maritalStatus || "",
        emergencyContactName: (user as any).emergencyContactName || "",
        emergencyContactPhone: (user as any).emergencyContactPhone || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === "signups" && signupSubs.length === 0) {
      loadSignups();
    } else if (activeTab === "giving" && donationsList.length === 0) {
      loadDonations();
    } else if (activeTab === "forms" && formSubs.length === 0) {
      loadFormSubs();
    }
  }, [activeTab, isAuthenticated]);

  async function loadSignups() {
    setHistoryLoading(true);
    const result = await v1Fetch("/api/v1/my/signup-submissions");
    if (result.success) setSignupSubs(result.data || []);
    setHistoryLoading(false);
  }

  async function loadDonations() {
    setHistoryLoading(true);
    const result = await v1Fetch("/api/v1/my/donations");
    if (result.success) setDonationsList(result.data || []);
    setHistoryLoading(false);
  }

  async function loadFormSubs() {
    setHistoryLoading(true);
    const result = await v1Fetch("/api/v1/my/form-submissions");
    if (result.success) setFormSubs(result.data || []);
    setHistoryLoading(false);
  }

  async function saveProfile() {
    setSaving(true);
    const payload = {
      ...profileForm,
      gender: profileForm.gender || null,
      maritalStatus: profileForm.maritalStatus || null,
      dateOfBirth: profileForm.dateOfBirth || undefined,
      emergencyContactName: profileForm.emergencyContactName || undefined,
      emergencyContactPhone: profileForm.emergencyContactPhone || undefined,
    };
    const result = await v1Put("/api/v1/auth/me", payload);
    setSaving(false);
    if (result.success) {
      toast({ title: "Profile updated" });
      setEditing(false);
      refreshUser();
    } else {
      toast({ title: "Update failed", description: result.error || undefined, variant: "destructive" });
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 pt-20">
        <Card className="bg-zinc-900 border-white/10 max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-white/70 mb-4">Please sign in to view your account.</p>
            <Link href="/login">
              <Button
                className="text-white border-transparent"
                style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
                data-testid="link-login-redirect"
              >
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: typeof User }[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "signups", label: "Sign Ups", icon: ClipboardList },
    { key: "giving", label: "Giving", icon: DollarSign },
    { key: "forms", label: "Forms", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-black pt-20 pb-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold text-white"
              style={{ fontFamily: "Montserrat, sans-serif" }}
              data-testid="text-account-title"
            >
              My Account
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Welcome, {user?.name || user?.email || "Member"}
            </p>
          </div>
          <Button
            variant="outline"
            className="text-white/70 border-white/20"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "ghost"}
              className={activeTab === tab.key
                ? "text-white border-transparent"
                : "text-white/60"
              }
              style={activeTab === tab.key ? { background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" } : undefined}
              onClick={() => setActiveTab(tab.key)}
              data-testid={`tab-${tab.key}`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {activeTab === "profile" && (
          <Card className="bg-zinc-900 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-white text-lg" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Personal Information
              </CardTitle>
              {!editing ? (
                <Button
                  variant="outline"
                  className="text-white/70 border-white/20"
                  onClick={() => setEditing(true)}
                  data-testid="button-edit-profile"
                >
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="text-white/70 border-white/20"
                    onClick={() => setEditing(false)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={saving}
                    className="text-white border-transparent"
                    style={{ background: "linear-gradient(135deg, #00D4FF, #0088DD, #0033AA)" }}
                    onClick={saveProfile}
                    data-testid="button-save-profile"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs">Email</Label>
                  <p className="text-white text-sm" data-testid="text-profile-email">{user?.email || "—"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs">Full Name</Label>
                  {editing ? (
                    <Input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                      className="bg-zinc-800 border-white/10 text-white"
                      data-testid="input-profile-name"
                      autoComplete="name"
                    />
                  ) : (
                    <p className="text-white text-sm" data-testid="text-profile-name">{user?.name || "—"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs">Phone</Label>
                  {editing ? (
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                      className="bg-zinc-800 border-white/10 text-white"
                      data-testid="input-profile-phone"
                      autoComplete="tel"
                    />
                  ) : (
                    <p className="text-white text-sm" data-testid="text-profile-phone">{user?.phone || "—"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs">Gender</Label>
                  {editing ? (
                    <Select
                      value={profileForm.gender || ""}
                      onValueChange={(v) => setProfileForm((f) => ({ ...f, gender: v }))}
                    >
                      <SelectTrigger className="bg-zinc-800 border-white/10 text-white" data-testid="select-profile-gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-white text-sm" data-testid="text-profile-gender">{(user as any)?.gender || "—"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs">Date of Birth</Label>
                  {editing ? (
                    <Input
                      type="date"
                      value={profileForm.dateOfBirth}
                      onChange={(e) => setProfileForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                      className="bg-zinc-800 border-white/10 text-white"
                      data-testid="input-profile-dob"
                    />
                  ) : (
                    <p className="text-white text-sm" data-testid="text-profile-dob">{formatDate((user as any)?.dateOfBirth)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs">Marital Status</Label>
                  {editing ? (
                    <Select
                      value={profileForm.maritalStatus || ""}
                      onValueChange={(v) => setProfileForm((f) => ({ ...f, maritalStatus: v }))}
                    >
                      <SelectTrigger className="bg-zinc-800 border-white/10 text-white" data-testid="select-profile-marital">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-white text-sm" data-testid="text-profile-marital">{(user as any)?.maritalStatus || "—"}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <h3 className="text-white/80 text-sm font-medium mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-white/60 text-xs">Street Address</Label>
                    {editing ? (
                      <Input
                        value={profileForm.address}
                        onChange={(e) => setProfileForm((f) => ({ ...f, address: e.target.value }))}
                        className="bg-zinc-800 border-white/10 text-white"
                        data-testid="input-profile-address"
                        autoComplete="street-address"
                      />
                    ) : (
                      <p className="text-white text-sm" data-testid="text-profile-address">{user?.address || "—"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/60 text-xs">City</Label>
                    {editing ? (
                      <Input
                        value={profileForm.city}
                        onChange={(e) => setProfileForm((f) => ({ ...f, city: e.target.value }))}
                        className="bg-zinc-800 border-white/10 text-white"
                        data-testid="input-profile-city"
                        autoComplete="address-level2"
                      />
                    ) : (
                      <p className="text-white text-sm" data-testid="text-profile-city">{user?.city || "—"}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/60 text-xs">State</Label>
                      {editing ? (
                        <Input
                          value={profileForm.state}
                          onChange={(e) => setProfileForm((f) => ({ ...f, state: e.target.value }))}
                          className="bg-zinc-800 border-white/10 text-white"
                          data-testid="input-profile-state"
                          autoComplete="address-level1"
                        />
                      ) : (
                        <p className="text-white text-sm" data-testid="text-profile-state">{user?.state || "—"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/60 text-xs">ZIP</Label>
                      {editing ? (
                        <Input
                          value={profileForm.zip}
                          onChange={(e) => setProfileForm((f) => ({ ...f, zip: e.target.value }))}
                          className="bg-zinc-800 border-white/10 text-white"
                          data-testid="input-profile-zip"
                          autoComplete="postal-code"
                        />
                      ) : (
                        <p className="text-white text-sm" data-testid="text-profile-zip">{user?.zip || "—"}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <h3 className="text-white/80 text-sm font-medium mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>Emergency Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/60 text-xs">Contact Name</Label>
                    {editing ? (
                      <Input
                        value={profileForm.emergencyContactName}
                        onChange={(e) => setProfileForm((f) => ({ ...f, emergencyContactName: e.target.value }))}
                        className="bg-zinc-800 border-white/10 text-white"
                        data-testid="input-profile-emergency-name"
                        placeholder="Full name"
                      />
                    ) : (
                      <p className="text-white text-sm" data-testid="text-profile-emergency-name">{(user as any)?.emergencyContactName || "—"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/60 text-xs">Contact Phone</Label>
                    {editing ? (
                      <Input
                        value={profileForm.emergencyContactPhone}
                        onChange={(e) => setProfileForm((f) => ({ ...f, emergencyContactPhone: e.target.value }))}
                        className="bg-zinc-800 border-white/10 text-white"
                        data-testid="input-profile-emergency-phone"
                        placeholder="Phone number"
                        autoComplete="tel"
                      />
                    ) : (
                      <p className="text-white text-sm" data-testid="text-profile-emergency-phone">{(user as any)?.emergencyContactPhone || "—"}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-white/40 text-xs">
                  Member since {formatDate(user?.createdAt as any)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "signups" && (
          <Card className="bg-zinc-900 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg" style={{ fontFamily: "Montserrat, sans-serif" }}>
                My Sign Ups
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                </div>
              ) : signupSubs.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50">No sign ups yet</p>
                  <Link href="/signups">
                    <Button
                      variant="outline"
                      className="mt-3 text-white/70 border-white/20"
                      data-testid="link-browse-signups"
                    >
                      Browse Sign Ups
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {signupSubs.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-md bg-zinc-800/50 flex-wrap"
                      data-testid={`signup-history-${sub.id}`}
                    >
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {sub.signupEvent?.title || `Event #${sub.signupEventId}`}
                        </p>
                        <p className="text-white/40 text-xs">{formatDate(sub.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.checkedIn && (
                          <Badge variant="outline" className="text-green-400 border-green-400/30">
                            <Check className="w-3 h-3 mr-1" />
                            Checked In
                          </Badge>
                        )}
                        <StatusBadge status={sub.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "giving" && (
          <Card className="bg-zinc-900 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Giving History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                </div>
              ) : donationsList.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50">No giving history yet</p>
                  <Link href="/give">
                    <Button
                      variant="outline"
                      className="mt-3 text-white/70 border-white/20"
                      data-testid="link-give"
                    >
                      Give Now
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {donationsList.map((don: any) => (
                    <div
                      key={don.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-md bg-zinc-800/50 flex-wrap"
                      data-testid={`donation-history-${don.id}`}
                    >
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium">
                          {formatCurrency(don.amountCents)}
                          {don.fund?.name ? ` — ${don.fund.name}` : ""}
                        </p>
                        <p className="text-white/40 text-xs">
                          {formatDate(don.createdAt)}
                          {don.frequency !== "one_time" ? ` · ${don.frequency}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={don.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "forms" && (
          <Card className="bg-zinc-900 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Form Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                </div>
              ) : formSubs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50">No form submissions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formSubs.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-md bg-zinc-800/50 flex-wrap"
                      data-testid={`form-history-${sub.id}`}
                    >
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {sub.form?.title || `Form #${sub.formId}`}
                        </p>
                        <p className="text-white/40 text-xs">{formatDate(sub.submittedAt)}</p>
                      </div>
                      <Badge variant="outline" className="text-white/50">
                        <Clock className="w-3 h-3 mr-1" />
                        Submitted
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}

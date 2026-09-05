import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare, Users, FileText, Send, Inbox, Settings, Tag, Plus, Trash2, Pencil,
  Phone, Clock, TrendingUp, AlertTriangle, CheckCircle2, XCircle, ArrowUpRight,
} from "lucide-react";
import type { SmsGroup, SmsTemplate, SmsMessage, SmsSettings, SmsIncomingMessage, SmsOptOut } from "@shared/schema";
import { AVAILABLE_ROLES, ROLE_LABELS } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmDelete from "@/components/confirm-delete";

export default function AdminSmsTab() {
  const [subTab, setSubTab] = useState("overview");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-2xl font-bold" data-testid="text-sms-title">SMS Messaging</h2>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview" data-testid="tab-sms-overview"><TrendingUp className="w-4 h-4 mr-1" /> Overview</TabsTrigger>
          <TabsTrigger value="compose" data-testid="tab-sms-compose"><Send className="w-4 h-4 mr-1" /> Compose</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-sms-history"><MessageSquare className="w-4 h-4 mr-1" /> History</TabsTrigger>
          <TabsTrigger value="groups" data-testid="tab-sms-groups"><Users className="w-4 h-4 mr-1" /> Groups</TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-sms-templates"><FileText className="w-4 h-4 mr-1" /> Templates</TabsTrigger>
          <TabsTrigger value="inbox" data-testid="tab-sms-inbox"><Inbox className="w-4 h-4 mr-1" /> Inbox</TabsTrigger>
          <TabsTrigger value="optouts" data-testid="tab-sms-optouts"><XCircle className="w-4 h-4 mr-1" /> Opt-Outs</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-sms-settings"><Settings className="w-4 h-4 mr-1" /> Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><SmsOverview /></TabsContent>
        <TabsContent value="compose"><SmsCompose /></TabsContent>
        <TabsContent value="history"><SmsHistory /></TabsContent>
        <TabsContent value="groups"><SmsGroups /></TabsContent>
        <TabsContent value="templates"><SmsTemplates /></TabsContent>
        <TabsContent value="inbox"><SmsInbox /></TabsContent>
        <TabsContent value="optouts"><SmsOptOuts /></TabsContent>
        <TabsContent value="settings"><SmsSettingsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function SmsOverview() {
  const { data: stats } = useQuery<{
    messagesToday: number;
    messagesThisMonth: number;
    costThisMonth: string;
    dailyLimit: number;
    monthlyLimit: number;
    optOutCount: number;
  }>({ queryKey: ["/api/sms/stats"] });

  const { data: messages } = useQuery<SmsMessage[]>({ queryKey: ["/api/sms/messages"] });
  const { data: inbox } = useQuery<SmsIncomingMessage[]>({ queryKey: ["/api/sms/inbox"], queryFn: async () => {
    const res = await fetch("/api/sms/inbox?filter=needs_response");
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  }});

  const recentMessages = messages?.slice(0, 5) || [];
  const needsResponse = inbox?.length || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sent Today</CardTitle>
            <Send className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-sms-sent-today">{stats?.messagesToday ?? 0}</div>
            <p className="text-xs text-muted-foreground">of {stats?.dailyLimit ?? 1000} daily limit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-sms-sent-month">{stats?.messagesThisMonth ?? 0}</div>
            <p className="text-xs text-muted-foreground">of {stats?.monthlyLimit ?? 10000} monthly limit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Cost</CardTitle>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-sms-cost">${stats?.costThisMonth ?? "0.00"}</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Needs Response</CardTitle>
            <Inbox className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-sms-needs-response">{needsResponse}</div>
            <p className="text-xs text-muted-foreground">{stats?.optOutCount || 0} total opt-outs</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {recentMessages.length === 0 ? (
            <p className="text-muted-foreground text-sm">No messages sent yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMessages.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell className="whitespace-nowrap">{msg.sentAt ? new Date(msg.sentAt).toLocaleDateString() : "Pending"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{msg.messageBody}</TableCell>
                    <TableCell>{msg.recipientCount}</TableCell>
                    <TableCell>
                      <StatusBadge status={msg.status} />
                    </TableCell>
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

function SmsCompose() {
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [groupId, setGroupId] = useState<string>("");
  const [channel, setChannel] = useState("sms");
  const [personalize, setPersonalize] = useState(true);
  const [respectQuietHours, setRespectQuietHours] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testSending, setTestSending] = useState(false);

  const { data: groups } = useQuery<SmsGroup[]>({ queryKey: ["/api/sms/groups"] });
  const { data: templates } = useQuery<SmsTemplate[]>({ queryKey: ["/api/sms/templates"] });
  const { data: preview } = useQuery({
    queryKey: ["/api/sms/groups", groupId, "preview"],
    enabled: !!groupId,
    queryFn: async () => {
      const res = await fetch(`/api/sms/groups/${groupId}/preview`);
      return res.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/sms/messages/send", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Message sending", description: "Your message is being sent to the selected group." });
      queryClient.invalidateQueries({ queryKey: ["/api/sms/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sms/stats"] });
      setBody("");
      setGroupId("");
    },
    onError: (err: any) => {
      toast({ title: "Send Failed", description: err.message, variant: "destructive" });
    },
  });

  const charCount = body.length;
  const segmentCount = body.length > 0 ? Math.ceil(body.length / ((/[^\x00-\x7F]/.test(body)) ? 70 : 160)) : 0;
  const isGSM = !/[^\x00-\x7F]/.test(body);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tmpl = templates?.find(t => t.id === Number(templateId));
    if (tmpl) setBody(tmpl.body);
  };

  const handleSend = () => {
    if (!body.trim()) return;
    if (!groupId) {
      toast({ title: "Select a group", variant: "destructive" });
      return;
    }
    // Review step before anything goes out
    setReviewOpen(true);
  };

  const confirmSend = () => {
    setReviewOpen(false);
    sendMutation.mutate({
      groupId: Number(groupId),
      messageBody: body,
      deliveryChannel: channel,
      personalize,
      respectQuietHours,
      templateId: selectedTemplate && selectedTemplate !== "none" ? Number(selectedTemplate) : undefined,
    });
  };

  async function sendTest() {
    if (!testPhone.trim() || !body.trim()) return;
    setTestSending(true);
    try {
      await apiRequest("POST", "/api/sms/settings/test", { phone: testPhone.trim(), message: body });
      toast({ title: "Test sent", description: `Check ${testPhone.trim()} for the message.` });
    } catch (e: any) {
      toast({ title: "Test failed", description: e.message, variant: "destructive" });
    } finally {
      setTestSending(false);
    }
  }

  const recipientCount = preview?.canReceiveSms || 0;
  const estCost = (segmentCount * recipientCount * 0.0079).toFixed(2);
  const selectedGroupName = groups?.find((g) => String(g.id) === groupId)?.name || "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Compose Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient Group</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger data-testid="select-sms-group">
                  <SelectValue placeholder="Select a group..." />
                </SelectTrigger>
                <SelectContent>
                  {groups?.map(g => (
                    <SelectItem key={g.id} value={g.id.toString()} data-testid={`select-group-${g.id}`}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Template (optional)</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger data-testid="select-sms-template">
                  <SelectValue placeholder="Start from template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates?.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()} data-testid={`select-template-${t.id}`}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Message Body</Label>
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Type your message here. Use {{first_name}} for personalization..."
                className="min-h-[120px]"
                data-testid="input-sms-body"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground gap-2 flex-wrap">
                <span>{charCount} characters | {segmentCount} segment{segmentCount !== 1 ? "s" : ""} | {isGSM ? "GSM" : "Unicode"}</span>
                <span>Variables: {"{{first_name}} {{name}} {{church_name}}"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Delivery Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger data-testid="select-sms-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS Only</SelectItem>
                  <SelectItem value="push">Push Notification Only</SelectItem>
                  <SelectItem value="both">Both SMS + Push</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Switch checked={personalize} onCheckedChange={setPersonalize} data-testid="switch-personalize" />
                <Label className="text-sm">Personalize with names</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={respectQuietHours} onCheckedChange={setRespectQuietHours} data-testid="switch-quiet-hours" />
                <Label className="text-sm">Respect quiet hours</Label>
              </div>
            </div>

            <div className="flex items-end gap-2 flex-wrap border rounded-md p-3 bg-muted/30">
              <div className="space-y-1">
                <Label className="text-xs">Send a test to yourself first</Label>
                <Input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="Your phone number"
                  className="w-[180px] h-9"
                  data-testid="input-test-phone"
                />
              </div>
              <Button variant="outline" size="sm" onClick={sendTest} disabled={testSending || !body.trim() || !testPhone.trim()} data-testid="button-send-test">
                {testSending ? "Sending..." : "Send Test"}
              </Button>
            </div>

            <Button onClick={handleSend} disabled={sendMutation.isPending || !body.trim()} className="w-full" data-testid="button-send-sms">
              <Send className="w-4 h-4 mr-2" />
              {sendMutation.isPending ? "Sending..." : "Review & Send"}
            </Button>
          </CardContent>
        </Card>

        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogContent data-testid="dialog-sms-review">
            <DialogHeader>
              <DialogTitle>Ready to send?</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">To</span><span className="font-medium">{selectedGroupName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">People who will get it</span><span className="font-medium">{recipientCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Message parts</span><span className="font-medium">{segmentCount}</span></div>
              {channel !== "push" && (
                <div className="flex justify-between"><span className="text-muted-foreground">Estimated cost</span><span className="font-medium">${estCost}</span></div>
              )}
              <p className="border rounded-md p-3 bg-muted/30 whitespace-pre-wrap">{body}</p>
              <p className="text-xs text-muted-foreground">Once sent, a text message can't be recalled.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewOpen(false)}>Go Back</Button>
              <Button onClick={confirmSend} disabled={sendMutation.isPending} data-testid="button-confirm-send-sms">
                <Send className="w-4 h-4 mr-2" /> Send to {recipientCount} {recipientCount === 1 ? "person" : "people"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {groupId && preview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Group Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Members:</span>
                <span className="font-medium">{preview.totalMembers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">With Phone:</span>
                <span className="font-medium">{preview.withPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mobile Phones:</span>
                <span className="font-medium">{preview.mobilePhones}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-green-600">Can Receive SMS:</span>
                <span className="font-bold text-green-600">{preview.canReceiveSms}</span>
              </div>
              {preview.optedOut > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-yellow-600">Opted Out:</span>
                  <span className="font-medium text-yellow-600">{preview.optedOut}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {body.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cost Estimate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Segments per message:</span>
                <span className="font-medium">{segmentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipients:</span>
                <span className="font-medium">{preview?.canReceiveSms || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Cost:</span>
                <span className="font-bold">${((segmentCount * (preview?.canReceiveSms || 0) * 0.0079).toFixed(4))}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Message Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-3 text-sm break-words whitespace-pre-wrap">
              {body || "Your message will appear here..."}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SmsHistory() {
  const { data: messages, isLoading } = useQuery<SmsMessage[]>({ queryKey: ["/api/sms/messages"] });
  const [selectedMessage, setSelectedMessage] = useState<SmsMessage | null>(null);
  const { data: recipients } = useQuery<any[]>({
    queryKey: ["/api/sms/messages", selectedMessage?.id, "recipients"],
    enabled: !!selectedMessage,
    queryFn: async () => {
      const res = await fetch(`/api/sms/messages/${selectedMessage!.id}/recipients`);
      return res.json();
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent>
          {!messages?.length ? (
            <p className="text-muted-foreground text-sm">No messages sent yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map(msg => (
                  <TableRow key={msg.id}>
                    <TableCell className="whitespace-nowrap">{msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ""}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{msg.messageBody}</TableCell>
                    <TableCell><Badge variant="secondary">{msg.deliveryChannel}</Badge></TableCell>
                    <TableCell>{msg.recipientCount}</TableCell>
                    <TableCell className="text-green-600">{msg.smsDeliveredCount || 0}</TableCell>
                    <TableCell className="text-red-600">{msg.smsFailedCount || 0}</TableCell>
                    <TableCell><StatusBadge status={msg.status} /></TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setSelectedMessage(msg)} data-testid={`button-view-msg-${msg.id}`}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3 text-sm">{selectedMessage.messageBody}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={selectedMessage.status} /></div>
                <div><span className="text-muted-foreground">Channel:</span> {selectedMessage.deliveryChannel}</div>
                <div><span className="text-muted-foreground">Recipients:</span> {selectedMessage.recipientCount}</div>
                <div><span className="text-muted-foreground">Segments:</span> {selectedMessage.segmentCount}</div>
              </div>
              {recipients && recipients.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Delivery Report ({recipients.length} recipients)</h4>
                  <div className="max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent</TableHead>
                          <TableHead>Delivered</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipients.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell>{r.phoneNumber}</TableCell>
                            <TableCell><StatusBadge status={r.status} /></TableCell>
                            <TableCell>{r.sentAt ? new Date(r.sentAt).toLocaleTimeString() : "-"}</TableCell>
                            <TableCell>{r.deliveredAt ? new Date(r.deliveredAt).toLocaleTimeString() : "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SmsGroups() {
  const { toast } = useToast();
  const { data: groups, isLoading } = useQuery<SmsGroup[]>({ queryKey: ["/api/sms/groups"] });
  const [showCreate, setShowCreate] = useState(false);
  const [editGroup, setEditGroup] = useState<SmsGroup | null>(null);
  const [form, setForm] = useState({ name: "", description: "", groupType: "custom" as string, filterRoles: [] as string[], filterTags: "", phoneVerifiedOnly: false });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/sms/groups", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Group created" });
      queryClient.invalidateQueries({ queryKey: ["/api/sms/groups"] });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/sms/groups/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Group updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/sms/groups"] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/sms/groups/${id}`),
    onSuccess: () => {
      toast({ title: "Group deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/sms/groups"] });
    },
  });

  function openEdit(group: SmsGroup) {
    setEditGroup(group);
    setForm({
      name: group.name,
      description: group.description || "",
      groupType: group.groupType,
      filterRoles: Array.isArray((group.filterCriteria as any)?.roles) ? (group.filterCriteria as any).roles : [],
      filterTags: Array.isArray((group.filterCriteria as any)?.tags) ? (group.filterCriteria as any).tags.join(", ") : "",
      phoneVerifiedOnly: !!(group.filterCriteria as any)?.phoneVerifiedOnly,
    });
    setShowCreate(true);
  }

  function closeDialog() {
    setShowCreate(false);
    setEditGroup(null);
    setForm({ name: "", description: "", groupType: "custom", filterRoles: [], filterTags: "", phoneVerifiedOnly: false });
  }

  const handleSave = () => {
    // Build filter criteria from the friendly controls
    let filterCriteria: any = null;
    if (form.groupType === "role") {
      filterCriteria = { roles: form.filterRoles, ...(form.phoneVerifiedOnly ? { phoneVerifiedOnly: true } : {}) };
    } else if (form.groupType === "ministry" || form.groupType === "tag") {
      const tags = form.filterTags.split(",").map((t) => t.trim()).filter(Boolean);
      filterCriteria = { tags, ...(form.phoneVerifiedOnly ? { phoneVerifiedOnly: true } : {}) };
    } else if (form.groupType === "all" && form.phoneVerifiedOnly) {
      filterCriteria = { phoneVerifiedOnly: true };
    }
    const data = { name: form.name, description: form.description, groupType: form.groupType, filterCriteria };
    if (editGroup) {
      updateMutation.mutate({ id: editGroup.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg font-semibold">SMS Groups</h3>
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-group">
          <Plus className="w-4 h-4 mr-2" /> New Group
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {!groups?.length ? (
            <p className="text-muted-foreground text-sm">No groups yet. Create one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell><Badge variant="secondary">{g.groupType}</Badge></TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{g.description || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" aria-label="Edit group" onClick={() => openEdit(g)} data-testid={`button-edit-group-${g.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <ConfirmDelete
                          title={`Delete "${g.name}"?`}
                          description="Messages already sent to this group are kept, but you won't be able to send to it anymore. This cannot be undone."
                          onConfirm={() => deleteMutation.mutate(g.id)}
                        >
                          <Button size="icon" variant="ghost" aria-label="Delete group" data-testid={`button-delete-group-${g.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </ConfirmDelete>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editGroup ? "Edit SMS Group" : "Create SMS Group"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. All Members" data-testid="input-group-name" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description..." data-testid="input-group-description" />
            </div>
            <div className="space-y-2">
              <Label>Group Type</Label>
              <Select value={form.groupType} onValueChange={v => setForm({ ...form, groupType: v })}>
                <SelectTrigger data-testid="select-group-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom (manual members)</SelectItem>
                  <SelectItem value="role">Role-based (dynamic)</SelectItem>
                  <SelectItem value="ministry">Ministry-based (dynamic)</SelectItem>
                  <SelectItem value="tag">Tag-based (dynamic)</SelectItem>
                  <SelectItem value="all">All Members</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.groupType === "role" && (
              <div className="space-y-2">
                <Label>Include people with these roles</Label>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
                  {AVAILABLE_ROLES.map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={form.filterRoles.includes(r)}
                        onCheckedChange={(checked) => {
                          setForm({
                            ...form,
                            filterRoles: checked === true
                              ? [...form.filterRoles, r]
                              : form.filterRoles.filter((x) => x !== r),
                          });
                        }}
                        data-testid={`checkbox-group-role-${r}`}
                      />
                      {ROLE_LABELS[r] || r}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {(form.groupType === "ministry" || form.groupType === "tag") && (
              <div className="space-y-2">
                <Label>Tags <span className="text-muted-foreground font-normal">(separate with commas)</span></Label>
                <Input
                  value={form.filterTags}
                  onChange={(e) => setForm({ ...form, filterTags: e.target.value })}
                  placeholder="e.g. kids, volunteers"
                  data-testid="input-group-tags"
                />
              </div>
            )}
            {form.groupType !== "custom" && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.phoneVerifiedOnly}
                  onCheckedChange={(v) => setForm({ ...form, phoneVerifiedOnly: v })}
                  data-testid="switch-phone-verified"
                />
                <Label className="text-sm">Only include people with a verified phone number</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending} data-testid="button-save-group">
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editGroup ? "Save Changes" : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SmsTemplates() {
  const { toast } = useToast();
  const { data: templates, isLoading } = useQuery<SmsTemplate[]>({ queryKey: ["/api/sms/templates"] });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", body: "", category: "general" });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/sms/templates", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Template created" });
      queryClient.invalidateQueries({ queryKey: ["/api/sms/templates"] });
      setShowCreate(false);
      setForm({ name: "", body: "", category: "general" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/sms/templates/${id}`),
    onSuccess: () => {
      toast({ title: "Template deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/sms/templates"] });
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg font-semibold">Message Templates</h3>
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-template">
          <Plus className="w-4 h-4 mr-2" /> New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!templates?.length ? (
          <p className="text-muted-foreground text-sm col-span-full">No templates yet.</p>
        ) : templates.map(t => (
          <Card key={t.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{t.name}</CardTitle>
                <Badge variant="secondary" className="mt-1">{t.category}</Badge>
              </div>
              <ConfirmDelete
                title={`Delete the "${t.name}" template?`}
                description="This cannot be undone."
                onConfirm={() => deleteMutation.mutate(t.id)}
              >
                <Button size="icon" variant="ghost" aria-label="Delete template" data-testid={`button-delete-template-${t.id}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </ConfirmDelete>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground break-words">{t.body}</p>
              <p className="text-xs text-muted-foreground mt-2">Used {t.useCount || 0} times | {Math.ceil(t.body.length / 160)} segment(s)</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sunday Reminder" data-testid="input-template-name" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger data-testid="select-template-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message Body</Label>
              <Textarea
                value={form.body}
                onChange={e => setForm({ ...form, body: e.target.value })}
                placeholder="Type your template message..."
                className="min-h-[120px]"
                data-testid="input-template-body"
              />
              <p className="text-xs text-muted-foreground">{form.body.length} chars | {Math.ceil(form.body.length / 160) || 0} segment(s)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.name.trim() || !form.body.trim() || createMutation.isPending} data-testid="button-save-template">
              {createMutation.isPending ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SmsInbox() {
  const { toast } = useToast();
  const { data: messages, isLoading } = useQuery<SmsIncomingMessage[]>({ queryKey: ["/api/sms/inbox"] });

  const respondMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/sms/inbox/${id}/respond`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Marked as responded" });
      queryClient.invalidateQueries({ queryKey: ["/api/sms/inbox"] });
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">SMS Inbox</h3>
      <Card>
        <CardContent className="pt-4">
          {!messages?.length ? (
            <p className="text-muted-foreground text-sm">No incoming messages.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map(msg => (
                  <TableRow key={msg.id} className={msg.requiresResponse && !msg.responded ? "bg-yellow-50/50 dark:bg-yellow-900/10" : ""}>
                    <TableCell className="font-mono text-sm">{msg.fromNumber}</TableCell>
                    <TableCell className="max-w-[300px]">{msg.messageBody}</TableCell>
                    <TableCell>
                      {msg.isOptOut ? <Badge variant="destructive">Opt-Out</Badge> :
                       msg.isOptIn ? <Badge className="bg-green-600">Opt-In</Badge> :
                       <Badge variant="secondary">Message</Badge>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}</TableCell>
                    <TableCell>
                      {msg.responded ? (
                        <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Responded</span>
                      ) : msg.requiresResponse ? (
                        <span className="text-yellow-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Needs Response</span>
                      ) : (
                        <span className="text-muted-foreground">Auto-handled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {msg.requiresResponse && !msg.responded && (
                        <Button size="sm" variant="outline" onClick={() => respondMutation.mutate(msg.id)} data-testid={`button-respond-${msg.id}`}>
                          Mark Responded
                        </Button>
                      )}
                    </TableCell>
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

function SmsOptOuts() {
  const { toast } = useToast();
  const { data: optOuts, isLoading } = useQuery<SmsOptOut[]>({ queryKey: ["/api/sms/opt-outs"] });

  const restoreMutation = useMutation({
    mutationFn: async (phone: string) => {
      const res = await apiRequest("POST", `/api/sms/opt-outs/${encodeURIComponent(phone)}/restore`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User opted back in" });
      queryClient.invalidateQueries({ queryKey: ["/api/sms/opt-outs"] });
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Opt-Out List</h3>
      <Card>
        <CardContent className="pt-4">
          {!optOuts?.length ? (
            <p className="text-muted-foreground text-sm">No opt-outs recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {optOuts.map(opt => (
                  <TableRow key={opt.id}>
                    <TableCell className="font-mono">{opt.phoneNumber}</TableCell>
                    <TableCell><Badge variant="secondary">{opt.optOutMethod}</Badge></TableCell>
                    <TableCell>{opt.optedOutAt ? new Date(opt.optedOutAt).toLocaleDateString() : ""}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => restoreMutation.mutate(opt.phoneNumber)} data-testid={`button-restore-${opt.id}`}>
                        Restore
                      </Button>
                    </TableCell>
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

function SmsSettingsPanel() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<SmsSettings>({ queryKey: ["/api/sms/settings"] });
  const [form, setForm] = useState<Partial<SmsSettings>>({});

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/sms/settings", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Settings updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/sms/settings"] });
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sms/settings/test");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Test message sent to your phone" });
    },
    onError: (err: any) => {
      toast({ title: "Test failed", description: err.message, variant: "destructive" });
    },
  });

  const currentSettings = { ...settings, ...form };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4 max-w-2xl">
      <h3 className="text-lg font-semibold">SMS Settings</h3>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Configure SMS messaging options for Lake City Christian Church.</p>
          <div className="space-y-2">
            <Label>Church Name Prefix</Label>
            <Input
              value={currentSettings.churchNamePrefix || ""}
              onChange={e => setForm({ ...form, churchNamePrefix: e.target.value })}
              placeholder="LC3: "
              data-testid="input-church-prefix"
            />
            <p className="text-xs text-muted-foreground">Prepended to every outgoing message</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quiet Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={currentSettings.quietHoursEnabled ?? true}
              onCheckedChange={v => setForm({ ...form, quietHoursEnabled: v })}
              data-testid="switch-quiet-hours-enabled"
            />
            <Label>Enable Quiet Hours</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={currentSettings.quietHoursStart || "21:00"}
                onChange={e => setForm({ ...form, quietHoursStart: e.target.value })}
                data-testid="input-quiet-start"
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={currentSettings.quietHoursEnd || "08:00"}
                onChange={e => setForm({ ...form, quietHoursEnd: e.target.value })}
                data-testid="input-quiet-end"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rate Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Daily Limit</Label>
              <Input
                type="number"
                value={currentSettings.dailyLimit || 1000}
                onChange={e => setForm({ ...form, dailyLimit: Number(e.target.value) })}
                data-testid="input-daily-limit"
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly Limit</Label>
              <Input
                type="number"
                value={currentSettings.monthlyLimit || 10000}
                onChange={e => setForm({ ...form, monthlyLimit: Number(e.target.value) })}
                data-testid="input-monthly-limit"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auto-Reply</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={currentSettings.autoReplyEnabled ?? false}
              onCheckedChange={v => setForm({ ...form, autoReplyEnabled: v })}
              data-testid="switch-auto-reply"
            />
            <Label>Enable Auto-Reply</Label>
          </div>
          <div className="space-y-2">
            <Label>Auto-Reply Message</Label>
            <Textarea
              value={currentSettings.autoReplyMessage || ""}
              onChange={e => setForm({ ...form, autoReplyMessage: e.target.value })}
              placeholder="Thank you for your message. We'll get back to you soon."
              data-testid="input-auto-reply"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={currentSettings.includeOptOutFooter ?? true}
              onCheckedChange={v => setForm({ ...form, includeOptOutFooter: v })}
              data-testid="switch-opt-out-footer"
            />
            <Label>Include opt-out footer ("Reply STOP to unsubscribe")</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending} data-testid="button-save-sms-settings">
          {updateMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
        <Button variant="outline" onClick={() => testMutation.mutate()} disabled={testMutation.isPending} data-testid="button-test-sms">
          <Phone className="w-4 h-4 mr-2" />
          {testMutation.isPending ? "Sending..." : "Send Test SMS"}
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    draft: { variant: "secondary", label: "Draft" },
    sending: { variant: "default", label: "Sending" },
    sent: { variant: "default", label: "Sent" },
    delivered: { variant: "default", label: "Delivered" },
    partially_sent: { variant: "outline", label: "Partial" },
    failed: { variant: "destructive", label: "Failed" },
    scheduled: { variant: "secondary", label: "Scheduled" },
    cancelled: { variant: "secondary", label: "Cancelled" },
    opted_out: { variant: "destructive", label: "Opted Out" },
    undelivered: { variant: "destructive", label: "Undelivered" },
    queued: { variant: "secondary", label: "Queued" },
  };
  const v = variants[status] || { variant: "secondary" as const, label: status };
  return <Badge variant={v.variant}>{v.label}</Badge>;
}

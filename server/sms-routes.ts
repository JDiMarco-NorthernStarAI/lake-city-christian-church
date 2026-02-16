import { Router, Request, Response } from "express";
import { storage } from "./storage";
import {
  createSmsGroupSchema, createSmsTemplateSchema, sendSmsMessageSchema, updateSmsSettingsSchema,
} from "@shared/schema";
import {
  sendSingleSms, sendBulkSms, personalizeMessage, calculateSegments, estimateCost,
  isQuietHours, checkDailyLimits, validateWebhookSignature, lookupPhoneNumber,
} from "./twilio-service";

export function registerSmsRoutes(app: any): void {
  const requireAuth = (req: Request, res: Response, next: any) => {
    if (!(req.session as any)?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireSmsFeature = (req: Request, res: Response, next: any) => {
    const session = req.session as any;
    if (!session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const roles = session.roles || [];
    if (roles.includes("super_admin") || roles.includes("admin")) return next();
    if (roles.includes("student_ministry") || roles.includes("kids_ministry") || roles.includes("small_group")) return next();
    return res.status(403).json({ message: "SMS access denied" });
  };

  const requireAdmin = (req: Request, res: Response, next: any) => {
    const session = req.session as any;
    if (!session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const roles = session.roles || [];
    if (roles.includes("super_admin") || roles.includes("admin")) return next();
    return res.status(403).json({ message: "Admin access required" });
  };

  const canSendToGroup = (user: any, group: any): boolean => {
    const roles = user.roles || [];
    if (roles.includes("super_admin") || roles.includes("admin")) return true;
    if (roles.includes("student_ministry") && group.groupType === "ministry") {
      const filter = group.filterCriteria as any;
      if (filter?.roles?.includes("student_ministry") || filter?.ministries?.includes("student")) return true;
    }
    if (roles.includes("kids_ministry") && group.groupType === "ministry") {
      const filter = group.filterCriteria as any;
      if (filter?.roles?.includes("kids_ministry") || filter?.ministries?.includes("kids") || filter?.hasChildren) return true;
    }
    return false;
  };

  // ======== SMS GROUPS ========

  app.get("/api/sms/groups", requireAuth, requireSmsFeature, async (_req: Request, res: Response) => {
    const groups = await storage.getSmsGroups();
    res.json(groups);
  });

  app.get("/api/sms/groups/:id", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const group = await storage.getSmsGroup(Number(req.params.id));
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  });

  app.get("/api/sms/groups/:id/members", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const members = await storage.resolveGroupMembers(Number(req.params.id));
    res.json(members.map(u => ({ id: u.id, name: u.name, phone: u.phone, phoneType: u.phoneType, smsOptIn: u.smsOptIn, phoneVerified: u.phoneVerified })));
  });

  app.get("/api/sms/groups/:id/preview", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const members = await storage.resolveGroupMembers(Number(req.params.id));
    const withPhone = members.filter(u => u.phone);
    const mobile = withPhone.filter(u => u.phoneType === "mobile");
    const optedIn = mobile.filter(u => u.smsOptIn);
    res.json({
      totalMembers: members.length,
      withPhone: withPhone.length,
      mobilePhones: mobile.length,
      canReceiveSms: optedIn.length,
      optedOut: mobile.length - optedIn.length,
      landlines: withPhone.filter(u => u.phoneType === "landline").length,
    });
  });

  app.post("/api/sms/groups", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const parsed = createSmsGroupSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message });
    const userId = (req.session as any).userId;
    const group = await storage.createSmsGroup({ ...parsed.data, createdBy: userId, filterCriteria: parsed.data.filterCriteria || null });
    res.status(201).json(group);
  });

  app.put("/api/sms/groups/:id", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const updated = await storage.updateSmsGroup(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Group not found" });
    res.json(updated);
  });

  app.delete("/api/sms/groups/:id", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    await storage.deleteSmsGroup(Number(req.params.id));
    res.json({ message: "Deleted" });
  });

  app.post("/api/sms/groups/:id/members", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });
    const session = req.session as any;
    try {
      const member = await storage.addSmsGroupMember({ groupId: Number(req.params.id), userId, addedBy: session.userId });
      res.status(201).json(member);
    } catch (err: any) {
      if (err.code === "23505") return res.status(400).json({ message: "Already a member" });
      res.status(500).json({ message: "Error adding member" });
    }
  });

  app.delete("/api/sms/groups/:id/members/:userId", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    await storage.removeSmsGroupMember(Number(req.params.id), Number(req.params.userId));
    res.json({ message: "Removed" });
  });

  // ======== SMS TEMPLATES ========

  app.get("/api/sms/templates", requireAuth, requireSmsFeature, async (_req: Request, res: Response) => {
    const templates = await storage.getSmsTemplates();
    res.json(templates);
  });

  app.get("/api/sms/templates/:id", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const template = await storage.getSmsTemplate(Number(req.params.id));
    if (!template) return res.status(404).json({ message: "Template not found" });
    res.json(template);
  });

  app.post("/api/sms/templates", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const parsed = createSmsTemplateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message });
    const session = req.session as any;
    const template = await storage.createSmsTemplate({ ...parsed.data, createdBy: session.userId, variables: parsed.data.variables || null });
    res.status(201).json(template);
  });

  app.put("/api/sms/templates/:id", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const updated = await storage.updateSmsTemplate(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Template not found" });
    res.json(updated);
  });

  app.delete("/api/sms/templates/:id", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    await storage.deleteSmsTemplate(Number(req.params.id));
    res.json({ message: "Deleted" });
  });

  // ======== SMS SETTINGS ========

  app.get("/api/sms/settings", requireAuth, requireSmsFeature, async (_req: Request, res: Response) => {
    let settings = await storage.getSmsSettings();
    if (!settings) {
      settings = await storage.upsertSmsSettings({ twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || null });
    }
    res.json(settings);
  });

  app.put("/api/sms/settings", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const parsed = updateSmsSettingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message });
    const updated = await storage.upsertSmsSettings(parsed.data);
    res.json(updated);
  });

  app.post("/api/sms/settings/test", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const session = req.session as any;
    const user = await storage.getUser(session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    const phone = user.phone;
    if (!phone) return res.status(400).json({ message: "No phone number on your account" });
    const result = await sendSingleSms(phone, "This is a test message from Lake City Christian Church SMS system.");
    if (result.success) {
      res.json({ message: "Test message sent", sid: result.sid });
    } else {
      res.status(500).json({ message: result.error || "Failed to send test" });
    }
  });

  app.get("/api/sms/stats", requireAuth, requireSmsFeature, async (_req: Request, res: Response) => {
    const settings = await storage.getSmsSettings();
    const optOuts = await storage.getSmsOptOuts();
    res.json({
      messagesToday: settings?.messagesSentToday || 0,
      messagesThisMonth: settings?.messagesSentThisMonth || 0,
      costThisMonth: settings?.costThisMonth || "0.00",
      dailyLimit: settings?.dailyLimit || 1000,
      monthlyLimit: settings?.monthlyLimit || 10000,
      optOutCount: optOuts.length,
    });
  });

  // ======== SMS MESSAGES ========

  app.get("/api/sms/messages", requireAuth, requireSmsFeature, async (_req: Request, res: Response) => {
    const messages = await storage.getSmsMessages();
    res.json(messages);
  });

  app.get("/api/sms/messages/:id", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const msg = await storage.getSmsMessage(Number(req.params.id));
    if (!msg) return res.status(404).json({ message: "Message not found" });
    res.json(msg);
  });

  app.get("/api/sms/messages/:id/recipients", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const recipients = await storage.getSmsRecipients(Number(req.params.id));
    res.json(recipients);
  });

  app.post("/api/sms/messages/send", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const parsed = sendSmsMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message });

    const session = req.session as any;
    const user = await storage.getUser(session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    const { groupId, userIds, messageBody, deliveryChannel, templateId, personalize, respectQuietHours, scheduleFor } = parsed.data;

    if (groupId) {
      const group = await storage.getSmsGroup(groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });
      if (!canSendToGroup({ roles: session.roles }, group)) {
        return res.status(403).json({ message: "You don't have permission to send to this group" });
      }
    }

    if (respectQuietHours !== false) {
      const quiet = await isQuietHours();
      if (quiet.inQuietHours) {
        return res.status(400).json({ message: `Quiet hours active. Messages will resume at ${quiet.resumeAt}` });
      }
    }

    const limits = await checkDailyLimits();
    if (!limits.withinLimits) {
      return res.status(400).json({ message: `Daily or monthly sending limit reached (${limits.daily}/${limits.dailyLimit} today, ${limits.monthly}/${limits.monthlyLimit} this month)` });
    }

    if (templateId) {
      await storage.incrementSmsTemplateUseCount(templateId);
    }

    let recipientUsers: any[] = [];
    if (groupId) {
      recipientUsers = await storage.resolveGroupMembers(groupId);
    } else if (userIds?.length) {
      const allUsers = await storage.getUsers();
      recipientUsers = allUsers.filter(u => userIds.includes(u.id));
    } else {
      return res.status(400).json({ message: "Provide groupId or userIds" });
    }

    const segments = calculateSegments(messageBody);
    const settings = await storage.getSmsSettings();
    const prefix = settings?.churchNamePrefix || "";

    const smsMessage = await storage.createSmsMessage({
      groupId: groupId || null,
      senderId: user.id,
      messageBody,
      messageType: groupId ? "broadcast" : "individual",
      deliveryChannel,
      status: scheduleFor ? "scheduled" : "sending",
      scheduledFor: scheduleFor ? new Date(scheduleFor) : null,
      recipientCount: recipientUsers.length,
      segmentCount: segments,
      estimatedCost: estimateCost(messageBody.length, recipientUsers.length),
    });

    if (scheduleFor) {
      return res.status(201).json({ message: "Message scheduled", data: smsMessage });
    }

    if (deliveryChannel === "sms" || deliveryChannel === "both") {
      const eligible = recipientUsers.filter(u => u.phone && u.smsOptIn && u.phoneType === "mobile");
      const smsRecipients = eligible.map(u => ({
        userId: u.id,
        phone: u.phone!,
        personalizedBody: prefix + (personalize ? personalizeMessage(messageBody, u) : messageBody) +
          (settings?.includeOptOutFooter ? "\nReply STOP to unsubscribe" : ""),
      }));

      const appUrl = process.env.APP_URL || "";
      const statusUrl = appUrl ? `${appUrl}/api/webhooks/twilio/status` : undefined;

      sendBulkSms(smsMessage.id, smsRecipients, statusUrl).catch(err => {
        console.error("[SMS] Bulk send error:", err);
      });
    }

    if (deliveryChannel === "push" || deliveryChannel === "both") {
      try {
        const webpush = await import("web-push");
        const pushSubs = await storage.getActivePushSubscriptions();
        const recipientIds = new Set(recipientUsers.map(u => u.id));
        const targetSubs = pushSubs.filter(s => s.userId && recipientIds.has(s.userId));

        let pushSent = 0;
        let pushFailed = 0;
        for (const sub of targetSubs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify({ title: "Lake City Christian Church", body: messageBody })
            );
            pushSent++;
          } catch {
            pushFailed++;
          }
        }
        await storage.updateSmsMessage(smsMessage.id, { pushDeliveredCount: pushSent, pushFailedCount: pushFailed });
      } catch (err) {
        console.error("[SMS] Push send error:", err);
      }
    }

    res.status(201).json({ message: "Message sending", data: smsMessage });
  });

  app.put("/api/sms/messages/:id/cancel", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const msg = await storage.getSmsMessage(Number(req.params.id));
    if (!msg) return res.status(404).json({ message: "Not found" });
    if (msg.status !== "scheduled") return res.status(400).json({ message: "Only scheduled messages can be cancelled" });
    const updated = await storage.updateSmsMessage(msg.id, { status: "cancelled" });
    res.json(updated);
  });

  app.delete("/api/sms/messages/:id", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    await storage.deleteSmsMessage(Number(req.params.id));
    res.json({ message: "Deleted" });
  });

  // ======== SMS INBOX ========

  app.get("/api/sms/inbox", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const filter = req.query.filter as string;
    if (filter === "needs_response") {
      const messages = await storage.getSmsIncomingMessagesRequiringResponse();
      return res.json(messages);
    }
    const messages = await storage.getSmsIncomingMessages();
    res.json(messages);
  });

  app.put("/api/sms/inbox/:id/respond", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const session = req.session as any;
    const updated = await storage.markSmsIncomingResponded(Number(req.params.id), session.userId);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  // ======== USER TAGS ========

  app.get("/api/sms/tags", requireAuth, requireSmsFeature, async (_req: Request, res: Response) => {
    const tags = await storage.getAllTags();
    res.json(tags);
  });

  app.get("/api/sms/users/:id/tags", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const tags = await storage.getUserTags(Number(req.params.id));
    res.json(tags);
  });

  app.post("/api/sms/users/:id/tags", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    const { tag } = req.body;
    if (!tag) return res.status(400).json({ message: "tag required" });
    const session = req.session as any;
    try {
      const created = await storage.addUserTag({ userId: Number(req.params.id), tag, createdBy: session.userId });
      res.status(201).json(created);
    } catch (err: any) {
      if (err.code === "23505") return res.status(400).json({ message: "Tag already exists for user" });
      res.status(500).json({ message: "Error adding tag" });
    }
  });

  app.delete("/api/sms/users/:id/tags/:tag", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    await storage.removeUserTag(Number(req.params.id), req.params.tag);
    res.json({ message: "Removed" });
  });

  // ======== OPT OUTS ========

  app.get("/api/sms/opt-outs", requireAuth, requireSmsFeature, async (_req: Request, res: Response) => {
    const optOuts = await storage.getSmsOptOuts();
    res.json(optOuts);
  });

  app.post("/api/sms/opt-outs/:phone/restore", requireAuth, requireSmsFeature, async (req: Request, res: Response) => {
    await storage.removeSmsOptOut(req.params.phone, "admin");
    res.json({ message: "Opted back in" });
  });

  // ======== PHONE VERIFICATION ========

  const verificationCodes = new Map<string, { code: string; userId: number; expiresAt: number }>();

  app.post("/api/sms/verify-phone", requireAuth, async (req: Request, res: Response) => {
    const session = req.session as any;
    const user = await storage.getUser(session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (!user.phone) return res.status(400).json({ message: "No phone number on your account" });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(user.id.toString(), { code, userId: user.id, expiresAt: Date.now() + 600000 });
    const result = await sendSingleSms(user.phone, `Your Lake City Christian Church verification code is: ${code}`);
    if (result.success) {
      res.json({ message: "Verification code sent" });
    } else {
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });

  app.post("/api/sms/verify-phone/confirm", requireAuth, async (req: Request, res: Response) => {
    const session = req.session as any;
    const user = await storage.getUser(session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    const { code } = req.body;
    const stored = verificationCodes.get(user.id.toString());
    if (!stored || stored.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Code expired or not found" });
    }
    if (stored.code !== code) {
      return res.status(400).json({ message: "Invalid code" });
    }
    verificationCodes.delete(user.id.toString());
    await storage.updateUser(user.id, { phoneVerified: true, phoneVerifiedAt: new Date() } as any);

    if (user.phone) {
      const lookup = await lookupPhoneNumber(user.phone);
      if (lookup.valid) {
        await storage.updateUser(user.id, { phoneType: lookup.phoneType, phoneCarrier: lookup.carrier || null } as any);
      }
    }
    res.json({ message: "Phone verified" });
  });

  // ======== TWILIO WEBHOOKS ========

  app.post("/api/webhooks/twilio/incoming", async (req: Request, res: Response) => {
    const fromNumber = req.body.From;
    const body = (req.body.Body || "").trim();
    const sid = req.body.MessageSid;

    const normalizedBody = body.toUpperCase();
    const isOptOut = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(normalizedBody);
    const isOptIn = ["START", "YES", "UNSTOP", "SUBSCRIBE"].includes(normalizedBody);

    const allUsers = await storage.getUsers();
    const matchedUser = allUsers.find(u => u.phone && (u.phone === fromNumber || u.phone.replace(/\D/g, "").endsWith(fromNumber.replace(/\D/g, "").slice(-10))));

    await storage.createSmsIncomingMessage({
      fromNumber,
      userId: matchedUser?.id || null,
      messageBody: body,
      twilioMessageSid: sid,
      isOptOut,
      isOptIn,
      requiresResponse: !isOptOut && !isOptIn,
    });

    const settings = await storage.getSmsSettings();

    if (isOptOut) {
      await storage.createSmsOptOut({ phoneNumber: fromNumber, userId: matchedUser?.id || null, optOutMethod: "reply_stop" });
      if (matchedUser) {
        await storage.updateUser(matchedUser.id, { smsOptIn: false, smsOptedOutAt: new Date() } as any);
      }
      const confirmation = settings?.optOutConfirmation || "You've been unsubscribed.";
      res.type("text/xml").send(`<Response><Message>${confirmation}</Message></Response>`);
      return;
    }

    if (isOptIn) {
      await storage.removeSmsOptOut(fromNumber, "reply_start");
      if (matchedUser) {
        await storage.updateUser(matchedUser.id, { smsOptIn: true, smsOptedInAt: new Date() } as any);
      }
      const confirmation = settings?.optInConfirmation || "You're now subscribed.";
      res.type("text/xml").send(`<Response><Message>${confirmation}</Message></Response>`);
      return;
    }

    if (settings?.autoReplyEnabled && settings.autoReplyMessage) {
      res.type("text/xml").send(`<Response><Message>${settings.autoReplyMessage}</Message></Response>`);
    } else {
      res.type("text/xml").send("<Response></Response>");
    }
  });

  app.post("/api/webhooks/twilio/status", async (req: Request, res: Response) => {
    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;

    if (MessageSid) {
      const recipient = await storage.getSmsRecipientByTwilioSid(MessageSid);
      if (recipient) {
        const updateData: any = { status: MessageStatus || recipient.status };
        if (MessageStatus === "delivered") {
          updateData.deliveredAt = new Date();
        }
        if (ErrorCode) updateData.errorCode = ErrorCode;
        if (ErrorMessage) updateData.errorMessage = ErrorMessage;
        await storage.updateSmsRecipient(recipient.id, updateData);

        if (recipient.messageId) {
          const msg = await storage.getSmsMessage(recipient.messageId);
          if (msg) {
            if (MessageStatus === "delivered") {
              await storage.updateSmsMessage(msg.id, { smsDeliveredCount: (msg.smsDeliveredCount || 0) + 1 });
            } else if (MessageStatus === "failed" || MessageStatus === "undelivered") {
              await storage.updateSmsMessage(msg.id, { smsFailedCount: (msg.smsFailedCount || 0) + 1 });
            }
          }
        }
      }
    }

    res.status(200).json({ received: true });
  });
}

import twilio from "twilio";
import { storage } from "./storage";
import type { User, SmsSettings } from "@shared/schema";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client: twilio.Twilio | null = null;

function getClient(): twilio.Twilio | null {
  if (client) return client;
  if (!accountSid || !authToken) {
    console.warn("[Twilio] Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN");
    return null;
  }
  client = twilio(accountSid, authToken);
  return client;
}

export function calculateSegments(message: string): number {
  const hasUnicode = /[^\x00-\x7F]/.test(message);
  const limit = hasUnicode ? 70 : 160;
  return Math.ceil(message.length / limit);
}

export function estimateCost(messageLength: number, recipientCount: number): string {
  const segments = calculateSegments("x".repeat(messageLength));
  const cost = segments * recipientCount * 0.0079;
  return cost.toFixed(4);
}

export function personalizeMessage(body: string, user: User): string {
  const name = user.name || user.username;
  const firstName = name.split(" ")[0] || name;
  const lastName = name.split(" ").slice(1).join(" ") || "";
  return body
    .replace(/\{\{name\}\}/gi, name)
    .replace(/\{\{first_name\}\}/gi, firstName)
    .replace(/\{\{last_name\}\}/gi, lastName)
    .replace(/\{\{church_name\}\}/gi, "Lake City Christian Church");
}

export async function isQuietHours(): Promise<{ inQuietHours: boolean; resumeAt: string | null }> {
  const settings = await storage.getSmsSettings();
  if (!settings || !settings.quietHoursEnabled) return { inQuietHours: false, resumeAt: null };

  const tz = settings.quietHoursTimezone || "America/New_York";
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });
  const currentTime = formatter.format(now);
  const [h, m] = currentTime.split(":").map(Number);
  const currentMinutes = h * 60 + m;

  const [startH, startM] = (settings.quietHoursStart || "21:00").split(":").map(Number);
  const [endH, endM] = (settings.quietHoursEnd || "08:00").split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  let inQuietHours = false;
  if (startMinutes > endMinutes) {
    inQuietHours = currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    inQuietHours = currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  return { inQuietHours, resumeAt: inQuietHours ? settings.quietHoursEnd : null };
}

export async function checkDailyLimits(): Promise<{ withinLimits: boolean; daily: number; monthly: number; dailyLimit: number; monthlyLimit: number }> {
  const settings = await storage.getSmsSettings();
  if (!settings) return { withinLimits: true, daily: 0, monthly: 0, dailyLimit: 1000, monthlyLimit: 10000 };

  const now = new Date();
  if (settings.lastDailyReset) {
    const lastReset = new Date(settings.lastDailyReset);
    if (now.toDateString() !== lastReset.toDateString()) {
      await storage.upsertSmsSettings({ messagesSentToday: 0, lastDailyReset: now });
    }
  }
  if (settings.lastMonthlyReset) {
    const lastReset = new Date(settings.lastMonthlyReset);
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      await storage.upsertSmsSettings({ messagesSentThisMonth: 0, costThisMonth: "0.00", lastMonthlyReset: now });
    }
  }

  const refreshed = await storage.getSmsSettings();
  const daily = refreshed?.messagesSentToday || 0;
  const monthly = refreshed?.messagesSentThisMonth || 0;
  return {
    withinLimits: daily < (settings.dailyLimit || 1000) && monthly < (settings.monthlyLimit || 10000),
    daily,
    monthly,
    dailyLimit: settings.dailyLimit || 1000,
    monthlyLimit: settings.monthlyLimit || 10000,
  };
}

export async function sendSingleSms(to: string, body: string, statusCallback?: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const twilioClient = getClient();
  if (!twilioClient || !fromNumber) {
    console.log(`[Twilio] Would send SMS to ${to}: "${body.substring(0, 50)}..."`);
    return { success: false, error: "Twilio not configured" };
  }

  try {
    const message = await twilioClient.messages.create({
      body,
      from: fromNumber,
      to,
      statusCallback: statusCallback || undefined,
    });
    return { success: true, sid: message.sid };
  } catch (err: any) {
    console.error(`[Twilio] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message || "Send failed" };
  }
}

export async function sendBulkSms(
  messageId: number,
  recipients: { userId: number; phone: string; personalizedBody: string }[],
  statusCallbackUrl?: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  const batchSize = 100;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    for (const recipient of batch) {
      const isOptedOut = await storage.isPhoneOptedOut(recipient.phone);
      if (isOptedOut) {
        await storage.createSmsRecipient({
          messageId,
          userId: recipient.userId,
          phoneNumber: recipient.phone,
          channel: "sms",
          status: "opted_out",
        });
        failed++;
        continue;
      }

      const result = await sendSingleSms(recipient.phone, recipient.personalizedBody, statusCallbackUrl);

      await storage.createSmsRecipient({
        messageId,
        userId: recipient.userId,
        phoneNumber: recipient.phone,
        channel: "sms",
        twilioMessageSid: result.sid || null,
        status: result.success ? "sent" : "failed",
        sentAt: result.success ? new Date() : null,
        errorMessage: result.error || null,
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      await new Promise(r => setTimeout(r, 100));
    }
  }

  await storage.updateSmsMessage(messageId, {
    status: failed === recipients.length ? "failed" : sent === recipients.length ? "sent" : "partially_sent",
    sentAt: new Date(),
    smsDeliveredCount: sent,
    smsFailedCount: failed,
  });

  const settings = await storage.getSmsSettings();
  if (settings) {
    await storage.upsertSmsSettings({
      messagesSentToday: (settings.messagesSentToday || 0) + sent,
      messagesSentThisMonth: (settings.messagesSentThisMonth || 0) + sent,
    });
  }

  return { sent, failed };
}

export function validateWebhookSignature(url: string, params: Record<string, string>, signature: string): boolean {
  try {
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!token) return false;
    return twilio.validateRequest(token, signature, url, params);
  } catch {
    return false;
  }
}

export async function lookupPhoneNumber(phone: string): Promise<{ valid: boolean; phoneType: string; carrier?: string; formatted?: string }> {
  const twilioClient = getClient();
  if (!twilioClient) return { valid: false, phoneType: "unknown" };

  try {
    const lookup = await twilioClient.lookups.v2.phoneNumbers(phone).fetch({ fields: "line_type_intelligence" });
    const lineType = (lookup.lineTypeIntelligence as any)?.type || "unknown";
    let phoneType = "unknown";
    if (lineType === "mobile") phoneType = "mobile";
    else if (lineType === "landline") phoneType = "landline";
    else if (lineType === "voip") phoneType = "voip";

    return {
      valid: lookup.valid || false,
      phoneType,
      carrier: (lookup.lineTypeIntelligence as any)?.carrier_name,
      formatted: lookup.phoneNumber || phone,
    };
  } catch (err: any) {
    console.error("[Twilio] Lookup failed:", err.message);
    return { valid: false, phoneType: "unknown" };
  }
}

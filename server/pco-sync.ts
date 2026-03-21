import { storage } from "./storage";

const PCO_APP_ID = process.env.PCO_APP_ID;
const PCO_SECRET = process.env.PCO_SECRET;
const PCO_BASE = "https://api.planningcenteronline.com";

function getAuthHeader(): string {
  return "Basic " + Buffer.from(`${PCO_APP_ID}:${PCO_SECRET}`).toString("base64");
}

async function pcoFetch(path: string): Promise<any> {
  const res = await fetch(`${PCO_BASE}${path}`, {
    headers: { Authorization: getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error(`PCO API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function fetchAllPages(path: string): Promise<any[]> {
  const allData: any[] = [];
  let url = path.includes("?") ? `${path}&per_page=100` : `${path}?per_page=100`;
  while (url) {
    const result = await pcoFetch(url);
    allData.push(...(result.data || []));
    url = result.links?.next ? result.links.next.replace(PCO_BASE, "") : null;
  }
  return allData;
}

// Build a map of PCO person ID → email by querying the People API
async function buildPersonEmailMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const people = await fetchAllPages("/people/v2/people?include=emails&fields[Person]=first_name,last_name&fields[Email]=address,primary");
    // People API returns included emails separately
    // We need to fetch page by page and collect includes
    let nextUrl: string | null = "/people/v2/people?include=emails&per_page=100";
    while (nextUrl) {
      const result = await pcoFetch(nextUrl);
      const emailMap = new Map<string, string>();
      for (const inc of (result.included || [])) {
        if (inc.type === "Email" && inc.attributes?.address) {
          // Find which person this email belongs to
          emailMap.set(inc.id, inc.attributes.address);
        }
      }
      for (const person of (result.data || [])) {
        const emailRels = person.relationships?.emails?.data || [];
        const primaryEmailId = emailRels[0]?.id;
        if (primaryEmailId && emailMap.has(primaryEmailId)) {
          map.set(person.id, emailMap.get(primaryEmailId)!);
        }
      }
      nextUrl = result.links?.next ? result.links.next.replace(PCO_BASE, "") : null;
    }
  } catch (err) {
    console.error("[PCO Sync] Error building person-email map:", err);
  }
  return map;
}

// Build a map of fund ID → fund name
async function buildFundMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const funds = await fetchAllPages("/giving/v2/funds");
    for (const fund of funds) {
      map.set(fund.id, fund.attributes.name);
    }
  } catch (err) {
    console.error("[PCO Sync] Error building fund map:", err);
  }
  return map;
}

export async function syncPcoDonations(): Promise<{ synced: number; skipped: number; errors: number }> {
  if (!PCO_APP_ID || !PCO_SECRET) {
    console.log("[PCO Sync] Skipping — PCO_APP_ID or PCO_SECRET not configured");
    return { synced: 0, skipped: 0, errors: 0 };
  }

  console.log("[PCO Sync] Starting donation sync...");
  let synced = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Build lookup maps
    const [personEmailMap, fundMap] = await Promise.all([
      buildPersonEmailMap(),
      buildFundMap(),
    ]);
    console.log(`[PCO Sync] Loaded ${personEmailMap.size} person emails, ${fundMap.size} funds`);

    // Fetch all donations with designations
    let nextUrl: string | null = "/giving/v2/donations?include=designations&order=-created_at&per_page=100";

    while (nextUrl) {
      const result = await pcoFetch(nextUrl);
      const designations = new Map<string, any[]>();

      // Group designations by donation
      for (const inc of (result.included || [])) {
        if (inc.type === "Designation") {
          const donationId = inc.relationships?.donation?.data?.id;
          if (donationId) {
            if (!designations.has(donationId)) designations.set(donationId, []);
            designations.get(donationId)!.push(inc);
          }
        }
      }

      for (const donation of (result.data || [])) {
        try {
          const pcoDonationId = donation.id;

          // Check if already synced
          const existing = await storage.getPcoDonationByPcoId(pcoDonationId);
          if (existing) {
            skipped++;
            continue;
          }

          const attrs = donation.attributes;
          const personId = donation.relationships?.person?.data?.id;
          const email = personId ? personEmailMap.get(personId) || null : null;
          const personName = personId ? null : null; // We get name from designations or person lookup

          // Get fund info from designations
          const donationDesignations = designations.get(pcoDonationId) || [];
          const primaryDesignation = donationDesignations[0];
          const fundId = primaryDesignation?.relationships?.fund?.data?.id;
          const fundName = fundId ? fundMap.get(fundId) || null : null;

          // Try to match to a user by email
          let userId: number | null = null;
          if (email) {
            const user = await storage.getUserByEmail(email);
            if (user) userId = user.id;
          }

          await storage.createPcoDonation({
            pcoDonationId,
            pcoPersonId: personId || null,
            donorEmail: email,
            donorName: null,
            userId,
            amountCents: attrs.amount_cents,
            fundName,
            fundId: fundId || null,
            paymentMethod: attrs.payment_method || null,
            receivedAt: attrs.received_at ? new Date(attrs.received_at) : null,
          });
          synced++;
        } catch (err) {
          errors++;
          console.error(`[PCO Sync] Error processing donation ${donation.id}:`, err);
        }
      }

      nextUrl = result.links?.next ? result.links.next.replace(PCO_BASE, "") : null;
    }

    // Try to get donor names from People API for donations that have a person ID but no name
    try {
      let peopleUrl: string | null = "/giving/v2/people?per_page=100";
      while (peopleUrl) {
        const result = await pcoFetch(peopleUrl);
        for (const person of (result.data || [])) {
          const name = [person.attributes.first_name, person.attributes.last_name].filter(Boolean).join(" ");
          if (name) {
            await storage.updatePcoDonationName(person.id, name);
          }
        }
        peopleUrl = result.links?.next ? result.links.next.replace(PCO_BASE, "") : null;
      }
    } catch (err) {
      console.error("[PCO Sync] Error updating donor names:", err);
    }

    console.log(`[PCO Sync] Complete: ${synced} synced, ${skipped} skipped, ${errors} errors`);
  } catch (err) {
    console.error("[PCO Sync] Fatal error:", err);
  }

  return { synced, skipped, errors };
}

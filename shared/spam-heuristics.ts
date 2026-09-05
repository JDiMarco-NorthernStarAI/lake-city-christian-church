// Heuristics for detecting bot-generated submissions. Used two ways:
// - Client: "Select Likely Spam" pre-checks rows for staff to review/delete.
// - Server: incoming connect cards that match are silently dropped.
// Tuned against the real spam wave of Aug 2026: gibberish names ("Tkpw
// Ykopexwsk", "Xmjf Cimdfat"), dotted-gmail variants, single random-token
// prayer requests, and one-word gibberish addresses.

export function isGibberishWord(word: string): boolean {
  const letters = word.toLowerCase().replace(/[^a-z]/g, "");
  if (letters.length < 4) return false;
  const vowels = (letters.match(/[aeiouy]/g) || []).length;
  // No vowels at all ("Xmjf", "Rsqdk") is the strongest tell. The ratio rule
  // needs 6+ letters and stays under 0.2 so real names like "Smith" (1/5)
  // never trip it. Long unpronounceable consonant runs catch the rest.
  if (vowels === 0) return true;
  if (letters.length >= 6 && vowels / letters.length < 0.2) return true;
  if (letters.length >= 5 && /[bcdfghjklmnpqrstvwxz]{5,}/.test(letters)) return true;
  return false;
}

export function isGibberishName(name: string | null | undefined): boolean {
  if (!name) return false;
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return false;
  const gibberish = words.filter(isGibberishWord).length;
  return gibberish > 0 && gibberish >= Math.ceil(words.length / 2);
}

// Spammers use dotted variations of one gmail address (a.b.c.d@gmail.com)
export function isDotTrickEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const local = email.split("@")[0] || "";
  const dots = (local.match(/\./g) || []).length;
  return dots >= 4;
}

// A single run of random letters/digits where a sentence should be
export function isRandomToken(text: string | null | undefined): boolean {
  if (!text) return false;
  const t = text.trim();
  if (!/^[A-Za-z0-9]{10,}$/.test(t)) return false;
  return /[a-z]/.test(t) && /[A-Z]/.test(t);
}

export function isLikelySpamConnectCard(card: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  address?: string | null;
  prayerRequest?: string | null;
}): boolean {
  let signals = 0;
  if (isGibberishName(`${card.firstName || ""} ${card.lastName || ""}`)) signals++;
  if (isDotTrickEmail(card.email)) signals++;
  if (isRandomToken(card.prayerRequest)) {
    signals++;
    // A random token that is ALSO unpronounceable ("WVhLcCwqwCThtciWz") is a
    // much stronger tell than something like "PleaseHealMyMom".
    if (isGibberishWord((card.prayerRequest || "").trim())) signals++;
  }
  if (card.address && !card.address.trim().includes(" ") && isGibberishWord(card.address.trim())) signals++;
  return signals >= 2;
}

export function isLikelySpamUser(user: {
  name?: string | null;
  username?: string | null;
  email?: string | null;
  roles?: string[];
}): boolean {
  // Never flag anyone with elevated roles
  if ((user.roles || []).some((r) => r !== "member")) return false;
  let signals = 0;
  if (isGibberishName(user.name) || isRandomToken(user.name || "")) signals++;
  if (isRandomToken(user.username || "") || isGibberishWord(user.username || "")) signals++;
  if (isDotTrickEmail(user.email)) signals++;
  return signals >= 2;
}

// For blocking bot registrations at the door (conservative on purpose —
// a false positive here would lock a real person out of registering).
export function isLikelySpamRegistration(data: {
  name?: string | null;
  email?: string | null;
}): boolean {
  let signals = 0;
  if (isGibberishName(data.name)) signals++;
  if (isRandomToken(data.name || "")) signals++;
  if (isDotTrickEmail(data.email)) signals++;
  return signals >= 2;
}

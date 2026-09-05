// Heuristics for flagging bot-generated records so staff can bulk-select
// likely spam and review before deleting. Nothing is ever deleted
// automatically — these only pre-check rows for a human to confirm.

function isGibberishWord(word: string): boolean {
  const letters = word.toLowerCase().replace(/[^a-z]/g, "");
  if (letters.length < 5) return false;
  const vowels = (letters.match(/[aeiouy]/g) || []).length;
  if (vowels / letters.length < 0.22) return true;
  if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(letters)) return true;
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
  if (isRandomToken(card.prayerRequest)) signals++;
  if (card.address && !card.address.includes(" ") && isGibberishWord(card.address)) signals++;
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

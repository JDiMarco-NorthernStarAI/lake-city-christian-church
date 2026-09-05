// Re-exported from shared so the admin UI and the server use the exact same
// spam heuristics. See shared/spam-heuristics.ts for the rules.
export {
  isGibberishWord,
  isGibberishName,
  isDotTrickEmail,
  isRandomToken,
  isLikelySpamConnectCard,
  isLikelySpamUser,
} from "@shared/spam-heuristics";

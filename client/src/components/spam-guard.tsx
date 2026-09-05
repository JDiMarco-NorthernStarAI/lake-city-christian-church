import { useMemo, useRef, useState } from "react";

// Invisible anti-spam guard for public forms. Renders a hidden "website"
// field humans never see (bots that auto-fill every input give themselves
// away) and stamps when the form was first rendered so instant submissions
// can be flagged. Spread `values()` into the submitted payload — the server
// strips these fields before validating or storing anything.
export function useSpamGuard() {
  const [website, setWebsite] = useState("");
  const startedAt = useRef(Date.now());

  const field = useMemo(
    () => (
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0, pointerEvents: "none" }}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [website],
  );

  function values() {
    return { website, formStartedAt: startedAt.current };
  }

  return { field, values };
}

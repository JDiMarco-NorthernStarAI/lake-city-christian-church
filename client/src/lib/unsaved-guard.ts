// Tracks whether an admin editor has unsaved changes, so navigation can warn
// before work is silently discarded. Sections call setUnsaved("sign up") when
// the user edits and setUnsaved(null) after a successful save (or on leaving
// the editor). A beforeunload handler covers browser refresh/close.

let unsavedLabel: string | null = null;

function handleBeforeUnload(e: BeforeUnloadEvent) {
  e.preventDefault();
  e.returnValue = "";
}

export function setUnsaved(label: string | null) {
  const had = unsavedLabel !== null;
  unsavedLabel = label;
  const has = label !== null;
  if (has && !had) window.addEventListener("beforeunload", handleBeforeUnload);
  if (!has && had) window.removeEventListener("beforeunload", handleBeforeUnload);
}

export function getUnsaved(): string | null {
  return unsavedLabel;
}

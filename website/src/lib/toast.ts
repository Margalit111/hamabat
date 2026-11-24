/** Tiny event-based toast: call say("...") from any client component. */
export const TOAST_EVENT = "mabat:toast";

export function say(text: string) {
  window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: text }));
}

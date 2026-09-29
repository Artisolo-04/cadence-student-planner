// Dev only: open http://localhost:5174/?empty=1 once, then navigate normally.
// import.meta.env.DEV is false in production builds, so this is always false there.
export const EMPTY_PREVIEW =
  import.meta.env.DEV &&
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("empty");

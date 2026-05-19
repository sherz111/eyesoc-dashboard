const isLocal = window.location.hostname === "localhost";
export const API_BASE = isLocal
  ? ""
  : "https://eyesoc-api.onrender.com";

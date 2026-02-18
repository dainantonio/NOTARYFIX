import React from "https://esm.sh/react@18.3.1?dev";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client?dev";
import App from "./app.js";

const showBootError = (err) => {
  const wrap = document.getElementById("boot-error");
  const msg = document.getElementById("boot-error-msg");
  const stack = document.getElementById("boot-error-stack");
  if (!wrap || !msg || !stack) return;
  wrap.classList.remove("hidden");
  msg.textContent = String(err?.message || err || "Unknown error");
  stack.textContent = String(err?.stack || "");
};

window.addEventListener("error", (e) => e?.error && showBootError(e.error));
window.addEventListener("unhandledrejection", (e) => showBootError(e?.reason || e));
document.getElementById("boot-reload")?.addEventListener("click", () => location.reload());

try {
  createRoot(document.getElementById("root")).render(React.createElement(App));
} catch (err) {
  showBootError(err);
}

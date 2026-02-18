import React, { useEffect, useState } from "https://esm.sh/react@18.3.1?dev";
const h = React.createElement;

let pushToast = null;

export const toast = {
  success: (msg) => pushToast?.({ type: "success", msg }),
  error: (msg) => pushToast?.({ type: "error", msg }),
  info: (msg) => pushToast?.({ type: "info", msg }),
};

export function ToastHost() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    pushToast = (t) => {
      const id = crypto.randomUUID?.() || String(Date.now() + Math.random());
      setItems((prev) => prev.concat([{ ...t, id }]));
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 2400);
    };
    return () => (pushToast = null);
  }, []);

  return h(
    "div",
    { className: "toasts", "aria-live": "polite" },
    items.map((t) =>
      h("div", { key: t.id, className: `toast toast--${t.type}` },
        h("div", { className: "toast__dot" }),
        h("div", { className: "toast__msg" }, t.msg)
      )
    )
  );
}

import React, { useMemo, useState } from "https://esm.sh/react@18.3.1?dev";
const h = React.createElement;

export default function AuthPage({ onAuthed }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const valid = useMemo(() => name.trim().length >= 2 email.includes("@"), [name, email]);

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 250));
    onAuthed?.({ name: name.trim(), email: email.trim().toLowerCase() });
    setBusy(false);
  };

  return h("section", { className: "card auth" },
    h("h1", { className: "h1" }, "Sign in"),
    h("p", { className: "muted" }, "Placeholder auth. Next we migrate your real auth here."),
    h("label", { className: "label" }, "Name"),
    h("input", { className: "input", value: name, onChange: (e) => setName(e.target.value), placeholder: "Jane Notary" }),
    h("label", { className: "label" }, "Email"),
    h("input", { className: "input", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@domain.com" }),
    h("button", { className: "btn btn--primary", disabled: !valid || busy, onClick: submit }, busy ? "Signing in..." : "Continue")
  );
}

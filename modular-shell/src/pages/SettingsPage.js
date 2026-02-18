import React from "https://esm.sh/react@18.3.1?dev";
const h = React.createElement;

export default function SettingsPage({ user, onSignOut }) {
  return h("section", { className: "card" },
    h("h2", { className: "h2" }, "Settings"),
    h("div", { className: "muted" }, "Placeholder settings."),
    h("div", { style: { marginTop: 12 } },
      h("span", { className: "chip" }, user ? user.email : "No user")
    ),
    h("div", { style: { marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" } },
      h("button", { className: "btn", onClick: () => (location.hash = "#/dashboard") }, "Back"),
      h("button", { className: "btn btn--danger", onClick: () => onSignOut?.() }, "Sign out")
    )
  );
}

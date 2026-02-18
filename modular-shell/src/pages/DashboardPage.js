import React from "https://esm.sh/react@18.3.1?dev";
const h = React.createElement;

export default function DashboardPage({ user }) {
  return h("section", { className: "dash" },
    h("div", { className: "dash__header" },
      h("div", null,
        h("div", { className: "kicker" }, "Dashboard"),
        h("h2", { className: "h2" }, "Today’s Command Center"),
        h("div", { className: "muted" }, user ? `Welcome, ${user.name}.` : "Sign in to see metrics.")
      ),
      h("div", { className: "dash__actions" },
        h("button", { className: "btn" }, "Schedule"),
        h("button", { className: "btn btn--primary" }, "New Appointment")
      )
    ),
    h("div", { className: "grid grid--4" },
      ["Today’s Signings", "Expected", "Collected", "Compliance"].map((label) =>
        h("div", { key: label, className: "card kpi" },
          h("div", { className: "kpi__label" }, label),
          h("div", { className: "kpi__value" }, "—"),
          h("div", { className: "kpi__sub" }, "ready for migration")
        )
      )
    )
  );
}

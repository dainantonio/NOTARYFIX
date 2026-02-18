import React from "https://esm.sh/react@18.3.1?dev";
const h = React.createElement;

/**
 * Shows your ORIGINAL landing page from repo root index.html.
 * IMPORTANT: Start the server from repo root so ../index.html exists.
 */
export default function LandingPage() {
  return h(
    "section",
    { className: "landing-wrap" },
    h("div", { className: "landing-head card" },
      h("div", { className: "kicker" }, "Original Landing Page"),
      h("div", { className: "muted" }, "This is your existing repo root index.html embedded below.")
    ),
    h("div", { className: "landing-frame card" },
      h("iframe", {
        className: "landing-iframe",
        title: "Original Landing",
        src: "../index.html",
      })
    ),
    h("div", { className: "landing-actions" },
      h("a", { className: "btn", href: "../index.html", target: "_blank", rel: "noreferrer" }, "Open landing in new tab")
    )
  );
}

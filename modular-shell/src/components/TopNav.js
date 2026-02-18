import React from "https://esm.sh/react@18.3.1?dev";
const h = React.createElement;

export default function TopNav({ route, user, onNav }) {
  const navBtn = (name, label) =>
    h(
      "button",
      { className: `navbtn ${route === name ? "is-active" : ""}`, onClick: () => onNav(name) },
      label
    );

  return h(
    "header",
    { className: "topnav" },
    h(
      "div",
      { className: "topnav__brand", role: "button", tabIndex: 0, onClick: () => onNav("landing") },
      h("div", { className: "topnav__logo" }, "N"),
      h("div", null,
        h("div", { className: "topnav__title" }, "NotaryOS"),
        h("div", { className: "topnav__sub" }, "Modular (Landing preserved)")
      )
    ),
    h("nav", { className: "topnav__nav" },
      navBtn("landing", "Landing"),
      navBtn("dashboard", "Dashboard"),
      navBtn("settings", "Settings")
    ),
    h("div", { className: "topnav__right" },
      h("span", { className: `chip ${user ? "" : "chip--muted"}` }, user ? (user.name || "User") : "Signed out"),
      h("button", { className: "btn btn--primary", onClick: () => onNav(user ? "dashboard" : "auth") }, user ? "Home" : "Sign in")
    )
  );
}

import React, { useEffect, useMemo, useState } from "https://esm.sh/react@18.3.1?dev";
import { useRoute, navigate } from "./router.js";
import TopNav from "./components/TopNav.js";
import { ToastHost, toast } from "./components/Toast.js";

import LandingPage from "./pages/LandingPage.js";
import AuthPage from "./pages/AuthPage.js";
import DashboardPage from "./pages/DashboardPage.js";
import SettingsPage from "./pages/SettingsPage.js";

const h = React.createElement;

export default function App() {
  const route = useRoute();

  // Placeholder. We'll migrate real auth later.
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Keep landing accessible even if not signed in.
    if (!user && !["landing", "auth"].includes(route.name)) navigate("auth");
  }, [user, route.name]);

  const page = useMemo(() => {
    switch (route.name) {
      case "landing":
        return h(LandingPage, {});
      case "auth":
        return h(AuthPage, {
          onAuthed: (u) => {
            setUser(u);
            toast.success("Signed in");
            navigate("dashboard");
          },
        });
      case "settings":
        return h(SettingsPage, {
          user,
          onSignOut: () => {
            setUser(null);
            toast.info("Signed out");
            navigate("landing");
          },
        });
      case "dashboard":
      default:
        return h(DashboardPage, { user });
    }
  }, [route.name, user]);

  return h(
    "div",
    { className: "app-shell" },
    h(TopNav, { route: route.name, user, onNav: navigate }),
    h("main", { className: "app-main" }, page),
    h(ToastHost)
  );
}

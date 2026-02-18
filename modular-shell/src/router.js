import React, { useEffect, useState } from "https://esm.sh/react@18.3.1?dev";

const ROUTES = new Set(["landing", "auth", "dashboard", "settings"]);

const parseHash = () => {
  const raw = (location.hash || "").replace(/^#\/?/, "");
  const name = ROUTES.has(raw) ? raw : "landing";
  return { name };
};

export const navigate = (name) => {
  const next = ROUTES.has(name) ? name : "landing";
  location.hash = `#/${next}`;
};

export const useRoute = () => {
  const [route, setRoute] = useState(parseHash());

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return route;
};

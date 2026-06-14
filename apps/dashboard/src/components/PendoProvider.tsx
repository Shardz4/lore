"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "./AuthProvider";

export function PendoProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const initializedRef = useRef(false);
  const isFirstAuthRef = useRef(true);
  const prevUserUidRef = useRef<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_PENDO_API_KEY;
    if (!apiKey) {
      console.warn(
        "[Lore] Missing NEXT_PUBLIC_PENDO_API_KEY environment variable. " +
          "Pendo analytics will not function. Add it to apps/dashboard/.env.local"
      );
      return;
    }

    if (loading) return;
    if (typeof window === "undefined" || !(window as any).pendo) return;

    const pendo = (window as any).pendo;

    const visitorConfig = user
      ? {
          visitor: {
            id: user.uid,
            email: user.email || undefined,
            full_name: user.displayName || undefined,
          },
          account: { id: "lore-dashboard" },
        }
      : {
          visitor: {},
          account: { id: "lore-dashboard" },
        };

    if (!initializedRef.current) {
      pendo.initialize(visitorConfig);
      initializedRef.current = true;
    } else {
      pendo.identify(visitorConfig);
    }

    // Track "User Signed In" when user transitions from unauthenticated to
    // authenticated, but not on the initial auth resolution (page refresh
    // with an existing session).
    if (user && prevUserUidRef.current === null && !isFirstAuthRef.current) {
      pendo.track("User Signed In", { method: "google" });
    }

    isFirstAuthRef.current = false;
    prevUserUidRef.current = user ? user.uid : null;
  }, [user, loading]);

  return <>{children}</>;
}

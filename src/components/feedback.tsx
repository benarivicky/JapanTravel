"use client";

import { useMemo } from "react";
import { FeedbackWidget } from "@amitkuzi/feedback-widget";
import { createFirestoreStore } from "@amitkuzi/feedback-widget/firestore";
import { db } from "@/lib/firebase";

/**
 * Client wrapper that mounts the feedback widget. Built as a client component so
 * the non-serializable Firestore `db` never crosses the server→client boundary
 * (the root layout is a server component).
 *
 * Gated by NEXT_PUBLIC_FEEDBACK_ENABLED: set it to "true" on the dev/staging
 * deploy so the client sees the widget; leave it unset in production so real
 * visitors never do.
 */
export function Feedback() {
  const enabled = process.env.NEXT_PUBLIC_FEEDBACK_ENABLED === "true";

  const store = useMemo(
    () => createFirestoreStore({ db, collectionName: "feedback" }),
    []
  );

  if (!enabled) return null;

  return (
    <FeedbackWidget
      store={store}
      project="japantravel"
      dir="rtl"
      buttonLabel="משוב"
      title="שליחת משוב"
      categories={["באג", "הצעה", "תוכן", "אחר"]}
    />
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ChecklistDashboardRefresh() {
  const router = useRouter();

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (
        event.data?.type ===
        "checklist-completed"
      ) {
        router.refresh();
      }
    }

    window.addEventListener(
      "message",
      handleMessage
    );

    return () => {
      window.removeEventListener(
        "message",
        handleMessage
      );
    };
  }, [router]);

  return null;
}
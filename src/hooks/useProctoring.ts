// src/hooks/useProctoring.ts
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export function useProctoring(attemptId: string | null) {
  const [violationCount, setViolationCount] = useState(0);

  useEffect(() => {
    if (!attemptId) return;

function logViolation(type: string, details: string) {
    // 1. Update the state safely without inline side-effects
    setViolationCount(function incrementCount(prev) {
      return prev + 1;
    });

    // 2. Trigger the toast popup completely outside the state setter
    toast.error(`Warning: ${details}. This is a security violation.`, {
      duration: 5000,
      icon: '🚨',
    });

    // 3. Fire and forget log to the database
    supabase.from("violations").insert([
      {
        attempt_id: attemptId,
        violation_type: type,
        details: details,
      }
    ]).then();
  }

    function handleVisibilityChange() {
      if (document.hidden) {
        logViolation("TAB_SWITCH", "You switched tabs or minimized the browser");
      }
    }

    function handleWindowBlur() {
      logViolation("WINDOW_BLUR", "Exam window lost focus");
    }

    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        logViolation("FULLSCREEN_EXIT", "You exited fullscreen mode");
      }
    }

    function handleContextMenu(e: MouseEvent) {
      e.preventDefault();
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Prevent Ctrl+C, Ctrl+V, Mac Cmd+C, Cmd+V
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v')) {
        e.preventDefault();
        toast.error("Copy and paste operations are disabled.");
      }
    }

    // Attach listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    // Request fullscreen upon initialization
    function requestFullscreen() {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Fullscreen request denied by browser:", err);
        });
      }
    }
    
    // Browsers require a user interaction to trigger fullscreen, 
    // so we attempt it with a slight delay after the component mounts 
    // (assuming the user just clicked "Start Exam").
    setTimeout(requestFullscreen, 100);

    return () => {
      // Cleanup listeners
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [attemptId]);

  return { violationCount };
}
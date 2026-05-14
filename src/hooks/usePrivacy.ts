"use client";
import { useState, useEffect, useCallback } from "react";

const KEY = "pingo_hide";
const EVT = "pingo-privacy-change";

export function usePrivacy() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(localStorage.getItem(KEY) === "1");
    const handler = () => setHidden(localStorage.getItem(KEY) === "1");
    window.addEventListener(EVT, handler);
    return () => window.removeEventListener(EVT, handler);
  }, []);

  const toggle = useCallback(() => {
    const next = localStorage.getItem(KEY) !== "1";
    localStorage.setItem(KEY, next ? "1" : "0");
    window.dispatchEvent(new Event(EVT));
    setHidden(next);
  }, []);

  return { hidden, toggle };
}

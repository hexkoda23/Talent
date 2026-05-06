import { useEffect, useState } from "react";
import { rotatingPhrases } from "@/lib/rotatingPhrases";

export const useRotatingPhrase = (name: string, intervalMs = 12000) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % rotatingPhrases.length),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return rotatingPhrases[index](name);
};

"use client";

import { useEffect, useState } from "react";

interface Props {
  /** Text to show before the count resolves, e.g. "250+ Mods" */
  fallback?: string;
}

export default function DynamicModCount({ fallback = "250+ Mods" }: Props) {
  const [label, setLabel] = useState<string>(fallback);

  useEffect(() => {
    fetch("/api/modpack/info")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.modCount) {
          setLabel(`${data.modCount}+ Mods`);
        }
      })
      .catch(() => null);
  }, []);

  return (
    <span className="text-xs font-mono text-text-secondary">
      {label}
    </span>
  );
}

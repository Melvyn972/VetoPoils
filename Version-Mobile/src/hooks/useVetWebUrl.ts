import { useEffect, useState } from "react";

import { getVetWebUrl, resolveVetWebUrl } from "@/lib/vetWeb";

export function useVetWebUrl() {
  const [url, setUrl] = useState(getVetWebUrl);
  const [isResolving, setIsResolving] = useState(!__DEV__);

  useEffect(() => {
    let cancelled = false;

    resolveVetWebUrl()
      .then((resolvedUrl) => {
        if (!cancelled) {
          setUrl(resolvedUrl);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsResolving(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { url, isResolving };
}

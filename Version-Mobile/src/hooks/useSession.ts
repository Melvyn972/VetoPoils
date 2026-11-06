import { useContext } from "react";

import { AuthContext } from "@/features/auth/AuthProvider";

export function useSession() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useSession must be used inside AuthProvider");
  }

  return context;
}

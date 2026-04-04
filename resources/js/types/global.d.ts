import type { Auth } from "@/types/auth";
import type { SharedFlashToast } from "./flash";

declare module "@inertiajs/core" {
  export interface InertiaConfig {
    sharedPageProps: {
      name: string;
      auth: Auth;
      sidebarOpen: boolean;
      flash?: {
        toast?: SharedFlashToast | null;
      };
      [key: string]: unknown;
    };
  }
}

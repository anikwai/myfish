import { router } from "@inertiajs/react";
import { useEffect } from "react";
import { toast } from "sonner";

import type { SharedFlashToast } from "@/types/flash";

/**
 * Same behavior as @inertiajs/core's getInitialPageFromDOM — inlined so Vite only
 * resolves @inertiajs/react (avoids a separate pre-bundled @inertiajs/core chunk
 * that can 504 behind some Herd/proxy + dev-server setups).
 */
function readInitialPageFromDocument<T>(id: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const scriptEl = document.querySelector(
    `script[data-page="${id}"][type="application/json"]`
  );

  if (scriptEl?.textContent) {
    return JSON.parse(scriptEl.textContent) as T;
  }

  return null;
}

type PageWithFlash = {
  props?: { flash?: { toast?: SharedFlashToast | null } };
};

function getToastFromPage(
  page: PageWithFlash | null | undefined
): SharedFlashToast | null | undefined {
  if (!page?.props || typeof page.props !== "object") {
    return undefined;
  }

  return page.props.flash?.toast ?? undefined;
}

function showFlashToast(payload: SharedFlashToast | null | undefined): void {
  if (!payload?.id || !payload.message) {
    return;
  }

  const fire = toast[payload.type];
  const options = { id: payload.id };

  if (payload.title) {
    fire(payload.title, { ...options, description: payload.message });
  } else {
    fire(payload.message, options);
  }
}

/**
 * Must live outside <App> (e.g. in createInertiaApp `withApp`), so it cannot use
 * usePage — PageContext is only provided inside Inertia's App. Uses router
 * events + the initial page embedded in the document instead.
 */
export function InertiaFlashToast() {
  useEffect(() => {
    const handlePage = (page: PageWithFlash | null | undefined) => {
      showFlashToast(getToastFromPage(page));
    };

    const initial = readInitialPageFromDocument<PageWithFlash>("app");

    handlePage(initial);

    const onInertiaPage = (event: Event) => {
      const e = event as CustomEvent<{ page: PageWithFlash }>;

      handlePage(e.detail?.page);
    };

    const removeNavigate = router.on("navigate", onInertiaPage);

    return () => {
      removeNavigate();
    };
  }, []);

  return null;
}

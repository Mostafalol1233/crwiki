import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    googletag?: {
      cmd: Array<() => void>;
      defineSlot?: (adUnitPath: string, size: unknown, elementId: string) => {
        addService: (service: unknown) => unknown;
      } | null;
      pubads?: () => {
        enableSingleRequest: () => void;
      };
      enableServices?: () => void;
      display?: (elementId: string) => void;
    };
  }
}

type GoogleAdSlotProps = {
  slot?: string;
  className?: string;
};

const adsenseClient = String(import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT || "").trim();
const adsenseSlot = String(import.meta.env.VITE_GOOGLE_ADSENSE_SLOT_WEAPONS || "").trim();
const adManagerNetwork = String(import.meta.env.VITE_GOOGLE_AD_MANAGER_NETWORK_CODE || "").trim();
const adManagerUnit = String(import.meta.env.VITE_GOOGLE_AD_MANAGER_UNIT_WEAPONS || "").trim();

function loadScript(src: string, id: string) {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.async = true;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export function GoogleAdSlot({ slot = "weapons-top", className = "" }: GoogleAdSlotProps) {
  const adSenseRef = useRef<HTMLElement | null>(null);
  const rawId = useId();
  const managerId = `google-ad-manager-${rawId.replace(/:/g, "")}-${slot.replace(/[^a-z0-9-]/gi, "-")}`;
  const managerEnabled = Boolean(adManagerNetwork && adManagerUnit);
  const adsenseEnabled = Boolean(adsenseClient && adsenseSlot);

  useEffect(() => {
    if (!adsenseEnabled || !adSenseRef.current) return;
    let cancelled = false;
    loadScript("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", "google-adsense-loader")
      .then(() => {
        if (cancelled) return;
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      })
      .catch(() => {
        // Ad loading is intentionally non-blocking; the content page remains usable.
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!managerEnabled) return;
    let cancelled = false;
    loadScript("https://securepubads.g.doubleclick.net/tag/js/gpt.js", "google-publisher-tag-loader")
      .then(() => {
        if (cancelled) return;
        window.googletag = window.googletag || { cmd: [] };
        window.googletag.cmd = window.googletag.cmd || [];
        window.googletag.cmd.push(() => {
          const googletag = window.googletag;
          if (!googletag?.defineSlot || !googletag.pubads || !googletag.enableServices || !googletag.display) return;
          const slotDefinition = googletag.defineSlot(`/${adManagerNetwork}/${adManagerUnit}`, [[320, 100], [728, 90], [970, 90]], managerId);
          if (!slotDefinition) return;
          slotDefinition.addService(googletag.pubads());
          googletag.pubads().enableSingleRequest();
          googletag.enableServices();
          googletag.display(managerId);
        });
      })
      .catch(() => {
        // Ad loading is intentionally non-blocking; the content page remains usable.
      });
    return () => { cancelled = true; };
  }, [managerEnabled, managerId]);

  if (adsenseEnabled) {
    return (
      <div className={`my-6 min-h-[90px] overflow-hidden ${className}`} aria-label="Advertisement">
        <ins
          ref={(node) => { adSenseRef.current = node; }}
          className="adsbygoogle block"
          style={{ display: "block", minHeight: 90 }}
          data-ad-client={adsenseClient}
          data-ad-slot={adsenseSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  if (managerEnabled) {
    return <div id={managerId} className={`my-6 min-h-[90px] overflow-hidden ${className}`} aria-label="Advertisement" />;
  }

  return null;
}

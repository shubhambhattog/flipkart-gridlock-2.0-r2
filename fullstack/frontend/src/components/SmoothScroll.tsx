"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Smooth scrolling for the app's content area.
 *
 * The scroll container here is the <main> element (the sidebar Nav stays put),
 * not the window — so Lenis is pointed at <main> as both `wrapper` and
 * `content`. The rendered markup is identical to a plain <main>, so this adds
 * no DOM wrapper and changes no page layout (full-height pages like /ask keep
 * filling the viewport).
 *
 * - deck.gl maps keep their native wheel-to-zoom (see `prevent`).
 * - Nested scrollers opt out of smoothing with `data-lenis-prevent`.
 * - Honors `prefers-reduced-motion` by falling back to native scrolling.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      wrapper,
      content: wrapper,
      lerp: 0.1,
      smoothWheel: true,
      autoRaf: true,
      // Don't hijack the wheel over a map — let deck.gl/MapLibre zoom natively.
      prevent: (node) => !!node.closest("canvas, .maplibregl-map, .mapboxgl-map"),
    });
    lenisRef.current = lenis;

    // Pages fetch data and grow after mount; keep Lenis's scroll limit in sync
    // by observing the live content. (Lenis's own auto-resize only watches the
    // wrapper's own box, which doesn't change when inner content grows taller.)
    const ro = new ResizeObserver(() => lenis.resize());
    const observeContent = () => {
      ro.disconnect();
      for (const child of Array.from(wrapper.children)) ro.observe(child);
    };
    observeContent();
    const mo = new MutationObserver(() => {
      observeContent();
      lenis.resize();
    });
    mo.observe(wrapper, { childList: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Reset to top and recompute limits on client-side navigation — Next doesn't
  // reset a nested scroll container the way it resets the window.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    lenis.scrollTo(0, { immediate: true });
    lenis.resize();
  }, [pathname]);

  return (
    <main ref={wrapperRef} className="flex-1 overflow-y-auto">
      {children}
    </main>
  );
}

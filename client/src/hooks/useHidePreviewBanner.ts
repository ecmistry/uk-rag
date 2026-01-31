import { useEffect } from "react";

/**
 * Hides any injected "Preview mode" banners (e.g. from host preview deployments)
 * by observing the DOM and setting their display to none.
 */
export function useHidePreviewBanner() {
  useEffect(() => {
    const hideBanners = () => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        null
      );
      const toHide: Element[] = [];
      let node: Element | null = walker.currentNode as Element;
      while (node) {
        const text = (node.textContent || "").trim();
        if (
          text.toLowerCase().includes("preview mode") &&
          node.childNodes.length <= 3
        ) {
          toHide.push(node);
        }
        node = walker.nextNode() as Element | null;
      }
      toHide.forEach((el) => {
        (el as HTMLElement).style.setProperty("display", "none", "important");
      });
    };

    hideBanners();
    const observer = new MutationObserver(hideBanners);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, []);
}

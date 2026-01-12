/**
 * Font Awesome Fallback Handler (Improved)
 * Detects if Font Awesome CDN fails and applies a robust CSS-based fallback.
 */

(function () {
  "use strict";

  let fallbackApplied = false;

  function isFontAwesomeLoaded() {
    try {
      // Create a test element to see if Font Awesome styles are applied
      const testElement = document.createElement("i");
      testElement.className = "fas fa-heart";
      testElement.style.cssText =
        "position:absolute;left:-9999px;font-size:16px;visibility:hidden";

      document.body.appendChild(testElement);

      const computedStyle = window.getComputedStyle(testElement);
      const fontFamily = computedStyle.getPropertyValue("font-family");

      document.body.removeChild(testElement);

      // Check for FA 6 Free or standard Font Awesome
      const hasFontAwesome =
        fontFamily.includes("Font Awesome") ||
        fontFamily.includes("FontAwesome") ||
        fontFamily.includes('"Font Awesome 6 Free"');

      return hasFontAwesome;
    } catch (e) {
      console.warn("Error checking Font Awesome:", e);
      return false;
    }
  }

  function applyFallback() {
    if (fallbackApplied) return;

    console.log(
      "Font Awesome CDN failed, applying high-fidelity CSS fallback..."
    );
    fallbackApplied = true;

    // Add class to body to trigger CSS fallbacks in fontawesome-fallback.css
    document.body.classList.add("fontawesome-fallback");
  }

  // Initial check
  function init() {
    // 1. Listen for network errors on link tags
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach((link) => {
      if (
        link.href.includes("font-awesome") ||
        link.href.includes("fontawesome")
      ) {
        link.addEventListener("error", applyFallback);
      }
    });

    // 2. Performance check (sometimes it fails silently)
    window.addEventListener("load", () => {
      setTimeout(() => {
        if (!isFontAwesomeLoaded()) {
          applyFallback();
        }
      }, 1500);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Export for manual check if needed
  window.checkFontAwesome = isFontAwesomeLoaded;
  window.triggerFontAwesomeFallback = applyFallback;
})();

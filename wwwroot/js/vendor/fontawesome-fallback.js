/**
 * Font Awesome Fallback Handler (Local Primary)
 * Uses local FontAwesome as primary source with CSS-based fallback
 * for maximum consistency between development and deployment.
 */

(function () {
  "use strict";

  let fallbackApplied = false;

  function isFontAwesomeLoaded() {
    try {
      // Create a test element to see if Font Awesome styles are applied
      const testElement = document.createElement("i");
      testElement.className = "bi bi-heart";
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

  function applyCSSFallback() {
    if (fallbackApplied) return;
    
    console.log("Local FontAwesome failed, applying CSS-based fallback...");
    fallbackApplied = true;
    document.body.classList.add("fontawesome-fallback");
  }

  // Initial check
  function init() {
    // Check if local FontAwesome loaded properly
    window.addEventListener("load", () => {
      setTimeout(() => {
        if (!isFontAwesomeLoaded()) {
          applyCSSFallback();
        } else {
          console.log("Local FontAwesome loaded successfully");
        }
      }, 1000);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Export for manual check if needed
  window.checkFontAwesome = isFontAwesomeLoaded;
  window.triggerCSSFallback = applyCSSFallback;
})();

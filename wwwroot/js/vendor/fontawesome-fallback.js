/**
 * Font Awesome Fallback Handler
 * Detects if Font Awesome CDN fails to load and applies fallback icons
 */

(function () {
  "use strict";

  let fallbackApplied = false;

  function isFontAwesomeLoaded() {
    try {
      const testElement = document.createElement("i");
      testElement.className = "fas fa-heart";
      testElement.style.cssText = "position:absolute;left:-9999px;font-size:16px;visibility:hidden";

      document.body.appendChild(testElement);

      const computedStyle = window.getComputedStyle(testElement);
      const fontFamily = computedStyle.getPropertyValue("font-family");

      document.body.removeChild(testElement);

      const hasFontAwesome =
        fontFamily.includes("Font Awesome") ||
        fontFamily.includes("FontAwesome") ||
        fontFamily.includes('"Font Awesome 6 Free"');

      console.log("Font Awesome check - Font Family:", fontFamily, "Has FA:", hasFontAwesome);
      return hasFontAwesome;
    } catch (e) {
      console.warn("Error checking Font Awesome:", e);
      return false;
    }
  }

  function applyFallbackIcons() {
    if (fallbackApplied) return;

    console.log("Font Awesome CDN failed to load, applying fallback icons...");
    fallbackApplied = true;

    document.body.classList.add("fontawesome-fallback");

    const iconMap = {
      "fa-book-open": "📖",
      "fa-check-circle": "✓",
      "fa-circle": "○",
      "fa-heart": "♥",
      "fa-times": "×",
      "fa-cloud-download-alt": "↓",
      "fa-plus": "+",
      "fa-search": "🔍",
      "fa-star": "⭐",
      "fa-bookmark": "🔖",
      "fa-home": "🏠",
      "fa-user": "👤",
      "fa-cog": "⚙",
      "fa-bars": "☰",
      "fa-download": "⬇",
    };

    Object.keys(iconMap).forEach((faClass) => {
      const elements = document.querySelectorAll(`.${faClass}`);
      elements.forEach((element) => {
        if (!element.textContent.trim()) {
          element.textContent = iconMap[faClass];
          element.classList.add("fallback-icon");
        }
      });
    });

    // Handle dynamically added elements
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) {
            Object.keys(iconMap).forEach((faClass) => {
              const elements = node.querySelectorAll
                ? node.querySelectorAll(`.${faClass}`)
                : node.classList && node.classList.contains(faClass)
                ? [node]
                : [];
              elements.forEach((element) => {
                if (!element.textContent.trim()) {
                  element.textContent = iconMap[faClass];
                  element.classList.add("fallback-icon");
                }
              });
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function checkFontAwesome() {
    setTimeout(() => {
      if (!isFontAwesomeLoaded()) {
        applyFallbackIcons();
      } else {
        console.log("Font Awesome loaded successfully");
      }
    }, 1500);
  }

  function setupCSSErrorHandling() {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach((link) => {
      if (link.href.includes("font-awesome") || link.href.includes("fontawesome")) {
        link.addEventListener("error", () => {
          console.warn("Font Awesome CSS failed to load from:", link.href);
          applyFallbackIcons();
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setupCSSErrorHandling();
      checkFontAwesome();
    });
  } else {
    setupCSSErrorHandling();
    checkFontAwesome();
  }

  window.addEventListener("load", () => {
    setTimeout(() => {
      if (!isFontAwesomeLoaded() && !fallbackApplied) {
        applyFallbackIcons();
      }
    }, 1000);
  });

  window.applyFontAwesomeFallback = applyFallbackIcons;
  window.checkFontAwesome = isFontAwesomeLoaded;
})();

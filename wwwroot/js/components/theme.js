/**
 * Theme Toggle Component
 * Handles dark/light theme switching
 */

// Initialize theme immediately to prevent flash
(function initTheme() {
  try {
    const htmlElement = document.documentElement;
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersLight = window.matchMedia(
      "(prefers-color-scheme: light)"
    ).matches;

    let targetTheme = "dark";
    if (savedTheme) {
      targetTheme = savedTheme;
    } else if (systemPrefersLight) {
      targetTheme = "light";
    }

    if (targetTheme === "light") {
      htmlElement.setAttribute("data-theme", "light");
    }
  } catch (e) {
    console.error("Error initializing theme:", e);
  }
})();

function initThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  const htmlElement = document.documentElement;

  if (themeToggle && !themeToggle.dataset.bound) {
    themeToggle.dataset.bound = "true";

    // Update icon visibility based on current theme
    const updateIcons = (theme) => {
      const isLight = theme === "light";
      const sunIcon = themeToggle.querySelector(".switch-light");
      const moonIcon = themeToggle.querySelector(".switch-dark");

      if (sunIcon && moonIcon) {
        if (isLight) {
          sunIcon.style.display = "none";
          moonIcon.style.display = "inline-block";
        } else {
          sunIcon.style.display = "inline-block";
          moonIcon.style.display = "none";
        }
      }
    };

    // Set initial icon state
    const currentTheme = htmlElement.getAttribute("data-theme") || "dark";
    updateIcons(currentTheme);

    themeToggle.addEventListener("click", function (e) {
      e.preventDefault();
      const isCurrentlyLight =
        htmlElement.getAttribute("data-theme") === "light";

      if (isCurrentlyLight) {
        htmlElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "dark");
        updateIcons("dark");
      } else {
        htmlElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
        updateIcons("light");
      }

      // Add a little click animation
      themeToggle.style.transform = "scale(0.9)";
      setTimeout(() => {
        themeToggle.style.transform = "";
      }, 100);
    });
  }
}

// Auto-init when DOM ready
document.addEventListener("DOMContentLoaded", initThemeToggle);

// Run init if DOM already ready
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  initThemeToggle();
}

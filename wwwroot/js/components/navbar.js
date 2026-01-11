/**
 * Navbar Component
 * Handles mobile navigation, scroll effects, and smooth scrolling
 */

document.addEventListener("DOMContentLoaded", initNavbar);

function initNavbar() {
  initMobileNav();
  initScrollEffects();
  initSmoothScroll();
  initAccessibility();
}

function initMobileNav() {
  const navbarToggler = document.getElementById("navbarToggler");
  const navbarCollapse = document.getElementById("navbarCollapse");

  if (navbarToggler && navbarCollapse && !navbarToggler.dataset.bound) {
    navbarToggler.dataset.bound = "true";

    navbarToggler.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const isExpanded = navbarToggler.getAttribute("aria-expanded") === "true";

      navbarToggler.classList.toggle("active");
      navbarCollapse.classList.toggle("show");
      navbarToggler.setAttribute("aria-expanded", !isExpanded);

      document.body.style.overflow = navbarCollapse.classList.contains("show") ? "hidden" : "";
    });

    // Close on outside click
    document.addEventListener("click", function (e) {
      if (
        navbarCollapse.classList.contains("show") &&
        !navbarToggler.contains(e.target) &&
        !navbarCollapse.contains(e.target)
      ) {
        closeNavbar();
      }
    });

    // Close on nav link click (mobile)
    navbarCollapse.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", function () {
        if (window.innerWidth <= 991) closeNavbar();
      });
    });

    // Close on resize
    window.addEventListener("resize", function () {
      if (window.innerWidth > 991 && navbarCollapse.classList.contains("show")) {
        closeNavbar();
      }
    });

    // Close on escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navbarCollapse.classList.contains("show")) {
        closeNavbar();
      }
    });

    function closeNavbar() {
      navbarToggler.classList.remove("active");
      navbarCollapse.classList.remove("show");
      navbarToggler.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  }
}

function initScrollEffects() {
  const navbar = document.querySelector(".navbar");
  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;

    if (navbar) {
      // Hide/show on scroll
      if (currentScroll > lastScrollY && currentScroll > 100) {
        navbar.classList.add("navbar-hidden");
        navbar.classList.remove("navbar-visible");
      } else {
        navbar.classList.remove("navbar-hidden");
        navbar.classList.add("navbar-visible");
      }

      // Add scrolled class
      navbar.classList.toggle("scrolled", currentScroll > 10);
    }

    lastScrollY = currentScroll;
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));

      if (target) {
        const navbar = document.querySelector(".navbar");
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = target.offsetTop - navbarHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    });
  });
}

function initAccessibility() {
  document.addEventListener("keydown", function (e) {
    if (e.key === "Tab") {
      const navbarCollapse = document.getElementById("navbarCollapse");
      if (navbarCollapse && navbarCollapse.classList.contains("show")) {
        const focusableElements = navbarCollapse.querySelectorAll(
          'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  });
}

// Run init if DOM already ready
if (document.readyState === "complete" || document.readyState === "interactive") {
  initNavbar();
}

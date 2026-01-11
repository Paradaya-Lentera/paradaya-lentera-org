/**
 * Dropdown Component
 * Handles user dropdown and other dropdown menus
 */

function initUserDropdown() {
  const avatar = document.getElementById("userAvatar");
  const dropdown = document.getElementById("userDropdown");

  if (avatar && dropdown && !avatar.dataset.bound) {
    avatar.dataset.bound = "true";

    // Ensure dropdown is hidden initially
    dropdown.classList.remove("show");

    avatar.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const isActive = dropdown.classList.contains("show");
      const dropdownWrap = avatar.closest(".user-dropdown");

      // Toggle dropdown
      if (isActive) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    function openDropdown() {
      const dropdownWrap = avatar.closest(".user-dropdown");
      dropdown.classList.add("show");
      if (dropdownWrap) dropdownWrap.classList.add("active");

      // Accessibility
      avatar.setAttribute("aria-expanded", "true");
    }

    function closeDropdown() {
      const dropdownWrap = avatar.closest(".user-dropdown");
      dropdown.classList.remove("show");
      if (dropdownWrap) dropdownWrap.classList.remove("active");

      // Accessibility
      avatar.setAttribute("aria-expanded", "false");
    }

    // Close on outside click
    document.addEventListener("click", function (e) {
      if (
        dropdown.classList.contains("show") &&
        !avatar.contains(e.target) &&
        !dropdown.contains(e.target)
      ) {
        closeDropdown();
      }
    });

    // Close on escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && dropdown.classList.contains("show")) {
        closeDropdown();
      }
    });
  }
}

// Auto-init
document.addEventListener("DOMContentLoaded", initUserDropdown);

// Run if DOM already ready
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  initUserDropdown();
}

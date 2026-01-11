/**
 * Auth Modal Component
 * Handles login/register modal overlay
 */

function initAuthModal() {
  const overlay = document.getElementById("authOverlay");
  const content = document.getElementById("authContent");
  const closeBtn = document.getElementById("closeAuth");

  function openAuth(url) {
    fetch(url)
      .then((res) => res.text())
      .then((html) => {
        content.innerHTML = html;
        overlay.classList.remove("hidden");
        document.body.classList.add("modal-open");
      });
  }

  function closeAuth() {
    overlay.classList.add("hidden");
    document.body.classList.remove("modal-open");
    content.innerHTML = "";
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeAuth);
  }

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeAuth();
    });
  }

  // Expose global functions
  window.openLogin = () => openAuth("/Auth/Login");
  window.openRegister = () => openAuth("/Auth/Register");
}

document.addEventListener("DOMContentLoaded", initAuthModal);

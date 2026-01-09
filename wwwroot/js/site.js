document.addEventListener("DOMContentLoaded", function () {
  // Dropdown User
  const avatar = document.getElementById("userAvatar");
  const dropdown = document.getElementById("userDropdown");

  if (avatar && dropdown) {
    avatar.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdown.classList.toggle("show");
    });

    document.addEventListener("click", function (e) {
      if (!dropdown.contains(e.target) && e.target !== avatar) {
        dropdown.classList.remove("show");
      }
    });
  }

  // Logika Scroll Navbar
  const navbar = document.querySelector(".navbar");
  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;

    if (navbar) {
      if (currentScroll > lastScrollY && currentScroll > 100) {
        navbar.classList.add("navbar-hidden");
        navbar.classList.remove("navbar-visible");
      } else {
        navbar.classList.remove("navbar-hidden");
        navbar.classList.add("navbar-visible");
      }
    }

    lastScrollY = currentScroll;
  });
});

document.addEventListener("DOMContentLoaded", () => {
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

  window.openLogin = () => openAuth("/Auth/Login");
  window.openRegister = () => openAuth("/Auth/Register");
});

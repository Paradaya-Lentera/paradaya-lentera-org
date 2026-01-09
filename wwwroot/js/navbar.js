// Inisialisasi tema - Jalankan segera untuk mencegah flash
(function () {
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
    console.error("Error inisialisasi tema", e);
  }
})();

// Interaksi DOM
document.addEventListener("DOMContentLoaded", function () {
  const themeToggle = document.getElementById("themeToggle");
  const htmlElement = document.documentElement;

  if (themeToggle) {
    themeToggle.addEventListener("click", function (e) {
      const isLight = htmlElement.getAttribute("data-theme") === "light";
      if (isLight) {
        htmlElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "dark");
      } else {
        htmlElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
      }
    });
  }
});

// Logika dropdown user
document.addEventListener("click", function (event) {
  const avatar = document.getElementById("userAvatar");
  const dropdown = document.getElementById("userDropdown");

  // Cek apakah elemen autentikasi ada
  if (!avatar || !dropdown) return;

  const isClickInsideAvatar = avatar.contains(event.target);
  const isClickInsideDropdown = dropdown.contains(event.target);

  if (isClickInsideAvatar) {
    dropdown.classList.toggle("show");
  } else if (!isClickInsideDropdown) {
    if (dropdown.classList.contains("show")) {
      dropdown.classList.remove("show");
    }
  }
});
// Tambahkan di navbar.js atau file terpisah

// Efek shadow saat scroll (opsional)
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    
    if (window.scrollY > 10) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth scroll untuk link internal (opsional)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = target.offsetTop - navbarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});
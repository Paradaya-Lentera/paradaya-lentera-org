function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    overlay.classList.add("hidden");
    setTimeout(() => {
      overlay.style.display = "none";
    }, 500);
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

// Check for offline status
window.addEventListener("load", function () {
  if (!navigator.onLine) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
      const text = overlay.querySelector("p");
      if (text) {
        text.innerHTML =
          '<i class="fas fa-wifi-slash"></i> Anda sedang offline. Konten buku mungkin tidak dapat dimuat karena keterbatasan sumber data.';
      }
      const spinner = overlay.querySelector(".spinner");
      if (spinner) spinner.style.display = "none";
    }
  }
});

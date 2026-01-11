/**
 * Read Page Script
 * Book reader functionality with immersive mode
 */

let headerTimer;
const header = document.getElementById("mainHeader");

function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    overlay.classList.add("hidden");
    setTimeout(() => {
      overlay.style.display = "none";
    }, 500);
  }

  // Start immersive mode timer after loading
  resetHeaderTimer();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

function resetHeaderTimer() {
  if (header) {
    header.style.transform = "translateY(0)";
    clearTimeout(headerTimer);
    headerTimer = setTimeout(() => {
      if (document.fullscreenElement) {
        header.style.transform = "translateY(-100%)";
      }
    }, 3000);
  }
}

// Event Listeners for Immersive Mode
document.addEventListener("mousemove", resetHeaderTimer);
document.addEventListener("touchstart", resetHeaderTimer);

// Check for offline status
window.addEventListener("load", function () {
  if (!navigator.onLine) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
      const text = overlay.querySelector("p");
      if (text) {
        text.innerHTML =
          '<i class="fas fa-wifi-slash"></i> Anda sedang offline. Konten buku mungkin tidak dapat dimuat.';
      }
      const spinner = overlay.querySelector(".spinner");
      if (spinner) spinner.style.display = "none";
    }
  }
});

// Update UI on fullscreen change
document.addEventListener("fullscreenchange", () => {
  const icon = document.querySelector("#btnFullscreen i");
  if (document.fullscreenElement) {
    icon.classList.replace("fa-expand", "fa-compress");
    resetHeaderTimer();
  } else {
    icon.classList.replace("fa-compress", "fa-expand");
    if (header) header.style.transform = "translateY(0)";
    clearTimeout(headerTimer);
  }
});

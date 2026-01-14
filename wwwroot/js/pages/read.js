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
          '<i class="bi bi-wifi-off"></i> Anda sedang offline. Konten buku mungkin tidak dapat dimuat.<br><br>' +
          '<i class="bi bi-lightbulb"></i> <strong>Tips:</strong> Gunakan tombol <i class="bi bi-download"></i> Download untuk menyimpan buku dan membacanya secara offline.';
      }
      const spinner = overlay.querySelector(".spinner");
      if (spinner) spinner.style.display = "none";
    }
  }

  // Show download feature hint on first visit
  const downloadHintShown = sessionStorage.getItem("downloadHintShown");
  if (!downloadHintShown) {
    setTimeout(() => {
      showDownloadHint();
      sessionStorage.setItem("downloadHintShown", "true");
    }, 3000);
  }

  // Initialize smart download link
  initDownloadLink();
});

// Initialize smart download link (prefer PDF if available)
async function initDownloadLink() {
  const btnDownload = document.getElementById("btnDownload");
  if (!btnDownload) return;

  const iaId = btnDownload.getAttribute("data-iaid");
  if (!iaId) return;

  // Gunakan Metadata API Archive.org (lebih aman dari CORS)
  const metadataUrl = `https://archive.org/metadata/${iaId}`;

  try {
    const response = await fetch(metadataUrl);
    if (!response.ok) throw new Error("Metadata not available");

    const data = await response.json();

    // Cari file yang berakhiran .pdf dalam daftar files
    // Utamakan yang namanya sama dengan ID (pattern umum)
    const pdfFile =
      data.files.find((f) => f.name === `${iaId}.pdf`) ||
      data.files.find((f) => f.name.toLowerCase().endsWith(".pdf"));

    if (pdfFile) {
      const directPdfUrl = `https://archive.org/download/${iaId}/${pdfFile.name}`;
      btnDownload.href = directPdfUrl;
      console.log("Direct PDF link applied:", directPdfUrl);
    } else {
      console.log("No PDF file found in metadata, keeping directory link.");
    }
  } catch (error) {
    // Jika gagal fetch metadata, fallback ke link download default (direktori) sudah aman
    console.warn(
      "Could not verify PDF via metadata API, using default.",
      error
    );
  }
}

// Show download feature hint
function showDownloadHint() {
  const btnDownload = document.getElementById("btnDownload");
  if (!btnDownload) return;

  // Create tooltip element
  const tooltip = document.createElement("div");
  tooltip.style.cssText = `
    position: absolute;
    top: 60px;
    right: 20px;
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 0.875rem;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-width: 280px;
    animation: slideDown 0.3s ease;
  `;
  tooltip.innerHTML = `
    <div style="display: flex; align-items: start; gap: 8px;">
      <i class="bi bi-download" style="font-size: 1.2rem; flex-shrink: 0;"></i>
      <div>
        <strong>Fitur Download Buku</strong><br>
        <span style="font-size: 0.8rem; opacity: 0.9;">
          Klik tombol hijau untuk mengunduh buku dan membacanya offline
        </span>
      </div>
    </div>
  `;

  document.body.appendChild(tooltip);

  // Auto dismiss after 6 seconds
  setTimeout(() => {
    tooltip.style.animation = "slideUp 0.3s ease";
    setTimeout(() => tooltip.remove(), 300);
  }, 6000);

  // Add animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes slideUp {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-10px);
      }
    }
  `;
  document.head.appendChild(style);
}

// Update UI on fullscreen change
document.addEventListener("fullscreenchange", () => {
  const icon = document.querySelector("#btnFullscreen i");
  if (!icon) return;

  if (document.fullscreenElement) {
    icon.classList.replace("bi-arrows-fullscreen", "bi-fullscreen-exit");
    resetHeaderTimer();
  } else {
    icon.classList.replace("bi-fullscreen-exit", "bi-arrows-fullscreen");
    if (header) header.style.transform = "translateY(0)";
    clearTimeout(headerTimer);
  }
});

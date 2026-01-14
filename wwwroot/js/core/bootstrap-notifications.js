(function () {
  "use strict";

  // Shared color schemes for both in-page and floating notifications
  const colorSchemes = {
    primary: {
      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#ffffff",
      icon: "bi bi-bookmark-fill",
      label: "Notifikasi",
    },
    success: {
      bg: "linear-gradient(135deg, #00b09b 0%, #96c93d 100%)",
      color: "#ffffff",
      icon: "bi bi-check-circle-fill",
      label: "Berhasil",
    },
    danger: {
      bg: "linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)",
      color: "#ffffff",
      icon: "bi bi-exclamation-octagon-fill",
      label: "Gagal",
    },
    warning: {
      bg: "linear-gradient(135deg, #f12711 0%, #f5af19 100%)",
      color: "#ffffff",
      icon: "bi bi-exclamation-triangle-fill",
      label: "Peringatan",
    },
    info: {
      bg: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
      color: "#ffffff",
      icon: "bi bi-info-circle-fill",
      label: "Informasi",
    },
    secondary: {
      bg: "linear-gradient(135deg, #304352 0%, #d7d2cc 100%)",
      color: "#ffffff",
      icon: "bi bi-bell-fill",
      label: "Pemberitahuan",
    },
  };

  /**
   * Menampilkan notifikasi Bootstrap dengan gaya premium
   */
  function showReadingListNotification(
    message,
    type = "primary",
    duration = 4000
  ) {
    const readingListContainer = document.querySelector(
      ".reading-list-container"
    );
    if (readingListContainer) {
      return showInPageNotification(message, type, duration);
    } else {
      return showFloatingNotification(message, type, duration);
    }
  }

  /**
   * Notifikasi di dalam halaman (biasanya di atas konten utama)
   */
  function showInPageNotification(message, type = "primary", duration = 4000) {
    const pageHeader =
      document.querySelector(".page-header") ||
      document.querySelector(".container");
    if (!pageHeader) return;

    let container = document.getElementById("reading-list-notifications");
    if (!container) {
      container = document.createElement("div");
      container.id = "reading-list-notifications";
      container.style.cssText = `
                margin-top: 1.5rem;
                margin-bottom: 1.5rem;
                max-width: 650px;
                margin-left: auto;
                margin-right: auto;
            `;
      pageHeader.insertAdjacentElement("afterend", container);
    }

    const scheme = colorSchemes[type] || colorSchemes.primary;
    const notification = document.createElement("div");
    notification.className = `alert alert-dismissible fade show premium-alert`;
    notification.style.cssText = `
            margin-bottom: 1rem;
            border: none;
            border-radius: 16px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            animation: slideInDownPremium 0.4s ease-out;
            background: ${scheme.bg};
            color: ${scheme.color};
            padding: 1.25rem 1.5rem;
            width: 100%;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
        `;

    // Add shine effect
    const overlay = document.createElement("div");
    overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
            pointer-events: none;
        `;
    notification.appendChild(overlay);

    notification.innerHTML += `
            <div class="d-flex align-items-center w-100">
                <div class="flex-shrink-0 me-3">
                    <div style="background: rgba(255,255,255,0.2); width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);">
                        <i class="${scheme.icon}" style="font-size: 1.5rem;"></i>
                    </div>
                </div>
                <div class="flex-grow-1">
                    <div style="font-size: 1.05rem; font-weight: 700; line-height: 1.3;">
                        ${message}
                    </div>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert" aria-label="Close" style="opacity: 0.7;"></button>
            </div>
        `;

    ensureStyles();
    container.appendChild(notification);

    if (duration > 0) {
      setTimeout(() => {
        hideInPageNotification(notification);
      }, duration);
    }

    const closeBtn = notification.querySelector(".btn-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        hideInPageNotification(notification);
      });
    }

    return notification;
  }

  /**
   * Notifikasi melayang (Toast style)
   */
  function showFloatingNotification(
    message,
    type = "primary",
    duration = 5000,
    position = "top-right"
  ) {
    let container = document.getElementById(
      "bootstrap-notifications-container"
    );
    if (!container) {
      container = document.createElement("div");
      container.id = "bootstrap-notifications-container";
      container.style.cssText = `
                position: fixed;
                z-index: 10000;
                pointer-events: none;
                padding: 20px;
            `;

      switch (position) {
        case "top-right":
          container.style.top = "20px";
          container.style.right = "20px";
          break;
        case "top-left":
          container.style.top = "20px";
          container.style.left = "20px";
          break;
        case "top-center":
          container.style.top = "20px";
          container.style.left = "50%";
          container.style.transform = "translateX(-50%)";
          break;
        case "bottom-right":
          container.style.bottom = "20px";
          container.style.right = "20px";
          break;
        case "bottom-left":
          container.style.bottom = "20px";
          container.style.left = "20px";
          break;
        case "bottom-center":
          container.style.bottom = "20px";
          container.style.left = "50%";
          container.style.transform = "translateX(-50%)";
          break;
      }

      document.body.appendChild(container);
    }

    const scheme = colorSchemes[type] || colorSchemes.primary;
    const notification = document.createElement("div");
    notification.className = `alert alert-dismissible fade show premium-toast`;
    notification.style.cssText = `
            pointer-events: auto;
            margin-bottom: 12px;
            min-width: 350px;
            max-width: 450px;
            width: 100%;
            background: ${scheme.bg};
            color: ${scheme.color};
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
            border: none;
            border-radius: 16px;
            padding: 1.25rem 1.5rem;
            animation: slideInRightPremium 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            display: flex;
            align-items: center;
            overflow: hidden;
            position: relative;
        `;

    const overlay = document.createElement("div");
    overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
            pointer-events: none;
        `;
    notification.appendChild(overlay);

    notification.innerHTML += `
            <div class="d-flex align-items-center w-100">
                <div class="flex-shrink-0 me-3">
                    <div style="background: rgba(255,255,255,0.2); width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);">
                        <i class="${scheme.icon}" style="font-size: 1.5rem;"></i>
                    </div>
                </div>
                <div class="flex-grow-1">
                    <div style="font-size: 0.85rem; opacity: 0.8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
                        ${scheme.label}
                    </div>
                    <div style="font-size: 1.05rem; font-weight: 700; line-height: 1.3;">
                        ${message}
                    </div>
                </div>
                <button type="button" class="btn-close btn-close-white ms-2" data-bs-dismiss="alert" aria-label="Close" style="opacity: 0.7;"></button>
            </div>
        `;

    ensureStyles();
    container.appendChild(notification);

    if (duration > 0) {
      setTimeout(() => {
        hideFloatingNotification(notification);
      }, duration);
    }

    const closeBtn = notification.querySelector(".btn-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        hideFloatingNotification(notification);
      });
    }

    return notification;
  }

  function hideInPageNotification(notification) {
    if (notification && notification.parentNode) {
      notification.style.animation = "slideOutUpPremium 0.3s ease-in forwards";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }

  function hideFloatingNotification(notification) {
    if (notification && notification.parentNode) {
      notification.style.animation =
        "slideOutRightPremium 0.3s ease-in forwards";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }

  function ensureStyles() {
    if (!document.getElementById("premium-notifications-styles")) {
      const style = document.createElement("style");
      style.id = "premium-notifications-styles";
      style.textContent = `
                @keyframes slideInRightPremium {
                    from { transform: translateX(120%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRightPremium {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(120%); opacity: 0; }
                }
                @keyframes slideInDownPremium {
                    from { transform: translateY(-30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideOutUpPremium {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(-30px); opacity: 0; }
                }
                .premium-toast .btn-close, .premium-alert .btn-close {
                    transition: all 0.2s;
                }
                .premium-toast .btn-close:hover, .premium-alert .btn-close:hover {
                    opacity: 1;
                    transform: scale(1.1);
                }
            `;
      document.head.appendChild(style);
    }
  }

  // Exposed API
  window.showSuccessNotification = (message, duration = 4000) =>
    showReadingListNotification(message, "success", duration);

  window.showErrorNotification = (message, duration = 5000) =>
    showReadingListNotification(message, "danger", duration);

  window.showWarningNotification = (message, duration = 4500) =>
    showReadingListNotification(message, "warning", duration);

  window.showInfoNotification = (message, duration = 4000) =>
    showReadingListNotification(message, "info", duration);

  window.showReadingListNotification = (message, duration = 4000) =>
    showReadingListNotification(message, "primary", duration);

  window.showBootstrapNotification = showFloatingNotification;
  window.showInPageNotification = showInPageNotification;

  console.log("Premium notification system initialized");
})();

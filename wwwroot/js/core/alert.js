/**
 * Alert/Notification Utility Module
 * Handles toast notifications and alerts
 */

function showAlert(message, type = "info", container = "body", duration = 3000) {
  const alertHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert" 
         style="position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  // Insert alert
  const alertElement = document.createElement("div");
  alertElement.innerHTML = alertHtml;
  const alert = alertElement.firstElementChild;

  const targetContainer = document.querySelector(container) || document.body;
  targetContainer.appendChild(alert);

  // Auto dismiss
  setTimeout(() => {
    alert.style.transition = "opacity 0.3s ease";
    alert.style.opacity = "0";
    setTimeout(() => alert.remove(), 300);
  }, duration);

  return alert;
}

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = { showAlert };
}

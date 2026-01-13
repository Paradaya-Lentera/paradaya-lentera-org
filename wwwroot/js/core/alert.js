/**
 * Alert/Notification Utility Module
 * Powered by SweetAlert2
 */

// Wait for DOM to be ready before initializing
document.addEventListener('DOMContentLoaded', function() {
    // Initialize SweetAlert2 Toast Mixin
    const Toast =
      typeof Swal !== "undefined"
        ? Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener("mouseenter", Swal.stopTimer);
              toast.addEventListener("mouseleave", Swal.resumeTimer);
            },
          })
        : {
            fire: (options) => {
              console.warn("SweetAlert2 not loaded:", options.title, options.text);
              // Fallback to browser alert
              alert(options.title + ": " + options.text);
            },
          };

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - success, error, warning, info
     * @param {string} title - Optional title
     */
    function showAlert(message, type = "success", title = null) {
      // Validate inputs
      if (!message || typeof message !== 'string') {
        console.warn('showAlert: Invalid message provided');
        return;
      }

      // Clean message from any HTML encoding issues
      const cleanMessage = message.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&');

      if (!title) {
        const titles = {
          success: "Berhasil!",
          error: "Oops...",
          info: "Informasi",
          warning: "Peringatan",
        };
        title = titles[type] || "Notifikasi";
      }

      // Check if Swal is available
      if (typeof Swal !== "undefined") {
        Toast.fire({
          icon: type,
          title: title,
          text: cleanMessage,
        });
      } else {
        // Fallback notification
        console.log(`${title}: ${cleanMessage}`);
        alert(`${title}: ${cleanMessage}`);
      }
    }

    // Global exposure
    window.showAlert = showAlert;
    
    // Log that alert system is ready
    console.log('Alert system initialized. SweetAlert2 available:', typeof Swal !== "undefined");
});

/**
 * Cache Page Script
 * Cache management functionality
 */

function loadCacheStats() {
  fetch("/Cache/GetCacheStats")
    .then((response) => response.json())
    .then((data) => {
      const statsEl = document.getElementById("cache-stats");
      if (!statsEl) return;

      if (data.error) {
        statsEl.innerHTML = `<div class="alert alert-warning">${data.error}</div>`;
      } else {
        statsEl.innerHTML = `
          <div class="row">
            <div class="col-md-6">
              <h6>Search Cache</h6>
              <ul class="list-unstyled">
                <li><strong>Status:</strong> ${data.searchCacheEnabled ? "Enabled" : "Disabled"}</li>
                <li><strong>Duration:</strong> ${data.searchCacheDuration}</li>
              </ul>
            </div>
            <div class="col-md-6">
              <h6>Top Saved Books Cache</h6>
              <ul class="list-unstyled">
                <li><strong>Status:</strong> ${data.topSavedBooksCacheEnabled ? "Enabled" : "Disabled"}</li>
                <li><strong>Duration:</strong> ${data.topSavedBooksCacheDuration}</li>
              </ul>
            </div>
          </div>
          <p class="text-muted mt-2">Last updated: ${data.lastCleared}</p>
        `;
      }
    })
    .catch(() => {
      const statsEl = document.getElementById("cache-stats");
      if (statsEl) {
        statsEl.innerHTML = '<div class="alert alert-danger">Failed to load cache statistics</div>';
      }
    });
}

document.addEventListener("DOMContentLoaded", function () {
  loadCacheStats();

  const refreshBtn = document.getElementById("refresh-stats");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadCacheStats);
  }
});

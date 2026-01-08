// Load cache statistics
function loadCacheStats() {
    fetch('/Cache/GetCacheStats')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('cache-stats').innerHTML = 
                    '<div class="alert alert-warning">' + data.error + '</div>';
            } else {
                document.getElementById('cache-stats').innerHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Search Cache</h6>
                            <ul class="list-unstyled">
                                <li><strong>Status:</strong> ${data.searchCacheEnabled ? 'Enabled' : 'Disabled'}</li>
                                <li><strong>Duration:</strong> ${data.searchCacheDuration}</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6>Top Saved Books Cache</h6>
                            <ul class="list-unstyled">
                                <li><strong>Status:</strong> ${data.topSavedBooksCacheEnabled ? 'Enabled' : 'Disabled'}</li>
                                <li><strong>Duration:</strong> ${data.topSavedBooksCacheDuration}</li>
                            </ul>
                        </div>
                    </div>
                    <p class="text-muted mt-2">Last updated: ${data.lastCleared}</p>
                `;
            }
        })
        .catch(error => {
            document.getElementById('cache-stats').innerHTML = 
                '<div class="alert alert-danger">Failed to load cache statistics</div>';
        });
}

// Load stats on page load
document.addEventListener('DOMContentLoaded', loadCacheStats);

// Refresh stats button
document.getElementById('refresh-stats').addEventListener('click', loadCacheStats);
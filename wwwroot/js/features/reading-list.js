/**
 * Reading List Feature Module
 * Handles reading list management with offline support
 */

console.log(
  "ReadingList JS loaded. jQuery available:",
  typeof $ !== "undefined"
);

// ==================== Reading List Refresh ====================

async function checkAndRefreshReadingList() {
  // If offline, load from cache or show offline message
  if (!navigator.onLine) {
    console.log("Offline mode: loading cached reading list data");
    await loadOfflineReadingList();
    return;
  }

  // Only refresh if online and needs refresh
  if (
    typeof CacheManager !== "undefined" &&
    CacheManager.needsReadingListRefresh()
  ) {
    CacheManager.clearReadingListRefreshFlag();
    await refreshReadingListData();
  } else if (sessionStorage.getItem("readingListNeedsRefresh") === "true") {
    // Fallback for older implementation
    sessionStorage.removeItem("readingListNeedsRefresh");
    await refreshReadingListData();
  }
}

async function loadOfflineReadingList() {
  try {
    // First try to load from IndexedDB (more reliable for structured data)
    if (typeof DB !== "undefined") {
      const cachedItems = await DB.getAll("readingList");
      if (cachedItems && cachedItems.length > 0) {
        // Convert IndexedDB format to display format
        const displayData = cachedItems.map((item) => ({
          id: item.id,
          bookId: item.bookId || item.id,
          isFavorite: item.isFavorite || false,
          isRead: item.isRead || false,
          title: item.title || "Unknown Title",
          author: item.author || "Unknown Author",
          thumbnail: item.thumbnail || "",
          category: item.category || "GENERAL",
          publishedYear: item.publishedYear,
          pageCount: item.pageCount,
        }));

        updateReadingListUI(displayData);
        showOfflineIndicator();
        console.log("Loaded reading list from IndexedDB (offline mode)");
        return;
      }
    }

    // Fallback: Try to load from cache
    if ("caches" in window) {
      const cache = await caches.open("lentera-offline-v5");
      const cachedResponse = await cache.match("/Page/GetReadingListData");

      if (cachedResponse) {
        const result = await cachedResponse.json();
        if (result.success && result.data && result.data.length > 0) {
          updateReadingListUI(result.data);
          showOfflineIndicator();
          console.log("Loaded reading list from cache (offline mode)");
          return;
        }
      }
    }

    // If no cache available, show offline message
    showOfflineMessage();
  } catch (error) {
    console.error("Error loading offline reading list:", error);
    showOfflineMessage();
  }
}

function showOfflineIndicator() {
  // Add offline indicator to the page
  const existingIndicator = document.querySelector(".offline-indicator");
  if (!existingIndicator) {
    const indicator = document.createElement("div");
    indicator.className = "offline-indicator alert alert-info";
    indicator.innerHTML = `
      <i class="fas fa-wifi"></i>
      <strong>Mode Offline:</strong> Menampilkan data tersimpan. Beberapa fitur mungkin terbatas.
    `;

    const container = document.querySelector(".reading-list-container");
    if (container) {
      container.insertBefore(indicator, container.firstChild);
    }
  }
}

function showOfflineMessage() {
  const grid = document.getElementById("readingListGrid");
  const emptyState = document.getElementById("emptyState");

  if (grid) grid.style.display = "none";
  if (emptyState) emptyState.style.display = "none";

  // Show offline message
  let offlineMessage = document.getElementById("offlineMessage");
  if (!offlineMessage) {
    offlineMessage = document.createElement("div");
    offlineMessage.id = "offlineMessage";
    offlineMessage.className = "offline-message text-center py-5";
    offlineMessage.innerHTML = `
      <div class="offline-icon mb-3">
        <i class="fas fa-wifi-slash fa-3x text-muted"></i>
      </div>
      <h3 class="text-muted">Tidak Ada Koneksi Internet</h3>
      <p class="text-muted mb-4">
        Reading list tidak tersedia saat offline.<br>
        Silakan periksa koneksi internet Anda dan coba lagi.
      </p>
      <button class="btn btn-primary" onclick="window.location.reload()">
        <i class="fas fa-refresh"></i> Coba Lagi
      </button>
    `;

    const container = document.querySelector(".reading-list-container");
    if (container) {
      container.appendChild(offlineMessage);
    }
  } else {
    offlineMessage.style.display = "block";
  }
}

function hideOfflineMessage() {
  const offlineMessage = document.getElementById("offlineMessage");
  if (offlineMessage) {
    offlineMessage.style.display = "none";
  }
}

function hideOfflineIndicator() {
  const indicator = document.querySelector(".offline-indicator");
  if (indicator) {
    indicator.remove();
  }
}

async function refreshReadingListData() {
  // Don't try to refresh if offline
  if (!navigator.onLine) {
    console.log("Offline mode: skipping reading list refresh");
    return;
  }

  try {
    // Add timestamp to prevent any caching
    const timestamp = new Date().getTime();
    const response = await fetch(`/Page/GetReadingListData?_t=${timestamp}`, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    if (response.ok) {
      const result = await response.json();

      if (result.success && result.data) {
        updateReadingListUI(result.data);
        console.log("Reading list refreshed successfully");
      }
    }
  } catch (error) {
    console.error("Failed to refresh reading list:", error);
    // If refresh fails, we'll rely on cached data
    console.log("Using cached reading list data as fallback");
  }
}

function updateReadingListUI(books) {
  const currentGrid = document.querySelector("#readingListGrid");
  const emptyState = document.getElementById("emptyState");

  if (!currentGrid) return;

  if (books.length === 0) {
    currentGrid.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  // Generate HTML for books
  const booksHTML = books
    .map(
      (item) => `
    <div class="book-card"
         data-favorite="${item.isFavorite.toString().toLowerCase()}"
         data-read="${item.isRead.toString().toLowerCase()}"
         data-book-id="${item.bookId}">

        <div class="book-cover-wrapper" onclick="viewBookDetail(${
          item.bookId
        })">
            <img src="${item.thumbnail || ""}"
                 alt="${item.title}"
                 class="book-cover"
                 loading="lazy"
                 onload="handleImageLoad(this)"
                 onerror="handleImageTimeout(this)">
            ${
              item.isRead
                ? '<div class="offline-badge" style="background: var(--accent-green);">SUDAH DIBACA</div>'
                : ""
            }
        </div>

        <div class="book-info">
            <div class="book-category">${(
              item.category || "GENERAL"
            ).toUpperCase()}</div>

            <h3 class="book-title" onclick="viewBookDetail(${item.bookId})">${
        item.title
      }</h3>
            <p class="book-author">${item.author}${
        item.publishedYear ? ` • ${item.publishedYear}` : ""
      }</p>
            
            <p class="book-description">
                ${
                  item.publishedYear
                    ? `Diterbitkan tahun ${item.publishedYear}`
                    : "Tahun terbit tidak diketahui"
                }${item.pageCount ? `, ${item.pageCount} halaman` : ""}
            </p>
            
            <div class="reading-list-primary-action">
                <a href="/Page/Read?id=${item.bookId}" class="btn-read-full">
                    BACA SEKARANG
                </a>
            </div>

            <!-- Secondary Actions -->
            <div class="reading-list-actions">
                <button class="btn-read-status ${
                  item.isRead ? "active" : ""
                }" onclick="toggleRead(${item.id}, event)" title="${
        item.isRead ? "Tandai Belum Dibaca" : "Tandai Sudah Dibaca"
      }">
                    <i class="${
                      item.isRead ? "fas fa-check-circle" : "far fa-circle"
                    }"></i>
                </button>

                <button class="btn-favorite ${
                  item.isFavorite ? "active" : ""
                }" onclick="toggleFavorite(${item.id}, event)" title="${
        item.isFavorite ? "Favorit" : "Tambah ke Favorit"
      }">
                    <i class="${
                      item.isFavorite ? "fas fa-heart" : "far fa-heart"
                    }"></i>
                </button>
                
                <button class="btn-offline" onclick="toggleOffline(${
                  item.bookId
                }, event)" title="Offline" id="offline-btn-${item.bookId}">
                    <i class="fas fa-cloud"></i>
                </button>

                <button class="btn-remove" onclick="removeFromReadingList(${
                  item.id
                }, event)" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    </div>
  `
    )
    .join("");

  // Update the grid
  currentGrid.innerHTML = booksHTML;
  currentGrid.style.display = "grid";
  emptyState.style.display = "none";

  // Re-initialize images
  initializeImages(currentGrid);

  // Re-apply current filter
  const activeTab = document.querySelector(".tab-btn.active");
  if (activeTab) {
    activeTab.click();
  }
}

// ==================== Core Functions ====================

function viewBookDetail(bookId) {
  window.location.href = `/Page/Detail?id=${bookId}`;
}

function removeFromReadingList(readinglistId, event) {
  event.stopPropagation();

  if (!confirm("Apakah Anda yakin ingin menghapus buku ini dari Reading List?"))
    return;

  if (navigator.onLine) {
    $.ajax({
      url: "/Page/RemoveFromReadingList",
      type: "POST",
      data: {
        readingListId: readinglistId,
        __RequestVerificationToken: window.antiForgeryToken || "",
      },
      success: function (response) {
        if (response.success) {
          removeCardAnimation(event.target);
        } else {
          showAlert("Gagal menghapus dari reading list", "warning");
        }
      },
      error: handleAjaxError,
    });
  } else {
    queueAction("removeFromReadingList", () => ({
      readingListId: readinglistId,
      __RequestVerificationToken: window.antiForgeryToken || "",
    }));
    removeCardAnimation(event.target);
  }
}

function toggleFavorite(readinglistId, event) {
  event.stopPropagation();

  const btn = event.target.closest(".btn-favorite");
  const icon = btn.querySelector("i");
  const card = btn.closest(".book-card");
  const isNowFavorite = !btn.classList.contains("active");

  if (navigator.onLine) {
    $.ajax({
      url: "/Page/ToggleFavorite",
      type: "POST",
      data: {
        readingListId: readinglistId,
        __RequestVerificationToken: window.antiForgeryToken || "",
      },
      success: function (response) {
        if (response.success) {
          updateFavoriteUI(btn, icon, card, response.isFavorite);
        } else {
          showAlert("Gagal mengubah status favorit", "warning");
        }
      },
      error: handleAjaxError,
    });
  } else {
    queueAction("toggleFavorite", () => ({
      readingListId: readinglistId,
      __RequestVerificationToken: window.antiForgeryToken || "",
    }));
    updateFavoriteUI(btn, icon, card, isNowFavorite);
  }
}

function toggleRead(readinglistId, event) {
  event.stopPropagation();

  const btn = event.target.closest(".btn-read-status");
  const card = btn.closest(".book-card");
  const isNowRead = !btn.classList.contains("active");

  if (navigator.onLine) {
    $.ajax({
      url: "/Page/ToggleRead",
      type: "POST",
      data: {
        readingListId: readinglistId,
        __RequestVerificationToken: window.antiForgeryToken || "",
      },
      success: function (response) {
        if (response.success) {
          updateReadUI(btn, response.isRead);
          card.setAttribute(
            "data-read",
            response.isRead.toString().toLowerCase()
          );
        } else {
          showAlert("Gagal mengubah status baca", "warning");
        }
      },
      error: handleAjaxError,
    });
  } else {
    queueAction("toggleRead", () => ({
      readingListId: readinglistId,
      __RequestVerificationToken: window.antiForgeryToken || "",
    }));
    updateReadUI(btn, isNowRead);
    card.setAttribute("data-read", isNowRead.toString().toLowerCase());
  }
}

// ==================== UI Helpers ====================

function updateFavoriteUI(btn, icon, card, isFavorite) {
  if (isFavorite) {
    btn.classList.add("active");
    btn.title = "Hapus dari Favorit";
    icon.className = "fas fa-heart";
  } else {
    btn.classList.remove("active");
    btn.title = "Tambah ke Favorit";
    icon.className = "far fa-heart";
  }
  card.setAttribute("data-favorite", isFavorite.toString().toLowerCase());
}

function updateReadUI(btn, isRead) {
  const icon = btn.querySelector("i");
  if (isRead) {
    btn.classList.add("active");
    btn.title = "Tandai Belum Dibaca";
    if (icon) icon.className = "fas fa-check-circle";
  } else {
    btn.classList.remove("active");
    btn.title = "Tandai Sudah Dibaca";
    if (icon) icon.className = "far fa-circle";
  }
}

function removeCardAnimation(target) {
  const card = target.closest(".book-card");
  card.style.transition = "opacity 0.3s ease";
  card.style.opacity = "0";
  setTimeout(() => {
    card.remove();
    const remaining = document.querySelectorAll(".book-card");
    if (remaining.length === 0) {
      document.getElementById("readingListGrid").style.display = "none";
      document.getElementById("emptyState").style.display = "block";
    }
  }, 300);
}

function handleAjaxError(xhr) {
  if (xhr.status === 401 || xhr.status === 403) {
    window.location.href = "/Auth/Login";
  } else {
    let errorMessage = "Terjadi kesalahan koneksi";
    try {
      const errorResponse = JSON.parse(xhr.responseText);
      if (errorResponse.message) errorMessage = errorResponse.message;
    } catch (e) {}
    showAlert(errorMessage, "danger");
  }
}

// ==================== Offline Support ====================

async function toggleOffline(bookId, event) {
  event.stopPropagation();

  const btn = event.target.closest(".btn-offline");
  const icon = btn.querySelector("i");
  const card = btn.closest(".book-card");

  if (!("caches" in window)) {
    showAlert("Browser tidak mendukung offline mode", "warning");
    return;
  }

  try {
    const isCached = await checkIsCached(bookId);

    if (isCached) {
      // Remove from cache
      await removeFromCache(bookId);
      btn.classList.remove("cached");
      btn.title = "Simpan untuk offline";
      icon.className = "fas fa-cloud";
      card.classList.remove("is-offline");
      showAlert("Buku dihapus dari offline storage", "info");
    } else {
      // Add to cache
      btn.disabled = true;
      btn.title = "Menyimpan...";
      icon.className = "fas fa-spinner fa-spin";

      const success = await cacheBookForOffline(bookId);

      if (success) {
        btn.classList.add("cached");
        btn.title = "Tersedia offline";
        icon.className = "fas fa-cloud-download-alt";
        card.classList.add("is-offline");
        showAlert("Buku disimpan untuk offline", "success");
      } else {
        btn.title = "Gagal menyimpan";
        icon.className = "fas fa-exclamation-triangle";
        showAlert("Gagal menyimpan buku untuk offline", "danger");
      }

      btn.disabled = false;
    }
  } catch (error) {
    console.error("Error toggling offline:", error);
    showAlert("Terjadi kesalahan saat mengatur offline mode", "danger");
    btn.disabled = false;
  }
}

async function checkIsCached(bookId) {
  if (!("caches" in window)) return false;

  try {
    const cache = await caches.open("lentera-offline-v5");
    const bookUrl = `/Page/Read?id=${bookId}`;
    const response = await cache.match(bookUrl);
    return !!response;
  } catch (error) {
    console.error("Error checking cache:", error);
    return false;
  }
}

async function cacheBookForOffline(bookId) {
  if (!navigator.onLine) {
    showAlert("Tidak dapat menyimpan buku saat offline", "warning");
    return false;
  }

  try {
    const cache = await caches.open("lentera-offline-v5");

    // URLs to cache for this book
    const urlsToCache = [
      `/Page/Read?id=${bookId}`,
      `/Page/Detail?id=${bookId}`,
      `/Page/GetBookContent?id=${bookId}`,
      `/Page/GetBookData?id=${bookId}`,
    ];

    // Cache each URL
    for (const url of urlsToCache) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response.clone());
        }
      } catch (error) {
        console.warn(`Failed to cache ${url}:`, error);
      }
    }

    // Also try to cache book thumbnail if available
    const card = document.querySelector(`[data-book-id="${bookId}"]`);
    if (card) {
      const img = card.querySelector(".book-cover");
      if (img && img.src && !img.src.startsWith("data:")) {
        try {
          const response = await fetch(img.src);
          if (response.ok) {
            await cache.put(img.src, response.clone());
          }
        } catch (error) {
          console.warn("Failed to cache book thumbnail:", error);
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Error caching book:", error);
    return false;
  }
}

async function removeFromCache(bookId) {
  try {
    const cache = await caches.open("lentera-offline-v5");

    // URLs to remove from cache
    const urlsToRemove = [
      `/Page/Read?id=${bookId}`,
      `/Page/Detail?id=${bookId}`,
      `/Page/GetBookContent?id=${bookId}`,
      `/Page/GetBookData?id=${bookId}`,
    ];

    // Remove each URL from cache
    for (const url of urlsToRemove) {
      await cache.delete(url);
    }

    // Also remove thumbnail if cached
    const card = document.querySelector(`[data-book-id="${bookId}"]`);
    if (card) {
      const img = card.querySelector(".book-cover");
      if (img && img.src && !img.src.startsWith("data:")) {
        await cache.delete(img.src);
      }
    }

    return true;
  } catch (error) {
    console.error("Error removing from cache:", error);
    return false;
  }
}

async function queueAction(actionType, createPayload) {
  if (typeof DB === "undefined") return;

  const action = {
    timestamp: Date.now(),
    type: actionType,
    payload: createPayload(),
    synced: false,
  };

  await DB.put("actionQueue", action);
  registerSync();
}

function registerSync() {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready
      .then((registration) => registration.sync.register("sync-reading-list"))
      .catch(() => console.log("Background sync not supported"));
  }
}

async function processActionQueue() {
  if (typeof DB === "undefined" || !navigator.onLine) return;

  const actions = await DB.getAll("actionQueue");
  if (!actions || actions.length === 0) return;

  console.log(`Processing ${actions.length} offline actions...`);

  for (const action of actions) {
    try {
      const urlMap = {
        toggleRead: "/Page/ToggleRead",
        toggleFavorite: "/Page/ToggleFavorite",
        removeFromReadingList: "/Page/RemoveFromReadingList",
      };

      if (urlMap[action.type]) {
        await performAjax(urlMap[action.type], action.payload);
        await DB.delete("actionQueue", action.timestamp);
      }
    } catch (e) {
      console.error("Failed to sync action:", action, e);
    }
  }

  if (actions.length > 0) {
    // Data synced silently
  }
}

function performAjax(url, data) {
  return new Promise((resolve, reject) => {
    $.ajax({ url, type: "POST", data, success: resolve, error: reject });
  });
}

async function saveReadingListToDB() {
  if (typeof DB === "undefined") return;

  const items = [];
  document.querySelectorAll(".book-card").forEach((card) => {
    const bookId = card.dataset.bookId;
    const titleEl = card.querySelector(".book-title");
    const authorEl = card.querySelector(".book-author");
    const categoryEl = card.querySelector(".book-category");
    const thumbnailEl = card.querySelector(".book-cover");

    if (bookId) {
      // Extract data from DOM elements
      const title = titleEl ? titleEl.textContent.trim() : "Unknown Title";
      const authorText = authorEl
        ? authorEl.textContent.trim()
        : "Unknown Author";
      const category = categoryEl ? categoryEl.textContent.trim() : "GENERAL";
      const thumbnail = thumbnailEl ? thumbnailEl.src : "";

      // Parse author and year from author text (format: "Author • Year")
      const authorParts = authorText.split(" • ");
      const author = authorParts[0] || "Unknown Author";
      const publishedYear = authorParts[1] ? parseInt(authorParts[1]) : null;

      // Get reading list ID from button onclick
      const btnFav = card.querySelector(".btn-favorite");
      const onclickFav = btnFav?.getAttribute("onclick") || "";
      const idMatch = onclickFav.match(/toggleFavorite\((\d+)/);
      const readingListId = idMatch ? parseInt(idMatch[1]) : parseInt(bookId);

      items.push({
        id: readingListId,
        bookId: parseInt(bookId),
        isFavorite: card.dataset.favorite === "true",
        isRead: card.dataset.read === "true",
        title: title,
        author: author,
        thumbnail: thumbnail,
        category: category,
        publishedYear: publishedYear,
        pageCount: null, // Will be extracted from description if available
        timestamp: Date.now(),
      });
    }
  });

  try {
    // Clear existing data first
    await DB.clear("readingList");

    // Save new data
    for (const item of items) {
      await DB.put("readingList", item);
    }
    console.log(`Reading list synced to IndexedDB: ${items.length} items`);
  } catch (e) {
    console.warn("Failed to sync reading list:", e);
  }
}

// ==================== Initialization ====================

document.addEventListener("DOMContentLoaded", async function () {
  // Check if reading list needs refresh first
  await checkAndRefreshReadingList();

  initTabFiltering();
  initializeImages(document);
  saveReadingListToDB();
  processActionQueue();

  // Check cached books
  if ("caches" in window) {
    const bookCards = document.querySelectorAll(".book-card");
    for (const card of bookCards) {
      const onclick = card.getAttribute("onclick");
      const match = onclick?.match(/viewBookDetail\((\d+)\)/);
      if (match && typeof checkIsCached !== "undefined") {
        const isCached = await checkIsCached(match[1]);
        if (isCached) {
          const btn = document.getElementById(`offline-btn-${match[1]}`);
          if (btn) btn.classList.add("cached");
          card.classList.add("is-offline");
        }
      }
    }
  }
});

function initializeImages(container) {
  const images = container.querySelectorAll(".book-thumbnail img, .book-cover");
  images.forEach((img) => {
    if (img.src && img.src !== "" && !img.src.startsWith("data:")) {
      // Increase timeout to 15 seconds
      const timeoutId = setTimeout(() => handleImageTimeout(img), 15000);
      img.setAttribute("data-timeout-id", timeoutId);
      if (img.complete && img.naturalHeight !== 0) handleImageLoad(img);
    } else if (!img.src || img.src === "") {
      handleImageTimeout(img);
    }
  });
}

// ==================== Search and Filter Functions ====================

function initSearchAndSort() {
  const searchInput = document.getElementById("searchBooks");
  const sortSelect = document.getElementById("sortBooks");

  if (searchInput) {
    searchInput.addEventListener("input", debounce(handleSearch, 300));
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", handleSort);
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase().trim();
  const cards = document.querySelectorAll(".book-card");
  let visibleCount = 0;

  cards.forEach((card) => {
    const title = card.dataset.title || "";
    const author = card.dataset.author || "";
    const isMatch = title.includes(searchTerm) || author.includes(searchTerm);

    if (isMatch) {
      card.classList.remove("filtered-out");
      card.classList.add("filtered-in");
      visibleCount++;
    } else {
      card.classList.add("filtered-out");
      card.classList.remove("filtered-in");
    }
  });

  updateVisibilityStates(visibleCount);
  updateStats();
}

function handleSort(event) {
  const sortBy = event.target.value;
  const grid = document.getElementById("readingListGrid");
  const cards = Array.from(grid.querySelectorAll(".book-card"));

  cards.sort((a, b) => {
    switch (sortBy) {
      case "title":
        return (a.dataset.title || "").localeCompare(b.dataset.title || "");
      case "title-desc":
        return (b.dataset.title || "").localeCompare(a.dataset.title || "");
      case "author":
        return (a.dataset.author || "").localeCompare(b.dataset.author || "");
      case "author-desc":
        return (b.dataset.author || "").localeCompare(a.dataset.author || "");
      case "date-added":
        return (
          new Date(b.dataset.dateAdded || 0) -
          new Date(a.dataset.dateAdded || 0)
        );
      case "date-added-desc":
        return (
          new Date(a.dataset.dateAdded || 0) -
          new Date(b.dataset.dateAdded || 0)
        );
      default:
        return 0;
    }
  });

  // Re-append sorted cards
  cards.forEach((card) => grid.appendChild(card));
}

function clearFilters() {
  const searchInput = document.getElementById("searchBooks");
  const sortSelect = document.getElementById("sortBooks");

  if (searchInput) searchInput.value = "";
  if (sortSelect) sortSelect.value = "title";

  // Reset all filters
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.querySelector('.tab-btn[data-status="all"]').classList.add("active");

  // Show all cards
  document.querySelectorAll(".book-card").forEach((card) => {
    card.classList.remove("filtered-out");
    card.style.display = "block";
  });

  updateVisibilityStates(document.querySelectorAll(".book-card").length);
  updateStats();
}

function updateVisibilityStates(visibleCount) {
  const grid = document.getElementById("readingListGrid");
  const emptyState = document.getElementById("emptyState");
  const noResultsState = document.getElementById("noResultsState");

  if (visibleCount === 0) {
    grid.style.display = "none";
    emptyState.style.display = "none";
    noResultsState.style.display = "block";
  } else {
    grid.style.display = "grid";
    emptyState.style.display = "none";
    noResultsState.style.display = "none";
  }
}

function updateStats() {
  const allCards = document.querySelectorAll(".book-card");
  const visibleCards = document.querySelectorAll(
    ".book-card:not(.filtered-out)"
  );

  const totalBooks = visibleCards.length;
  const readBooks = Array.from(visibleCards).filter(
    (card) => card.dataset.read === "true"
  ).length;
  const favoriteBooks = Array.from(visibleCards).filter(
    (card) => card.dataset.favorite === "true"
  ).length;
  const unreadBooks = totalBooks - readBooks;

  // Update stat numbers
  const totalElement = document.getElementById("totalBooks");
  const readElement = document.getElementById("readBooks");
  const favoriteElement = document.getElementById("favoriteBooks");
  const unreadElement = document.getElementById("unreadBooks");

  if (totalElement) animateNumber(totalElement, totalBooks);
  if (readElement) animateNumber(readElement, readBooks);
  if (favoriteElement) animateNumber(favoriteElement, favoriteBooks);
  if (unreadElement) animateNumber(unreadElement, unreadBooks);
}

function animateNumber(element, targetNumber) {
  const currentNumber = parseInt(element.textContent) || 0;
  const increment = targetNumber > currentNumber ? 1 : -1;
  const duration = 300;
  const steps = Math.abs(targetNumber - currentNumber);
  const stepDuration = steps > 0 ? duration / steps : 0;

  if (steps === 0) return;

  let current = currentNumber;
  const timer = setInterval(() => {
    current += increment;
    element.textContent = current;

    if (current === targetNumber) {
      clearInterval(timer);
    }
  }, stepDuration);
}

// ==================== Enhanced Tab Filtering ====================

function initTabFiltering() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const filter = this.getAttribute("data-status");
      const cards = document.querySelectorAll(".book-card");
      let visibleCount = 0;

      cards.forEach((card) => {
        let isVisible = false;
        if (filter === "all") isVisible = true;
        else if (filter === "Favorite" && card.dataset.favorite === "true")
          isVisible = true;
        else if (filter === "Read" && card.dataset.read === "true")
          isVisible = true;
        else if (filter === "Unread" && card.dataset.read === "false")
          isVisible = true;

        if (isVisible) {
          card.classList.remove("filtered-out");
          card.style.display = "block";
          visibleCount++;
        } else {
          card.classList.add("filtered-out");
          card.style.display = "none";
        }
      });

      updateVisibilityStates(visibleCount);
      updateStats();
    });
  });
}

// ==================== Enhanced Image Handling ====================

function createPlaceholderSVG(title) {
  const initials = title
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23667eea;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23764ba2;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='300' fill='url(%23grad)'/%3E%3Ctext x='100' y='140' text-anchor='middle' fill='white' font-size='48' font-weight='bold' font-family='Arial'%3E${initials}%3C/text%3E%3Ctext x='100' y='180' text-anchor='middle' fill='white' font-size='12' font-family='Arial' opacity='0.8'%3ENo Cover%3C/text%3E%3C/svg%3E`;
}

function handleImageTimeout(img) {
  const timeoutId = img.getAttribute("data-timeout-id");
  if (timeoutId) {
    clearTimeout(parseInt(timeoutId));
    img.removeAttribute("data-timeout-id");
  }

  // If already loaded or already have a placeholder, don't do it again
  if (
    img.classList.contains("loaded") ||
    img.src.startsWith("data:image/svg+xml")
  ) {
    return;
  }

  // Get book title for placeholder
  const bookCard = img.closest(".book-card");
  const titleElement = bookCard ? bookCard.querySelector(".book-title") : null;
  const title = titleElement ? titleElement.textContent.trim() : "Book";

  // Set custom placeholder
  img.style.opacity = "1";
  img.src = createPlaceholderSVG(title);
}

// ==================== Enhanced Initialization ====================

document.addEventListener("DOMContentLoaded", async function () {
  // Check if reading list needs refresh first
  await checkAndRefreshReadingList();

  initTabFiltering();
  initSearchAndSort();
  initializeImages(document);
  saveReadingListToDB();
  processActionQueue();

  // Initialize stats
  updateStats();

  // Online/Offline event handlers
  window.addEventListener("online", () => {
    document.body.classList.remove("offline-mode");
    hideOfflineMessage();
    hideOfflineIndicator();
    processActionQueue();
    // Refresh reading list when coming back online
    setTimeout(() => {
      checkAndRefreshReadingList();
    }, 1000);
  });

  window.addEventListener("offline", () => {
    document.body.classList.add("offline-mode");
    showOfflineIndicator();
  });

  // Check cached books
  if ("caches" in window) {
    const bookCards = document.querySelectorAll(".book-card");
    for (const card of bookCards) {
      const bookId = card.dataset.bookId;
      if (bookId && typeof checkIsCached !== "undefined") {
        const isCached = await checkIsCached(bookId);
        if (isCached) {
          const btn = document.getElementById(`offline-btn-${bookId}`);
          if (btn) btn.classList.add("cached");
          card.classList.add("is-offline");
        }
      }
    }
  }
});

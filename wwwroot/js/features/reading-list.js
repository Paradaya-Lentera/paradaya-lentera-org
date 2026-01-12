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
  // Check if reading list needs refresh using CacheManager
  if (typeof CacheManager !== 'undefined' && CacheManager.needsReadingListRefresh()) {
    CacheManager.clearReadingListRefreshFlag();
    await refreshReadingListData();
  } else if (sessionStorage.getItem('readingListNeedsRefresh') === 'true') {
    // Fallback for older implementation
    sessionStorage.removeItem('readingListNeedsRefresh');
    await refreshReadingListData();
  }
}

async function refreshReadingListData() {
  try {
    // Add timestamp to prevent any caching
    const timestamp = new Date().getTime();
    const response = await fetch(`/Page/GetReadingListData?_t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success && result.data) {
        updateReadingListUI(result.data);
        console.log('Reading list refreshed successfully');
      }
    }
  } catch (error) {
    console.error('Failed to refresh reading list:', error);
  }
}

function updateReadingListUI(books) {
  const currentGrid = document.querySelector('#readingListGrid');
  const emptyState = document.getElementById('emptyState');
  
  if (!currentGrid) return;
  
  if (books.length === 0) {
    currentGrid.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  // Generate HTML for books
  const booksHTML = books.map(item => `
    <div class="book-card"
         data-favorite="${item.isFavorite.toString().toLowerCase()}"
         data-read="${item.isRead.toString().toLowerCase()}"
         data-book-id="${item.bookId}">

        <div class="book-cover-wrapper" onclick="viewBookDetail(${item.bookId})">
            <img src="${item.thumbnail || ''}"
                 alt="${item.title}"
                 class="book-cover"
                 loading="lazy"
                 onload="handleImageLoad(this)"
                 onerror="handleImageTimeout(this)">
            ${item.isRead ? '<div class="offline-badge" style="background: var(--accent-green);">SUDAH DIBACA</div>' : ''}
        </div>

        <div class="book-info">
            <div class="book-category">${(item.category || 'GENERAL').toUpperCase()}</div>

            <h3 class="book-title" onclick="viewBookDetail(${item.bookId})">${item.title}</h3>
            <p class="book-author">${item.author}${item.publishedYear ? ` • ${item.publishedYear}` : ''}</p>
            
            <p class="book-description">
                ${item.publishedYear ? `Diterbitkan tahun ${item.publishedYear}` : 'Tahun terbit tidak diketahui'}${item.pageCount ? `, ${item.pageCount} halaman` : ''}
            </p>
            
            <div class="reading-list-primary-action">
                <a href="/Page/Read?id=${item.bookId}" class="btn-read-full">
                    BACA SEKARANG
                </a>
            </div>

            <!-- Secondary Actions -->
            <div class="reading-list-actions">
                <button class="btn-read-status ${item.isRead ? 'active' : ''}" onclick="toggleRead(${item.id}, event)" title="${item.isRead ? 'Tandai Belum Dibaca' : 'Tandai Sudah Dibaca'}">
                    <i class="fas fa-check-circle"></i>
                </button>

                <button class="btn-favorite ${item.isFavorite ? 'active' : ''}" onclick="toggleFavorite(${item.id}, event)" title="${item.isFavorite ? 'Favorit' : 'Tambah ke Favorit'}">
                    <i class="fas fa-heart"></i>
                </button>
                
                <button class="btn-offline" onclick="toggleOffline(${item.bookId}, event)" title="Offline" id="offline-btn-${item.bookId}">
                    <i class="fas fa-cloud"></i>
                </button>

                <button class="btn-remove" onclick="removeFromReadingList(${item.id}, event)" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    </div>
  `).join('');
  
  // Update the grid
  currentGrid.innerHTML = booksHTML;
  currentGrid.style.display = 'grid';
  emptyState.style.display = 'none';
  
  // Re-initialize images
  initializeImages(currentGrid);
  
  // Re-apply current filter
  const activeTab = document.querySelector('.tab-btn.active');
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
  if (isRead) {
    btn.classList.add("active");
    btn.title = "Tandai Belum Dibaca";
    btn.innerHTML = '<i class="fas fa-check-circle"></i>';
  } else {
    btn.classList.remove("active");
    btn.title = "Tandai Sudah Dibaca";
    btn.innerHTML = '<i class="far fa-circle"></i>';
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
    const btnFav = card.querySelector(".btn-favorite");
    const onclickFav = btnFav?.getAttribute("onclick") || "";
    const idMatch = onclickFav.match(/toggleFavorite\((\d+)/);

    if (idMatch) {
      items.push({
        id: parseInt(idMatch[1]),
        isFavorite: card.dataset.favorite === "true",
        isRead: card.dataset.read === "true",
        timestamp: Date.now(),
      });
    }
  });

  try {
    for (const item of items) {
      await DB.put("readingList", item);
    }
    console.log("Reading list synced to IndexedDB");
  } catch (e) {
    console.warn("Failed to sync reading list:", e);
  }
}

// ==================== Tab Filtering ====================

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

        card.style.display = isVisible ? "block" : "none";
        if (isVisible) visibleCount++;
      });

      const grid = document.getElementById("readingListGrid");
      const emptyState = document.getElementById("emptyState");

      if (visibleCount === 0) {
        grid.style.display = "none";
        emptyState.style.display = "block";
      } else {
        grid.style.display = "grid";
        emptyState.style.display = "none";
      }
    });
  });
}

// ==================== Initialization ====================

document.addEventListener("DOMContentLoaded", async function () {
  // Check if reading list needs refresh first
  await checkAndRefreshReadingList();
  
  initTabFiltering();
  initializeImages(document);
  saveReadingListToDB();
  processActionQueue();

  // Online/Offline event handlers
  window.addEventListener("online", () => {
    document.body.classList.remove("offline-mode");
    processActionQueue();
  });

  window.addEventListener("offline", () => {
    document.body.classList.add("offline-mode");
  });

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
    if (img.src && img.src !== "") {
      const timeoutId = setTimeout(() => handleImageTimeout(img), 3000);
      img.setAttribute("data-timeout-id", timeoutId);
      if (img.complete && img.naturalHeight !== 0) handleImageLoad(img);
    } else {
      handleImageTimeout(img);
    }
  });
}

function handleImageLoad(img) {
  const timeoutId = img.getAttribute("data-timeout-id");
  if (timeoutId) {
    clearTimeout(parseInt(timeoutId));
    img.removeAttribute("data-timeout-id");
  }
  img.style.opacity = "1";
}

function handleImageTimeout(img) {
  const timeoutId = img.getAttribute("data-timeout-id");
  if (timeoutId) {
    clearTimeout(parseInt(timeoutId));
    img.removeAttribute("data-timeout-id");
  }
  
  // Set placeholder image or hide
  img.style.opacity = "0.5";
  img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='180' viewBox='0 0 120 180'%3E%3Crect width='120' height='180' fill='%23f0f0f0'/%3E%3Ctext x='60' y='90' text-anchor='middle' fill='%23999' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
}

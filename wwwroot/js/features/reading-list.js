/**
 * Reading List Feature Module
 * Handles reading list management with offline support
 */

console.log(
  "ReadingList JS loaded. jQuery available:",
  typeof $ !== "undefined"
);

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
          showAlert(response.message, "success");
        } else {
          showAlert(response.message, "warning");
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
    showAlert("Permintaan hapus disimpan (Offline Mode)", "info");
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
          showAlert(response.message, "success");
        } else {
          showAlert(response.message, "warning");
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
    showAlert("Status favorit disimpan offline", "info");
  }
}

function toggleRead(readinglistId, event) {
  event.stopPropagation();

  const btn = event.target.closest(".btn-read-status");
  const card = btn.closest(".book-card");
  const isNowRead = btn.classList.contains("unread");

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
          showAlert(response.message, "success");
        } else {
          showAlert(response.message, "warning");
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
    showAlert("Status bacaan disimpan offline", "info");
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
    btn.classList.remove("unread");
    btn.classList.add("completed");
    btn.title = "Tandai Belum Dibaca";
    btn.innerHTML = '<i class="fas fa-check-circle"></i>';
  } else {
    btn.classList.remove("completed");
    btn.classList.add("unread");
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
    showAlert("Data offline berhasil disinkronisasi!", "success");
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
  initTabFiltering();
  initializeImages(document);
  saveReadingListToDB();
  processActionQueue();

  // Online/Offline event handlers
  window.addEventListener("online", () => {
    document.body.classList.remove("offline-mode");
    showAlert("Koneksi kembali! Menyinkronkan data...", "info");
    processActionQueue();
  });

  window.addEventListener("offline", () => {
    document.body.classList.add("offline-mode");
    showAlert(
      "Anda sedang offline. Perubahan akan disimpan dan disinkronkan nanti.",
      "warning"
    );
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
  const images = container.querySelectorAll(".book-thumbnail img");
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

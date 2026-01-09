console.log(
  "ReadingList JS loaded. jQuery available:",
  typeof $ !== "undefined"
);

function viewBookDetail(bookId) {
  window.location.href = `/Page/Detail?id=${bookId}`;
}

function removeFromReadingList(readinglistId, event) {
  // Prevent card click event
  event.stopPropagation();

  if (
    confirm("Apakah Anda yakin ingin menghapus buku ini dari Reading List?")
  ) {
    $.ajax({
      url: "/Page/RemoveFromReadingList",
      type: "POST",
      data: {
        readingListId: readinglistId,
        __RequestVerificationToken: window.antiForgeryToken || "",
      },
      success: function (response) {
        if (response.success) {
          // Remove card from DOM
          const card = event.target.closest(".book-card");
          card.style.transition = "opacity 0.3s ease";
          card.style.opacity = "0";

          setTimeout(() => {
            card.remove();

            // Check if grid is empty
            const remainingCards = document.querySelectorAll(".book-card");
            if (remainingCards.length === 0) {
              document.getElementById("readingListGrid").style.display = "none";
              document.getElementById("emptyState").style.display = "block";
            }
          }, 300);

          // Show success message
          showAlert(response.message, "success");
        } else {
          showAlert(response.message, "warning");
        }
      },
      error: function (xhr) {
        if (xhr.status === 401 || xhr.status === 403) {
          // User not authenticated, redirect to login
          window.location.href =
            "/Auth/Login?returnUrl=" +
            encodeURIComponent(
              window.location.pathname + window.location.search
            );
        } else {
          showAlert(
            "Terjadi error saat menghapus buku dari Reading List",
            "danger"
          );
        }
      },
    });
  }
}

function toggleFavorite(readinglistId, event) {
  // Prevent card click event
  event.stopPropagation();

  $.ajax({
    url: "/Page/ToggleFavorite",
    type: "POST",
    data: {
      readingListId: readinglistId,
      __RequestVerificationToken: window.antiForgeryToken || "",
    },
    success: function (response) {
      if (response.success) {
        // Update favorite button
        const btn = event.target.closest(".btn-favorite");
        const icon = btn.querySelector("i");

        if (response.isFavorite) {
          btn.classList.add("active");
          btn.title = "Hapus dari Favorit";
          icon.className = "fas fa-heart";
        } else {
          btn.classList.remove("active");
          btn.title = "Tambah ke Favorit";
          icon.className = "far fa-heart";
        }

        // Update card data attribute for filtering
        const card = btn.closest(".book-card");
        card.setAttribute(
          "data-favorite",
          response.isFavorite.toString().toLowerCase()
        );

        showAlert(response.message, "success");
      } else {
        showAlert(response.message, "warning");
      }
    },
    error: function (xhr) {
      if (xhr.status === 401 || xhr.status === 403) {
        window.location.href =
          "/Auth/Login?returnUrl=" +
          encodeURIComponent(window.location.pathname + window.location.search);
      } else {
        let errorMessage = "Terjadi error saat memperbarui status favorit";
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          if (errorResponse.message) {
            errorMessage = errorResponse.message;
          }
        } catch (e) {
          // Use default message if parsing fails
        }
        showAlert(errorMessage + " (Status: " + xhr.status + ")", "danger");
      }
    },
  });
}

function toggleRead(readinglistId, event) {
  // Prevent card click event
  event.stopPropagation();

  $.ajax({
    url: "/Page/ToggleRead",
    type: "POST",
    data: {
      readingListId: readinglistId,
      __RequestVerificationToken: window.antiForgeryToken || "",
    },
    success: function (response) {
      if (response.success) {
        // Update read status button
        const btn = event.target.closest(".btn-read-status");
        const icon = btn.querySelector("i");

        if (response.isRead) {
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

        // Update card data attribute for filtering
        const card = btn.closest(".book-card");
        card.setAttribute(
          "data-read",
          response.isRead.toString().toLowerCase()
        );

        showAlert(response.message, "success");
      } else {
        showAlert(response.message, "warning");
      }
    },
    error: function (xhr) {
      if (xhr.status === 401 || xhr.status === 403) {
        window.location.href =
          "/Auth/Login?returnUrl=" +
          encodeURIComponent(window.location.pathname + window.location.search);
      } else {
        let errorMessage = "Terjadi error saat memperbarui status baca";
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          if (errorResponse.message) {
            errorMessage = errorResponse.message;
          }
        } catch (e) {
          // Use default message if parsing fails
        }
        showAlert(errorMessage + " (Status: " + xhr.status + ")", "danger");
      }
    },
  });
}

function showAlert(message, type) {
  const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

  // Insert alert at top of container
  $(".reading-list-container").prepend(alertHtml);

  // Auto dismiss after 3 seconds
  setTimeout(function () {
    $(".alert").fadeOut();
  }, 3000);
}

// Initialize tab filtering functionality
document.addEventListener("DOMContentLoaded", function () {
  // Simple Client-side Filter
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
          card.style.display = "block";
          visibleCount++;
        } else {
          card.style.display = "none";
        }
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
});

// Image loading functions (same as in search page)
function handleImageLoad(img) {
  img.classList.add("loaded");
  const timeoutId = img.getAttribute("data-timeout-id");
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  const skeleton = img.parentElement.querySelector(".image-skeleton");
  if (skeleton) {
    skeleton.style.display = "none";
  }
}

function handleImageTimeout(img) {
  const thumbnail = img.parentElement;
  thumbnail.classList.add("timeout");

  const skeleton = thumbnail.querySelector(".image-skeleton");
  const empty = thumbnail.querySelector(".image-empty");

  if (skeleton) skeleton.style.display = "none";
  if (empty) empty.style.display = "flex";
}

// Initialize image loading for existing images
document.addEventListener("DOMContentLoaded", function () {
  const images = document.querySelectorAll(".book-thumbnail img");
  images.forEach((img) => {
    if (img.src && img.src !== "") {
      const timeoutId = setTimeout(() => {
        handleImageTimeout(img);
      }, 3000);

      img.setAttribute("data-timeout-id", timeoutId);

      // Check if image is already loaded
      if (img.complete && img.naturalHeight !== 0) {
        handleImageLoad(img);
      }
    } else {
      handleImageTimeout(img);
    }
  });
});

// --- Offline Support Logic with IndexedDB ---

// Helper: Scrape current reading list from DOM and save to IndexedDB
async function saveReadingListToDB() {
  if (typeof DB === "undefined") return;

  const items = [];
  document.querySelectorAll(".book-card").forEach((card) => {
    const idMatch = card
      .getAttribute("onclick")
      .match(/viewBookDetail\((\d+)\)/); // Assumption: viewBookDetail(bookId) usually correlates, but readingListId is in other buttons.
    // Wait, the buttons use readingListId (e.g. toggleFavorite(@item.Id)). storage needs readingListId key.

    // Let's grab readingListId from one of the buttons
    const btnFav = card.querySelector(".btn-favorite");
    const onclickFav = btnFav ? btnFav.getAttribute("onclick") : "";
    const idMatchFav = onclickFav.match(/toggleFavorite\((\d+)/);

    if (idMatchFav) {
      const id = parseInt(idMatchFav[1]);
      const isFavorite = card.dataset.favorite === "true";
      const isRead = card.dataset.read === "true";
      // We store minimal state needed for offline UI updates or list rendering
      items.push({
        id: id,
        isFavorite: isFavorite,
        isRead: isRead,
        timestamp: Date.now(),
      });
    }
  });

  try {
    const tx = await DB.put("readingList", items); // Actually this puts the array as one object if not careful? No, put needs iteration or use a bulk method if implemented. Our DB util 'put' does single item.
    // Let's refactor to put individual items.
    for (const item of items) {
      await DB.put("readingList", item);
    }
    console.log("Reading list data synced to IndexedDB");
  } catch (e) {
    console.warn("Failed to sync reading list to DB:", e);
  }
}

// Queue an action for offline sync
async function queueAction(actionType, createPayload) {
  if (typeof DB === "undefined") return;

  const payload = createPayload();
  const action = {
    timestamp: Date.now(),
    type: actionType,
    payload: payload,
    synced: false,
  };

  await DB.put("actionQueue", action);
  registerSync();
}

// Register background sync (if supported, otherwise relying on next online reload)
function registerSync() {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.sync.register("sync-reading-list");
      })
      .catch(() => {
        // Fallback: Just hope user reloads when online
        console.log("Background sync not supported or failed");
      });
  }
}

async function processActionQueue() {
  if (typeof DB === "undefined" || !navigator.onLine) return;

  const actions = await DB.getAll("actionQueue");
  if (!actions || actions.length === 0) return;

  console.log(`Processing ${actions.length} offline actions...`);

  for (const action of actions) {
    try {
      // Re-execute action
      if (action.type === "toggleRead") {
        await performAjax("/Page/ToggleRead", action.payload);
      } else if (action.type === "toggleFavorite") {
        await performAjax("/Page/ToggleFavorite", action.payload);
      } else if (action.type === "removeFromReadingList") {
        await performAjax("/Page/RemoveFromReadingList", action.payload);
      }

      // Remove from queue if successful
      await DB.delete("actionQueue", action.timestamp);
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
    $.ajax({
      url: url,
      type: "POST",
      data: data,
      success: resolve,
      error: reject,
    });
  });
}

// --- Modified Event Handlers ---

function removeFromReadingList(readinglistId, event) {
  event.stopPropagation();

  if (
    confirm("Apakah Anda yakin ingin menghapus buku ini dari Reading List?")
  ) {
    if (navigator.onLine) {
      // Original Logic
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
        error: function (xhr) {
          if (xhr.status === 401) window.location.href = "/Auth/Login";
          else showAlert("Gagal menghapus (Online Error)", "danger");
        },
      });
    } else {
      // Offline Logic
      queueAction("removeFromReadingList", () => ({
        readingListId: readinglistId,
        __RequestVerificationToken: window.antiForgeryToken || "",
      }));

      // Optimistic UI update
      removeCardAnimation(event.target);
      showAlert("Permintaan hapus disimpan (Offline Mode)", "info");
    }
  }
}

function toggleFavorite(readinglistId, event) {
  event.stopPropagation();

  const btn = event.target.closest(".btn-favorite");
  const icon = btn.querySelector("i");
  const card = btn.closest(".book-card");
  const isNowFavorite = !btn.classList.contains("active"); // Toggle logic

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
          if (response.isFavorite) {
            btn.classList.add("active");
            btn.title = "Hapus dari Favorit";
            icon.className = "fas fa-heart";
          } else {
            btn.classList.remove("active");
            btn.title = "Tambah ke Favorit";
            icon.className = "far fa-heart";
          }
          card.setAttribute(
            "data-favorite",
            response.isFavorite.toString().toLowerCase()
          );
          showAlert(response.message, "success");
        } else {
          showAlert(response.message, "warning");
        }
      },
      error: errorHandler,
    });
  } else {
    // Offline Logic
    queueAction("toggleFavorite", () => ({
      readingListId: readinglistId,
      __RequestVerificationToken: window.antiForgeryToken || "",
    }));

    // Optimistic UI
    if (isNowFavorite) {
      btn.classList.add("active");
      btn.title = "Hapus dari Favorit";
      icon.className = "fas fa-heart";
      card.setAttribute("data-favorite", "true");
    } else {
      btn.classList.remove("active");
      btn.title = "Tambah ke Favorit";
      icon.className = "far fa-heart";
      card.setAttribute("data-favorite", "false");
    }
    showAlert("Status favorit disimpan offline", "info");
  }
}

function toggleRead(readinglistId, event) {
  event.stopPropagation();
  const btn = event.target.closest(".btn-read-status");
  const isNowRead = btn.classList.contains("unread"); // If it has 'unread' class, we are making it read

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
          updateReadBtnUI(btn, response.isRead);
          const card = btn.closest(".book-card");
          card.setAttribute(
            "data-read",
            response.isRead.toString().toLowerCase()
          );
          showAlert(response.message, "success");
        } else {
          showAlert(response.message, "warning");
        }
      },
      error: errorHandler,
    });
  } else {
    // Offline
    queueAction("toggleRead", () => ({
      readingListId: readinglistId,
      __RequestVerificationToken: window.antiForgeryToken || "",
    }));

    // Optimistic
    updateReadBtnUI(btn, isNowRead);
    const card = btn.closest(".book-card");
    card.setAttribute("data-read", isNowRead.toString().toLowerCase());
    showAlert("Status bacaan disimpan offline", "info");
  }
}

// Helper Helpers
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

function updateReadBtnUI(btn, isRead) {
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

function errorHandler(xhr) {
  if (xhr.status === 401 || xhr.status === 403) {
    window.location.href = "/Auth/Login";
  } else {
    showAlert("Terjadi kesalahan koneksi", "danger");
  }
}

// Initial check for cached books
document.addEventListener("DOMContentLoaded", async function () {
  // Sync the current page for offline use (HTML Cache)
  if (typeof ensureReadingListIsCached !== "undefined")
    ensureReadingListIsCached();

  // Save current data to IDB for future reference
  saveReadingListToDB();

  // Process any pending offline actions
  processActionQueue();

  // Listen for online status
  window.addEventListener("online", processActionQueue);

  // Existing cache check logic
  if ("caches" in window) {
    const bookCards = document.querySelectorAll(".book-card");
    for (const card of bookCards) {
      const onclick = card.getAttribute("onclick");
      const match = onclick?.match(/viewBookDetail\((\d+)\)/);
      if (match) {
        const bookId = match[1];
        if (typeof checkIsCached !== "undefined") {
          const isCached = await checkIsCached(bookId);
          if (isCached) {
            const btn = document.getElementById(`offline-btn-${bookId}`);
            if (btn) btn.classList.add("cached");
            card.classList.add("is-offline");
          }
        }
      }
    }
  }
});

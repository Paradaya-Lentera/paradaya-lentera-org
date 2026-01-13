/**
 * Detail Page Script
 * Book detail page functionality
 */

let isInReadingList = false;

$(document).ready(function () {
  const bookDetail = document.getElementById("bookDetail");
  if (bookDetail) {
    isInReadingList = bookDetail.getAttribute("data-is-in-reading-list") === "true";
  }

  // Mark dynamic data as loaded
  setTimeout(function () {
    $(".dynamic-data").addClass("loaded");
  }, 500);
});

function toggleReadingList(bookId) {
  const btn = document.getElementById("readingListBtn");
  const icon = document.getElementById("readingListIcon");
  const text = document.getElementById("readingListText");

  btn.disabled = true;

  $.ajax({
    url: "/Page/ToggleReadingList",
    type: "POST",
    data: {
      bookId: bookId,
      __RequestVerificationToken: window.antiForgeryToken || "",
    },
    success: function (response) {
      if (response.success) {
        isInReadingList = response.isInReadingList;

        if (isInReadingList) {
          btn.className = "btn-danger w-100 mb-2";
          if (icon) {
            icon.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
          }
          if (text) text.textContent = "Hapus dari Daftar";
          
          // Show success notification for adding to reading list
          if (typeof showReadingListNotification === 'function') {
            showReadingListNotification("Berhasil menambahkan buku ke daftar bacaan!");
          } else if (typeof showBootstrapNotification === 'function') {
            showBootstrapNotification("Berhasil menambahkan buku ke daftar bacaan!", "primary");
          }
        } else {
          btn.className = "btn-primary w-100 mb-2";
          if (icon) {
            icon.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
          }
          if (text) text.textContent = "Tambahkan ke Daftar";
          
          // Show info notification for removing from reading list
          if (typeof showInfoNotification === 'function') {
            showInfoNotification("Buku telah dihapus dari daftar bacaan");
          } else if (typeof showBootstrapNotification === 'function') {
            showBootstrapNotification("Buku telah dihapus dari daftar bacaan", "info");
          }
        }
      } else {
        // Show error notification
        if (typeof showErrorNotification === 'function') {
          showErrorNotification("Gagal mengubah daftar bacaan");
        } else if (typeof showBootstrapNotification === 'function') {
          showBootstrapNotification("Gagal mengubah daftar bacaan", "danger");
        }
      }
    },
    error: function (xhr) {
      if (xhr.status === 401 || xhr.status === 403) {
        window.location.href =
          "/Auth/Login?returnUrl=" + encodeURIComponent(window.location.pathname + window.location.search);
      } else {
        // Show error notification
        if (typeof showErrorNotification === 'function') {
          showErrorNotification("Terjadi error saat memproses permintaan");
        } else if (typeof showBootstrapNotification === 'function') {
          showBootstrapNotification("Terjadi error saat memproses permintaan", "danger");
        }
      }
    },
    complete: function () {
      btn.disabled = false;
    },
  });
}

function toggleFavorite(readingListId) {
  $.post("/Page/ToggleFavorite", {
    readingListId: readingListId,
    __RequestVerificationToken: window.antiForgeryToken || "",
  }).done((res) => {
    if (res.success) {
      const btn = document.getElementById("favoriteBtn");
      btn.innerHTML = res.isFavorite ? "⭐ Favorit" : "☆ Favorit";
    }
  });
}

function toggleRead(readingListId) {
  $.post("/Page/ToggleRead", {
    readingListId: readingListId,
    __RequestVerificationToken: window.antiForgeryToken || "",
  }).done((res) => {
    if (res.success) {
      const btn = document.getElementById("readBtn");
      btn.innerHTML = res.isRead ? "Selesai Dibaca" : "Tandai Belum Dibaca";
    }
  });
}

function toggleSynopsisText() {
  const shortText = document.getElementById("synopsisShort");
  const fullText = document.getElementById("synopsisFull");
  const toggleBtn = document.getElementById("toggleSynopsis");

  if (fullText.style.display === "none") {
    shortText.style.display = "none";
    fullText.style.display = "block";
    toggleBtn.textContent = "Lihat Lebih Sedikit";
  } else {
    shortText.style.display = "block";
    fullText.style.display = "none";
    toggleBtn.textContent = "Lihat Selengkapnya";
  }
}

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
        __RequestVerificationToken: window.antiForgeryToken || ''
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
      __RequestVerificationToken: window.antiForgeryToken || ''
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
      __RequestVerificationToken: window.antiForgeryToken || ''
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

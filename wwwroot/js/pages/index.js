/**
 * Index Page Script
 * Main homepage functionality
 */

let currentFilter = "relevance";
let currentBookSource = "featured";

document.addEventListener("DOMContentLoaded", function () {
  const featuredBooks = new FeaturedBooks();
  featuredBooks.loadFeaturedBooks();

  // Update result count after load
  setTimeout(() => {
    const count = featuredBooks.allBooks.length;
    const resultCount = document.getElementById("resultCount");
    if (resultCount) resultCount.textContent = count;
  }, 1000);

  // Search on Enter
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") performSearch();
    });
  }

  // Filter buttons
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Remove active class from all
      filterBtns.forEach((b) => b.classList.remove("active"));
      // Add active to clicked
      this.classList.add("active");

      currentFilter = this.dataset.filter;

      if (window.lazySearch) {
        window.lazySearch.sortResults(currentFilter);
      }
    });
  });
});

async function performSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchTerm = searchInput?.value.trim();
  if (!searchTerm) return;

  if (!window.lazySearch) {
    console.error("window.lazySearch not available");
    return;
  }

  await window.lazySearch.performSearch(searchTerm);
}

function switchBookSource(source) {
  currentBookSource = source;

  document
    .querySelectorAll(".tab-button")
    .forEach((btn) => btn.classList.remove("active"));
  const activeBtn = document.getElementById(`load-${source}`);
  if (activeBtn) activeBtn.classList.add("active");

  const featuredBooks = new FeaturedBooks();
  if (source === "featured") {
    featuredBooks.loadFeaturedBooks();
  } else if (source === "popular") {
    featuredBooks.loadPopularBooks();
  }

  // Update count
  setTimeout(() => {
    const count = featuredBooks.allBooks.length;
    const resultCount = document.getElementById("resultCount");
    if (resultCount) resultCount.textContent = count;
  }, 1000);
}

function navigateToDetail(url, event) {
  if (event.target.closest("button") || event.target.closest("form")) return;
  window.location.href = url;
}

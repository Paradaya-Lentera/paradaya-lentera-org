let currentFilter = "relevance";
let currentBookSource = "featured";

document.addEventListener("DOMContentLoaded", function () {
  const featuredBooks = new FeaturedBooks();
  featuredBooks.loadFeaturedBooks();

  // Update result count setelah load
  setTimeout(() => {
    const count = featuredBooks.allBooks.length;
    document.getElementById("resultCount").textContent = count;
  }, 1000);

  document
    .getElementById("searchInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        performSearch();
      }
    });
});

async function performSearch() {
  const searchTerm = document.getElementById("searchInput").value.trim();
  if (searchTerm === "") return;

  if (!window.lazySearch) {
    console.error("window.lazySearch tidak tersedia");
    return;
  }

  await window.lazySearch.performSearch(searchTerm);
}

function switchBookSource(source) {
  currentBookSource = source;

  document
    .querySelectorAll(".tab-button")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById(`load-${source}`).classList.add("active");

  const featuredBooks = new FeaturedBooks();
  if (source === "featured") {
    featuredBooks.loadFeaturedBooks();
  } else if (source === "popular") {
    featuredBooks.loadPopularBooks();
  }
  
  // Update count
  setTimeout(() => {
    const count = featuredBooks.allBooks.length;
    document.getElementById("resultCount").textContent = count;
  }, 1000);
}

function navigateToDetail(url, event) {
  if (event.target.closest("button") || event.target.closest("form")) {
    return;
  }
  window.location.href = url;
}
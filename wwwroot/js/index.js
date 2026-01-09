let currentFilter = "relevance";
let currentBookSource = "featured";

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("resultCount").textContent = "0";

  const featuredBooks = new FeaturedBooks();
  featuredBooks.loadFeaturedBooks();

  document
    .getElementById("searchInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        performSearch();
      }
    });
});

async function performSearch() {
  console.log("performSearch dipanggil");
  const searchTerm = document.getElementById("searchInput").value.trim();
  console.log("Kata pencarian:", searchTerm);
  
  if (searchTerm === "") return;

  if (!window.lazySearch) {
    console.error("window.lazySearch tidak tersedia");
    return;
  }

  console.log("✅ Calling lazySearch.performSearch...");
  await window.lazySearch.performSearch(searchTerm);
  console.log("✅ lazySearch.performSearch completed");
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
}

function navigateToDetail(url, event) {
  if (event.target.closest("button") || event.target.closest("form")) {
    return;
  }

  window.location.href = url;
}

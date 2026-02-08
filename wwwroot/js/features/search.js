/**
 * Search Feature Module
 * Handles book search with lazy loading and pagination
 */

class LazySearch {
  constructor() {
    this.currentSearchTerm = "";
    this.isLoading = false;
    this.allSearchResults = [];
    this.currentPage = 1;
    this.itemsPerPage = 9;
  }

  getBooksGrid() {
    return document.getElementById("booksGrid");
  }

  getResultCount() {
    return document.getElementById("resultCount");
  }

  getFeaturedBooksSection() {
    return document.getElementById("featuredBooksSection");
  }

  async performSearch(searchTerm) {
    if (!searchTerm.trim()) return;

    this.currentSearchTerm = searchTerm.trim();
    this.isLoading = false;
    this.currentPage = 1;

    const booksGrid = this.getBooksGrid();
    const resultCount = this.getResultCount();
    const featuredBooksSection = this.getFeaturedBooksSection();

    if (!booksGrid || !resultCount || !featuredBooksSection) {
      console.error("Required DOM elements not found");
      return;
    }

    featuredBooksSection.style.display = "none";
    booksGrid.style.display = "grid";

    // Hide featured pagination
    const featuredPagination = document.getElementById("paginationWrapper");
    if (featuredPagination) {
      featuredPagination.style.display = "none";
    }

    booksGrid.innerHTML = `
      <div class="loading-container w-100">
        <lottie-player 
          src="/images/loading.json" 
          background="transparent" 
          speed="1" 
          style="width: 250px; height: 250px;" 
          loop 
          autoplay>
        </lottie-player>
        <p class="loading-text">Menyiapkan buku pilihan untukmu...</p>
      </div>`;

    try {
      const response = await fetch(
        `/Search/SearchApi?q=${encodeURIComponent(searchTerm)}&page=1&limit=100`
      );
      const data = await response.json();

      if (data && data.docs && data.docs.length > 0) {
        this.allSearchResults = data.docs.map((doc, index) => ({
          ...doc,
          originalIndex: index,
        }));
        console.log(`🔍 Found ${this.allSearchResults.length} books`);

        booksGrid.innerHTML = "";
        this.renderPage(1);

        resultCount.textContent = data.docs.length.toString();
      } else {
        booksGrid.innerHTML =
          '<p class="text-center w-100 py-5 text-gray-400">Tidak ada buku yang ditemukan.</p>';
        resultCount.textContent = "0";
        this.hidePagination();
      }
    } catch (error) {
      console.error("Search error:", error);
      booksGrid.innerHTML =
        '<p class="text-center w-100 py-5 text-danger">Error koneksi ke Open Library API.</p>';
      resultCount.textContent = "0";
      this.hidePagination();
    }
  }

  renderPage(page) {
    this.currentPage = page;
    const booksGrid = this.getBooksGrid();

    if (!booksGrid) return;

    booksGrid.innerHTML = "";

    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const booksToShow = this.allSearchResults.slice(start, end);

    console.log(
      `📄 Search Page ${page}: showing ${start + 1}-${Math.min(
        end,
        this.allSearchResults.length
      )} of ${this.allSearchResults.length}`
    );

    this.displayBooks(booksToShow);
    this.renderPagination();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  displayBooks(docs) {
    const isAuthenticated = window.isUserAuthenticated || false;
    const booksGrid = this.getBooksGrid();

    if (!booksGrid) return;

    docs.forEach((book) => {
      const bookCard = this.createBookCard(book, isAuthenticated);
      booksGrid.appendChild(bookCard);
    });
  }

  renderPagination() {
    const totalPages = Math.ceil(
      this.allSearchResults.length / this.itemsPerPage
    );

    let wrapper = document.getElementById("searchPaginationWrapper");

    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = "searchPaginationWrapper";
      wrapper.className = "pagination-wrapper";
      wrapper.innerHTML = `
        <button id="searchPrevPage">
          <span class="pagination-arrow">←</span>
          <span class="pagination-label">Prev</span>
        </button>
        <span id="searchPageInfo"></span>
        <button id="searchNextPage">
          <span class="pagination-label">Next</span>
          <span class="pagination-arrow">→</span>
        </button>
      `;

      const booksContainer = document.querySelector(".books-container");
      if (booksContainer) {
        booksContainer.appendChild(wrapper);
      }
    }

    const pageInfo = document.getElementById("searchPageInfo");
    const prevBtn = document.getElementById("searchPrevPage");
    const nextBtn = document.getElementById("searchNextPage");

    if (!pageInfo || !prevBtn || !nextBtn) return;

    if (totalPages > 1) {
      wrapper.style.display = "flex";
      pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;

      prevBtn.disabled = this.currentPage === 1;
      nextBtn.disabled = this.currentPage === totalPages;

      const newPrevBtn = prevBtn.cloneNode(true);
      const newNextBtn = nextBtn.cloneNode(true);
      prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
      nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

      newPrevBtn.onclick = () => {
        if (this.currentPage > 1) this.renderPage(this.currentPage - 1);
      };

      newNextBtn.onclick = () => {
        if (this.currentPage < totalPages)
          this.renderPage(this.currentPage + 1);
      };
    } else {
      wrapper.style.display = "none";
    }
  }

  hidePagination() {
    const wrapper = document.getElementById("searchPaginationWrapper");
    if (wrapper) wrapper.style.display = "none";
  }

  createBookCard(book, isAuthenticated) {
    const author = book.author_name?.[0] || "Penulis Tidak Diketahui";
    const year = book.first_publish_year || "N/A";
    const coverUrl = book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
      : `https://via.placeholder.com/160x240?text=No+Cover`;

    const isbn = book.isbn?.[0] || "";
    const olKey = book.key?.replace("/works/", "") || "";

    let detailUrl = "#";
    if (isbn) {
      detailUrl = `/Page/Detail?isbn=${encodeURIComponent(isbn)}`;
    } else if (olKey) {
      detailUrl = `/Page/Detail?olkey=${encodeURIComponent(olKey)}`;
    }

    const category = this.determineCategory(book.title);
    const description =
      book.subtitle ||
      `Diterbitkan tahun ${year}${
        book.number_of_pages_median
          ? `, ${book.number_of_pages_median} halaman`
          : ""
      }`;

    const cardDiv = document.createElement("div");
    cardDiv.className = "book-card";
    cardDiv.setAttribute("data-isbn", isbn);
    cardDiv.onclick = (event) => navigateToDetail(detailUrl, event);

    const actionButton = isAuthenticated
      ? this.createAddToListForm(book, author, coverUrl, isbn)
      : this.createLoginButton();

    cardDiv.innerHTML = `
      <div class="book-thumbnail">
        <div class="image-skeleton"></div>
        <div class="image-empty"></div>
        <img src="${coverUrl}" alt="${book.title}" loading="lazy"
             onload="handleImageLoad(this)" onerror="handleImageTimeout(this)" data-timeout-id="">
      </div>
      <div class="book-info">
        <div class="book-category">${category}</div>
        <h3 class="book-title">${book.title}</h3>
        <p class="book-author">${author} • ${year}</p>
        <p class="book-description">${description}</p>
        ${actionButton}
      </div>
    `;

    // Setup image timeout
    const img = cardDiv.querySelector("img");
    if (img?.src) {
      const timeoutId = setTimeout(() => handleImageTimeout(img), 3000);
      img.setAttribute("data-timeout-id", timeoutId);
    }

    return cardDiv;
  }

  determineCategory(title) {
    const t = (title || "").toLowerCase();
    if (
      t.includes("harry potter") ||
      t.includes("hobbit") ||
      t.includes("fantasy")
    )
      return "FANTASY";
    if (t.includes("1984") || t.includes("gatsby") || t.includes("classic"))
      return "CLASSIC";
    if (t.includes("fiction") || t.includes("pride")) return "FICTION";
    if (t.includes("programming") || t.includes("computer")) return "EDUCATION";
    if (t.includes("dune") || t.includes("sci-fi")) return "SCI-FI";
    return "GENERAL";
  }

  createAddToListForm(book, author, coverUrl, isbn) {
    const token = window.antiForgeryToken || "";
    const currentLang = window.LanguageSwitcher ? window.LanguageSwitcher.getLanguage() : 'en';
    const buttonText = currentLang === 'id' ? 'Tambah ke Daftar Bacaan' : 'Add to Reading List';
    return `
      <form action="/Search/AddToReadingList" method="post" style="display:inline;" onclick="event.stopPropagation();">
        <input type="hidden" name="__RequestVerificationToken" value="${token}" />
        <input type="hidden" name="title" value="${book.title.replace(
          /"/g,
          "&quot;"
        )}" />
        <input type="hidden" name="author" value="${author.replace(
          /"/g,
          "&quot;"
        )}" />
        <input type="hidden" name="thumbnail" value="${coverUrl}" />
        <input type="hidden" name="year" value="${
          book.first_publish_year || 0
        }" />
        <input type="hidden" name="pages" value="${
          book.number_of_pages_median || 0
        }" />
        <input type="hidden" name="isbn" value="${isbn}" />
        <button type="submit" class="add-to-list">${buttonText}</button>
      </form>
    `;
  }

  createLoginButton() {
    const returnUrl = encodeURIComponent(
      window.location.pathname + window.location.search
    );
    const currentLang = window.LanguageSwitcher ? window.LanguageSwitcher.getLanguage() : 'en';
    const buttonText = currentLang === 'id' ? 'Login untuk Menambahkan' : 'Login to Add';
    return `
      <a href="/Auth/Login?returnUrl=${returnUrl}" class="add-to-list"
         style="text-decoration: none; display: inline-block; text-align: center;"
         onclick="event.stopPropagation();">
        ${buttonText}
      </a>
    `;
  }

  clearSearch() {
    this.allSearchResults = [];
    this.currentPage = 1;
    this.hidePagination();

    const booksGrid = this.getBooksGrid();
    const featuredBooksSection = this.getFeaturedBooksSection();

    if (booksGrid) booksGrid.style.display = "none";
    if (featuredBooksSection) featuredBooksSection.style.display = "block";

    const featuredPagination = document.getElementById("paginationWrapper");
    if (featuredPagination) featuredPagination.style.display = "flex";
  }

  sortResults(criteria) {
    if (!this.allSearchResults || this.allSearchResults.length === 0) return;

    console.log(`Sorting results by: ${criteria}`);

    switch (criteria) {
      case "date":
        this.allSearchResults.sort((a, b) => {
          const yearA = a.first_publish_year || 0;
          const yearB = b.first_publish_year || 0;
          return yearB - yearA; // Newest first
        });
        break;
      case "title":
        this.allSearchResults.sort((a, b) => {
          return (a.title || "").localeCompare(b.title || "");
        });
        break;
      case "relevance":
      default:
        // Revert to original order (Open Library's relevance)
        this.allSearchResults.sort((a, b) => a.originalIndex - b.originalIndex);
        break;
    }

    // Reset to page 1
    this.renderPage(1);
  }
}

// Initialize global instance
window.lazySearch = new LazySearch();

// Listen for language changes and update "Add to Reading List" buttons
document.addEventListener('languageChanged', (e) => {
  const lang = e.detail.language;
  // Update all "Add to Reading List" buttons
  const addToListButtons = document.querySelectorAll('.add-to-list');
  const addToListTextId = 'Tambah ke Daftar Bacaan';
  const addToListTextEn = 'Add to Reading List';
  const loginTextId = 'Login untuk Menambahkan';
  const loginTextEn = 'Login to Add';

  addToListButtons.forEach(btn => {
    const href = btn.getAttribute('href');
    // Check if it's a login link or a submit button
    if (href && href.includes('/Auth/Login')) {
      btn.textContent = lang === 'id' ? loginTextId : loginTextEn;
    } else {
      btn.textContent = lang === 'id' ? addToListTextId : addToListTextEn;
    }
  });
});


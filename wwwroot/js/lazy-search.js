// Fungsi Pencarian dengan Lazy Loading dan Pagination
class LazySearch {
  constructor() {
    this.currentSearchTerm = "";
    this.isLoading = false;
    this.allSearchResults = []; // Simpan semua hasil search
    this.currentPage = 1;
    this.itemsPerPage = 9;
    this.initializeDOMElements();
  }

  initializeDOMElements() {
    this.getBooksGrid = () => document.getElementById("booksGrid");
    this.getResultCount = () => document.getElementById("resultCount");
    this.getFeaturedBooksSection = () =>
      document.getElementById("featuredBooksSection");
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
      console.error(
        "Elemen DOM yang diperlukan untuk pencarian tidak ditemukan"
      );
      return;
    }

    featuredBooksSection.style.display = "none";
    booksGrid.style.display = "grid";

    // Sembunyikan featured pagination
    const featuredPagination = document.getElementById("paginationWrapper");
    if (featuredPagination) {
      featuredPagination.style.display = "none";
    }

    booksGrid.innerHTML =
      '<div class="text-center w-100 py-5"><div class="spinner-border text-primary"></div><p class="text-white mt-3">Mencari di Open Library...</p></div>';

    try {
     const response = await fetch(
  `/Search/SearchApi?q=${encodeURIComponent(searchTerm)}&page=1&limit=100`
);
      const data = await response.json();

      if (data && data.docs && data.docs.length > 0) {
        this.allSearchResults = data.docs;
        console.log(`🔍 Found ${this.allSearchResults.length} books`);
        
        booksGrid.innerHTML = "";
        this.renderPage(1);

        resultCount.textContent = data.docs.length.toString();
      } else {
        booksGrid.innerHTML =
          '<p class="text-center w-100 py-5 text-gray-400">Tidak ada buku yang ditemukan untuk pencarian ini.</p>';
        resultCount.textContent = "0";
        this.hidePagination();
      }
    } catch (error) {
      console.error("Error saat mencari buku:", error);
      booksGrid.innerHTML =
        '<p class="text-center w-100 py-5 text-danger">Error koneksi ke Open Library API.</p>';
      resultCount.textContent = "0";
      this.hidePagination();
    }
  }

  renderPage(page) {
    this.currentPage = page;
    const booksGrid = this.getBooksGrid();
    
    if (!booksGrid) {
      console.error("Elemen grid buku tidak ditemukan");
      return;
    }

    // Clear grid
    booksGrid.innerHTML = "";

    // Hitung buku yang akan ditampilkan
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const booksToShow = this.allSearchResults.slice(start, end);

    console.log(`📄 Search Page ${page}: showing ${start + 1}-${Math.min(end, this.allSearchResults.length)} of ${this.allSearchResults.length}`);
    console.log(`🔢 Start: ${start}, End: ${end}, Books to show:`, booksToShow.length);
    console.log(`📚 First book on this page:`, booksToShow[0]?.title);
    console.log(`📚 Last book on this page:`, booksToShow[booksToShow.length - 1]?.title);

    // Render buku
    this.displayBooks(booksToShow);

    // Render pagination
    this.renderPagination();

    // Scroll ke atas
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  displayBooks(docs) {
    const isAuthenticated = window.isUserAuthenticated || false;
    const booksGrid = this.getBooksGrid();

    if (!booksGrid) {
      console.error("Elemen grid buku tidak ditemukan");
      return;
    }

    docs.forEach((book) => {
      const bookCard = this.createBookCard(book, isAuthenticated);
      booksGrid.appendChild(bookCard);
    });
  }

  renderPagination() {
    const totalPages = Math.ceil(this.allSearchResults.length / this.itemsPerPage);

    // GUNAKAN ID BERBEDA untuk search pagination
    let wrapper = document.getElementById("searchPaginationWrapper");

    // Jika tidak ada, buat baru
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = "searchPaginationWrapper";
      wrapper.className = "pagination-wrapper";
      wrapper.innerHTML = `
        <button id="searchPrevPage">← Prev</button>
        <span id="searchPageInfo"></span>
        <button id="searchNextPage">Next →</button>
      `;

      // Tambahkan setelah books-container
      const booksContainer = document.querySelector(".books-container");
      if (booksContainer) {
        booksContainer.appendChild(wrapper);
      }
    }

    const pageInfo = document.getElementById("searchPageInfo");
    const prevBtn = document.getElementById("searchPrevPage");
    const nextBtn = document.getElementById("searchNextPage");

    if (!pageInfo || !prevBtn || !nextBtn) {
      console.error("❌ Elemen pagination tidak lengkap!");
      return;
    }

    // Tampilkan pagination hanya jika lebih dari 1 halaman
    if (totalPages > 1) {
      wrapper.style.display = "flex";
      pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;

      prevBtn.disabled = this.currentPage === 1;
      nextBtn.disabled = this.currentPage === totalPages;

      // Setup event listeners (hapus listener lama dulu)
      const newPrevBtn = prevBtn.cloneNode(true);
      const newNextBtn = nextBtn.cloneNode(true);
      prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
      nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

      newPrevBtn.onclick = () => {
        if (this.currentPage > 1) {
          this.renderPage(this.currentPage - 1);
        }
      };

      newNextBtn.onclick = () => {
        if (this.currentPage < totalPages) {
          this.renderPage(this.currentPage + 1);
        }
      };

      console.log(`✅ Search Pagination: page ${this.currentPage}/${totalPages}`);
    } else {
      wrapper.style.display = "none";
      console.log(`ℹ️ Search Pagination hidden: only ${this.allSearchResults.length} results`);
    }
  }

  hidePagination() {
    const wrapper = document.getElementById("searchPaginationWrapper");
    if (wrapper) {
      wrapper.style.display = "none";
    }
  }

  createBookCard(book, isAuthenticated) {
    const author =
      book.author_name && book.author_name.length > 0
        ? book.author_name[0]
        : "Penulis Tidak Diketahui";
    const year = book.first_publish_year || "N/A";
    const coverUrl = book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
      : `https://via.placeholder.com/160x240?text=No+Cover`;

    const isbn = book.isbn && book.isbn.length > 0 ? book.isbn[0] : "";
    const olKey = book.key ? book.key.replace("/works/", "") : "";

    let detailUrl = "";
    if (isbn) {
      detailUrl = `/Page/Detail?isbn=${encodeURIComponent(isbn)}`;
    } else if (olKey) {
      detailUrl = `/Page/Detail?olkey=${encodeURIComponent(olKey)}`;
    } else {
      detailUrl = "#";
    }

    let category = "GENERAL";
    const title = book.title.toLowerCase();
    if (
      title.includes("harry potter") ||
      title.includes("hobbit") ||
      title.includes("lord of the rings") ||
      title.includes("fantasy")
    ) {
      category = "FANTASY";
    } else if (
      title.includes("1984") ||
      title.includes("gatsby") ||
      title.includes("mockingbird") ||
      title.includes("classic")
    ) {
      category = "CLASSIC";
    } else if (
      title.includes("pride") ||
      title.includes("catcher") ||
      title.includes("fiction")
    ) {
      category = "FICTION";
    } else if (
      title.includes("clean code") ||
      title.includes("programming") ||
      title.includes("computer")
    ) {
      category = "EDUCATION";
    } else if (
      title.includes("dune") ||
      title.includes("science fiction") ||
      title.includes("sci-fi")
    ) {
      category = "SCI-FI";
    }

    const description =
      book.subtitle ||
      `Diterbitkan tahun ${year}${
        book.number_of_pages_median
          ? `, ${book.number_of_pages_median} halaman`
          : ""
      }. ${
        book.publisher ? `Diterbitkan oleh ${book.publisher[0]}.` : ""
      }`.trim();

    const cardDiv = document.createElement("div");
    cardDiv.className = "book-card";
    cardDiv.setAttribute("data-isbn", isbn);
    cardDiv.onclick = (event) => this.navigateToDetail(detailUrl, event);

    let actionButton = "";
    if (isAuthenticated) {
      const token = window.antiForgeryToken || "";
      actionButton = `
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
            <button type="submit" class="add-to-list">
                Tambah ke Daftar Bacaan
            </button>
        </form>
    `;
    } else {
      actionButton = `
                <a href="/Auth/Login?returnUrl=${encodeURIComponent(
                  window.location.pathname + window.location.search
                )}" class="add-to-list" style="text-decoration: none; display: inline-block; text-align: center;" onclick="event.stopPropagation();">
                    Login untuk Menambahkan
                </a>
            `;
    }

    cardDiv.innerHTML = `
            <div class="book-thumbnail">
                <div class="image-skeleton"></div>
                <div class="image-empty"></div>
                <img src="${coverUrl}" 
                     alt="${book.title}" 
                     loading="lazy"
                     onload="handleImageLoad(this)"
                     onerror="handleImageTimeout(this)"
                     data-timeout-id="">
            </div>
            <div class="book-info">
                <div class="book-category">${category}</div>
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${author} • ${year}</p>
                <p class="book-description">${description}</p>
                ${actionButton}
            </div>
        `;

    const img = cardDiv.querySelector("img");
    if (img && img.src && img.src !== "") {
      const timeoutId = setTimeout(() => {
        handleImageTimeout(img);
      }, 3000);

      img.setAttribute("data-timeout-id", timeoutId);
    } else {
      handleImageTimeout(img);
    }

    return cardDiv;
  }

  navigateToDetail(url, event) {
    if (event.target.closest("button") || event.target.closest("form")) {
      return;
    }

    window.location.href = url;
  }

  // Method untuk clear search dan kembali ke featured
  clearSearch() {
    this.allSearchResults = [];
    this.currentPage = 1;
    this.hidePagination();
    
    const booksGrid = this.getBooksGrid();
    const featuredBooksSection = this.getFeaturedBooksSection();
    
    if (booksGrid) booksGrid.style.display = "none";
    if (featuredBooksSection) featuredBooksSection.style.display = "block";
    
    // Tampilkan kembali featured pagination
    const featuredPagination = document.getElementById("paginationWrapper");
    if (featuredPagination) {
      featuredPagination.style.display = "flex";
    }
  }
}

window.lazySearch = new LazySearch();
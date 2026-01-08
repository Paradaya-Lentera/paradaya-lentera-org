// Fungsi Pencarian dengan Lazy Loading
class LazySearch {
  constructor() {
    this.currentSearchTerm = "";
    this.isLoading = false;
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

    booksGrid.innerHTML =
      '<div class="text-center w-100 py-5"><div class="spinner-border text-primary"></div><p class="text-white mt-3">Mencari di Open Library...</p></div>';

    try {
      const response = await fetch(
        `/Search/SearchApi?q=${encodeURIComponent(searchTerm)}&page=1&limit=50`
      );
      const data = await response.json();

      if (data && data.docs && data.docs.length > 0) {
        booksGrid.innerHTML = "";
        this.displayBooks(data.docs);

        resultCount.textContent = data.docs.length.toString();
      } else {
        booksGrid.innerHTML =
          '<p class="text-center w-100 py-5 text-gray-400">Tidak ada buku yang ditemukan untuk pencarian ini.</p>';
        resultCount.textContent = "0";
      }
    } catch (error) {
      console.error("Error saat mencari buku:", error);
      booksGrid.innerHTML =
        '<p class="text-center w-100 py-5 text-danger">Error koneksi ke Open Library API.</p>';
      resultCount.textContent = "0";
    }
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
}

window.lazySearch = new LazySearch();

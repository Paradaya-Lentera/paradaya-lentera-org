class FeaturedBooks {
  constructor() {
    this.container = document.getElementById("featuredBooksGrid");
    this.loadingElement = document.getElementById("loading-featured");
    this.allBooks = []; // Simpan semua buku
    this.currentPage = 1;
    this.itemsPerPage = 9; // 9 buku per halaman (3 baris x 3 kolom)
  }

  async loadFeaturedBooks() {
    try {
      this.showLoading();

      const response = await fetch("/data/featured-books.json");
      const data = await response.json();

      this.allBooks = data.featured_books || [];
      console.log(`✅ Loaded ${this.allBooks.length} featured books`);
      
      this.renderBooksWithPagination(1);
      this.hideLoading();
    } catch (error) {
      console.error("Error loading featured books:", error);
      this.showError();
    }
  }

  async loadFeaturedBooksFromAPI() {
    try {
      this.showLoading();

      const response = await fetch("/Search/GetFeaturedBooks");
      const data = await response.json();

      this.allBooks = data.featured_books || [];
      console.log(`✅ Loaded ${this.allBooks.length} featured books from API`);
      
      this.renderBooksWithPagination(1);
      this.hideLoading();
    } catch (error) {
      console.error("Error loading featured books dari API:", error);
      this.showError();
    }
  }

  async loadPopularBooks() {
    try {
      this.showLoading();

      const response = await fetch("/Search/GetPopularBooks");
      const data = await response.json();

      this.allBooks = data.popular_books || [];
      console.log(`✅ Loaded ${this.allBooks.length} popular books`);
      
      this.renderBooksWithPagination(1);
      this.hideLoading();
    } catch (error) {
      console.error("Error loading buku populer:", error);
      this.showError();
    }
  }

  renderBooksWithPagination(page) {
    this.currentPage = page;
    
    // Hitung buku yang akan ditampilkan
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const booksToShow = this.allBooks.slice(start, end);
    
    console.log(`📄 Page ${page}: showing books ${start + 1}-${Math.min(end, this.allBooks.length)} of ${this.allBooks.length}`);
    
    // Render buku
    this.renderBooks(booksToShow);
    
    // Render pagination
    this.renderPagination();
  }

  renderBooks(books) {
    if (!this.container) return;

    const booksHTML = books
      .map((book) => {
        let category = "GENERAL";
        const title = book.title.toLowerCase();
        if (
          title.includes("harry potter") ||
          title.includes("hobbit") ||
          title.includes("lord of the rings")
        ) {
          category = "FANTASY";
        } else if (
          title.includes("1984") ||
          title.includes("gatsby") ||
          title.includes("mockingbird")
        ) {
          category = "CLASSIC";
        } else if (title.includes("pride") || title.includes("catcher")) {
          category = "FICTION";
        } else if (title.includes("clean code")) {
          category = "EDUCATION";
        } else if (title.includes("dune")) {
          category = "SCI-FI";
        }

        const detailUrl = `/Page/Detail?isbn=${encodeURIComponent(book.isbn)}`;

        return `
                <div class="book-card" data-isbn="${
                  book.isbn
                }" onclick="navigateToDetail('${detailUrl}', event)">
                    <div class="book-thumbnail">
                        <div class="image-skeleton"></div>
                        <div class="image-empty"></div>
                        <img src="${book.thumbnail || ""}" 
                             alt="${book.title}" 
                             loading="lazy"
                             onload="handleImageLoad(this)"
                             onerror="handleImageTimeout(this)"
                             data-timeout-id="">
                    </div>
                    <div class="book-info">
                        <div class="book-category">${category}</div>
                        <h3 class="book-title">${book.title}</h3>
                        <p class="book-author">${book.author} • ${book.year}</p>
                        <p class="book-description">${book.description}</p>
                        <form action="/Search/AddToReadingList" method="post" style="display:inline;" onclick="event.stopPropagation();">
                            <input type="hidden" name="__RequestVerificationToken" value="${window.antiForgeryToken || ''}" />
                            <input type="hidden" name="title" value="${book.title.replace(
                              /"/g,
                              "&quot;"
                            )}" />
                            <input type="hidden" name="author" value="${book.author.replace(
                              /"/g,
                              "&quot;"
                            )}" />
                            <input type="hidden" name="thumbnail" value="${
                              book.thumbnail
                            }" />
                            <input type="hidden" name="year" value="${
                              book.year
                            }" />
                            <input type="hidden" name="pages" value="${
                              book.pages
                            }" />
                            <input type="hidden" name="isbn" value="${
                              book.isbn
                            }" />
                            <button type="submit" class="add-to-list">
                                Add to Reading List
                            </button>
                        </form>
                    </div>
                </div>
            `;
      })
      .join("");

    this.container.innerHTML = booksHTML;

    const images = this.container.querySelectorAll("img");
    images.forEach((img) => {
      if (img.src && img.src !== "") {
        const timeoutId = setTimeout(() => {
          handleImageTimeout(img);
        }, 3000);

        img.setAttribute("data-timeout-id", timeoutId);
      } else {
        handleImageTimeout(img);
      }
    });
  }

  renderPagination() {
    const totalPages = Math.ceil(this.allBooks.length / this.itemsPerPage);
    
    // Cari atau buat elemen pagination
    let wrapper = document.getElementById("paginationWrapper");
    
    // Jika tidak ada, buat baru
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = "paginationWrapper";
      wrapper.className = "pagination-wrapper";
      wrapper.innerHTML = `
        <button id="prevPage">← Prev</button>
        <span id="pageInfo"></span>
        <button id="nextPage">Next →</button>
      `;
      
      // Tambahkan setelah featuredBooksGrid
      const section = document.querySelector(".featured-books-section");
      if (section) {
        section.appendChild(wrapper);
      }
    }
    
    const pageInfo = document.getElementById("pageInfo");
    const prevBtn = document.getElementById("prevPage");
    const nextBtn = document.getElementById("nextPage");
    
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
          this.renderBooksWithPagination(this.currentPage - 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };
      
      newNextBtn.onclick = () => {
        if (this.currentPage < totalPages) {
          this.renderBooksWithPagination(this.currentPage + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };
      
      console.log(`✅ Pagination: page ${this.currentPage}/${totalPages} (${this.allBooks.length} books, ${this.itemsPerPage} per page)`);
    } else {
      wrapper.style.display = "none";
      console.log(`ℹ️ Pagination hidden: only ${this.allBooks.length} books`);
    }
  }

  showLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = "block";
    }
    if (this.container) {
      this.container.innerHTML =
        '<div class="loading">Memuat buku unggulan...</div>';
    }
  }

  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = "none";
    }
  }

  showError() {
    if (this.container) {
      this.container.innerHTML =
        '<div class="error">Gagal memuat buku unggulan</div>';
    }
    this.hideLoading();
  }
}

function navigateToDetail(url, event) {
  if (event.target.closest("button") || event.target.closest("form")) {
    return;
  }

  window.location.href = url;
}

function handleImageLoad(img) {
  const timeoutId = img.getAttribute("data-timeout-id");
  if (timeoutId) {
    clearTimeout(parseInt(timeoutId));
  }

  img.classList.add("loaded");
  img.style.opacity = "1";
}

function handleImageTimeout(img) {
  const timeoutId = img.getAttribute("data-timeout-id");
  if (timeoutId) {
    clearTimeout(parseInt(timeoutId));
  }

  const thumbnail = img.parentElement;
  if (thumbnail) {
    thumbnail.classList.add("timeout");
    img.style.display = "none";
  }
}
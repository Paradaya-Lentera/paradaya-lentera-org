class FeaturedBooks {
  constructor() {
    this.container = document.getElementById("featuredBooksGrid");
    this.loadingElement = document.getElementById("loading-featured");
    this.allBooks = [];
    this.currentPage = 1;
    this.itemsPerPage = 9;
    this.currentSource = "api"; // Track apakah dari API atau JSON
  }

  async loadFeaturedBooks() {
    try {
      this.showLoading();

      // PRIORITAS 1: Load dari API (100+ buku dari berbagai kategori)
      console.log("🌐 Loading initial books from API...");
      const response = await fetch("/Search/GetInitialBooks");
      
      if (!response.ok) throw new Error("API request failed");
      
      const data = await response.json();

      if (data.featured_books && data.featured_books.length > 0) {
        this.allBooks = data.featured_books;
        this.currentSource = data.source || "api";
        console.log(`✅ Loaded ${this.allBooks.length} books from ${this.currentSource.toUpperCase()}`);
        
        if (data.categories) {
          console.log(`📚 Categories: ${data.categories.join(", ")}`);
        }
        
        this.renderBooksWithPagination(1);
        this.hideLoading();
        return;
      }
      
      // Jika API return kosong, fallback ke JSON
      throw new Error("API returned empty results");
      
    } catch (error) {
      console.warn("⚠️ API failed, falling back to JSON:", error.message);
      await this.loadFromJSON();
    }
  }

  async loadFromJSON() {
    try {
      this.showLoading();
      
      console.log("📁 Loading books from JSON fallback...");
      const response = await fetch("/data/featured-books.json");
      const data = await response.json();

      this.allBooks = data.featured_books || [];
      this.currentSource = "json";
      console.log(`✅ Loaded ${this.allBooks.length} books from JSON (offline mode)`);
      
      this.renderBooksWithPagination(1);
      this.hideLoading();
    } catch (error) {
      console.error("❌ Failed to load books from JSON:", error);
      this.showError();
    }
  }

  async loadFeaturedBooksFromAPI() {
    // Sama seperti loadFeaturedBooks (untuk backward compatibility)
    await this.loadFeaturedBooks();
  }

  async loadPopularBooks() {
    try {
      this.showLoading();

      console.log("🔥 Loading popular books from API...");
      const response = await fetch("/Search/GetPopularBooks");
      const data = await response.json();

      this.allBooks = data.popular_books || [];
      this.currentSource = "popular";
      console.log(`✅ Loaded ${this.allBooks.length} popular books`);
      
      this.renderBooksWithPagination(1);
      this.hideLoading();
    } catch (error) {
      console.error("Error loading popular books:", error);
      this.showError();
    }
  }

  renderBooksWithPagination(page) {
    this.currentPage = page;
    
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const booksToShow = this.allBooks.slice(start, end);
    
    console.log(`📄 Featured Page ${page}: showing books ${start + 1}-${Math.min(end, this.allBooks.length)} of ${this.allBooks.length} (${this.currentSource})`);
    
    this.renderBooks(booksToShow);
    this.renderPagination();
  }

  renderBooks(books) {
    if (!this.container) return;

    const booksHTML = books
      .map((book) => {
        let category = this.determineCategory(book);
        const detailUrl = `/Page/Detail?isbn=${encodeURIComponent(book.isbn)}`;

        return `
                <div class="book-card" data-isbn="${book.isbn}" onclick="navigateToDetail('${detailUrl}', event)">
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
                        <p class="book-description">${book.description || ''}</p>
                        <form action="/Search/AddToReadingList" method="post" style="display:inline;" onclick="event.stopPropagation();">
                            <input type="hidden" name="__RequestVerificationToken" value="${window.antiForgeryToken || ''}" />
                            <input type="hidden" name="title" value="${book.title.replace(/"/g, "&quot;")}" />
                            <input type="hidden" name="author" value="${book.author.replace(/"/g, "&quot;")}" />
                            <input type="hidden" name="thumbnail" value="${book.thumbnail}" />
                            <input type="hidden" name="year" value="${book.year}" />
                            <input type="hidden" name="pages" value="${book.pages}" />
                            <input type="hidden" name="isbn" value="${book.isbn}" />
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

  determineCategory(book) {
    // Cek dari category yang ada (dari API)
    if (book.category) {
      const cat = book.category.toLowerCase();
      if (cat.includes("fiction")) return "FICTION";
      if (cat.includes("fantasy")) return "FANTASY";
      if (cat.includes("science")) return "SCI-FI";
      if (cat.includes("mystery") || cat.includes("thriller")) return "MYSTERY";
      if (cat.includes("romance")) return "ROMANCE";
      if (cat.includes("classic")) return "CLASSIC";
      if (cat.includes("programming") || cat.includes("business")) return "EDUCATION";
      if (cat.includes("bestseller")) return "BESTSELLER";
    }

    // Fallback: detect dari title
    const title = (book.title || "").toLowerCase();
    if (title.includes("harry potter") || title.includes("hobbit") || title.includes("lord of the rings")) {
      return "FANTASY";
    } else if (title.includes("1984") || title.includes("gatsby") || title.includes("mockingbird")) {
      return "CLASSIC";
    } else if (title.includes("pride") || title.includes("catcher")) {
      return "FICTION";
    } else if (title.includes("clean code") || title.includes("programming")) {
      return "EDUCATION";
    } else if (title.includes("dune")) {
      return "SCI-FI";
    }
    
    return "GENERAL";
  }

  renderPagination() {
    const totalPages = Math.ceil(this.allBooks.length / this.itemsPerPage);
    
    let wrapper = document.getElementById("paginationWrapper");
    
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = "paginationWrapper";
      wrapper.className = "pagination-wrapper";
      wrapper.innerHTML = `
        <button id="prevPage">← Prev</button>
        <span id="pageInfo"></span>
        <button id="nextPage">Next →</button>
      `;
      
      const section = document.querySelector(".featured-books-section");
      if (section) {
        section.appendChild(wrapper);
      }
    }
    
    const pageInfo = document.getElementById("pageInfo");
    const prevBtn = document.getElementById("prevPage");
    const nextBtn = document.getElementById("nextPage");
    
    if (!pageInfo || !prevBtn || !nextBtn) {
      console.error("❌ Pagination elements not found!");
      return;
    }
    
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
      
      console.log(`✅ Pagination: page ${this.currentPage}/${totalPages}`);
    } else {
      wrapper.style.display = "none";
    }
  }

  showLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = "block";
    }
    if (this.container) {
      this.container.innerHTML = '<div class="loading">Loading books...</div>';
    }
  }

  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = "none";
    }
  }

  showError() {
    if (this.container) {
      this.container.innerHTML = '<div class="error">Failed to load books. Please try again.</div>';
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
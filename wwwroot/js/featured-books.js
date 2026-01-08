class FeaturedBooks {
  constructor() {
    this.container = document.getElementById("featuredBooksGrid");
    this.loadingElement = document.getElementById("loading-featured");
  }

  async loadFeaturedBooks() {
    try {
      this.showLoading();

      const response = await fetch("/data/featured-books.json");
      const data = await response.json();

      this.renderBooks(data.featured_books);
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

      this.renderBooks(data.featured_books);
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

      this.renderBooks(data.popular_books);
      this.hideLoading();
    } catch (error) {
      console.error("Error loading buku populer:", error);
      this.showError();
    }
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

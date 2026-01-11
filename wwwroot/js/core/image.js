/**
 * Image Loading Utility Module
 * Handles image loading states, timeouts, and fallbacks
 */

function handleImageLoad(img) {
  const timeoutId = img.getAttribute("data-timeout-id");
  if (timeoutId) {
    clearTimeout(parseInt(timeoutId));
  }

  img.classList.add("loaded");
  img.style.opacity = "1";
  img.style.display = "block";

  const thumbnail = img.parentElement;
  if (thumbnail) {
    thumbnail.classList.remove("timeout");

    const skeleton = thumbnail.querySelector(".image-skeleton");
    if (skeleton) skeleton.style.display = "none";

    const empty = thumbnail.querySelector(".image-empty");
    if (empty) empty.style.display = "none";
  }
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

    const skeleton = thumbnail.querySelector(".image-skeleton");
    const empty = thumbnail.querySelector(".image-empty");

    if (skeleton) skeleton.style.display = "none";
    if (empty) empty.style.display = "flex";
  }
}

function setupImageTimeout(img, timeout = 3000) {
  if (img.src && img.src !== "") {
    const timeoutId = setTimeout(() => {
      handleImageTimeout(img);
    }, timeout);
    img.setAttribute("data-timeout-id", timeoutId);

    // Check if already loaded
    if (img.complete && img.naturalHeight !== 0) {
      handleImageLoad(img);
    }
  } else {
    handleImageTimeout(img);
  }
}

function initializeImages(container, timeout = 3000) {
  const images = container.querySelectorAll("img");
  images.forEach((img) => setupImageTimeout(img, timeout));
}

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    handleImageLoad,
    handleImageTimeout,
    setupImageTimeout,
    initializeImages,
  };
}

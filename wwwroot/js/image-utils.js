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

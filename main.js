const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxMedia = lightbox.querySelector(".lightbox-media");
const lightboxCaption = lightbox.querySelector(".lightbox-caption");

document.getElementById("year").textContent = new Date().getFullYear();

function placeholder(item) {
  const el = document.createElement("div");
  el.className = "placeholder";
  el.innerHTML = item.type === "video"
    ? `<span class="ph-icon">▶</span><span>Stop motion placeholder</span>`
    : `<span class="ph-icon">◐</span><span>Artwork placeholder</span>`;
  return el;
}

function media(item, { controls = false } = {}) {
  if (!item.src) return placeholder(item);
  if (item.type === "video") {
    const v = document.createElement("video");
    v.src = item.src;
    if (item.poster) v.poster = item.poster;
    v.muted = !controls;
    v.loop = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.controls = controls;
    if (controls) v.autoplay = true;
    return v;
  }
  const img = document.createElement("img");
  img.src = item.src;
  img.alt = item.title;
  img.loading = "lazy";
  return img;
}

function render() {
  GALLERY.forEach((item, i) => {
    const tile = document.createElement("figure");
    tile.className = `tile ${item.size || ""}`;
    tile.dataset.type = item.type;
    tile.style.animationDelay = `${i * 60}ms`;
    tile.tabIndex = 0;

    const frame = document.createElement("div");
    frame.className = "frame";
    frame.appendChild(media(item));
    if (item.type === "video") frame.insertAdjacentHTML("beforeend", `<span class="badge">Film</span>`);

    tile.appendChild(frame);
    tile.insertAdjacentHTML("beforeend", `
      <figcaption>
        <span class="title">${item.title}</span>
        <span class="meta">${item.medium} · ${item.year}</span>
      </figcaption>`);

    // Stop motion previews play on hover
    const video = frame.querySelector("video");
    if (video) {
      tile.addEventListener("mouseenter", () => video.play());
      tile.addEventListener("mouseleave", () => { video.pause(); video.currentTime = 0; });
    }

    const open = () => openLightbox(item);
    tile.addEventListener("click", open);
    tile.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });

    gallery.appendChild(tile);
  });
}

function openLightbox(item) {
  lightboxMedia.replaceChildren(media(item, { controls: true }));
  lightboxCaption.textContent = `${item.title} — ${item.medium}, ${item.year}`;
  lightbox.showModal();
}

lightbox.addEventListener("close", () => lightboxMedia.replaceChildren());
lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) lightbox.close(); });

document.querySelectorAll(".filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((b) => b.classList.toggle("is-active", b === btn));
    const f = btn.dataset.filter;
    gallery.querySelectorAll(".tile").forEach((t) => {
      t.hidden = f !== "all" && t.dataset.type !== f;
    });
  });
});

render();

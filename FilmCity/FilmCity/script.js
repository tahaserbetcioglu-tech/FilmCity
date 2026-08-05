/*************************************************************************
  script.js (Optimize Sürüm - Akıcı)
  - Donma ve gecikme azaltıldı
  - TMDB + YouTube + smooth animasyonlar
  + ✅ Swiper Slider (otomatik yükleme + otomatik HTML ekleme)
  + ✅ Slider üst başlık: Popüler Filmler / Diziler / Animasyonlar
  + ✅ Başlık harf harf animasyon
*************************************************************************/

const TMDB_KEY = "d0cee02c031433c37861a9b22b11854e";
const YT_KEY = "AIzaSyCjZ77zLEYbQike8KFuFpVLY10dbYEl6CQ";

document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     ✅ SLIDER: Swiper CSS/JS otomatik yükle + HTML ekle
  ========================================================= */
  function injectSwiperCSS() {
    if (document.querySelector('link[data-filmcity="swiper"]')) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css";
    l.setAttribute("data-filmcity", "swiper");
    document.head.appendChild(l);
  }

  function injectSliderCSS() {
    if (document.querySelector('style[data-filmcity="slidercss"]')) return;
    const s = document.createElement("style");
    s.setAttribute("data-filmcity", "slidercss");
    s.textContent = `
      /* ✅ Slider başlığı */
      .slider-head{padding:10px 24px 6px}
      #sliderTitle{
  margin:0;
  font-size:26px;
  font-weight:900;
  color:#1fb3ff; /* ✅ mavi neon */
  letter-spacing:.2px;
  text-shadow:
    0 0 6px rgba(31,179,255,.75),
    0 0 14px rgba(31,179,255,.55),
    0 0 26px rgba(31,179,255,.35);
}


      /* ✅ Harf harf animasyon */
      #sliderTitle .char{display:inline-block;opacity:0;transform:translateY(10px)}
      #sliderTitle.title-animate .char{animation:titleChar .5s ease forwards}
      @keyframes titleChar{to{opacity:1;transform:translateY(0)}}

      .movie-slider{position:relative;padding:6px 0 18px}
      .movie-slider .swiper{padding:8px 44px}
      .movie-card{position:relative;border-radius:14px;overflow:hidden;background:#111;aspect-ratio:16/9;box-shadow:0 10px 30px rgba(0,0,0,.35);display:block}
      .movie-card img{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.02)}
      .badges{position:absolute;top:10px;left:10px;display:flex;gap:8px;align-items:center;z-index:2}
      .badge{font:700 12px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial;padding:6px 8px;border-radius:10px;background:rgba(255,255,255,.92);color:#111;backdrop-filter:blur(6px)}
      .badge.cc{background:rgba(255,255,255,.92)}
      .rating{position:absolute;top:10px;right:10px;display:inline-flex;gap:6px;align-items:center;font:800 16px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#f7c948;z-index:2;text-shadow:0 2px 10px rgba(0,0,0,.6)}
      .title{position:absolute;left:0;right:0;bottom:0;padding:14px 12px;color:#fff;font:800 18px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Arial;background:linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,0));z-index:2}
      .year{position:absolute;left:12px;bottom:52px;font:800 16px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial;color:rgba(255,255,255,.9);z-index:2;text-shadow:0 2px 10px rgba(0,0,0,.6)}
      .swiper-button-prev,.swiper-button-next{width:40px;height:40px;border-radius:999px;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);color:#fff;box-shadow:0 10px 25px rgba(0,0,0,.35)}
      .swiper-button-prev:after,.swiper-button-next:after{font-size:16px;font-weight:900}
      .swiper-button-prev{left:6px}
      .swiper-button-next{right:6px}
      .movie-card:after{content:"";position:absolute;inset:0;background:rgba(0,0,0,0);transition:.2s;z-index:1}
      .movie-card:hover:after{background:rgba(0,0,0,.10)}
    `;
    document.head.appendChild(s);
  }

  function loadSwiperJS() {
    return new Promise((resolve) => {
      if (window.Swiper) return resolve(true);
      if (document.querySelector('script[data-filmcity="swiperjs"]')) {
        const t = setInterval(() => {
          if (window.Swiper) { clearInterval(t); resolve(true); }
        }, 50);
        return;
      }
      const sc = document.createElement("script");
      sc.src = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js";
      sc.async = true;
      sc.setAttribute("data-filmcity", "swiperjs");
      sc.onload = () => resolve(true);
      sc.onerror = () => resolve(false);
      document.body.appendChild(sc);
    });
  }

  function ensureSliderHTML() {
    if (document.getElementById("moviesSwiper")) return;
    const header = document.querySelector(".topbar");
    if (!header) return;

    const sec = document.createElement("section");
    sec.className = "movie-slider";
    sec.innerHTML = `
      <div class="slider-head">
        <h2 id="sliderTitle">Popüler Filmler</h2>
      </div>

      <div class="swiper" id="moviesSwiper">
        <div class="swiper-wrapper"></div>
        <div class="swiper-button-prev"></div>
        <div class="swiper-button-next"></div>
      </div>
    `;
    header.insertAdjacentElement("afterend", sec);
  }

  let moviesSwiper = null;

  /* 🔹 Türler Dropdown */
  const searchContainer = document.querySelector(".search-container");
  const genreSelect = document.createElement("select");
  genreSelect.id = "genreSelect";
  genreSelect.innerHTML = `
    <option value="">🎬 Türler</option>
    <option value="28">Aksiyon</option>
    <option value="12">Macera</option>
    <option value="16">Animasyon</option>
    <option value="35">Komedi</option>
    <option value="80">Suç</option>
    <option value="18">Dram</option>
    <option value="14">Fantastik</option>
    <option value="27">Korku</option>
    <option value="10749">Romantik</option>
    <option value="878">Bilim Kurgu</option>
    <option value="53">Gerilim</option>
  `;
  if (searchContainer) searchContainer.prepend(genreSelect);

  let selectedGenre = "";

  /* 🔹 DOM Elemanları */
  const grid = document.getElementById("grid");
  const loadingEl = document.getElementById("loading");
  const detailPanel = document.getElementById("detailPanel");
  const trailerFrame = document.getElementById("trailerFrame");
  const watchBtn = document.getElementById("watchBtn");
  const watchModal = document.getElementById("watchModal");
  const watchFrame = document.getElementById("watchFrame");
  const closePanelBtn = document.getElementById("closePanel");
  const closeWatchBtn = document.getElementById("closeWatch");
  const detailTitle = document.getElementById("detailTitle");
  const detailPoster = document.getElementById("detailPoster");
  const detailYear = document.getElementById("detailYear");
  const detailGenres = document.getElementById("detailGenres");
  const detailRating = document.getElementById("detailRating");
  const detailOverview = document.getElementById("detailOverview");
  const searchInput = document.querySelector(".search-box");
  const tabs = document.querySelectorAll(".tab");

  let page = 1, totalPages = Infinity, loading = false;
  let currentType = "movie", lastQuery = "";
  const AVATAR_URL = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  /* ✅ Başlık harf harf yazdır */
  function animateTitle(text) {
    const el = document.getElementById("sliderTitle");
    if (!el) return;

    if (el.dataset.txt === text) return;
    el.dataset.txt = text;

    el.classList.remove("title-animate");
    el.innerHTML = "";

    const frag = document.createDocumentFragment();
    [...text].forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "char";
      span.style.animationDelay = `${i * 0.03}s`;
      span.textContent = ch === " " ? "\u00A0" : ch;
      frag.appendChild(span);
    });

    el.appendChild(frag);
    void el.offsetWidth; // reflow
    el.classList.add("title-animate");
  }

  /* ✅ Slider başlığı güncelle */
  function updateSliderTitle() {
    if (currentType === "movie") animateTitle("Popüler Filmler");
    else if (currentType === "tv") animateTitle("Popüler Diziler");
    else if (currentType === "anime") animateTitle("Popüler Animasyonlar");
  }

  /* 🖼️ Poster */
  const posterUrl = p => p ? `https://image.tmdb.org/t/p/w500${p}` : "https://via.placeholder.com/300x450?text=No+Image";
  const backdropUrl = p => p ? `https://image.tmdb.org/t/p/w780${p}` : "https://via.placeholder.com/1200x675?text=No+Image";

  /* 🌐 TMDB Fetch - Debounce ile */
  let lastFetchTime = 0;
  async function fetchTMDB(url) {
    const now = Date.now();
    if (now - lastFetchTime < 300) await new Promise(r => setTimeout(r, 300));
    lastFetchTime = now;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch {
      return null;
    }
  }

  genreSelect.addEventListener("change", () => {
    selectedGenre = genreSelect.value;
    page = 1;
    grid.innerHTML = "";
    loadMovies(true);
    updateSliderTitle();
    renderTopSlider();
  });

  /* =========================================================
     ✅ SLIDER: TMDB’den çek + Swiper’a bas
  ========================================================= */
  async function fetchSliderItems() {
    const genreFilter = selectedGenre ? `&with_genres=${selectedGenre}` : "";
    let url = "";

    if (currentType === "movie") {
      url = selectedGenre
        ? `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&language=tr-TR&sort_by=popularity.desc${genreFilter}`
        : `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}&language=tr-TR`;
    } else if (currentType === "tv") {
      url = selectedGenre
        ? `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_KEY}&language=tr-TR&sort_by=popularity.desc${genreFilter}`
        : `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}&language=tr-TR`;
    } else if (currentType === "anime") {
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&language=tr-TR&with_genres=16&sort_by=popularity.desc`;
    }

    const data = await fetchTMDB(url);
    return (data?.results || []).filter(x => x.backdrop_path || x.poster_path).slice(0, 12);
  }

  async function renderTopSlider() {
    ensureSliderHTML();
    updateSliderTitle();

    const wrapper = document.querySelector("#moviesSwiper .swiper-wrapper");
    if (!wrapper) return;

    wrapper.innerHTML = `
      <div class="swiper-slide">
        <div style="padding:14px;color:#fff;opacity:.8">Slider yükleniyor...</div>
      </div>
    `;

    const items = await fetchSliderItems();
    wrapper.innerHTML = "";

    if (!items.length) {
      wrapper.innerHTML = `
        <div class="swiper-slide">
          <div style="padding:14px;color:#fff;opacity:.8">Slider verisi bulunamadı.</div>
        </div>
      `;
      if (moviesSwiper) moviesSwiper.update();
      return;
    }

    const frag = document.createDocumentFragment();
    items.forEach(item => {
      const id = item.id;
      const title = item.title || item.name || "Başlıksız";
      const year = (item.release_date || item.first_air_date || "").split("-")[0] || "";
      const rating = item.vote_average ? (Math.round(item.vote_average * 10) / 10).toFixed(1) : "";
      const poster = item.poster_path || "";
      const img = backdropUrl(item.backdrop_path || item.poster_path);

      const media_type = currentType === "tv" ? "tv" : "movie";

      const slide = document.createElement("div");
      slide.className = "swiper-slide";
      slide.innerHTML = `
        <a class="movie-card" href="javascript:void(0)">
          <img loading="lazy" src="${img}" alt="${title}">
          <div class="badges"><span class="badge cc">CC</span></div>
          ${rating ? `<div class="rating">⭐ ${rating}</div>` : ``}
          ${year ? `<div class="year">${year}</div>` : ``}
          <div class="title">${title}</div>
        </a>
      `;
      slide.querySelector(".movie-card").addEventListener("click", () => {
        openDetail({ id, title, poster, media_type });
      });
      frag.appendChild(slide);
    });

    wrapper.appendChild(frag);

    if (moviesSwiper) {
      moviesSwiper.update();
      moviesSwiper.slideTo(0, 0);
      return;
    }

    const ok = await loadSwiperJS();
    if (!ok || !window.Swiper) return;

    moviesSwiper = new Swiper("#moviesSwiper", {
      slidesPerView: 1.2,
      spaceBetween: 14,
      speed: 450,
      navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
      breakpoints: {
        480: { slidesPerView: 1.6 },
        768: { slidesPerView: 2.4 },
        1024:{ slidesPerView: 4.2 },
        1280:{ slidesPerView: 5.2 }
      }
    });
  }

  /* 🎞️ Filmleri Yükle (Akıcı) */
  async function loadMovies(reset = false) {
    if (loading || page > totalPages) return;
    loading = true;
    loadingEl && (loadingEl.style.display = "block");

    let genreFilter = selectedGenre ? `&with_genres=${selectedGenre}` : "";
    let url = "";
    if (lastQuery) {
      url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&language=tr-TR&query=${encodeURIComponent(lastQuery)}&page=${page}`;
    } else if (currentType === "movie") {
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&language=tr-TR&page=${page}${genreFilter}`;
    } else if (currentType === "tv") {
      url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_KEY}&language=tr-TR&page=${page}${genreFilter}`;
    } else if (currentType === "anime") {
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&language=tr-TR&with_genres=16&page=${page}${genreFilter}`;
    }

    const data = await fetchTMDB(url);
    if (!data) return (loading = false);

    if (reset) grid.innerHTML = "";
    totalPages = data.total_pages || totalPages;

    const fragment = document.createDocumentFragment();
    const batch = [...data.results];
    function renderBatch() {
      const chunk = batch.splice(0, 20);
      chunk.forEach(item => {
        const id = item.id;
        const title = item.title || item.name || "Başlıksız";
        const poster = item.poster_path;
        const media_type = currentType === "anime" ? "movie" : (item.media_type || currentType);
        const card = document.createElement("div");
        card.className = "grid-card";
        card.innerHTML = `<img src="${posterUrl(poster)}"><h4>${title}</h4>`;
        card.addEventListener("click", () => openDetail({ id, title, poster, media_type }));
        fragment.appendChild(card);
      });
      grid.appendChild(fragment);
      if (batch.length > 0) requestAnimationFrame(renderBatch);
    }
    requestAnimationFrame(renderBatch);

    page++;
    loading = false;
    loadingEl && (loadingEl.style.display = "none");
  }

  /* 🎬 Detay Paneli */
  async function openDetail(movie) {
    const { id, media_type } = movie;
    detailPanel.classList.add("open");
    detailTitle.textContent = "Yükleniyor...";
    trailerFrame.src = "";

    const detailUrl = `https://api.themoviedb.org/3/${media_type}/${id}?api_key=${TMDB_KEY}&language=tr-TR&append_to_response=videos`;
    const data = await fetchTMDB(detailUrl);
    if (!data) return;

    detailTitle.textContent = data.title || data.name || "Başlıksız";
    detailPoster.src = posterUrl(data.poster_path);
    detailYear.textContent = (data.release_date || data.first_air_date || "").split("-")[0];
    detailGenres.textContent = (data.genres || []).map(g => g.name).join(", ");
    detailRating.textContent = data.vote_average ? `IMDB: ${data.vote_average}` : "";
    detailOverview.textContent = data.overview || "Açıklama yok";

    detailPanel.querySelectorAll(".director, .cast-section").forEach(e => e.remove());

    const creditsUrl = `https://api.themoviedb.org/3/${media_type}/${id}/credits?api_key=${TMDB_KEY}&language=tr-TR`;
    const credits = await fetchTMDB(creditsUrl);
    if (credits) {
      const director = credits.crew.find(p => p.job === "Director");
      const castList = credits.cast.slice(0, 10);

      const directorHtml = director ? `
        <div class="director">
          <h3> Yönetmen</h3>
          <div class="person">
            <img src="${director.profile_path ? `https://image.tmdb.org/t/p/w185${director.profile_path}` : AVATAR_URL}">
            <span>${director.name}</span>
          </div>
        </div>` : "";

      const castHtml = `
        <div class="cast-section">
          <h3> Oyuncular</h3>
          <div class="cast-scroll">
            ${castList.map(c => `
              <div class="actor">
                <img src="${c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : AVATAR_URL}">
                <span>${c.name}</span>
              </div>`).join("")}
          </div>
        </div>`;

      detailOverview.insertAdjacentHTML("afterend", directorHtml + castHtml);
    }

    let youtubeId = null;
    if (data.videos?.results?.length) {
      const trailer = data.videos.results.find(v => /trailer/i.test(v.type)) || data.videos.results[0];
      youtubeId = trailer?.key;
    }
    if (!youtubeId) {
      const q = encodeURIComponent((data.title || data.name) + " fragman");
      try {
        const yRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${q}&key=${YT_KEY}&maxResults=1`);
        const yData = await yRes.json();
        if (yData.items?.length) youtubeId = yData.items[0].id.videoId;
      } catch {}
    }

    trailerFrame.src = youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : "";
    trailerFrame.style.display = youtubeId ? "block" : "none";
  }

  /* ▶️ Fragman Modal */
  watchBtn.onclick = () => {
    if (!trailerFrame.src) return alert("Fragman bulunamadı.");
    watchFrame.src = trailerFrame.src + "?autoplay=1";
    watchModal.classList.add("show");
  };
  closeWatchBtn.onclick = () => { watchModal.classList.remove("show"); watchFrame.src = ""; };
  closePanelBtn.onclick = () => { detailPanel.classList.remove("open"); trailerFrame.src = ""; };

  /* 🔸 Sekmeler */
  tabs.forEach(t => t.addEventListener("click", () => {
    tabs.forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    currentType = t.dataset.tab;

    updateSliderTitle();
    renderTopSlider();

    page = 1;
    grid.innerHTML = "";
    loadMovies(true);
  }));

  /* 🔍 Arama */
  if (searchInput) {
    let timer;
    searchInput.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        lastQuery = searchInput.value.trim();
        page = 1;
        grid.innerHTML = "";
        loadMovies(true);
      }, 500);
    });
  }

  /* 🔄 Sonsuz Kaydırma */
  window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) loadMovies();
  });

  // ✅ Swiper ve slider hazırlığı
  injectSwiperCSS();
  injectSliderCSS();
  ensureSliderHTML();

  updateSliderTitle();
  loadMovies();
  renderTopSlider();

});


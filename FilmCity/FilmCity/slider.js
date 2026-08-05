(() => {
  // Kendi KEY’lerimiz (script.js'e dokunmuyoruz)
  const TMDB_KEY = "d0cee02c031433c37861a9b22b11854e";
  const YT_KEY = "AIzaSyCjZ77zLEYbQike8KFuFpVLY10dbYEl6CQ";
  const SLIDER_LIMIT = 12;

  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => [...r.querySelectorAll(s)];
  const posterUrl = (p) => p ? `https://image.tmdb.org/t/p/w500${p}` : "https://via.placeholder.com/300x450?text=No+Image";
  const backdropUrl = (p) => p ? `https://image.tmdb.org/t/p/w780${p}` : "https://via.placeholder.com/1200x675?text=No+Image";

  // style.css'e dokunmadan slider stilini ekleyelim (istersen kaldırırım)
  function injectSliderCSS() {
    if (qs('style[data-filmcity="slider-css"]')) return;
    const style = document.createElement("style");
    style.setAttribute("data-filmcity", "slider-css");
    style.textContent = `
      .movie-slider{position:relative;padding:10px 0 18px}
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
      .movie-card:hover:after{background:rgba(0,0,0,.10);}
    `;
    document.head.appendChild(style);
  }

  function ensureSliderHTML() {
    if (qs("#moviesSwiper")) return;
    const header = qs(".topbar");
    if (!header) return;

    const section = document.createElement("section");
    section.className = "movie-slider";
    section.innerHTML = `
      <div class="swiper" id="moviesSwiper">
        <div class="swiper-wrapper"></div>
        <div class="swiper-button-prev"></div>
        <div class="swiper-button-next"></div>
      </div>
    `;
    header.insertAdjacentElement("afterend", section);
  }

  let lastFetchTime = 0;
  async function fetchTMDB(url) {
    const now = Date.now();
    if (now - lastFetchTime < 250) await new Promise(r => setTimeout(r, 250));
    lastFetchTime = now;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch {
      return null;
    }
  }

  function getActiveTab() {
    return qs(".tab.active")?.dataset?.tab || "movie";
  }

  async function fetchSliderItems() {
    const tab = getActiveTab();
    let url = "";
    if (tab === "tv") {
      url = `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}&language=tr-TR`;
    } else if (tab === "anime") {
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&language=tr-TR&with_genres=16&sort_by=popularity.desc`;
    } else {
      url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}&language=tr-TR`;
    }
    const data = await fetchTMDB(url);
    return (data?.results || []).filter(x => x.backdrop_path || x.poster_path).slice(0, SLIDER_LIMIT);
  }

  // ✅ Senin script.js'indeki openDetail global değil → buradan paneli biz dolduruyoruz
  async function openDetailLocal({ id, media_type }) {
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

    if (!detailPanel) return;

    detailPanel.classList.add("open");
    if (detailTitle) detailTitle.textContent = "Yükleniyor...";
    if (trailerFrame) trailerFrame.src = "";

    const detailUrl = `https://api.themoviedb.org/3/${media_type}/${id}?api_key=${TMDB_KEY}&language=tr-TR&append_to_response=videos`;
    const data = await fetchTMDB(detailUrl);
    if (!data) return;

    if (detailTitle) detailTitle.textContent = data.title || data.name || "Başlıksız";
    if (detailPoster) detailPoster.src = posterUrl(data.poster_path);
    if (detailYear) detailYear.textContent = (data.release_date || data.first_air_date || "").split("-")[0] || "";
    if (detailGenres) detailGenres.textContent = (data.genres || []).map(g => g.name).join(", ");
    if (detailRating) detailRating.textContent = data.vote_average ? `IMDB: ${data.vote_average}` : "";
    if (detailOverview) detailOverview.textContent = data.overview || "Açıklama yok";

    // Trailer
    let youtubeId = null;
    if (data.videos?.results?.length) {
      const trailer = data.videos.results.find(v => /trailer/i.test(v.type)) || data.videos.results[0];
      youtubeId = trailer?.key || null;
    }
    if (!youtubeId) {
      const q = encodeURIComponent((data.title || data.name) + " fragman");
      try {
        const yRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${q}&key=${YT_KEY}&maxResults=1`);
        const yData = await yRes.json();
        if (yData.items?.length) youtubeId = yData.items[0].id.videoId;
      } catch {}
    }

    if (trailerFrame) {
      trailerFrame.src = youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : "";
      trailerFrame.style.display = youtubeId ? "block" : "none";
    }

    // Mevcut butonlara dokunmadan: sadece ilk kez bağla
    if (watchBtn && !watchBtn.__filmcityBound) {
      watchBtn.__filmcityBound = true;
      watchBtn.onclick = () => {
        if (!trailerFrame?.src) return alert("Fragman bulunamadı.");
        if (watchFrame) watchFrame.src = trailerFrame.src + "?autoplay=1";
        watchModal?.classList.add("show");
      };
    }
    if (closeWatchBtn && !closeWatchBtn.__filmcityBound) {
      closeWatchBtn.__filmcityBound = true;
      closeWatchBtn.onclick = () => {
        watchModal?.classList.remove("show");
        if (watchFrame) watchFrame.src = "";
      };
    }
    if (closePanelBtn && !closePanelBtn.__filmcityBound) {
      closePanelBtn.__filmcityBound = true;
      closePanelBtn.onclick = () => {
        detailPanel.classList.remove("open");
        if (trailerFrame) trailerFrame.src = "";
      };
    }
  }

  async function renderSlider() {
    ensureSliderHTML();

    const wrap = qs("#moviesSwiper .swiper-wrapper");
    if (!wrap) return;

    wrap.innerHTML = `
      <div class="swiper-slide">
        <div style="padding:14px;color:#fff;opacity:.8">Slider yükleniyor...</div>
      </div>
    `;

    const items = await fetchSliderItems();
    wrap.innerHTML = "";

    if (!items.length) {
      wrap.innerHTML = `
        <div class="swiper-slide">
          <div style="padding:14px;color:#fff;opacity:.8">Slider verisi bulunamadı.</div>
        </div>
      `;
      return;
    }

    const tab = getActiveTab();
    const media_type = tab === "tv" ? "tv" : "movie";

    const frag = document.createDocumentFragment();
    items.forEach(item => {
      const title = item.title || item.name || "Başlıksız";
      const year = (item.release_date || item.first_air_date || "").split("-")[0] || "";
      const rating = item.vote_average ? (Math.round(item.vote_average * 10) / 10).toFixed(1) : "";
      const img = backdropUrl(item.backdrop_path || item.poster_path);

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
        openDetailLocal({ id: item.id, media_type });
      });

      frag.appendChild(slide);
    });

    wrap.appendChild(frag);

    if (window.__filmcitySwiper) {
      window.__filmcitySwiper.update();
      window.__filmcitySwiper.slideTo(0, 0);
    } else {
      window.__filmcitySwiper = new Swiper("#moviesSwiper", {
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
  }

  function bindTabChanges() {
    qsa(".tab").forEach(btn => {
      if (btn.__filmcitySliderBound) return;
      btn.__filmcitySliderBound = true;
      btn.addEventListener("click", () => setTimeout(renderSlider, 120));
    });
  }

  function start() {
    injectSliderCSS();
    ensureSliderHTML();
    bindTabChanges();
    renderSlider();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

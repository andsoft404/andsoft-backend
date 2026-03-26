import { useEffect } from 'react';
import Head from 'next/head';

export async function getServerSideProps() {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const hex = Buffer.from(JSON.stringify({ a: 'public.all' })).toString('hex');
    const res = await fetch(API + '/api', { method: 'POST', body: 'h=' + hex, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const json = await res.json();
    return { props: { siteData: json.data || {} } };
  } catch (e) {
    console.error('SSR fetch error:', e.message);
    return { props: { siteData: {} } };
  }
}

export default function Home({ siteData }) {
  const sb = siteData.sidebar || {};
  const ab = siteData.about || {};
  const ct = siteData.contact || {};
  const services = siteData.services || [];
  const team = siteData.team || [];
  const partners = siteData.partners || [];
  const pricing = siteData.pricing || [];
  const packages = siteData.packages || [];
  const advantages = siteData.advantages || [];
  const projects = siteData.projects || [];
  useEffect(() => {
    // Theme toggle
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

    // element toggle function
    const elementToggleFunc = function (elem) { elem.classList.toggle("active"); };

    // sidebar toggle
    const sidebar = document.querySelector("[data-sidebar]");
    const sidebarBtn = document.querySelector("[data-sidebar-btn]");
    if (sidebarBtn && sidebar) {
      sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });
    }

    // testimonials modal
    const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
    const modalContainer = document.querySelector("[data-modal-container]");
    const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
    const overlayEl = document.querySelector("[data-overlay]");
    const modalImg = document.querySelector("[data-modal-img]");
    const modalTitle = document.querySelector("[data-modal-title]");
    const modalText = document.querySelector("[data-modal-text]");

    const testimonialsModalFunc = function () {
      if (modalContainer && overlayEl) {
        modalContainer.classList.toggle("active");
        overlayEl.classList.toggle("active");
      }
    };

    for (let i = 0; i < testimonialsItem.length; i++) {
      testimonialsItem[i].addEventListener("click", function () {
        const scrollParent = this.closest(".has-scrollbar");
        if (scrollParent && scrollParent._getDragMoved && scrollParent._getDragMoved()) {
          scrollParent._resetDragMoved();
          return;
        }
        if (modalImg && modalTitle && modalText) {
          modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
          modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
          modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
          modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;
        }
        testimonialsModalFunc();
      });
    }
    if (modalCloseBtn) modalCloseBtn.addEventListener("click", testimonialsModalFunc);
    if (overlayEl) overlayEl.addEventListener("click", testimonialsModalFunc);

    // contact form
    const form = document.querySelector("[data-form]");
    const formInputs = document.querySelectorAll("[data-form-input]");
    const formBtn = document.querySelector("[data-form-btn]");

    // custom select
    const customSelect = document.querySelector("[data-custom-select]");
    const customSelectTrigger = document.querySelector("[data-custom-select-trigger]");
    const customSelectDropdown = document.querySelector("[data-custom-select-dropdown]");
    const hiddenSelect = document.querySelector(".form-select[name='service']");

    if (customSelect && customSelectTrigger && customSelectDropdown && hiddenSelect) {
      customSelectTrigger.addEventListener("click", function () {
        customSelect.classList.toggle("active");
      });
      const customOptions = customSelectDropdown.querySelectorAll(".custom-select-option");
      for (let i = 0; i < customOptions.length; i++) {
        customOptions[i].addEventListener("click", function () {
          const val = this.dataset.value;
          const label = this.querySelector(".custom-select-option-text span").textContent;
          hiddenSelect.value = val;
          hiddenSelect.dispatchEvent(new Event("input", { bubbles: true }));
          customSelectTrigger.querySelector(".custom-select-value").textContent = label;
          customSelectTrigger.classList.add("has-value");
          for (let j = 0; j < customOptions.length; j++) customOptions[j].classList.remove("selected");
          this.classList.add("selected");
          customSelect.classList.remove("active");
        });
      }
      document.addEventListener("click", function (e) {
        if (!customSelect.contains(e.target)) customSelect.classList.remove("active");
      });
    }

    if (form && formBtn) {
      for (let i = 0; i < formInputs.length; i++) {
        formInputs[i].addEventListener("input", function () {
          if (form.checkValidity()) formBtn.removeAttribute("disabled");
          else formBtn.setAttribute("disabled", "");
        });
      }
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var msgData = {
          name: form.querySelector('[name="fullname"]').value,
          email: form.querySelector('[name="email"]').value,
          phone: form.querySelector('[name="phone"]').value || '',
          service: form.querySelector('[name="service"]').value || '',
          message: form.querySelector('[name="message"]').value,
          date: new Date().toLocaleString('mn-MN')
        };
        var _msg = Object.assign({ a: 'messages.submit' }, msgData);
        var _mBytes = new TextEncoder().encode(JSON.stringify(_msg));
        var _mHex = ''; for (var _i = 0; _i < _mBytes.length; _i++) { _mHex += ('0' + _mBytes[_i].toString(16)).slice(-2); }
        var _mFd = new FormData(); _mFd.append('h', _mHex);
        fetch(API_URL + '/api', { method: 'POST', body: _mFd }).catch(function () { });
        form.reset();
        formBtn.setAttribute("disabled", "");
        if (customSelectTrigger) {
          customSelectTrigger.querySelector(".custom-select-value").textContent = "Үйлчилгээ сонгох";
          customSelectTrigger.classList.remove("has-value");
        }
        alert("Мессеж амжилттай илгээгдлээ!");
      });
    }

    // page navigation
    const navigationLinks = document.querySelectorAll("[data-nav-link]");
    const pages = document.querySelectorAll("[data-page]");
    for (let i = 0; i < navigationLinks.length; i++) {
      navigationLinks[i].addEventListener("click", function () {
        const linkText = (this.querySelector("span") ? this.querySelector("span").textContent : this.textContent).trim().toLowerCase();
        for (let j = 0; j < pages.length; j++) {
          if (linkText === pages[j].dataset.page) {
            pages[j].classList.add("active");
            navigationLinks[j].classList.add("active");
            window.scrollTo(0, 0);
          } else {
            pages[j].classList.remove("active");
            navigationLinks[j].classList.remove("active");
          }
        }
      });
    }

    // accordion
    const accordionHeaders = document.querySelectorAll("[data-accordion-header]");
    for (let i = 0; i < accordionHeaders.length; i++) {
      accordionHeaders[i].addEventListener("click", function () {
        this.closest(".accordion-section").classList.toggle("active");
      });
    }

    // project filter
    const filterBtns = document.querySelectorAll("[data-filter-btn]");
    const projectCards = document.querySelectorAll("[data-project-card]");
    function applyFilter(filter) {
      for (let j = 0; j < projectCards.length; j++) {
        projectCards[j].style.display = (filter === "all" || projectCards[j].dataset.category === filter) ? "" : "none";
      }
    }
    for (let i = 0; i < filterBtns.length; i++) {
      if (filterBtns[i].classList.contains("active")) { applyFilter(filterBtns[i].dataset.filter); break; }
    }
    for (let i = 0; i < filterBtns.length; i++) {
      filterBtns[i].addEventListener("click", function () {
        for (let j = 0; j < filterBtns.length; j++) filterBtns[j].classList.remove("active");
        this.classList.add("active");
        applyFilter(this.dataset.filter);
      });
    }

    // project detail modal
    const projectModalContainer = document.querySelector("[data-project-modal]");
    const projectModalOverlay = document.querySelector("[data-project-modal-overlay]");
    const projectModalClose = document.querySelector("[data-project-modal-close]");
    const projectModalTitle = document.querySelector("[data-project-modal-title]");
    const projectModalDesc = document.querySelector("[data-project-modal-desc]");
    const projectModalGallery = document.querySelector("[data-project-modal-gallery]");
    const projectModalPrice = document.querySelector("[data-project-modal-price]");
    const projectOrderForm = document.querySelector("[data-project-order-form]");
    const projectOrderBtn = document.querySelector("[data-project-modal-order-btn]");

    function closeProjectModal() {
      if (projectModalContainer) projectModalContainer.classList.remove("active");
      if (projectOrderForm) projectOrderForm.style.display = "none";
    }

    for (let i = 0; i < projectCards.length; i++) {
      projectCards[i].addEventListener("click", function () {
        const detailData = this.querySelector(".project-detail-data");
        if (!detailData || !projectModalTitle || !projectModalDesc || !projectModalGallery) return;
        projectModalTitle.textContent = detailData.querySelector("[data-detail-title]").textContent;
        projectModalDesc.textContent = detailData.querySelector("[data-detail-desc]").textContent;
        const imgs = detailData.querySelector("[data-detail-imgs]").textContent.split(",");
        projectModalGallery.innerHTML = "";
        for (let j = 0; j < imgs.length; j++) {
          const img = document.createElement("img");
          img.src = imgs[j].trim();
          img.alt = "Screenshot " + (j + 1);
          img.loading = "lazy";
          projectModalGallery.appendChild(img);
        }
        const priceEl = detailData.querySelector("[data-detail-price]");
        if (priceEl && projectModalPrice) { projectModalPrice.textContent = priceEl.textContent; projectModalPrice.style.display = "block"; }
        else if (projectModalPrice) { projectModalPrice.style.display = "none"; }
        if (projectOrderForm) projectOrderForm.style.display = "none";
        if (projectModalContainer) projectModalContainer.classList.add("active");
      });
    }
    if (projectModalClose) projectModalClose.addEventListener("click", closeProjectModal);
    if (projectModalOverlay) projectModalOverlay.addEventListener("click", closeProjectModal);
    if (projectOrderBtn) {
      projectOrderBtn.addEventListener("click", function () {
        if (projectOrderForm) projectOrderForm.style.display = projectOrderForm.style.display === "none" ? "block" : "none";
      });
    }

    // order form
    const orderFormInner = document.querySelector("[data-order-form-inner]");
    if (orderFormInner) {
      orderFormInner.addEventListener("submit", function (e) {
        e.preventDefault();
        var orderData = {
          name: this.querySelector('[name="name"]').value,
          email: this.querySelector('[name="email"]').value,
          phone: this.querySelector('[name="phone"]').value || '',
          project: projectModalTitle ? projectModalTitle.textContent : '',
          message: this.querySelector('[name="message"]').value,
          date: new Date().toLocaleString('mn-MN')
        };
        var _ord = Object.assign({ a: 'orders.submit' }, orderData);
        var _oBytes = new TextEncoder().encode(JSON.stringify(_ord));
        var _oHex = ''; for (var _j = 0; _j < _oBytes.length; _j++) { _oHex += ('0' + _oBytes[_j].toString(16)).slice(-2); }
        var _oFd = new FormData(); _oFd.append('h', _oHex);
        fetch(API_URL + '/api', { method: 'POST', body: _oFd }).catch(function () { });
        this.reset();
        if (projectOrderForm) projectOrderForm.style.display = "none";
        alert("Захиалга амжилттай илгээгдлээ!");
      });
    }

    // lightbox
    const lightbox = document.querySelector("[data-lightbox]");
    const lightboxImg = document.querySelector("[data-lightbox-img]");
    const lightboxCloseBtns = document.querySelectorAll("[data-lightbox-close]");
    const lightboxPrev = document.querySelector("[data-lightbox-prev]");
    const lightboxNext = document.querySelector("[data-lightbox-next]");
    let lightboxImages = [];
    let lightboxIndex = 0;

    function openLightbox(index) {
      lightboxImages = Array.from(projectModalGallery.querySelectorAll("img"));
      if (!lightboxImages.length) return;
      lightboxIndex = index;
      lightboxImg.src = lightboxImages[lightboxIndex].src;
      lightbox.classList.add("active");
    }
    function closeLightbox() { lightbox.classList.remove("active"); }
    function lightboxNavigate(dir) {
      lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
      lightboxImg.src = lightboxImages[lightboxIndex].src;
    }

    if (lightbox) {
      for (let i = 0; i < lightboxCloseBtns.length; i++) lightboxCloseBtns[i].addEventListener("click", closeLightbox);
      if (lightboxPrev) lightboxPrev.addEventListener("click", function () { lightboxNavigate(-1); });
      if (lightboxNext) lightboxNext.addEventListener("click", function () { lightboxNavigate(1); });
      document.addEventListener("keydown", function (e) {
        if (!lightbox.classList.contains("active")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") lightboxNavigate(-1);
        if (e.key === "ArrowRight") lightboxNavigate(1);
      });

      let lbTouchStartX = 0, lbTouchDiff = 0;
      lightbox.addEventListener("touchstart", function (e) { lbTouchStartX = e.touches[0].clientX; lbTouchDiff = 0; }, { passive: true });
      lightbox.addEventListener("touchmove", function (e) { lbTouchDiff = e.touches[0].clientX - lbTouchStartX; if (lightboxImg) lightboxImg.style.transform = "translateX(" + lbTouchDiff + "px)"; }, { passive: true });
      lightbox.addEventListener("touchend", function () { if (lightboxImg) lightboxImg.style.transform = ""; if (Math.abs(lbTouchDiff) > 50) lightboxNavigate(lbTouchDiff > 0 ? -1 : 1); lbTouchDiff = 0; }, { passive: true });

      let lbMouseDown = false, lbMouseStartX = 0, lbMouseDiff = 0;
      lightboxImg.addEventListener("mousedown", function (e) { lbMouseDown = true; lbMouseStartX = e.clientX; lbMouseDiff = 0; e.preventDefault(); });
      document.addEventListener("mousemove", function (e) { if (!lbMouseDown) return; lbMouseDiff = e.clientX - lbMouseStartX; if (lightboxImg) lightboxImg.style.transform = "translateX(" + lbMouseDiff + "px)"; });
      document.addEventListener("mouseup", function () { if (!lbMouseDown) return; lbMouseDown = false; if (lightboxImg) lightboxImg.style.transform = ""; if (Math.abs(lbMouseDiff) > 50) lightboxNavigate(lbMouseDiff > 0 ? -1 : 1); lbMouseDiff = 0; });
    }

    if (projectModalGallery) {
      projectModalGallery.addEventListener("click", function (e) {
        if (e.target.tagName === "IMG") {
          const imgs = Array.from(projectModalGallery.querySelectorAll("img"));
          openLightbox(imgs.indexOf(e.target));
        }
      });
    }

    // drag scrolling with momentum
    const scrollContainers = document.querySelectorAll(".has-scrollbar");
    for (let i = 0; i < scrollContainers.length; i++) {
      let isDown = false, startX, scrollLeft, dragMoved = false;
      let lastX, lastTime, velocity = 0, momentumId = null;
      const el = scrollContainers[i];

      function stopMomentum() { if (momentumId) { cancelAnimationFrame(momentumId); momentumId = null; } }

      el.addEventListener("mousedown", function (e) {
        stopMomentum();
        isDown = true; dragMoved = false;
        el.style.cursor = "grabbing";
        startX = e.clientX; scrollLeft = el.scrollLeft;
        lastX = e.clientX; lastTime = Date.now(); velocity = 0;
        e.preventDefault();
      });

      document.addEventListener("mouseup", function () {
        if (!isDown) return;
        isDown = false; el.style.cursor = "grab";
        // momentum scroll
        if (Math.abs(velocity) > 0.5) {
          (function tick() {
            velocity *= 0.95;
            if (Math.abs(velocity) < 0.5) return;
            el.scrollLeft -= velocity;
            momentumId = requestAnimationFrame(tick);
          })();
        }
      });

      document.addEventListener("mousemove", function (e) {
        if (!isDown) return;
        e.preventDefault();
        const now = Date.now();
        const dt = now - lastTime;
        const dx = e.clientX - lastX;
        if (dt > 0) velocity = dx / dt * 16;
        lastX = e.clientX; lastTime = now;
        const walk = e.clientX - startX;
        if (Math.abs(walk) > 3) dragMoved = true;
        el.scrollLeft = scrollLeft - walk;
      });

      let touchStartX, touchScrollLeft, touchDragMoved = false;
      let touchLastX, touchLastTime, touchVelocity = 0;

      el.addEventListener("touchstart", function (e) {
        stopMomentum();
        touchStartX = e.touches[0].clientX; touchScrollLeft = el.scrollLeft; touchDragMoved = false;
        touchLastX = e.touches[0].clientX; touchLastTime = Date.now(); touchVelocity = 0;
      }, { passive: true });

      el.addEventListener("touchmove", function (e) {
        const now = Date.now();
        const dx = e.touches[0].clientX - touchLastX;
        const dt = now - touchLastTime;
        if (dt > 0) touchVelocity = dx / dt * 16;
        touchLastX = e.touches[0].clientX; touchLastTime = now;
        const walk = e.touches[0].clientX - touchStartX;
        if (Math.abs(walk) > 3) touchDragMoved = true;
        el.scrollLeft = touchScrollLeft - walk;
      }, { passive: false });

      el.addEventListener("touchend", function () {
        if (Math.abs(touchVelocity) > 0.5) {
          (function tick() {
            touchVelocity *= 0.95;
            if (Math.abs(touchVelocity) < 0.5) return;
            el.scrollLeft -= touchVelocity;
            momentumId = requestAnimationFrame(tick);
          })();
        }
      }, { passive: true });

      el._getDragMoved = function () { return dragMoved || touchDragMoved; };
      el._resetDragMoved = function () { dragMoved = false; touchDragMoved = false; };
    }

    // auto-scroll
    const autoScrollIntervals = [];
    for (let i = 0; i < scrollContainers.length; i++) {
      const el = scrollContainers[i];
      let autoScrollPaused = false, pauseTimeout;
      function autoScroll() {
        if (autoScrollPaused) return;
        const firstChild = el.firstElementChild;
        if (!firstChild) return;
        const itemWidth = firstChild.offsetWidth + 15;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (el.scrollLeft >= maxScroll - 2) {
          el.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          el.scrollTo({ left: el.scrollLeft + itemWidth, behavior: "smooth" });
        }
      }
      autoScrollIntervals.push(setInterval(autoScroll, 3000));
      function pauseAutoScroll() { autoScrollPaused = true; clearTimeout(pauseTimeout); pauseTimeout = setTimeout(function () { autoScrollPaused = false; }, 5000); }
      el.addEventListener("mousedown", pauseAutoScroll);
      el.addEventListener("touchstart", pauseAutoScroll, { passive: true });
    }

    // Mapbox
    if (typeof mapboxgl !== 'undefined') {
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
      const destLng = parseFloat(ct.lng) || 106.927123;
      const destLat = parseFloat(ct.lat) || 47.914678;
      const destZoom = parseInt(ct.zoom) || 17;
      const destCoords = [destLng, destLat];
      const popTitle = ct.popupTitle || 'АндСофт Глобал Партнэр ХХК';
      const popAddr = ct.popupAddress || '';
      const mapContainer = document.getElementById('mapbox-map');
      if (mapContainer) {
        const map = new mapboxgl.Map({
          container: 'mapbox-map',
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: destCoords,
          zoom: destZoom,
          pitch: 0,
          bearing: 0,
          antialias: true
        });
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        const markerEl = document.createElement('div');
        markerEl.className = 'mapbox-marker';
        const markerImg = document.createElement('img');
        markerImg.src = '/images/Logo1.png';
        markerImg.alt = 'АндСофт';
        markerEl.appendChild(markerImg);

        const popupHTML = '<div class="mapbox-popup-inner">' +
          '<img src="/images/Logo1.png" alt="АндСофт" class="mapbox-popup-logo">' +
          '<div class="mapbox-popup-info">' +
          '<div class="mapbox-popup-title">' + popTitle + '</div>' +
          '<div class="mapbox-popup-text">' + popAddr + '</div>' +
          '</div></div>' +
          '<img src="/images/embassy.jpg" alt="Embassy One" class="mapbox-popup-embassy-img">' +
          '<button class="mapbox-popup-directions" onclick="mapboxNavigate()"><ion-icon name="navigate-outline"></ion-icon> Очих</button>';

        const marker = new mapboxgl.Marker(markerEl)
          .setLngLat(destCoords)
          .setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false, closeOnClick: false, maxWidth: '260px', anchor: 'bottom' }).setHTML(popupHTML))
          .addTo(map);
        marker.togglePopup();

        window.mapboxNavigate = function () {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (pos) {
              window.open('https://www.google.com/maps/dir/' + pos.coords.latitude + ',' + pos.coords.longitude + '/' + destLat + ',' + destLng, '_blank');
            }, function () {
              window.open('https://www.google.com/maps/dir/?api=1&destination=' + destLat + ',' + destLng, '_blank');
            });
          } else {
            window.open('https://www.google.com/maps/dir/?api=1&destination=' + destLat + ',' + destLng, '_blank');
          }
        };

        map.on('load', function () { map.resize(); });

        // resize map when navigating to contact
        document.querySelectorAll('[data-nav-link]').forEach(function (link) {
          link.addEventListener('click', function () {
            var txt = (this.querySelector('span') ? this.querySelector('span').textContent : this.textContent).trim().toLowerCase();
            if (txt === 'холбоо барих') setTimeout(function () { map.resize(); }, 50);
          });
        });
      }
    }

    return () => {
      autoScrollIntervals.forEach(id => clearInterval(id));
    };
  }, []);

  return (
    <>
      <Head>
        <title>АндСофт ХХК</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <main>
        {/* SIDEBAR */}
        <aside className="sidebar" data-sidebar>
          <div className="sidebar-info">
            <figure className="avatar-box">
              <img src={sb.logo || "/images/AndSoft-Logo.png"} alt="АндСофт Глобал Партнэр" width="120" className="logo-dark" />
              <img src={sb.logoLight || "/images/AndSoft-Logo-Light.png"} alt="АндСофт Глобал Партнэр" width="120" className="logo-light" />
            </figure>
            <div className="info-content">
              <p className="title">{sb.subtitle || 'IT Компани'}</p>
            </div>
            <button className="info_more-btn" data-sidebar-btn>
              <span>Дэлгэрэнгүй</span>
              <ion-icon name="chevron-down"></ion-icon>
            </button>
          </div>

          <div className="sidebar-info_more">
            <div className="separator"></div>
            <ul className="contacts-list">
              {sb.email && <li className="contact-item">
                <div className="icon-box"><ion-icon name="mail-outline"></ion-icon></div>
                <div className="contact-info">
                  <p className="contact-title">Имэйл</p>
                  <a href={`mailto:${sb.email}`} className="contact-link">{sb.email}</a>
                </div>
              </li>}
              {sb.phone && <li className="contact-item">
                <div className="icon-box"><ion-icon name="phone-portrait-outline"></ion-icon></div>
                <div className="contact-info">
                  <p className="contact-title">Утас</p>
                  <a href={`tel:${sb.phone}`} className="contact-link">{sb.phone}</a>
                </div>
              </li>}
              {sb.address && <li className="contact-item">
                <div className="icon-box"><ion-icon name="location-outline"></ion-icon></div>
                <div className="contact-info">
                  <p className="contact-title">Байршил</p>
                  <address>{sb.address}</address>
                </div>
              </li>}
            </ul>
            <div className="separator"></div>
            <ul className="social-list">
              {sb.facebook && <li className="social-item"><a href={sb.facebook} className="social-link"><ion-icon name="logo-facebook"></ion-icon></a></li>}
              {sb.instagram && <li className="social-item"><a href={sb.instagram} className="social-link"><ion-icon name="logo-instagram"></ion-icon></a></li>}
            </ul>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="main-content">
          {/* NAVBAR */}
          <nav className="navbar">
            <ul className="navbar-list">
              <li className="navbar-item"><button className="navbar-link active" data-nav-link><ion-icon name="home-outline"></ion-icon><span>Танилцуулга</span></button></li>
              <li className="navbar-item"><button className="navbar-link" data-nav-link><ion-icon name="pricetag-outline"></ion-icon><span>Үнэ</span></button></li>
              <li className="navbar-item"><button className="navbar-link" data-nav-link><ion-icon name="cube-outline"></ion-icon><span>Багц</span></button></li>
              <li className="navbar-item"><button className="navbar-link" data-nav-link><ion-icon name="star-outline"></ion-icon><span>Давуу тал</span></button></li>
              <li className="navbar-item"><button className="navbar-link" data-nav-link><ion-icon name="folder-outline"></ion-icon><span>Төсөл</span></button></li>
              <li className="navbar-item"><button className="navbar-link" data-nav-link><ion-icon name="call-outline"></ion-icon><span>Холбоо барих</span></button></li>
              <li className="navbar-item"><button className="theme-toggle navbar-theme-toggle" onClick={() => {
                const html = document.documentElement;
                const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
                html.setAttribute('data-theme', next);
                localStorage.setItem('theme', next);
              }}>
                <ion-icon name="sunny-outline" className="sun-icon"></ion-icon>
                <ion-icon name="moon-outline" className="moon-icon"></ion-icon>
              </button></li>
            </ul>
          </nav>

          {/* ТАНИЛЦУУЛГА */}
          <article className="about active" data-page="танилцуулга">
            <header><h2 className="h2 article-title">Танилцуулга</h2></header>

            <section className="about-text">
              {ab.text ? ab.text.split('\n').filter(p => p.trim()).map((p, i) => <p key={i}>{p}</p>) : <p>Мэдээлэл байхгүй.</p>}
            </section>

            {/* Үйл ажиллагааны чиглэл */}
            <section className="service">
              <h3 className="h3 service-title">Үйл ажиллагааны чиглэл</h3>
              <ul className="service-list">
                {services.map((s, i) => (
                  <li key={i} className="service-item">
                    <div className="service-icon-box"><ion-icon name={s.icon || 'code-slash-outline'} style={{fontSize: '36px', color: 'hsl(208, 96%, 31%)'}}></ion-icon></div>
                    <div className="service-content-box">
                      <h4 className="h4 service-item-title">{s.title}</h4>
                      <p className="service-item-text">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Эрхэм зорилго ба Алсын хараа */}
            <section className="mission-vision">
              <h3 className="h3 service-title" style={{gridColumn: '1 / -1', marginBottom: 0}}>Эрхэм зорилго ба Алсын хараа</h3>
              <div className="mv-card">
                <div className="mv-card-icon"><ion-icon name="flag-outline"></ion-icon></div>
                <div className="mv-card-content">
                  <h3 className="h3 mv-card-title">Эрхэм зорилго</h3>
                  <p>{ab.mission || ''}</p>
                </div>
              </div>
              <div className="mv-card">
                <div className="mv-card-icon"><ion-icon name="eye-outline"></ion-icon></div>
                <div className="mv-card-content">
                  <h3 className="h3 mv-card-title">Алсын хараа</h3>
                  <p>{ab.vision || ''}</p>
                </div>
              </div>
            </section>

            {/* Хамт олон — Puzzle */}
            <section className="testimonials">
              <h3 className="h3 testimonials-title">Хамт олон</h3>
              <div className="puzzle-grid">
                {(() => {
                  const len = team.length;
                  if (!len) return null;
                  const cols = len <= 2 ? len : len <= 3 ? 3 : len <= 6 ? 3 : 4;
                  /* Generate puzzle clip-path polygon for each piece.
                     Each edge can be: flat (0), tab outward (1), blank inward (-1).
                     Neighbours must interlock: one tab, one blank. */
                  const buildPoly = (eT, eR, eB, eL) => {
                    const pts = [];
                    const N = 16; // smoothness of curves
                    const p = (x, y) => pts.push(x.toFixed(2) + '% ' + y.toFixed(2) + '%');
                    // Tab parameters (in %)
                    const depth = 10;  // how far tab protrudes
                    const neckW = 6;   // neck half-width
                    const headW = 8;   // head half-width (> neckW for the round part)
                    // Top edge: left to right
                    p(0, 0);
                    if (eT !== 0) {
                      p(50 - headW - 2, 0);
                      p(50 - neckW, 0);
                      for (let j = 0; j <= N; j++) {
                        const a = Math.PI + (j / N) * Math.PI;
                        p(50 + headW * Math.cos(a), -eT * depth + -eT * depth * 0.6 * Math.sin(a));
                      }
                      p(50 + neckW, 0);
                      p(50 + headW + 2, 0);
                    }
                    p(100, 0);
                    // Right edge: top to bottom
                    if (eR !== 0) {
                      p(100, 50 - headW - 2);
                      p(100, 50 - neckW);
                      for (let j = 0; j <= N; j++) {
                        const a = -Math.PI / 2 + (j / N) * Math.PI;
                        p(100 + eR * depth + eR * depth * 0.6 * Math.cos(a), 50 + headW * Math.sin(a));
                      }
                      p(100, 50 + neckW);
                      p(100, 50 + headW + 2);
                    }
                    p(100, 100);
                    // Bottom edge: right to left
                    if (eB !== 0) {
                      p(50 + headW + 2, 100);
                      p(50 + neckW, 100);
                      for (let j = 0; j <= N; j++) {
                        const a = (j / N) * Math.PI;
                        p(50 + headW * Math.cos(a), 100 + eB * depth + eB * depth * 0.6 * Math.sin(a));
                      }
                      p(50 - neckW, 100);
                      p(50 - headW - 2, 100);
                    }
                    p(0, 100);
                    // Left edge: bottom to top
                    if (eL !== 0) {
                      p(0, 50 + headW + 2);
                      p(0, 50 + neckW);
                      for (let j = 0; j <= N; j++) {
                        const a = Math.PI / 2 + (j / N) * Math.PI;
                        p(-eL * depth + -eL * depth * 0.6 * Math.cos(a), 50 + headW * Math.sin(a));
                      }
                      p(0, 50 - neckW);
                      p(0, 50 - headW - 2);
                    }
                    return 'polygon(' + pts.join(', ') + ')';
                  };
                  return team.map((mbr, i) => {
                    const r = Math.floor(i / cols), c = i % cols;
                    const hasR = c < cols - 1 && i + 1 < len;
                    const hasB = i + cols < len;
                    const hasL = c > 0;
                    const hasT = r > 0;
                    // Determine edge directions — using (r+c)%2 for alternation
                    // Right edge of piece [r,c] = -(Left edge of piece [r,c+1])
                    // Bottom edge of piece [r,c] = -(Top edge of piece [r+1,c])
                    const eR = !hasR ? 0 : ((r + c) % 2 === 0 ? 1 : -1);
                    const eB = !hasB ? 0 : ((r + c) % 2 === 0 ? 1 : -1);
                    // Left = negative of the right edge of the piece to the left
                    const eL = !hasL ? 0 : -((r + (c - 1)) % 2 === 0 ? 1 : -1);
                    // Top = negative of the bottom edge of the piece above
                    const eT = !hasT ? 0 : -(((r - 1) + c) % 2 === 0 ? 1 : -1);
                    const clip = buildPoly(eT, eR, eB, eL);
                    return (
                      <div key={i} className="puzzle-piece" style={{ clipPath: clip }} data-testimonials-item>
                        <img src={mbr.image || '/images/avatar-1.png'} alt={mbr.role} className="puzzle-img" data-testimonials-avatar />
                        <div className="puzzle-overlay">
                          <div className="puzzle-name" data-testimonials-title>{mbr.role}</div>
                        </div>
                        <p className="puzzle-hidden-desc" data-testimonials-text>{mbr.desc}</p>
                      </div>
                    );
                  });
                })()}
              </div>
            </section>

            {/* Хамтрагч байгууллагууд */}
            <section className="clients">
              <h3 className="h3 clients-title">Хамтрагч байгууллагууд</h3>
              <ul className="clients-list has-scrollbar">
                {partners.map((p, i) => (
                  <li key={i} className="clients-item"><a href={p.url || '#'}><img src={p.logo || '/images/partner.png'} alt={p.name} /></a></li>
                ))}
              </ul>
            </section>

            {/* Testimonials Modal */}
            <div className="modal-container" data-modal-container>
              <div className="overlay" data-overlay></div>
              <section className="testimonials-modal">
                <button className="modal-close-btn" data-modal-close-btn><ion-icon name="close-outline"></ion-icon></button>
                <div className="modal-img-wrapper">
                  <figure className="modal-avatar-box"><img src="/images/avatar-1.png" alt="avatar" width="80" data-modal-img /></figure>
                  <img src="/images/icon-quote.svg" alt="quote icon" />
                </div>
                <div className="modal-content">
                  <h4 className="h3 modal-title" data-modal-title>Гишүүн</h4>
                  <time dateTime="2024-01-01"></time>
                  <div data-modal-text><p></p></div>
                </div>
              </section>
            </div>
          </article>

          {/* ҮНЭ */}
          <article className="resume" data-page="үнэ">
            <header><h2 className="h2 article-title">Үйлчилгээний үнэ</h2></header>

            {pricing.map((cat, ci) => (
              <section key={ci} className="timeline accordion-section">
                <div className="title-wrapper accordion-header" data-accordion-header>
                  <div className="icon-box"><ion-icon name={cat.icon || 'pricetag-outline'}></ion-icon></div>
                  <h3 className="h3">{ci + 1}. {cat.name}</h3>
                  <span className="accordion-icon"><ion-icon name="chevron-down"></ion-icon></span>
                </div>
                <ol className="timeline-list accordion-body" data-accordion-body>
                  {(cat.items || []).map((item, ii) => (
                    <li key={ii} className="timeline-item">
                      {item.popular && <span className="timeline-popular-badge">Түгээмэл</span>}
                      <h4 className="h4 timeline-item-title"><ion-icon name={item.icon || 'ellipse-outline'}></ion-icon> {item.title}</h4>
                      <span>{item.price}</span>
                      <p className="timeline-text">{item.desc}</p>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </article>

          {/* БАГЦ */}
          <article className="portfolio" data-page="багц">
            <header><h2 className="h2 article-title">Багцууд</h2></header>
            <section className="pricing-packages">
              <ul className="service-list pricing-grid">
                {packages.map((pkg, i) => (
                  <li key={i} className={`service-item pricing-card${pkg.popular ? ' pricing-card-popular' : ''}`}>
                    <div className="pricing-badge-area">{pkg.popular && <span className="pricing-badge">Түгээмэл</span>}</div>
                    <div className="pricing-icon-circle"><ion-icon name={pkg.icon || 'cube-outline'}></ion-icon></div>
                    <div className="pricing-header">
                      <h4 className="h4 service-item-title pricing-title">{pkg.name}</h4>
                      <span className="pricing-amount">{pkg.price}</span>
                    </div>
                    <div className="service-content-box">
                      <ul className="pricing-features">
                        {(pkg.features || []).map((f, fi) => (
                          <li key={fi}><ion-icon name="checkmark-outline" style={{color: 'hsl(208, 96%, 31%)', fontSize: '16px', flexShrink: 0}}></ion-icon> {f}</li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </article>

          {/* ДАВУУ ТАЛ */}
          <article className="blog" data-page="давуу тал">
            <header><h2 className="h2 article-title">Давуу тал</h2></header>

            {advantages.map((sec, si) => (
              <section key={si} className="advantage-section">
                <div className="advantage-section-header">
                  <span className="advantage-number">{sec.number || String(si + 1).padStart(2, '0')}</span>
                  <h3 className="h3 service-title">{sec.title}</h3>
                </div>
                <ul className="advantage-grid">
                  {(sec.items || []).map((item, ii) => (
                    <li key={ii} className="advantage-card">
                      <div className="advantage-card-icon"><ion-icon name={item.icon || 'star-outline'}></ion-icon></div>
                      <h4 className="h4">{item.title}</h4>
                      <p>{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </article>

          {/* ТӨСӨЛ */}
          <article className="projects" data-page="төсөл">
            <header><h2 className="h2 article-title">Төслүүд</h2></header>

            <ul className="filter-list">
              <li className="filter-item"><button className="filter-btn active" data-filter-btn data-filter="project">Бидний хийсэн төслүүд</button></li>
              <li className="filter-item"><button className="filter-btn" data-filter-btn data-filter="template">Бэлэн загвар, сайтууд</button></li>
            </ul>

            <section className="projects-section">
              <ul className="projects-grid">
                {projects.map((proj, i) => {
                  const tagsArr = typeof proj.tags === 'string' ? proj.tags.split(',').map(t => t.trim()).filter(Boolean) : (proj.tags || []);
                  const imgs = proj.image ? proj.image.split(',').map(s => s.trim()).filter(Boolean) : [];
                  return (
                    <li key={i} className={`project-card${proj.category === 'template' ? ' template-card' : ''}`} data-category={proj.category || 'project'} data-project-card>
                      <figure className="project-img-box"><img src={imgs[0] || '/images/project-1.png'} alt={proj.name} loading="lazy" /></figure>
                      <div className="project-card-content">
                        <h4 className="h4">{proj.name}</h4>
                        <p>{proj.shortDesc}</p>
                        {proj.price && <span className="template-price">{proj.price}</span>}
                        <div className="project-tags">{tagsArr.map((t, ti) => <span key={ti} className="project-tag">{t}</span>)}</div>
                      </div>
                      <div className="project-detail-data" style={{display:'none'}}>
                        <div data-detail-title>{proj.name}</div>
                        <div data-detail-desc>{proj.desc}</div>
                        <div data-detail-imgs>{imgs.join(',')}</div>
                        {proj.price && <div data-detail-price>{proj.price}</div>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Project detail modal */}
            <div className="project-modal-container" data-project-modal>
              <div className="project-modal-overlay" data-project-modal-overlay></div>
              <section className="project-modal">
                <button className="modal-close-btn" data-project-modal-close><ion-icon name="close-outline"></ion-icon></button>
                <h3 className="h3 project-modal-title" data-project-modal-title></h3>
                <p className="project-modal-desc" data-project-modal-desc></p>
                <div className="project-modal-gallery" data-project-modal-gallery></div>
                <div className="project-modal-price" data-project-modal-price style={{display:'none'}}></div>
                <div className="project-modal-actions">
                  <a href="#" target="_blank" rel="noopener noreferrer" className="project-modal-btn" data-project-modal-link>
                    <ion-icon name="eye-outline"></ion-icon><span>Сайт үзэх</span>
                  </a>
                  <button type="button" className="project-modal-btn project-modal-btn-primary" data-project-modal-order-btn>
                    <ion-icon name="cart-outline"></ion-icon><span>Захиалах</span>
                  </button>
                </div>
                <div className="project-order-form" data-project-order-form style={{display:'none'}}>
                  <h4 className="h4" style={{marginBottom: '16px', color: 'var(--white-2)'}}>Захиалга өгөх</h4>
                  <form className="project-order-form-inner" data-order-form-inner>
                    <input type="text" name="name" className="form-input" placeholder="Нэр" required />
                    <input type="tel" name="phone" className="form-input" placeholder="Утасны дугаар" required />
                    <input type="email" name="email" className="form-input" placeholder="Имэйл хаяг" required />
                    <textarea name="message" className="form-input" placeholder="Тайлбар" rows="3"></textarea>
                    <button type="submit" className="project-modal-btn project-modal-btn-primary" style={{width:'100%', justifyContent:'center'}}>
                      <ion-icon name="send-outline"></ion-icon><span>Илгээх</span>
                    </button>
                  </form>
                </div>
              </section>
            </div>

            {/* Image Lightbox */}
            <div className="lightbox" data-lightbox>
              <div className="lightbox-overlay" data-lightbox-close></div>
              <button className="lightbox-close" data-lightbox-close><ion-icon name="close-outline"></ion-icon></button>
              <button className="lightbox-nav lightbox-prev" data-lightbox-prev><ion-icon name="chevron-back-outline"></ion-icon></button>
              <button className="lightbox-nav lightbox-next" data-lightbox-next><ion-icon name="chevron-forward-outline"></ion-icon></button>
              <img className="lightbox-img" data-lightbox-img src="" alt="Preview" />
            </div>
          </article>

          {/* ХОЛБОО БАРИХ */}
          <article className="contact" data-page="холбоо барих">
            <header><h2 className="h2 article-title">Холбоо барих</h2></header>

            <section className="mapbox" data-mapbox>
              <figure><div id="mapbox-map"></div></figure>
            </section>

            <section className="contact-info-section" style={{marginBottom: '30px'}}>
              <ul className="service-list">
                {ct.email && <li className="service-item">
                  <div className="service-icon-box"><ion-icon name="mail-outline" style={{fontSize: '24px', color: 'hsl(208, 96%, 31%)'}}></ion-icon></div>
                  <div className="service-content-box">
                    <h4 className="h4 service-item-title">Имэйл</h4>
                    <p className="service-item-text">{ct.email}</p>
                  </div>
                </li>}
                {ct.phone && <li className="service-item">
                  <div className="service-icon-box"><ion-icon name="call-outline" style={{fontSize: '24px', color: 'hsl(208, 96%, 31%)'}}></ion-icon></div>
                  <div className="service-content-box">
                    <h4 className="h4 service-item-title">Утас</h4>
                    <p className="service-item-text">{ct.phone}</p>
                  </div>
                </li>}
              </ul>
            </section>

            <section className="contact-form">
              <h3 className="h3 form-title">Мессеж илгээх</h3>
              <form action="#" className="form" data-form>
                <div className="input-wrapper">
                  <input type="text" name="fullname" className="form-input" placeholder="Нэр" required data-form-input />
                  <input type="email" name="email" className="form-input" placeholder="Имэйл хаяг" required data-form-input />
                </div>
                <div className="input-wrapper">
                  <input type="tel" name="phone" className="form-input" placeholder="Утасны дугаар" required data-form-input />

                  <select name="service" className="form-input form-select" required data-form-input style={{display:'none'}}>
                    <option value="" disabled defaultValue>Үйлчилгээ сонгох</option>
                    {pricing.map((cat, ci) => (
                      <optgroup key={ci} label={`── ${cat.name} ──`}>
                        {(cat.items || []).map((item, ii) => (
                          <option key={ii} value={item.title}>{item.title} — {item.price}</option>
                        ))}
                      </optgroup>
                    ))}
                    {packages.length > 0 && <optgroup label="── Багц ──">
                      {packages.map((pkg, pi) => (
                        <option key={pi} value={pkg.name}>{pkg.name} — {pkg.price}</option>
                      ))}
                    </optgroup>}
                    <optgroup label="── Нэмэлт ──">
                      <option value="other">Бусад</option>
                    </optgroup>
                  </select>

                  {/* Custom dropdown */}
                  <div className="custom-select" data-custom-select>
                    <button type="button" className="custom-select-trigger form-input" data-custom-select-trigger>
                      <span className="custom-select-value">Үйлчилгээ сонгох</span>
                      <ion-icon name="chevron-down" className="custom-select-icon"></ion-icon>
                    </button>
                    <div className="custom-select-dropdown" data-custom-select-dropdown>
                      {pricing.map((cat, ci) => (
                        <div key={ci}>
                          <div className="custom-select-group-label">{cat.name}</div>
                          {(cat.items || []).map((item, ii) => (
                            <div key={ii} className="custom-select-option" data-value={item.title}>
                              <ion-icon name={item.icon || 'ellipse-outline'}></ion-icon>
                              <div className="custom-select-option-text"><span>{item.title}</span><small>{item.price}</small></div>
                            </div>
                          ))}
                        </div>
                      ))}
                      {packages.length > 0 && <>
                        <div className="custom-select-group-label">Багц</div>
                        {packages.map((pkg, pi) => (
                          <div key={pi} className="custom-select-option" data-value={pkg.name}>
                            <ion-icon name={pkg.icon || 'cube-outline'}></ion-icon>
                            <div className="custom-select-option-text"><span>{pkg.name}</span><small>{pkg.price}</small></div>
                          </div>
                        ))}
                      </>}
                      <div className="custom-select-group-label">Нэмэлт</div>
                      <div className="custom-select-option" data-value="other">
                        <ion-icon name="ellipsis-horizontal-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>Бусад</span><small>&nbsp;</small></div>
                      </div>
                    </div>
                  </div>
                </div>

                <textarea name="message" className="form-input" placeholder="Таны мессеж" required data-form-input></textarea>

                <button className="form-btn" type="submit" disabled data-form-btn>
                  <ion-icon name="paper-plane"></ion-icon>
                  <span>Мессеж илгээх</span>
                </button>
              </form>
            </section>
          </article>

        </div>
      </main>
    </>
  );
}

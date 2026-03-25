import { useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
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
        var _mHex = '', _mStr = JSON.stringify(_msg);
        for (var _i = 0; _i < _mStr.length; _i++) { var _c = _mStr.charCodeAt(_i).toString(16); _mHex += (_c.length < 2 ? '0' : '') + _c; }
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
        var _oHex = '', _oStr = JSON.stringify(_ord);
        for (var _j = 0; _j < _oStr.length; _j++) { var _d = _oStr.charCodeAt(_j).toString(16); _oHex += (_d.length < 2 ? '0' : '') + _d; }
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
      const destCoords = [106.927123, 47.914678];
      const mapContainer = document.getElementById('mapbox-map');
      if (mapContainer) {
        const map = new mapboxgl.Map({
          container: 'mapbox-map',
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: destCoords,
          zoom: 17,
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
          '<div class="mapbox-popup-title">АндСофт Глобал Партнэр ХХК</div>' +
          '<div class="mapbox-popup-text">Embassy One бизнес оффис 10 давхарт<br>Улаанбаатар, Монгол</div>' +
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
              window.open('https://www.google.com/maps/dir/' + pos.coords.latitude + ',' + pos.coords.longitude + '/47.914678,106.927123', '_blank');
            }, function () {
              window.open('https://maps.app.goo.gl/SLDCYq9tcWUZjs5K9', '_blank');
            });
          } else {
            window.open('https://maps.app.goo.gl/SLDCYq9tcWUZjs5K9', '_blank');
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
              <img src="/images/AndSoft-Logo.png" alt="АндСофт Глобал Партнэр" width="120" className="logo-dark" />
              <img src="/images/AndSoft-Logo-Light.png" alt="АндСофт Глобал Партнэр" width="120" className="logo-light" />
            </figure>
            <div className="info-content">
              <p className="title">IT Компани</p>
            </div>
            <button className="info_more-btn" data-sidebar-btn>
              <span>Дэлгэрэнгүй</span>
              <ion-icon name="chevron-down"></ion-icon>
            </button>
          </div>

          <div className="sidebar-info_more">
            <div className="separator"></div>
            <ul className="contacts-list">
              <li className="contact-item">
                <div className="icon-box"><ion-icon name="mail-outline"></ion-icon></div>
                <div className="contact-info">
                  <p className="contact-title">Имэйл</p>
                  <a href="mailto:AndSoftGP@protonmail.com" className="contact-link">AndSoftGP@protonmail.com</a>
                </div>
              </li>
              <li className="contact-item">
                <div className="icon-box"><ion-icon name="phone-portrait-outline"></ion-icon></div>
                <div className="contact-info">
                  <p className="contact-title">Утас</p>
                  <a href="tel:+97694496014" className="contact-link">9449-6014</a>
                </div>
              </li>
              <li className="contact-item">
                <div className="icon-box"><ion-icon name="location-outline"></ion-icon></div>
                <div className="contact-info">
                  <p className="contact-title">Байршил</p>
                  <address>Улаанбаатар, Embassy One бизнес оффис 10 давхарт</address>
                </div>
              </li>
            </ul>
            <div className="separator"></div>
            <ul className="social-list">
              <li className="social-item"><a href="#" className="social-link"><ion-icon name="logo-facebook"></ion-icon></a></li>
              <li className="social-item"><a href="#" className="social-link"><ion-icon name="logo-instagram"></ion-icon></a></li>
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
              <p>АндСофт Глобал Партнэр компани нь оюутан наснаас эхэлсэн нөхөрлөл, хамтын мөрөөдлөөс төрсөн мэдээлэл технологийн компани юм. Манай компани вебсайт болон мобайл аппликейшн хөгжүүлэлтийн чиглэлээр үйл ажиллагаа явуулдаг бөгөөд салбартаа хөгжиж буй чадварлаг залуу хамт олонтой.</p>
              <p>Манай хамт олон 5 хүний бүрэлдэхүүнтэй бөгөөд програм хангамжийн хөгжүүлэлт, UI/UX дизайн, системийн дизайн зэрэг чиглэлүүдээр мэргэшсэн. Бид байгууллагын хэрэгцээ шаардлагад нийцсэн, орчин үеийн технологид суурилсан, найдвартай шийдлүүдийг санал болгон ажилладаг.</p>
            </section>

            {/* Үйл ажиллагааны чиглэл */}
            <section className="service">
              <h3 className="h3 service-title">Үйл ажиллагааны чиглэл</h3>
              <ul className="service-list">
                <li className="service-item">
                  <div className="service-icon-box"><ion-icon name="globe-outline" style={{fontSize: '36px', color: 'var(--orange-yellow-crayola)'}}></ion-icon></div>
                  <div className="service-content-box">
                    <h4 className="h4 service-item-title">Байгууллагын вебсайт хөгжүүлэлт</h4>
                    <p className="service-item-text">Орчин үеийн технологид суурилсан, хариуцлагатай вебсайт хөгжүүлэлт.</p>
                  </div>
                </li>
                <li className="service-item">
                  <div className="service-icon-box"><ion-icon name="phone-portrait-outline" style={{fontSize: '36px', color: 'var(--orange-yellow-crayola)'}}></ion-icon></div>
                  <div className="service-content-box">
                    <h4 className="h4 service-item-title">Мобайл аппликейшн (iOS, Android)</h4>
                    <p className="service-item-text">iOS болон Android платформд зориулсан мэргэжлийн аппликейшн хөгжүүлэлт.</p>
                  </div>
                </li>
                <li className="service-item">
                  <div className="service-icon-box"><ion-icon name="settings-outline" style={{fontSize: '36px', color: 'var(--orange-yellow-crayola)'}}></ion-icon></div>
                  <div className="service-content-box">
                    <h4 className="h4 service-item-title">Байгууллагын дотоод систем (CRM, ERP)</h4>
                    <p className="service-item-text">Байгууллагын үйл ажиллагааг автоматжуулах дотоод системийн шийдэл.</p>
                  </div>
                </li>
                <li className="service-item">
                  <div className="service-icon-box"><ion-icon name="code-slash-outline" style={{fontSize: '36px', color: 'var(--orange-yellow-crayola)'}}></ion-icon></div>
                  <div className="service-content-box">
                    <h4 className="h4 service-item-title">Backend систем болон API хөгжүүлэлт</h4>
                    <p className="service-item-text">Найдвартай backend систем, API интеграци болон UI/UX дизайны шийдэл.</p>
                  </div>
                </li>
              </ul>
            </section>

            {/* Эрхэм зорилго ба Алсын хараа */}
            <section className="mission-vision">
              <h3 className="h3 service-title" style={{gridColumn: '1 / -1', marginBottom: 0}}>Эрхэм зорилго ба Алсын хараа</h3>
              <div className="mv-card">
                <div className="mv-card-icon"><ion-icon name="flag-outline"></ion-icon></div>
                <div className="mv-card-content">
                  <h3 className="h3 mv-card-title">Эрхэм зорилго</h3>
                  <p>Орчин үеийн технологийн шийдлээр дамжуулан байгууллагуудын үйл ажиллагааг хялбарчилж, үр ашигтай болгоход хувь нэмэр оруулах.</p>
                </div>
              </div>
              <div className="mv-card">
                <div className="mv-card-icon"><ion-icon name="eye-outline"></ion-icon></div>
                <div className="mv-card-content">
                  <h3 className="h3 mv-card-title">Алсын хараа</h3>
                  <p>Мэдээлэл технологид суурилсан, олон салбарыг хамарсан дэлхийн түншлэлийн экосистемийг бүтээх.</p>
                </div>
              </div>
            </section>

            {/* Хамт олон */}
            <section className="testimonials">
              <h3 className="h3 testimonials-title">Хамт олон</h3>
              <ul className="testimonials-list has-scrollbar">
                <li className="testimonials-item">
                  <div className="content-card" data-testimonials-item>
                    <figure className="testimonials-avatar-box"><img src="/images/avatar-1.png" alt="CEO" width="60" data-testimonials-avatar /></figure>
                    <h4 className="h4 testimonials-item-title" data-testimonials-title>Гүйцэтгэх захирал (CEO)</h4>
                    <div className="testimonials-text" data-testimonials-text><p>Санхүү, маркетинг, компанийн ерөнхий удирдлагыг хариуцна.</p></div>
                  </div>
                </li>
                <li className="testimonials-item">
                  <div className="content-card" data-testimonials-item>
                    <figure className="testimonials-avatar-box"><img src="/images/avatar-2.png" alt="CTO" width="60" data-testimonials-avatar /></figure>
                    <h4 className="h4 testimonials-item-title" data-testimonials-title>Дэд захирал / CTO</h4>
                    <div className="testimonials-text" data-testimonials-text><p>Системийн архитектур, Backend, Data analysis, нийт хөгжүүлэлт хариуцна. Developer баг удирдана.</p></div>
                  </div>
                </li>
                <li className="testimonials-item">
                  <div className="content-card" data-testimonials-item>
                    <figure className="testimonials-avatar-box"><img src="/images/avatar-3.png" alt="Product Designer" width="60" data-testimonials-avatar /></figure>
                    <h4 className="h4 testimonials-item-title" data-testimonials-title>Product Designer / UI UX</h4>
                    <div className="testimonials-text" data-testimonials-text><p>Апп, вэбийн дизайн, хэрэглэгчийн туршлага (UX), интерфейс (UI) хариуцна.</p></div>
                  </div>
                </li>
                <li className="testimonials-item">
                  <div className="content-card" data-testimonials-item>
                    <figure className="testimonials-avatar-box"><img src="/images/avatar-4.png" alt="Business Development" width="60" data-testimonials-avatar /></figure>
                    <h4 className="h4 testimonials-item-title" data-testimonials-title>Business Development Manager</h4>
                    <div className="testimonials-text" data-testimonials-text><p>Харилцагчтай уулзалт, захиалга авах, маркетинг, сурталчилгаа хариуцна.</p></div>
                  </div>
                </li>
                <li className="testimonials-item">
                  <div className="content-card" data-testimonials-item>
                    <figure className="testimonials-avatar-box"><img src="/images/avatar-1.png" alt="Frontend Architect" width="60" data-testimonials-avatar /></figure>
                    <h4 className="h4 testimonials-item-title" data-testimonials-title>Frontend Architect</h4>
                    <div className="testimonials-text" data-testimonials-text><p>Вэб, аппын хэрэглэгчид харагдах интерфэйс хөгжүүлэх. UI-г код болгох (Next, React, Flutter гэх мэт).</p></div>
                  </div>
                </li>
              </ul>
            </section>

            {/* Хамтрагч байгууллагууд */}
            <section className="clients">
              <h3 className="h3 clients-title">Хамтрагч байгууллагууд</h3>
              <ul className="clients-list has-scrollbar">
                <li className="clients-item"><a href="https://www.bersfinance.mn"><img src="/images/bers.png" alt="Бэрс Финанс" /></a></li>
                <li className="clients-item"><a href="https://www.bichilglobus.mn"><img src="/images/bichil.svg" alt="Бичил Глобүс" /></a></li>
                <li className="clients-item"><a href="https://baavar.mn"><img src="/images/baavar.png" alt="Баавар Сугалаа" /></a></li>
                <li className="clients-item"><a href="https://sono.mn"><img src="/images/sono.webp" alt="Соно" /></a></li>
                <li className="clients-item"><a href="https://topica.mn"><img src="/images/Топика.png" alt="Топика" /></a></li>
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

            {/* Вебсайт хийх үнэ */}
            <section className="timeline accordion-section">
              <div className="title-wrapper accordion-header" data-accordion-header>
                <div className="icon-box"><ion-icon name="globe-outline"></ion-icon></div>
                <h3 className="h3">1. Вебсайт хийх үнэ</h3>
                <ion-icon name="chevron-down" className="accordion-icon"></ion-icon>
              </div>
              <ol className="timeline-list accordion-body" data-accordion-body>
                <li className="timeline-item">
                  <h4 className="h4 timeline-item-title"><ion-icon name="newspaper-outline"></ion-icon> Энгийн вебсайт (танилцуулга сайт)</h4>
                  <span>200,000 – 500,000₮</span>
                  <p className="timeline-text">3–5 хуудас (Home, About, Contact). Responsive дизайн.</p>
                </li>
                <li className="timeline-item">
                  <span className="timeline-popular-badge">Түгээмэл</span>
                  <h4 className="h4 timeline-item-title"><ion-icon name="briefcase-outline"></ion-icon> Дунд түвшин (Business сайт)</h4>
                  <span>600,000 – 2,500,000₮</span>
                  <p className="timeline-text">Admin хэсэгтэй. Мэдээлэл, зураг нэмэх боломжтой.</p>
                </li>
                <li className="timeline-item">
                  <h4 className="h4 timeline-item-title"><ion-icon name="construct-outline"></ion-icon> Хүнд (Custom системтэй веб)</h4>
                  <span>3,000,000 – 8,000,000₮ (+)</span>
                  <p className="timeline-text">Захиалга, хэрэглэгчийн бүртгэл. Төлбөр, API холболт.</p>
                </li>
              </ol>
            </section>

            {/* Гар утасны апп */}
            <section className="timeline accordion-section">
              <div className="title-wrapper accordion-header" data-accordion-header>
                <div className="icon-box"><ion-icon name="phone-portrait-outline"></ion-icon></div>
                <h3 className="h3">2. Гар утасны апп (Android / iOS)</h3>
                <ion-icon name="chevron-down" className="accordion-icon"></ion-icon>
              </div>
              <ol className="timeline-list accordion-body" data-accordion-body>
                <li className="timeline-item">
                  <h4 className="h4 timeline-item-title"><ion-icon name="phone-portrait-outline"></ion-icon> Энгийн түвшиний апп</h4>
                  <span>500,000 – 1,000,000₮</span>
                  <p className="timeline-text">Танилцуулга, мэдээлэл харах.</p>
                </li>
                <li className="timeline-item">
                  <span className="timeline-popular-badge">Түгээмэл</span>
                  <h4 className="h4 timeline-item-title"><ion-icon name="apps-outline"></ion-icon> Дунд түвшиний апп</h4>
                  <span>1,500,000 – 6,000,000₮</span>
                  <p className="timeline-text">Login, өгөгдөл хадгалах. API холболт.</p>
                </li>
                <li className="timeline-item">
                  <h4 className="h4 timeline-item-title"><ion-icon name="server-outline"></ion-icon> Том систем апп</h4>
                  <span>7,000,000 – 15,000,000₮ (+)</span>
                  <p className="timeline-text">Чат, төлбөр, realtime систем.</p>
                </li>
                <li className="timeline-item">
                  <h4 className="h4 timeline-item-title"><ion-icon name="chatbubble-ellipses-outline"></ion-icon> AI chatbot + Админ эрхээс модел сургана</h4>
                  <span>3,000,000 – 4,000,000₮</span>
                  <p className="timeline-text">AI суурьтай чатбот систем, админ эрхээр модел сургах боломжтой.</p>
                </li>
              </ol>
            </section>

            {/* Систем / автоматжуулалт */}
            <section className="timeline accordion-section">
              <div className="title-wrapper accordion-header" data-accordion-header>
                <div className="icon-box"><ion-icon name="settings-outline"></ion-icon></div>
                <h3 className="h3">3. Систем / Автоматжуулалт</h3>
                <ion-icon name="chevron-down" className="accordion-icon"></ion-icon>
              </div>
              <ol className="timeline-list accordion-body" data-accordion-body>
                <li className="timeline-item">
                  <h4 className="h4 timeline-item-title"><ion-icon name="sync-outline"></ion-icon> Жижиг автоматжуулалт</h4>
                  <span>500,000 – 1,200,000₮</span>
                  <p className="timeline-text">Excel → систем. Тайлан, workflow гэх мэт.</p>
                </li>
                <li className="timeline-item">
                  <span className="timeline-popular-badge">Түгээмэл</span>
                  <h4 className="h4 timeline-item-title"><ion-icon name="grid-outline"></ion-icon> Дунд систем</h4>
                  <span>2,000,000 – 7,000,000₮</span>
                  <p className="timeline-text">CRM, бүртгэл, удирдлага.</p>
                </li>
                <li className="timeline-item">
                  <h4 className="h4 timeline-item-title"><ion-icon name="layers-outline"></ion-icon> Том систем (custom ERP)</h4>
                  <span>8,000,000 – 20,000,000₮ (+)</span>
                  <p className="timeline-text">Байгууллагын бүрэн систем.</p>
                </li>
              </ol>
            </section>

            {/* Нэмэлт үйлчилгээ */}
            <section className="timeline accordion-section">
              <div className="title-wrapper accordion-header" data-accordion-header>
                <div className="icon-box"><ion-icon name="add-circle-outline"></ion-icon></div>
                <h3 className="h3">Нэмэлт үйлчилгээ</h3>
                <ion-icon name="chevron-down" className="accordion-icon"></ion-icon>
              </div>
              <ol className="timeline-list accordion-body" data-accordion-body>
                <li className="timeline-item">
                  <h4 className="h4 timeline-item-title"><ion-icon name="cloud-outline"></ion-icon> Hosting setup</h4>
                  <span>160,000₮ – 260,000₮</span>
                  <p className="timeline-text">Манайхаас гарган (domain, hosting-server).</p>
                </li>
                <li className="timeline-item">
                  <span className="timeline-popular-badge">Түгээмэл</span>
                  <h4 className="h4 timeline-item-title"><ion-icon name="color-palette-outline"></ion-icon> UI/UX дизайн</h4>
                  <span>300,000 – 1,000,000₮</span>
                  <p className="timeline-text">Хэрэглэгчийн туршлагын дизайны шийдэл.</p>
                </li>
                <li className="timeline-item">
                  <h4 className="h4 timeline-item-title"><ion-icon name="hammer-outline"></ion-icon> Bug fix / update</h4>
                  <span>30,000 – 80,000₮</span>
                  <p className="timeline-text">Алдаа засах, шинэчлэлт хийх.</p>
                </li>
              </ol>
            </section>
          </article>

          {/* БАГЦ */}
          <article className="portfolio" data-page="багц">
            <header><h2 className="h2 article-title">Багцууд</h2></header>
            <section className="pricing-packages">
              <ul className="service-list pricing-grid">
                <li className="service-item pricing-card">
                  <div className="pricing-badge-area"></div>
                  <div className="pricing-icon-circle"><ion-icon name="leaf-outline"></ion-icon></div>
                  <div className="pricing-header">
                    <h4 className="h4 service-item-title pricing-title">Starter багц</h4>
                    <span className="pricing-amount">1,500,000₮</span>
                  </div>
                  <div className="service-content-box">
                    <ul className="pricing-features">
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> Танилцуулга сайт</li>
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> Админ эрх</li>
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> Responsive дизайн</li>
                    </ul>
                  </div>
                </li>
                <li className="service-item pricing-card">
                  <div className="pricing-badge-area"></div>
                  <div className="pricing-icon-circle"><ion-icon name="diamond-outline"></ion-icon></div>
                  <div className="pricing-header">
                    <h4 className="h4 service-item-title pricing-title">Basic багц</h4>
                    <span className="pricing-amount">6,000,000₮</span>
                  </div>
                  <div className="service-content-box">
                    <ul className="pricing-features">
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> Админ эрх</li>
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> Сайт</li>
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> Чатбот</li>
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> UI/UX дизайн</li>
                    </ul>
                  </div>
                </li>
                <li className="service-item pricing-card pricing-card-popular">
                  <div className="pricing-badge-area"><span className="pricing-badge">Түгээмэл</span></div>
                  <div className="pricing-icon-circle"><ion-icon name="briefcase-outline"></ion-icon></div>
                  <div className="pricing-header">
                    <h4 className="h4 service-item-title pricing-title">Business багц</h4>
                    <span className="pricing-amount">15,000,000₮</span>
                  </div>
                  <div className="service-content-box">
                    <ul className="pricing-features">
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> Веб</li>
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> Апп</li>
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> Систем</li>
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> API холболт</li>
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> Тусгай дизайн</li>
                    </ul>
                  </div>
                </li>
                <li className="service-item pricing-card">
                  <div className="pricing-badge-area"></div>
                  <div className="pricing-icon-circle"><ion-icon name="rocket-outline"></ion-icon></div>
                  <div className="pricing-header">
                    <h4 className="h4 service-item-title pricing-title">Premium багц</h4>
                    <span className="pricing-amount">30,000,000₮</span>
                  </div>
                  <div className="service-content-box">
                    <ul className="pricing-features">
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> Веб</li>
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> Апп</li>
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> Систем</li>
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> AI чатбот</li>
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> Бүрэн тусгай дизайн</li>
                      <li><ion-icon name="checkmark-outline" className="feature-icon"></ion-icon> Дэмжлэг, засвар</li>
                    </ul>
                  </div>
                </li>
              </ul>
            </section>
          </article>

          {/* ДАВУУ ТАЛ */}
          <article className="blog" data-page="давуу тал">
            <header><h2 className="h2 article-title">Давуу тал</h2></header>

            <section className="advantage-section">
              <div className="advantage-section-header">
                <span className="advantage-number">01</span>
                <h3 className="h3 service-title">Манай багийн давуу тал</h3>
              </div>
              <ul className="advantage-grid">
                <li className="advantage-card">
                  <div className="advantage-card-icon"><ion-icon name="flash-outline"></ion-icon></div>
                  <h4 className="h4">Хурдтай, уян хатан гүйцэтгэл</h4>
                  <p>Төслийг хурдан, оновчтой хугацаанд хүлээлгэн өгнө.</p>
                </li>
                <li className="advantage-card">
                  <div className="advantage-card-icon"><ion-icon name="bulb-outline"></ion-icon></div>
                  <h4 className="h4">Захиалагчид тохирсон шийдэл</h4>
                  <p>Хэрэгцээнд нийцсэн, бизнесийн зорилгод чиглэсэн шийдэл боловсруулна.</p>
                </li>
                <li className="advantage-card">
                  <div className="advantage-card-icon"><ion-icon name="rocket-outline"></ion-icon></div>
                  <h4 className="h4">Шинэлэг технологи</h4>
                  <p>Орчин үеийн хамгийн сүүлийн үеийн технологиудыг ашиглана.</p>
                </li>
                <li className="advantage-card">
                  <div className="advantage-card-icon"><ion-icon name="shield-checkmark-outline"></ion-icon></div>
                  <h4 className="h4">Хариуцлагатай хамтын ажиллагаа</h4>
                  <p>Нээлттэй, ил тод, итгэлтэй хамтын ажиллагааг эрхэмлэнэ.</p>
                </li>
                <li className="advantage-card">
                  <div className="advantage-card-icon"><ion-icon name="people-outline"></ion-icon></div>
                  <h4 className="h4">Багийн хүчирхэг ажиллагаа</h4>
                  <p>5 мэргэшсэн гишүүнтэй, багаар хамтран ажиллах өндөр чадвартай.</p>
                </li>
              </ul>
            </section>

            <section className="advantage-section">
              <div className="advantage-section-header">
                <span className="advantage-number">02</span>
                <h3 className="h3 service-title">Туршлага, хэрэгжүүлсэн ажлууд</h3>
              </div>
              <ul className="advantage-grid">
                <li className="advantage-card">
                  <div className="advantage-card-icon"><ion-icon name="business-outline"></ion-icon></div>
                  <h4 className="h4">Санхүүгийн байгууллагууд</h4>
                  <p>Банк бус санхүүгийн байгууллагуудтай хамтарсан төслүүд амжилттай хэрэгжүүлсэн.</p>
                </li>
                <li className="advantage-card">
                  <div className="advantage-card-icon"><ion-icon name="code-slash-outline"></ion-icon></div>
                  <h4 className="h4">Хөгжүүлэлтийн ажлууд</h4>
                  <p>Нэг удаагийн болон богино хугацааны хөгжүүлэлтийн шаардлагуудыг чанартай биелүүлсэн.</p>
                </li>
                <li className="advantage-card">
                  <div className="advantage-card-icon"><ion-icon name="checkmark-done-outline"></ion-icon></div>
                  <h4 className="h4">Захиалагчид тохирсон шийдэл</h4>
                  <p>Захиалагчийн шаардлагад нийцсэн веб болон системийн шийдлүүдийг хугацаанд нь, чанартай гүйцэтгэсэн.</p>
                </li>
              </ul>
            </section>

            <section className="advantage-section">
              <div className="advantage-section-header">
                <span className="advantage-number">03</span>
                <h3 className="h3 service-title">Хамтын ажиллагаа</h3>
              </div>
              <ul className="advantage-grid">
                <li className="advantage-card">
                  <div className="advantage-card-icon"><ion-icon name="globe-outline"></ion-icon></div>
                  <h4 className="h4">Шинэ бүтээгдэхүүн</h4>
                  <p>Шинэ вебсайт, аппликейшн хөгжүүлэх.</p>
                </li>
                <li className="advantage-card">
                  <div className="advantage-card-icon"><ion-icon name="build-outline"></ion-icon></div>
                  <h4 className="h4">Систем сайжруулалт</h4>
                  <p>Одоо ашиглаж буй системийг сайжруулах, автоматжуулалт хийх.</p>
                </li>
                <li className="advantage-card">
                  <div className="advantage-card-icon"><ion-icon name="trending-up-outline"></ion-icon></div>
                  <h4 className="h4">Урт хугацааны түншлэл</h4>
                  <p>Урт хугацааны технологийн хамтын ажиллагааг зорьдог. Захиалагчийн бизнесийн зорилгод нийцсэн шийдлийг санал болгож, хамтран хөгжинө.</p>
                </li>
              </ul>
            </section>
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
                {/* Хийсэн төслүүд */}
                <li className="project-card" data-category="project" data-project-card>
                  <figure className="project-img-box"><img src="/images/project-1.png" alt="ББСБ вебсайт" loading="lazy" /></figure>
                  <div className="project-card-content">
                    <h4 className="h4">ББСБ вебсайт</h4>
                    <p>Банк бус санхүүгийн байгууллагын танилцуулга сайт, онлайн зээлийн хүсэлт.</p>
                    <div className="project-tags"><span className="project-tag">Веб</span><span className="project-tag">Систем</span></div>
                  </div>
                  <div className="project-detail-data" style={{display:'none'}}>
                    <div data-detail-title>ББСБ вебсайт</div>
                    <div data-detail-desc>Банк бус санхүүгийн байгууллагын бүрэн танилцуулга сайт. Онлайн зээлийн хүсэлт хүлээн авах систем, автомат тооцоолуур, хэрэглэгчийн бүртгэл, админ удирдлагын самбартай. Responsive дизайн, SEO оновчлолтой.</div>
                    <div data-detail-imgs>/images/project-1.png,/images/project-1.png,/images/project-1.png,/images/project-1.png,/images/project-1.png,/images/project-1.png</div>
                  </div>
                </li>

                <li className="project-card" data-category="project" data-project-card>
                  <figure className="project-img-box"><img src="/images/project-2.png" alt="Бизнес удирдлагын апп" loading="lazy" /></figure>
                  <div className="project-card-content">
                    <h4 className="h4">Бизнес удирдлагын апп</h4>
                    <p>Байгууллагын дотоод үйл ажиллагааг удирдах мобайл аппликейшн.</p>
                    <div className="project-tags"><span className="project-tag">Апп</span><span className="project-tag">Android</span><span className="project-tag">iOS</span></div>
                  </div>
                  <div className="project-detail-data" style={{display:'none'}}>
                    <div data-detail-title>Бизнес удирдлагын апп</div>
                    <div data-detail-desc>Байгууллагын дотоод үйл ажиллагааг бүрэн удирдах мобайл аппликейшн. Ажилтны бүртгэл, цагийн хуваарь, мэдэгдэл, тайлан, дотоод чат систем. Android болон iOS хоёулаад дээр ажиллана.</div>
                    <div data-detail-imgs>/images/project-2.png,/images/project-2.png,/images/project-2.png,/images/project-2.png,/images/project-2.png,/images/project-2.png</div>
                  </div>
                </li>

                <li className="project-card" data-category="project" data-project-card>
                  <figure className="project-img-box"><img src="/images/project-3.png" alt="AI Чатбот" loading="lazy" /></figure>
                  <div className="project-card-content">
                    <h4 className="h4">AI Чатбот систем</h4>
                    <p>AI суурьтай чатбот. Админ эрхээс модел сургах боломжтой.</p>
                    <div className="project-tags"><span className="project-tag">AI</span><span className="project-tag">Чатбот</span></div>
                  </div>
                  <div className="project-detail-data" style={{display:'none'}}>
                    <div data-detail-title>AI Чатбот систем</div>
                    <div data-detail-desc>Хэрэглэгчийн асуултанд автоматаар хариулдаг AI суурьтай чатбот систем. Админ панелаас өөрийн датагаар модел сургах, хариултуудыг удирдах, анализ хийх боломжтой. Вебсайт болон аппд шууд холбож ашиглана.</div>
                    <div data-detail-imgs>/images/project-3.png,/images/project-3.png,/images/project-3.png,/images/project-3.png,/images/project-3.png,/images/project-3.png</div>
                  </div>
                </li>

                <li className="project-card" data-category="project" data-project-card>
                  <figure className="project-img-box"><img src="/images/project-4.png" alt="CRM систем" loading="lazy" /></figure>
                  <div className="project-card-content">
                    <h4 className="h4">CRM систем</h4>
                    <p>Харилцагчийн бүртгэл, захиалгын удирдлага, тайлан тооцоо.</p>
                    <div className="project-tags"><span className="project-tag">Систем</span><span className="project-tag">CRM</span></div>
                  </div>
                  <div className="project-detail-data" style={{display:'none'}}>
                    <div data-detail-title>CRM систем</div>
                    <div data-detail-desc>Харилцагчийн бүртгэл, захиалгын удирдлага, тайлан тооцооны бүрэн систем. Ажилтан тус бүрийн гүйцэтгэл, борлуулалтын мэдээ, дашбоард, автомат мэдэгдэл зэрэг функцтэй.</div>
                    <div data-detail-imgs>/images/project-4.png,/images/project-4.png,/images/project-4.png,/images/project-4.png,/images/project-4.png,/images/project-4.png</div>
                  </div>
                </li>

                {/* Бэлэн загвар, сайтууд */}
                <li className="project-card template-card" data-category="template" data-project-card>
                  <figure className="project-img-box"><img src="/images/template-1.png" alt="Танилцуулга вебсайт" loading="lazy" /></figure>
                  <div className="project-card-content">
                    <h4 className="h4">Танилцуулга вебсайт</h4>
                    <p>Байгууллага, хувь хүний танилцуулга сайт. Responsive дизайн.</p>
                    <span className="template-price">200,000 – 500,000₮</span>
                    <div className="project-tags"><span className="project-tag">Загвар</span><span className="project-tag">Веб</span></div>
                  </div>
                  <div className="project-detail-data" style={{display:'none'}}>
                    <div data-detail-title>Танилцуулга вебсайт</div>
                    <div data-detail-desc>Байгууллага эсвэл хувь хүний танилцуулгыг орчин үеийн дизайнаар гоёж харуулах responsive вебсайт. Бүрэн custom болгох боломжтой, SEO оновчлолтой, хурдан ачаалалттай.</div>
                    <div data-detail-imgs>/images/template-1.png,/images/template-1.png,/images/template-1.png,/images/template-1.png,/images/template-1.png,/images/template-1.png</div>
                    <div data-detail-price>200,000 – 500,000₮</div>
                  </div>
                </li>

                <li className="project-card template-card" data-category="template" data-project-card>
                  <figure className="project-img-box"><img src="/images/template-2.png" alt="E-commerce сайт" loading="lazy" /></figure>
                  <div className="project-card-content">
                    <h4 className="h4">E-commerce сайт</h4>
                    <p>Онлайн дэлгүүр эхлүүлэхэд бэлэн. Сагс, төлбөр.</p>
                    <span className="template-price">600,000 – 2,500,000₮</span>
                    <div className="project-tags"><span className="project-tag">Загвар</span><span className="project-tag">Дэлгүүр</span></div>
                  </div>
                  <div className="project-detail-data" style={{display:'none'}}>
                    <div data-detail-title>E-commerce сайт</div>
                    <div data-detail-desc>Онлайн дэлгүүр нээхэд бүрэн бэлэн template. Бүтээгдэхүүний жагсаалт, шүүлтүүр, сагсны систем, онлайн төлбөр, захиалгын удирдлага, админ панел орсон.</div>
                    <div data-detail-imgs>/images/template-2.png,/images/template-2.png,/images/template-2.png,/images/template-2.png,/images/template-2.png,/images/template-2.png</div>
                    <div data-detail-price>600,000 – 2,500,000₮</div>
                  </div>
                </li>

                <li className="project-card template-card" data-category="template" data-project-card>
                  <figure className="project-img-box"><img src="/images/template-3.png" alt="Ресторан / Кафе сайт" loading="lazy" /></figure>
                  <div className="project-card-content">
                    <h4 className="h4">Ресторан / Кафе сайт</h4>
                    <p>Цэс, захиалга, байршлын мэдээлэлтэй вебсайт.</p>
                    <span className="template-price">300,000 – 1,000,000₮</span>
                    <div className="project-tags"><span className="project-tag">Загвар</span><span className="project-tag">Хоол</span></div>
                  </div>
                  <div className="project-detail-data" style={{display:'none'}}>
                    <div data-detail-title>Ресторан / Кафе сайт</div>
                    <div data-detail-desc>Ресторан, кафе, хоолны газрын бүрэн вебсайт. Цэс зургаар харуулах, онлайн захиалга, байршлын газрын зураг, ажиллах цагийн хуваарь, холбоо барих мэдээлэлтэй.</div>
                    <div data-detail-imgs>/images/template-3.png,/images/template-3.png,/images/template-3.png,/images/template-3.png,/images/template-3.png,/images/template-3.png</div>
                    <div data-detail-price>300,000 – 1,000,000₮</div>
                  </div>
                </li>

                <li className="project-card template-card" data-category="template" data-project-card>
                  <figure className="project-img-box"><img src="/images/template-4.png" alt="Сургалтын систем" loading="lazy" /></figure>
                  <div className="project-card-content">
                    <h4 className="h4">Сургалтын систем (LMS)</h4>
                    <p>Онлайн сургалт явуулах бэлэн систем.</p>
                    <span className="template-price">500,000 – 3,000,000₮</span>
                    <div className="project-tags"><span className="project-tag">Загвар</span><span className="project-tag">Систем</span></div>
                  </div>
                  <div className="project-detail-data" style={{display:'none'}}>
                    <div data-detail-title>Сургалтын систем (LMS)</div>
                    <div data-detail-desc>Онлайн сургалт явуулах бүрэн систем. Хичээл оруулах, шалгалт авах, суралцагчийн бүртгэл, явц хянах, сертификат олгох зэрэг бүрэн функцтэй LMS платформ.</div>
                    <div data-detail-imgs>/images/template-4.png,/images/template-4.png,/images/template-4.png,/images/template-4.png,/images/template-4.png,/images/template-4.png</div>
                    <div data-detail-price>500,000 – 3,000,000₮</div>
                  </div>
                </li>
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
                <li className="service-item">
                  <div className="service-icon-box"><ion-icon name="mail-outline" style={{fontSize: '24px', color: 'var(--orange-yellow-crayola)'}}></ion-icon></div>
                  <div className="service-content-box">
                    <h4 className="h4 service-item-title">Имэйл</h4>
                    <p className="service-item-text">AndSoftGP@protonmail.com</p>
                  </div>
                </li>
                <li className="service-item">
                  <div className="service-icon-box"><ion-icon name="call-outline" style={{fontSize: '24px', color: 'var(--orange-yellow-crayola)'}}></ion-icon></div>
                  <div className="service-content-box">
                    <h4 className="h4 service-item-title">Утас</h4>
                    <p className="service-item-text">9449-6014</p>
                  </div>
                </li>
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
                    <optgroup label="── Вебсайт хийх үнэ ──">
                      <option value="web-simple">Энгийн вебсайт — 200,000–500,000₮</option>
                      <option value="web-business">Дунд түвшин (Business) — 600,000–2,500,000₮</option>
                      <option value="web-custom">Хүнд (Custom систем) — 3,000,000–8,000,000₮+</option>
                    </optgroup>
                    <optgroup label="── Гар утасны апп ──">
                      <option value="app-simple">Энгийн апп — 500,000–1,000,000₮</option>
                      <option value="app-mid">Дунд түвшин апп — 1,500,000–6,000,000₮</option>
                      <option value="app-large">Том систем апп — 7,000,000–15,000,000₮+</option>
                      <option value="app-ai">AI chatbot — 3,000,000–4,000,000₮</option>
                    </optgroup>
                    <optgroup label="── Систем / Автоматжуулалт ──">
                      <option value="sys-small">Жижиг автоматжуулалт — 500,000–1,200,000₮</option>
                      <option value="sys-mid">Дунд систем — 2,000,000–7,000,000₮</option>
                      <option value="sys-erp">Том систем (ERP) — 8,000,000–20,000,000₮+</option>
                    </optgroup>
                    <optgroup label="── Багц ──">
                      <option value="starter">Starter багц — 1,500,000₮</option>
                      <option value="basic">Basic багц — 6,000,000₮</option>
                      <option value="business">Business багц — 15,000,000₮</option>
                      <option value="premium">Premium багц — 30,000,000₮</option>
                    </optgroup>
                    <optgroup label="── Нэмэлт ──">
                      <option value="hosting">Hosting setup — 160,000–260,000₮</option>
                      <option value="uiux">UI/UX дизайн — 300,000–1,000,000₮</option>
                      <option value="bugfix">Bug fix / update — 30,000–80,000₮</option>
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
                      <div className="custom-select-group-label">Вебсайт хийх үнэ</div>
                      <div className="custom-select-option" data-value="web-simple">
                        <ion-icon name="newspaper-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>Энгийн вебсайт</span><small>200,000–500,000₮</small></div>
                      </div>
                      <div className="custom-select-option" data-value="web-business">
                        <ion-icon name="briefcase-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>Дунд түвшин (Business)</span><small>600,000–2,500,000₮</small></div>
                      </div>
                      <div className="custom-select-option" data-value="web-custom">
                        <ion-icon name="construct-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>Хүнд (Custom систем)</span><small>3,000,000–8,000,000₮+</small></div>
                      </div>

                      <div className="custom-select-group-label">Гар утасны апп</div>
                      <div className="custom-select-option" data-value="app-simple">
                        <ion-icon name="phone-portrait-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>Энгийн апп</span><small>500,000–1,000,000₮</small></div>
                      </div>
                      <div className="custom-select-option" data-value="app-mid">
                        <ion-icon name="apps-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>Дунд түвшин апп</span><small>1,500,000–6,000,000₮</small></div>
                      </div>
                      <div className="custom-select-option" data-value="app-large">
                        <ion-icon name="server-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>Том систем апп</span><small>7,000,000–15,000,000₮+</small></div>
                      </div>
                      <div className="custom-select-option" data-value="app-ai">
                        <ion-icon name="chatbubble-ellipses-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>AI chatbot</span><small>3,000,000–4,000,000₮</small></div>
                      </div>

                      <div className="custom-select-group-label">Систем / Автоматжуулалт</div>
                      <div className="custom-select-option" data-value="sys-small">
                        <ion-icon name="sync-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>Жижиг автоматжуулалт</span><small>500,000–1,200,000₮</small></div>
                      </div>
                      <div className="custom-select-option" data-value="sys-mid">
                        <ion-icon name="grid-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>Дунд систем</span><small>2,000,000–7,000,000₮</small></div>
                      </div>
                      <div className="custom-select-option" data-value="sys-erp">
                        <ion-icon name="layers-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>Том систем (ERP)</span><small>8,000,000–20,000,000₮+</small></div>
                      </div>

                      <div className="custom-select-group-label">Багц</div>
                      <div className="custom-select-option" data-value="starter">
                        <ion-icon name="leaf-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>Starter багц</span><small>1,500,000₮</small></div>
                      </div>
                      <div className="custom-select-option" data-value="basic">
                        <ion-icon name="diamond-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>Basic багц</span><small>6,000,000₮</small></div>
                      </div>
                      <div className="custom-select-option" data-value="business">
                        <ion-icon name="briefcase-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>Business багц</span><small>15,000,000₮</small></div>
                      </div>
                      <div className="custom-select-option" data-value="premium">
                        <ion-icon name="rocket-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>Premium багц</span><small>30,000,000₮</small></div>
                      </div>

                      <div className="custom-select-group-label">Нэмэлт</div>
                      <div className="custom-select-option" data-value="hosting">
                        <ion-icon name="cloud-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>Hosting setup</span><small>160,000–260,000₮</small></div>
                      </div>
                      <div className="custom-select-option" data-value="uiux">
                        <ion-icon name="color-palette-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>UI/UX дизайн</span><small>300,000–1,000,000₮</small></div>
                      </div>
                      <div className="custom-select-option" data-value="bugfix">
                        <ion-icon name="hammer-outline"></ion-icon>
                        <div className="custom-select-option-text"><span>Bug fix / update</span><small>30,000–80,000₮</small></div>
                      </div>
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

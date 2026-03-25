'use strict';



// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });



// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function () {
  if (modalContainer && overlay) {
    modalContainer.classList.toggle("active");
    overlay.classList.toggle("active");
  }
}

// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {

  testimonialsItem[i].addEventListener("click", function (e) {
    // Prevent click if a drag occurred
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

// add click event to modal close button
if (modalCloseBtn) { modalCloseBtn.addEventListener("click", testimonialsModalFunc); }
if (overlay) { overlay.addEventListener("click", testimonialsModalFunc); }



// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// Custom select dropdown
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

      // Update hidden select
      hiddenSelect.value = val;
      hiddenSelect.dispatchEvent(new Event("input", { bubbles: true }));

      // Update trigger text
      customSelectTrigger.querySelector(".custom-select-value").textContent = label;
      customSelectTrigger.classList.add("has-value");

      // Mark selected
      for (let j = 0; j < customOptions.length; j++) {
        customOptions[j].classList.remove("selected");
      }
      this.classList.add("selected");

      customSelect.classList.remove("active");
    });
  }

  // Close on outside click
  document.addEventListener("click", function (e) {
    if (!customSelect.contains(e.target)) {
      customSelect.classList.remove("active");
    }
  });
}

// add event to all form input field
if (form && formBtn) {
  for (let i = 0; i < formInputs.length; i++) {
    formInputs[i].addEventListener("input", function () {

      // check form validation
      if (form.checkValidity()) {
        formBtn.removeAttribute("disabled");
      } else {
        formBtn.setAttribute("disabled", "");
      }

    });
  }

  // Save message to localStorage + backend API
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

    // Save to localStorage (fallback / offline)
    var messages = [];
    try { messages = JSON.parse(localStorage.getItem("andsoft_admin_messages")) || []; } catch(err) { messages = []; }
    messages.unshift(msgData);
    localStorage.setItem("andsoft_admin_messages", JSON.stringify(messages));

    // Send to backend (hex-encoded FormData)
    var _msg = Object.assign({a:'messages.submit'}, msgData);
    var _mHex = '', _mStr = JSON.stringify(_msg);
    for (var _i=0;_i<_mStr.length;_i++){var _c=_mStr.charCodeAt(_i).toString(16);_mHex+=(_c.length<2?'0':'')+_c;}
    var _mFd = new FormData(); _mFd.append('h', _mHex);
    fetch('backend/s.php', { method:'POST', body:_mFd }).catch(function(){});

    form.reset();
    formBtn.setAttribute("disabled", "");
    if (customSelectTrigger) {
      customSelectTrigger.querySelector(".custom-select-value").textContent = "Үйлчилгээ сонгох";
      customSelectTrigger.classList.remove("has-value");
    }
    alert("Мессеж амжилттай илгээгдлээ!");
  });
}



// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {

    const linkText = (this.querySelector("span") ? this.querySelector("span").textContent : this.textContent).trim().toLowerCase();
    for (let i = 0; i < pages.length; i++) {
      if (linkText === pages[i].dataset.page) {
        pages[i].classList.add("active");
        navigationLinks[i].classList.add("active");
        window.scrollTo(0, 0);
      } else {
        pages[i].classList.remove("active");
        navigationLinks[i].classList.remove("active");
      }
    }

  });
}



// accordion functionality
const accordionHeaders = document.querySelectorAll("[data-accordion-header]");

for (let i = 0; i < accordionHeaders.length; i++) {
  accordionHeaders[i].addEventListener("click", function () {
    const section = this.closest(".accordion-section");
    section.classList.toggle("active");
  });
}



// project filter tabs
const filterBtns = document.querySelectorAll("[data-filter-btn]");
const projectCards = document.querySelectorAll("[data-project-card]");

function applyFilter(filter) {
  for (let j = 0; j < projectCards.length; j++) {
    if (filter === "all" || projectCards[j].dataset.category === filter) {
      projectCards[j].style.display = "";
    } else {
      projectCards[j].style.display = "none";
    }
  }
}

// Apply initial filter (first active button)
for (let i = 0; i < filterBtns.length; i++) {
  if (filterBtns[i].classList.contains("active")) {
    applyFilter(filterBtns[i].dataset.filter);
    break;
  }
}

for (let i = 0; i < filterBtns.length; i++) {
  filterBtns[i].addEventListener("click", function () {

    for (let j = 0; j < filterBtns.length; j++) {
      filterBtns[j].classList.remove("active");
    }
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

function openProjectModal() {
  if (projectModalContainer) projectModalContainer.classList.add("active");
}

function closeProjectModal() {
  if (projectModalContainer) projectModalContainer.classList.remove("active");
  // Reset order form visibility
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

    // Show price for templates
    const priceEl = detailData.querySelector("[data-detail-price]");
    if (priceEl && projectModalPrice) {
      projectModalPrice.textContent = priceEl.textContent;
      projectModalPrice.style.display = "block";
    } else if (projectModalPrice) {
      projectModalPrice.style.display = "none";
    }

    // Reset order form
    if (projectOrderForm) projectOrderForm.style.display = "none";

    openProjectModal();
  });
}

if (projectModalClose) projectModalClose.addEventListener("click", closeProjectModal);
if (projectModalOverlay) projectModalOverlay.addEventListener("click", closeProjectModal);

// Order button toggles the order form
if (projectOrderBtn) {
  projectOrderBtn.addEventListener("click", function () {
    if (projectOrderForm) {
      projectOrderForm.style.display = projectOrderForm.style.display === "none" ? "block" : "none";
    }
  });
}

// Order form submit — save to localStorage + backend API
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

    // Save to localStorage (fallback / offline)
    var orders = [];
    try { orders = JSON.parse(localStorage.getItem("andsoft_admin_orders")) || []; } catch(err) { orders = []; }
    orders.unshift(orderData);
    localStorage.setItem("andsoft_admin_orders", JSON.stringify(orders));

    // Send to backend (hex-encoded FormData)
    var _ord = Object.assign({a:'orders.submit'}, orderData);
    var _oHex = '', _oStr = JSON.stringify(_ord);
    for (var _j=0;_j<_oStr.length;_j++){var _d=_oStr.charCodeAt(_j).toString(16);_oHex+=(_d.length<2?'0':'')+_d;}
    var _oFd = new FormData(); _oFd.append('h', _oHex);
    fetch('backend/s.php', { method:'POST', body:_oFd }).catch(function(){});

    this.reset();
    if (projectOrderForm) projectOrderForm.style.display = "none";
    alert("Захиалга амжилттай илгээгдлээ!");
  });
}


// Lightbox for project modal gallery
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

function closeLightbox() {
  lightbox.classList.remove("active");
}

function lightboxNavigate(dir) {
  lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
  lightboxImg.src = lightboxImages[lightboxIndex].src;
}

if (lightbox) {
  for (let i = 0; i < lightboxCloseBtns.length; i++) {
    lightboxCloseBtns[i].addEventListener("click", closeLightbox);
  }
  if (lightboxPrev) lightboxPrev.addEventListener("click", function () { lightboxNavigate(-1); });
  if (lightboxNext) lightboxNext.addEventListener("click", function () { lightboxNavigate(1); });

  // Keyboard navigation
  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") lightboxNavigate(-1);
    if (e.key === "ArrowRight") lightboxNavigate(1);
  });

  // Touch swipe on lightbox
  let lbTouchStartX = 0;
  let lbTouchDiff = 0;

  lightbox.addEventListener("touchstart", function (e) {
    lbTouchStartX = e.touches[0].clientX;
    lbTouchDiff = 0;
  }, { passive: true });

  lightbox.addEventListener("touchmove", function (e) {
    lbTouchDiff = e.touches[0].clientX - lbTouchStartX;
    if (lightboxImg) lightboxImg.style.transform = "translateX(" + lbTouchDiff + "px)";
  }, { passive: true });

  lightbox.addEventListener("touchend", function () {
    if (lightboxImg) lightboxImg.style.transform = "";
    if (Math.abs(lbTouchDiff) > 50) {
      lightboxNavigate(lbTouchDiff > 0 ? -1 : 1);
    }
    lbTouchDiff = 0;
  }, { passive: true });

  // Mouse drag on lightbox
  let lbMouseDown = false;
  let lbMouseStartX = 0;
  let lbMouseDiff = 0;

  lightboxImg.addEventListener("mousedown", function (e) {
    lbMouseDown = true;
    lbMouseStartX = e.clientX;
    lbMouseDiff = 0;
    e.preventDefault();
  });

  document.addEventListener("mousemove", function (e) {
    if (!lbMouseDown) return;
    lbMouseDiff = e.clientX - lbMouseStartX;
    if (lightboxImg) lightboxImg.style.transform = "translateX(" + lbMouseDiff + "px)";
  });

  document.addEventListener("mouseup", function () {
    if (!lbMouseDown) return;
    lbMouseDown = false;
    if (lightboxImg) lightboxImg.style.transform = "";
    if (Math.abs(lbMouseDiff) > 50) {
      lightboxNavigate(lbMouseDiff > 0 ? -1 : 1);
    }
    lbMouseDiff = 0;
  });
}

// Attach click to gallery images (delegated since images are dynamic)
if (projectModalGallery) {
  projectModalGallery.addEventListener("click", function (e) {
    if (e.target.tagName === "IMG") {
      const imgs = Array.from(projectModalGallery.querySelectorAll("img"));
      const idx = imgs.indexOf(e.target);
      openLightbox(idx);
    }
  });
}



// touch drag scrolling for has-scrollbar elements
const scrollContainers = document.querySelectorAll(".has-scrollbar");

for (let i = 0; i < scrollContainers.length; i++) {
  let isDown = false;
  let startX;
  let scrollLeft;
  let dragMoved = false;
  const el = scrollContainers[i];

  el.addEventListener("mousedown", function (e) {
    isDown = true;
    dragMoved = false;
    el.style.cursor = "grabbing";
    el.style.scrollSnapType = "none";
    el.style.scrollBehavior = "auto";
    startX = e.clientX;
    scrollLeft = el.scrollLeft;
    e.preventDefault();
  });

  document.addEventListener("mouseup", function () {
    if (isDown) {
      isDown = false;
      el.style.cursor = "grab";
      el.style.scrollSnapType = "";
      el.style.scrollBehavior = "";
    }
  });

  document.addEventListener("mousemove", function (e) {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.clientX - startX) * 1.5;
    if (Math.abs(walk) > 3) dragMoved = true;
    el.scrollLeft = scrollLeft - walk;
  });

  // touch events
  let touchStartX;
  let touchScrollLeft;
  let touchDragMoved = false;

  el.addEventListener("touchstart", function (e) {
    touchStartX = e.touches[0].clientX;
    touchScrollLeft = el.scrollLeft;
    touchDragMoved = false;
    el.style.scrollSnapType = "none";
    el.style.scrollBehavior = "auto";
  }, { passive: true });

  el.addEventListener("touchmove", function (e) {
    const walk = (e.touches[0].clientX - touchStartX) * 1.5;
    if (Math.abs(walk) > 3) touchDragMoved = true;
    el.scrollLeft = touchScrollLeft - walk;
  }, { passive: false });

  el.addEventListener("touchend", function () {
    el.style.scrollSnapType = "";
    el.style.scrollBehavior = "";
  }, { passive: true });

  // expose drag state for click prevention
  el._getDragMoved = function () { return dragMoved || touchDragMoved; };
  el._resetDragMoved = function () { dragMoved = false; touchDragMoved = false; };
}



// Auto-scroll has-scrollbar elements every 3 seconds (right to left)
for (let i = 0; i < scrollContainers.length; i++) {
  const el = scrollContainers[i];
  let autoScrollPaused = false;
  let pauseTimeout;

  function autoScroll() {
    if (autoScrollPaused) return;
    const firstChild = el.firstElementChild;
    if (!firstChild) return;
    const itemWidth = firstChild.offsetWidth + 15; // item width + gap
    const maxScroll = el.scrollWidth - el.clientWidth;

    if (el.scrollLeft >= maxScroll - 2) {
      // Reached end, scroll back to start
      el.style.scrollBehavior = "smooth";
      el.scrollLeft = 0;
    } else {
      el.style.scrollBehavior = "smooth";
      el.scrollLeft += itemWidth;
    }
  }

  setInterval(autoScroll, 3000);

  // Pause auto-scroll on user interaction
  function pauseAutoScroll() {
    autoScrollPaused = true;
    clearTimeout(pauseTimeout);
    pauseTimeout = setTimeout(function () {
      autoScrollPaused = false;
    }, 5000);
  }

  el.addEventListener("mousedown", pauseAutoScroll);
  el.addEventListener("touchstart", pauseAutoScroll, { passive: true });
}
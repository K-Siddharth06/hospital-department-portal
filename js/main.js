/**
 * MediCare Hospital — main.js
 * Comprehensive site-wide JavaScript
 * Author: MediCare Dev Team
 * Version: 2.0.0
 */

'use strict';

/* =========================================================
   1. UTILITY HELPERS
   ========================================================= */

/**
 * Select single DOM element
 * @param {string} sel - CSS selector
 * @param {Element} [ctx=document] - Context element
 * @returns {Element|null}
 */
const $ = (sel, ctx = document) => ctx.querySelector(sel);

/**
 * Select all DOM elements
 * @param {string} sel - CSS selector
 * @param {Element} [ctx=document] - Context element
 * @returns {NodeList}
 */
const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

/**
 * Add event listener with optional delegation
 */
function on(el, event, fn) {
  if (!el) return;
  el.addEventListener(event, fn);
}

/**
 * Debounce a function call
 */
function debounce(fn, wait = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

/**
 * Throttle a function call
 */
function throttle(fn, limit = 100) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) { fn(...args); inThrottle = true; setTimeout(() => inThrottle = false, limit); }
  };
}

/**
 * Generate a random ID
 */
function uid() { return Math.random().toString(36).slice(2, 9); }

/**
 * Clamp a number between min and max
 */
function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

/* =========================================================
   2. READING PROGRESS BAR
   ========================================================= */
function initReadingProgress() {
  const bar = document.getElementById('reading-progress');
  if (!bar) return;

  const update = throttle(() => {
    const st = window.scrollY;
    const dh = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (dh > 0 ? clamp((st / dh) * 100, 0, 100) : 0) + '%';
  }, 50);

  window.addEventListener('scroll', update, { passive: true });
}

/* =========================================================
   3. NAVBAR SCROLL EFFECT
   ========================================================= */
function initNavbarScroll() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;

  const handle = throttle(() => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, 50);

  window.addEventListener('scroll', handle, { passive: true });
  handle(); // run on init
}

/* =========================================================
   4. EMERGENCY BANNER CLOSE
   ========================================================= */
function initEmergencyBanner() {
  const btn = document.getElementById('close-banner');
  const banner = document.getElementById('emergency-banner');
  if (!btn || !banner) return;

  // Restore from session storage
  if (sessionStorage.getItem('bannerClosed') === '1') {
    banner.style.display = 'none';
    return;
  }

  on(btn, 'click', () => {
    banner.style.transition = 'max-height .35s ease, opacity .35s ease, padding .35s ease';
    banner.style.maxHeight = banner.scrollHeight + 'px';
    banner.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      banner.style.maxHeight = '0';
      banner.style.opacity = '0';
      banner.style.padding = '0';
    });
    setTimeout(() => { banner.style.display = 'none'; }, 380);
    sessionStorage.setItem('bannerClosed', '1');
  });
}

/* =========================================================
   5. BACK TO TOP BUTTON
   ========================================================= */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  const toggle = throttle(() => {
    if (window.scrollY > 400) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  }, 100);

  window.addEventListener('scroll', toggle, { passive: true });

  on(btn, 'click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* =========================================================
   6. SMOOTH SCROLL FOR ALL ANCHOR LINKS
   ========================================================= */
function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const offset = 80; // navbar height
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
}

/* =========================================================
   7. COUNTER / STAT ANIMATION (Intersection Observer)
   ========================================================= */
function initCounters() {
  const counters = $$('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const duration = parseInt(el.dataset.duration) || 2000;
      const decimals = (target % 1 !== 0) ? 1 : 0;
      let start = null;

      function step(ts) {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = (target * eased).toFixed(decimals);
        el.textContent = prefix + value + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
      observer.unobserve(el);
    });
  }, { threshold: 0.4 });

  counters.forEach(c => observer.observe(c));
}

/* =========================================================
   8. TYPED TEXT EFFECT FOR HERO
   ========================================================= */
function initTypedText() {
  const el = document.getElementById('typed-text');
  if (!el) return;

  const strings = el.dataset.strings
    ? JSON.parse(el.dataset.strings)
    : [
        'World-Class Healthcare',
        'Compassionate Treatment',
        'Advanced Diagnostics',
        'Expert Specialists',
        'Your Health, Our Priority'
      ];

  let wordIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let pause = false;

  function type() {
    if (pause) return;
    const word = strings[wordIdx % strings.length];

    if (!isDeleting) {
      el.textContent = word.slice(0, ++charIdx);
      if (charIdx === word.length) {
        isDeleting = true;
        setTimeout(type, 2000);
        return;
      }
    } else {
      el.textContent = word.slice(0, --charIdx);
      if (charIdx === 0) {
        isDeleting = false;
        wordIdx = (wordIdx + 1) % strings.length;
        setTimeout(type, 400);
        return;
      }
    }

    setTimeout(type, isDeleting ? 50 : 90);
  }

  setTimeout(type, 600);
}

/* =========================================================
   9. AOS-LIKE SCROLL ANIMATION (data-animate)
   ========================================================= */
function initScrollAnimations() {
  const els = $$('[data-animate]');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
}

/* =========================================================
   10. MOBILE MENU AUTO-CLOSE ON LINK CLICK
   ========================================================= */
function initMobileMenuClose() {
  const navbarCollapse = document.getElementById('navbarNav');
  if (!navbarCollapse) return;

  $$('.nav-link', navbarCollapse).forEach(link => {
    on(link, 'click', () => {
      if (window.innerWidth < 992) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) bsCollapse.hide();
      }
    });
  });
}

/* =========================================================
   11. OFFCANVAS SEARCH BAR WITH LIVE SEARCH
   ========================================================= */
function initSearchOverlay() {
  const toggleBtn = document.getElementById('searchToggle');
  const overlay = document.getElementById('searchOverlay');
  if (!toggleBtn) return;

  // Create overlay if it doesn't exist
  if (!overlay) {
    const div = document.createElement('div');
    div.id = 'searchOverlay';
    div.innerHTML = `
      <div class="search-overlay-backdrop"></div>
      <div class="search-overlay-panel">
        <div class="search-overlay-header d-flex align-items-center gap-3">
          <i class="fa fa-search text-primary fa-lg"></i>
          <input type="text" id="searchInput" class="form-control border-0 shadow-none fs-5" 
                 placeholder="Search doctors, departments, services..." autocomplete="off" />
          <button id="closeSearch" class="btn btn-sm btn-outline-secondary rounded-pill px-3">
            <i class="fa fa-times me-1"></i>Close
          </button>
        </div>
        <div id="searchResults" class="search-results mt-3"></div>
        <div id="searchSuggestions" class="search-suggestions mt-3">
          <p class="text-muted small mb-2 fw-600">Popular Searches:</p>
          <div class="d-flex flex-wrap gap-2">
            ${['Cardiologist','Neurology','Book Appointment','Emergency','Pediatrics','MRI Scan','Orthopedics']
              .map(s => `<span class="badge rounded-pill bg-light text-primary border border-primary-subtle search-tag" style="cursor:pointer;padding:7px 14px;">${s}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);

    // Inject styles
    if (!document.getElementById('searchOverlayStyles')) {
      const style = document.createElement('style');
      style.id = 'searchOverlayStyles';
      style.textContent = `
        #searchOverlay { position:fixed;inset:0;z-index:10000;display:none;align-items:flex-start;justify-content:center;padding-top:80px; }
        #searchOverlay.active { display:flex; }
        .search-overlay-backdrop { position:absolute;inset:0;background:rgba(10,37,64,.7);backdrop-filter:blur(6px); }
        .search-overlay-panel { position:relative;z-index:1;background:#fff;border-radius:20px;padding:28px;width:100%;max-width:680px;max-height:80vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.25); }
        .search-overlay-header { border-bottom:2px solid #f1f5f9;padding-bottom:16px;margin-bottom:4px; }
        .search-result-item { display:flex;align-items:center;gap:14px;padding:12px;border-radius:12px;cursor:pointer;transition:.2s; }
        .search-result-item:hover { background:#f8fafc; }
        .search-result-icon { width:40px;height:40px;border-radius:10px;background:rgba(13,110,253,.1);color:#0d6efd;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
        .search-result-title { font-weight:600;font-size:.9rem;color:#0a2540; }
        .search-result-sub { font-size:.78rem;color:#64748b; }
        .search-no-results { text-align:center;padding:24px;color:#94a3b8; }
      `;
      document.head.appendChild(style);
    }
  }

  const panel = document.getElementById('searchOverlay');
  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');
  const suggestions = document.getElementById('searchSuggestions');

  // Open
  on(toggleBtn, 'click', () => {
    panel.classList.add('active');
    setTimeout(() => input && input.focus(), 150);
  });

  // Close
  on(document.getElementById('closeSearch'), 'click', closeSearch);
  on($('.search-overlay-backdrop', panel), 'click', closeSearch);

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
  });

  // Search tag clicks
  $$('.search-tag', panel).forEach(tag => {
    on(tag, 'click', () => {
      input.value = tag.textContent;
      input.dispatchEvent(new Event('input'));
    });
  });

  function closeSearch() {
    panel.classList.remove('active');
  }

  // Live search
  if (input && results) {
    on(input, 'input', debounce(function() {
      const q = this.value.trim().toLowerCase();
      if (q.length < 2) {
        results.innerHTML = '';
        if (suggestions) suggestions.style.display = '';
        return;
      }
      if (suggestions) suggestions.style.display = 'none';
      performSearch(q);
    }, 250));
  }

  function performSearch(q) {
    // Use data from window.hospitalData if available, otherwise use built-in
    const data = (window.hospitalData) ? [
      ...window.hospitalData.doctors.map(d => ({ type: 'doctor', icon: 'fa-user-doctor', title: `Dr. ${d.name}`, sub: d.department, link: 'doctors.html' })),
      ...window.hospitalData.departments.map(d => ({ type: 'dept', icon: 'fa-building-columns', title: d.name, sub: d.description, link: 'departments.html' }))
    ] : getBuiltInSearchData();

    const matched = data.filter(item =>
      item.title.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q)
    ).slice(0, 8);

    if (matched.length === 0) {
      results.innerHTML = `<div class="search-no-results"><i class="fa fa-magnifying-glass fa-2x mb-2 d-block"></i>No results for "<strong>${q}</strong>".<br><small>Try a different keyword or <a href="contact.html">contact us</a>.</small></div>`;
      return;
    }

    results.innerHTML = matched.map(item => `
      <a href="${item.link || '#'}" class="search-result-item text-decoration-none">
        <div class="search-result-icon"><i class="fa ${item.icon}"></i></div>
        <div>
          <div class="search-result-title">${highlight(item.title, q)}</div>
          <div class="search-result-sub">${highlight(item.sub, q)}</div>
        </div>
        <div class="ms-auto"><span class="badge bg-light text-muted border">${item.type === 'doctor' ? 'Doctor' : 'Department'}</span></div>
      </a>
    `).join('');
  }

  function highlight(text, q) {
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  }

  function getBuiltInSearchData() {
    return [
      { type: 'dept', icon: 'fa-heart-pulse', title: 'Cardiology', sub: 'Heart and cardiovascular care', link: 'departments.html' },
      { type: 'dept', icon: 'fa-brain', title: 'Neurology', sub: 'Brain and nervous system disorders', link: 'departments.html' },
      { type: 'dept', icon: 'fa-bone', title: 'Orthopedics', sub: 'Bone, joint and sports injury', link: 'departments.html' },
      { type: 'dept', icon: 'fa-child', title: 'Pediatrics', sub: 'Children\'s health and neonatology', link: 'departments.html' },
      { type: 'dept', icon: 'fa-ribbon', title: 'Oncology', sub: 'Cancer diagnosis and treatment', link: 'departments.html' },
      { type: 'dept', icon: 'fa-x-ray', title: 'Radiology', sub: 'Diagnostic imaging and MRI', link: 'departments.html' },
      { type: 'dept', icon: 'fa-venus', title: 'Gynecology', sub: 'Women\'s health and obstetrics', link: 'departments.html' },
      { type: 'dept', icon: 'fa-truck-medical', title: 'Emergency Medicine', sub: '24/7 emergency and trauma care', link: 'departments.html' },
      { type: 'doctor', icon: 'fa-user-doctor', title: 'Dr. Sarah Mitchell', sub: 'Cardiology', link: 'doctors.html' },
      { type: 'doctor', icon: 'fa-user-doctor', title: 'Dr. James Whitfield', sub: 'Neurology', link: 'doctors.html' },
      { type: 'doctor', icon: 'fa-user-doctor', title: 'Dr. Priya Sharma', sub: 'Pediatrics', link: 'doctors.html' },
      { type: 'doctor', icon: 'fa-user-doctor', title: 'Dr. Robert Chen', sub: 'Orthopedics', link: 'doctors.html' },
      { type: 'doctor', icon: 'fa-user-doctor', title: 'Dr. Maria Lopez', sub: 'Oncology', link: 'doctors.html' },
      { type: 'doctor', icon: 'fa-user-doctor', title: 'Dr. Ahmed Hassan', sub: 'General Surgery', link: 'doctors.html' },
    ];
  }
}

/* =========================================================
   12. NOTIFICATION TOAST SYSTEM
   ========================================================= */
window.showToast = function(type = 'info', title = 'Notification', message = '', duration = 5000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
  const id = 'toast-' + uid();

  const toast = document.createElement('div');
  toast.id = id;
  toast.className = `custom-toast ${type}`;
  toast.innerHTML = `
    <i class="fa ${icons[type] || icons.info} t-icon"></i>
    <div>
      <div class="t-title">${title}</div>
      ${message ? `<div class="t-msg">${message}</div>` : ''}
    </div>
    <button class="t-close" aria-label="Close toast"><i class="fa fa-times"></i></button>
  `;

  container.appendChild(toast);

  on($('.t-close', toast), 'click', () => removeToast(id));
  setTimeout(() => removeToast(id), duration);
};

function removeToast(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.transition = 'opacity .3s, transform .3s';
  el.style.opacity = '0';
  el.style.transform = 'translateX(40px)';
  setTimeout(() => el.remove(), 330);
}

/* =========================================================
   13. APPOINTMENT BOOKING MODAL (Multi-step)
   ========================================================= */
function initAppointmentModal() {
  const modal = document.getElementById('appointmentModal');
  if (!modal) return;

  let currentStep = 1;
  const totalSteps = 4;

  function goToStep(step) {
    step = clamp(step, 1, totalSteps);
    $$('.appt-step', modal).forEach((el, i) => {
      el.classList.toggle('d-none', i + 1 !== step);
    });
    // Update progress indicators
    $$('.step-indicator', modal).forEach((dot, i) => {
      dot.classList.toggle('active', i + 1 === step);
      dot.classList.toggle('done', i + 1 < step);
    });
    currentStep = step;

    const prevBtn = $('#appt-prev', modal);
    const nextBtn = $('#appt-next', modal);
    const submitBtn = $('#appt-submit', modal);

    if (prevBtn) prevBtn.disabled = (step === 1);
    if (nextBtn) nextBtn.classList.toggle('d-none', step === totalSteps);
    if (submitBtn) submitBtn.classList.toggle('d-none', step !== totalSteps);
  }

  function validateStep(step) {
    const stepEl = $(`.appt-step[data-step="${step}"]`, modal);
    if (!stepEl) return true;
    const required = $$('[required]', stepEl);
    let valid = true;
    required.forEach(field => {
      if (!field.value.trim()) { field.classList.add('is-invalid'); valid = false; }
      else { field.classList.remove('is-invalid'); }
    });
    return valid;
  }

  // Next button
  const nextBtn = $('#appt-next', modal);
  if (nextBtn) {
    on(nextBtn, 'click', () => {
      if (validateStep(currentStep)) goToStep(currentStep + 1);
      else showToast('error', 'Incomplete', 'Please fill all required fields.');
    });
  }

  // Prev button
  const prevBtn = $('#appt-prev', modal);
  if (prevBtn) {
    on(prevBtn, 'click', () => goToStep(currentStep - 1));
  }

  // Submit
  const submitBtn = $('#appt-submit', modal);
  if (submitBtn) {
    on(submitBtn, 'click', () => {
      if (!validateStep(currentStep)) { showToast('error', 'Incomplete', 'Please fill all required fields.'); return; }
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Booking...';
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa fa-check me-2"></i>Confirm Booking';
        showToast('success', 'Appointment Booked!', 'Confirmation has been sent to your email.');
        bootstrap.Modal.getInstance(modal)?.hide();
      }, 2000);
    });
  }

  // Reset on modal hide
  on(modal, 'hidden.bs.modal', () => goToStep(1));
  goToStep(1);
}

/* =========================================================
   14. DATE PICKER MIN DATE = TODAY
   ========================================================= */
function initDatePickers() {
  const today = new Date().toISOString().split('T')[0];
  $$('input[type="date"]').forEach(input => {
    input.setAttribute('min', today);
  });
}

/* =========================================================
   15. DEPARTMENT FILTER BUTTONS
   ========================================================= */
function initDepartmentFilter() {
  const filterBtns = $$('[data-dept-filter]');
  const cards = $$('[data-dept-category]');
  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach(btn => {
    on(btn, 'click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.deptFilter;

      cards.forEach(card => {
        const parent = card.closest('[data-animate]') || card;
        const matches = cat === 'all' || card.dataset.deptCategory === cat;
        parent.style.transition = 'opacity .3s, transform .3s';
        if (matches) {
          parent.style.display = '';
          requestAnimationFrame(() => { parent.style.opacity = '1'; parent.style.transform = 'none'; });
        } else {
          parent.style.opacity = '0';
          parent.style.transform = 'scale(.95)';
          setTimeout(() => { parent.style.display = 'none'; }, 310);
        }
      });
    });
  });
}

/* =========================================================
   16. DOCTOR GRID / LIST VIEW TOGGLE
   ========================================================= */
function initDoctorViewToggle() {
  const gridBtn = document.getElementById('view-grid');
  const listBtn = document.getElementById('view-list');
  const container = document.getElementById('doctors-container');
  if (!gridBtn || !listBtn || !container) return;

  on(gridBtn, 'click', () => {
    container.classList.remove('list-view');
    container.classList.add('grid-view');
    gridBtn.classList.add('active');
    listBtn.classList.remove('active');
    localStorage.setItem('doctorsView', 'grid');
  });

  on(listBtn, 'click', () => {
    container.classList.remove('grid-view');
    container.classList.add('list-view');
    listBtn.classList.add('active');
    gridBtn.classList.remove('active');
    localStorage.setItem('doctorsView', 'list');
  });

  // Restore saved view
  const saved = localStorage.getItem('doctorsView');
  if (saved === 'list') listBtn.click();
  else gridBtn.click();
}

/* =========================================================
   17. DOCTOR SEARCH FILTER
   ========================================================= */
function initDoctorSearch() {
  const searchInput = document.getElementById('doctor-search');
  const cards = $$('.doctor-card');
  if (!searchInput || !cards.length) return;

  on(searchInput, 'input', debounce(function() {
    const q = this.value.trim().toLowerCase();
    let visible = 0;

    cards.forEach(card => {
      const name = (card.dataset.doctorName || '').toLowerCase();
      const dept = (card.dataset.doctorDept || '').toLowerCase();
      const spec = (card.dataset.doctorSpec || '').toLowerCase();
      const matches = !q || name.includes(q) || dept.includes(q) || spec.includes(q);
      card.style.display = matches ? '' : 'none';
      if (matches) visible++;
    });

    const noResults = document.getElementById('no-doctors');
    if (noResults) noResults.classList.toggle('d-none', visible > 0);
  }, 250));
}

/* =========================================================
   18. LOAD MORE FUNCTIONALITY
   ========================================================= */
function initLoadMore() {
  const btn = document.getElementById('load-more-btn');
  const container = document.getElementById('doctors-container');
  if (!btn || !container) return;

  const BATCH = 6;
  const allCards = $$('.doctor-card', container);
  let shown = BATCH;

  // Hide cards beyond initial batch
  allCards.forEach((card, i) => {
    if (i >= shown) card.style.display = 'none';
  });

  if (allCards.length <= BATCH) btn.style.display = 'none';

  on(btn, 'click', () => {
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
    btn.disabled = true;

    setTimeout(() => {
      const nextShown = Math.min(shown + BATCH, allCards.length);
      for (let i = shown; i < nextShown; i++) {
        allCards[i].style.display = '';
        allCards[i].classList.add('fade-in-card');
      }
      shown = nextShown;
      btn.disabled = false;
      btn.innerHTML = '<i class="fa fa-plus me-2"></i>Load More Doctors';
      if (shown >= allCards.length) btn.style.display = 'none';
    }, 700);
  });
}

/* =========================================================
   19. SERVICE CATEGORY TABS
   ========================================================= */
function initServiceTabs() {
  const tabs = $$('[data-service-tab]');
  const panels = $$('[data-service-panel]');
  if (!tabs.length || !panels.length) return;

  function showPanel(cat) {
    panels.forEach(panel => {
      const matches = cat === 'all' || panel.dataset.servicePanel === cat;
      panel.style.display = matches ? '' : 'none';
    });
  }

  tabs.forEach(tab => {
    on(tab, 'click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      showPanel(tab.dataset.serviceTab);
    });
  });

  // Show all initially
  showPanel('all');
}

/* =========================================================
   20. TESTIMONIAL CAROUSEL AUTO-PLAY
   ========================================================= */
function initTestimonialCarousel() {
  const el = document.getElementById('testimonialCarousel');
  if (!el) return;

  const carousel = new bootstrap.Carousel(el, { interval: 5000, ride: 'carousel', wrap: true });

  // Pause on hover
  on(el, 'mouseenter', () => carousel.pause());
  on(el, 'mouseleave', () => carousel.cycle());
}

/* =========================================================
   21. STAR RATING HOVER EFFECT (Global)
   ========================================================= */
function initStarRatings() {
  $$('.star-rating').forEach(container => {
    const stars = $$('i', container);
    const input = document.getElementById(container.dataset.input || 'ratingValue');

    stars.forEach((star, i) => {
      on(star, 'mouseenter', () => {
        stars.forEach((s, j) => {
          s.classList.toggle('hover', j <= i);
          s.classList.remove('active');
        });
      });

      on(star, 'mouseleave', () => {
        const val = input ? parseInt(input.value) || 0 : 0;
        stars.forEach((s, j) => {
          s.classList.remove('hover');
          s.classList.toggle('active', j < val);
        });
      });

      on(star, 'click', () => {
        if (input) input.value = i + 1;
        stars.forEach((s, j) => {
          s.classList.remove('hover');
          s.classList.toggle('active', j <= i);
        });
      });
    });
  });
}

/* =========================================================
   22. PRINT APPOINTMENT CONFIRMATION
   ========================================================= */
window.printAppointmentConfirmation = function(data = {}) {
  const {
    patientName = 'John Doe',
    doctor = 'Dr. Sarah Mitchell',
    department = 'Cardiology',
    date = new Date().toLocaleDateString(),
    time = '10:30 AM',
    refId = 'MC-' + Math.random().toString(36).slice(2,8).toUpperCase()
  } = data;

  const win = window.open('', '_blank', 'width=700,height=600');
  if (!win) return;

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Appointment Confirmation – MediCare</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #0d6efd; padding-bottom: 20px; margin-bottom: 24px; }
        .logo { color: #0d6efd; font-size: 1.5rem; font-weight: 800; }
        .ref-box { background: #f0f7ff; border: 1px solid #0d6efd; border-radius: 8px; padding: 12px 20px; margin: 20px 0; text-align: center; }
        .ref-box .ref-label { font-size: .8rem; color: #64748b; }
        .ref-box .ref-num { font-size: 1.4rem; font-weight: 900; color: #0d6efd; letter-spacing: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; }
        td:first-child { font-weight: 600; color: #64748b; width: 40%; }
        .footer { margin-top: 40px; font-size: .8rem; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body onload="window.print()">
      <div class="header">
        <div class="logo">⚕ MediCare Hospital</div>
        <div style="color:#64748b;font-size:.9rem;margin-top:4px">4200 Medical Center Drive, New York, NY 10001</div>
        <h2 style="margin:16px 0 0;font-size:1.2rem;color:#0a2540;">Appointment Confirmation</h2>
      </div>
      <div class="ref-box">
        <div class="ref-label">Reference Number</div>
        <div class="ref-num">${refId}</div>
      </div>
      <table>
        <tr><td>Patient Name</td><td>${patientName}</td></tr>
        <tr><td>Doctor</td><td>${doctor}</td></tr>
        <tr><td>Department</td><td>${department}</td></tr>
        <tr><td>Date</td><td>${date}</td></tr>
        <tr><td>Time</td><td>${time}</td></tr>
        <tr><td>Status</td><td><strong style="color:#198754;">Confirmed ✓</strong></td></tr>
      </table>
      <div style="background:#fff3cd;border-radius:8px;padding:14px 18px;margin-top:20px;font-size:.85rem;">
        <strong>Please arrive 15 minutes early</strong> with your valid ID, insurance card, and this confirmation. 
        To reschedule, call <strong>+1-555-123-4567</strong> at least 24 hours in advance.
      </div>
      <div class="footer">
        Generated on ${new Date().toLocaleString()} &nbsp;|&nbsp; MediCare Hospital © 2026 &nbsp;|&nbsp; info@medicare-hospital.com
      </div>
    </body>
    </html>
  `);
  win.document.close();
};

/* =========================================================
   23. IMAGE LAZY LOADING
   ========================================================= */
function initLazyLoading() {
  if ('loading' in HTMLImageElement.prototype) {
    $$('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  $$('img[data-src]').forEach(img => observer.observe(img));
}

/* =========================================================
   24. COOKIE CONSENT BANNER
   ========================================================= */
function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;

  if (localStorage.getItem('cookieConsent')) { banner.style.display = 'none'; return; }

  // Show banner after short delay
  setTimeout(() => banner.classList.add('show'), 1500);

  const accept = document.getElementById('cookie-accept');
  const decline = document.getElementById('cookie-decline');

  function dismiss(consent) {
    banner.classList.remove('show');
    setTimeout(() => banner.style.display = 'none', 350);
    localStorage.setItem('cookieConsent', consent ? 'accepted' : 'declined');
    if (consent) showToast('info', 'Cookies Accepted', 'Your preferences have been saved.');
  }

  if (accept) on(accept, 'click', () => dismiss(true));
  if (decline) on(decline, 'click', () => dismiss(false));
}

/* =========================================================
   25. BOOTSTRAP TOOLTIPS & POPOVERS INIT
   ========================================================= */
function initBootstrapComponents() {
  // Tooltips
  $$('[data-bs-toggle="tooltip"]').forEach(el => {
    new bootstrap.Tooltip(el, { trigger: 'hover' });
  });

  // Popovers
  $$('[data-bs-toggle="popover"]').forEach(el => {
    new bootstrap.Popover(el);
  });
}

/* =========================================================
   26. FORM VALIDATION HELPERS
   ========================================================= */
function initFormValidation() {
  // Real-time validation for all forms with .needs-validation
  $$('form.needs-validation').forEach(form => {
    // Input event for real-time
    $$('[required]', form).forEach(field => {
      on(field, 'input', () => {
        if (field.checkValidity()) {
          field.classList.remove('is-invalid');
          field.classList.add('is-valid');
        } else {
          field.classList.remove('is-valid');
        }
      });

      on(field, 'blur', () => {
        if (!field.checkValidity()) field.classList.add('is-invalid');
      });
    });
  });
}

/* =========================================================
   27. HERO PARALLAX EFFECT
   ========================================================= */
function initParallax() {
  const hero = $('.page-hero') || $('[data-parallax]');
  if (!hero) return;

  const handle = throttle(() => {
    const scrollY = window.scrollY;
    const rate = hero.dataset.parallaxRate || 0.4;
    hero.style.backgroundPositionY = (scrollY * rate) + 'px';
  }, 16);

  window.addEventListener('scroll', handle, { passive: true });
}

/* =========================================================
   28. ACCORDION SEARCH FILTER
   ========================================================= */
function initAccordionSearch() {
  const searchInput = document.getElementById('faq-search');
  if (!searchInput) return;

  on(searchInput, 'input', debounce(function() {
    const q = this.value.trim().toLowerCase();
    const items = $$('.faq-accordion .accordion-item');

    items.forEach(item => {
      const btn = $('[data-bs-toggle="collapse"]', item);
      const body = $('[class*="accordion-body"]', item);
      const text = ((btn ? btn.textContent : '') + (body ? body.textContent : '')).toLowerCase();
      item.style.display = (!q || text.includes(q)) ? '' : 'none';
    });
  }, 300));
}

/* =========================================================
   29. SCROLL SPY FOR ACTIVE NAV LINKS
   ========================================================= */
function initScrollSpy() {
  const sections = $$('section[id]');
  const navLinks = $$('.nav-link');
  if (!sections.length) return;

  const handle = throttle(() => {
    let current = '';
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top;
      if (top <= 100) current = sec.id;
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.includes(current) && current) {
        link.classList.add('active');
      }
    });
  }, 100);

  window.addEventListener('scroll', handle, { passive: true });
}

/* =========================================================
   30. TESTIMONIAL STAR DISPLAY
   ========================================================= */
function initTestimonialStars() {
  $$('[data-rating]').forEach(el => {
    const rating = parseFloat(el.dataset.rating) || 0;
    let html = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) html += '<i class="fa fa-star text-warning"></i>';
      else if (i - 0.5 <= rating) html += '<i class="fa fa-star-half-stroke text-warning"></i>';
      else html += '<i class="fa fa-star text-secondary opacity-25"></i>';
    }
    el.innerHTML = html;
  });
}

/* =========================================================
   31. KEYBOARD ACCESSIBILITY
   ========================================================= */
function initKeyboardNav() {
  // Skip to content
  const skipLink = document.getElementById('skip-to-content');
  if (skipLink) {
    on(skipLink, 'click', (e) => {
      e.preventDefault();
      const main = document.getElementById('main-content') || $('main');
      if (main) { main.setAttribute('tabindex', '-1'); main.focus(); }
    });
  }

  // Close modals/overlays with Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('searchOverlay');
      if (overlay && overlay.classList.contains('active')) {
        overlay.classList.remove('active');
      }
    }
  });
}

/* =========================================================
   32. DYNAMIC NAVBAR HIGHLIGHT (based on current page)
   ========================================================= */
function initActiveNavLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === page || href.endsWith('/' + page))) {
      link.classList.add('active');
    }
  });
}

/* =========================================================
   33. PHONE NUMBER CLICK TO CALL TRACKING
   ========================================================= */
function initPhoneTracking() {
  $$('a[href^="tel:"]').forEach(link => {
    on(link, 'click', () => {
      const num = link.getAttribute('href').replace('tel:', '');
      console.info(`[Analytics] Click-to-call: ${num}`);
      // In production: send analytics event here
    });
  });
}

/* =========================================================
   34. CARD HOVER TILT EFFECT (3D)
   ========================================================= */
function initCardTilt() {
  $$('[data-tilt]').forEach(card => {
    const intensity = parseFloat(card.dataset.tiltIntensity) || 8;

    on(card, 'mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale(1.02)`;
    });

    on(card, 'mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* =========================================================
   35. INITIALIZE EVERYTHING ON DOM READY
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initReadingProgress();
  initNavbarScroll();
  initEmergencyBanner();
  initBackToTop();
  initSmoothScroll();
  initCounters();
  initTypedText();
  initScrollAnimations();
  initMobileMenuClose();
  initSearchOverlay();
  initAppointmentModal();
  initDatePickers();
  initDepartmentFilter();
  initDoctorViewToggle();
  initDoctorSearch();
  initLoadMore();
  initServiceTabs();
  initTestimonialCarousel();
  initStarRatings();
  initLazyLoading();
  initCookieBanner();
  initBootstrapComponents();
  initFormValidation();
  initParallax();
  initAccordionSearch();
  initScrollSpy();
  initTestimonialStars();
  initKeyboardNav();
  initActiveNavLink();
  initPhoneTracking();
  initCardTilt();

  console.log('%c✚ MediCare Hospital – JS Loaded', 'color:#0d6efd;font-weight:bold;font-size:1rem;');
});

/* =========================================================
   36. GLOBAL EXPOSED UTILITIES
   ========================================================= */
window.MediCare = {
  showToast,
  printAppointmentConfirmation,
  utils: { $, $$, debounce, throttle, uid, clamp }
};

/**
 * MediCare Hospital — filter.js
 * Department Filter, Doctor Filter, Appointment Flow, Service Filter
 * Author: MediCare Dev Team
 * Version: 2.0.0
 */

'use strict';

/* =========================================================
   UTILITY HELPERS (local, no dependency on main.js)
   ========================================================= */

const _$ = (sel, ctx = document) => ctx.querySelector(sel);
const _$$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

function _debounce(fn, wait = 250) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

function _sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function _fuzzyMatch(str, query) {
  if (!query) return true;
  str = str.toLowerCase();
  query = query.toLowerCase();
  if (str.includes(query)) return true;
  // Simple fuzzy: all chars of query appear in order
  let si = 0;
  for (let i = 0; i < query.length; i++) {
    si = str.indexOf(query[i], si);
    if (si === -1) return false;
    si++;
  }
  return true;
}

function _highlightText(text, query) {
  if (!query || !text) return _sanitize(text || '');
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return _sanitize(text).replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

/* =========================================================
   CLASS 1: DepartmentFilter
   ========================================================= */

class DepartmentFilter {
  /**
   * @param {string} containerSel – CSS selector for the card grid
   * @param {Array}  data         – Array of department objects
   */
  constructor(containerSel, data = []) {
    this.container = _$(containerSel);
    this.data = data;
    this.filtered = [...data];
    this.currentCategory = 'all';
    this.currentSort = 'name';
    this.searchQuery = '';
    this.modalEl = null;
  }

  /* ---- PUBLIC API ---- */

  init() {
    if (!this.container) { console.warn('[DeptFilter] Container not found'); return this; }
    this._setupModal();
    this.renderDepartments(this.filtered);
    this._bindFilterButtons();
    this._bindSearchInput();
    this._bindSortSelect();
    return this;
  }

  renderDepartments(depts) {
    if (!this.container) return;
    if (!depts.length) {
      this.container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fa fa-building-columns fa-3x text-muted mb-3 d-block"></i>
          <h5 class="text-muted">No departments match your search.</h5>
          <button class="btn btn-outline-primary mt-3 rounded-pill" onclick="window._deptFilterInstance?.clearFilters()">
            <i class="fa fa-rotate-left me-2"></i>Clear Filters
          </button>
        </div>`;
      return;
    }

    this.container.innerHTML = depts.map(dept => this._buildDeptCard(dept)).join('');

    // Re-attach click events
    _$$('.dept-card-open', this.container).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDeptModal(btn.dataset.id);
      });
    });

    // Animate cards in
    requestAnimationFrame(() => {
      _$$('.dept-filter-card', this.container).forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity .4s ease ${i * 60}ms, transform .4s ease ${i * 60}ms`;
        requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = 'none'; });
      });
    });
  }

  filterByCategory(cat) {
    this.currentCategory = cat;
    this._applyAll();
  }

  filterBySearch(query) {
    this.searchQuery = query.trim().toLowerCase();
    this._applyAll();
  }

  sortDepartments(type) {
    this.currentSort = type;
    this._applyAll();
  }

  clearFilters() {
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.currentSort = 'name';
    _$$('[data-dept-filter]').forEach(btn => btn.classList.remove('active'));
    const allBtn = _$('[data-dept-filter="all"]');
    if (allBtn) allBtn.classList.add('active');
    const searchInput = document.getElementById('dept-search-input');
    if (searchInput) searchInput.value = '';
    const sortSelect = document.getElementById('dept-sort-select');
    if (sortSelect) sortSelect.value = 'name';
    this._applyAll();
  }

  openDeptModal(id) {
    const dept = this.data.find(d => String(d.id) === String(id));
    if (!dept || !this.modalEl) return;

    _$('#deptModalTitle', this.modalEl).textContent = dept.name;
    _$('#deptModalBody', this.modalEl).innerHTML = this._buildDeptModalContent(dept);

    const bsModal = bootstrap.Modal.getOrCreateInstance(this.modalEl);
    bsModal.show();
  }

  /* ---- PRIVATE ---- */

  _applyAll() {
    let result = [...this.data];

    // Category filter
    if (this.currentCategory !== 'all') {
      result = result.filter(d => d.category === this.currentCategory);
    }

    // Search
    if (this.searchQuery) {
      result = result.filter(d =>
        _fuzzyMatch(d.name, this.searchQuery) ||
        _fuzzyMatch(d.description || '', this.searchQuery) ||
        (d.specializations || []).some(s => _fuzzyMatch(s, this.searchQuery))
      );
    }

    // Sort
    if (this.currentSort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.currentSort === 'doctors') {
      result.sort((a, b) => (b.doctorCount || 0) - (a.doctorCount || 0));
    } else if (this.currentSort === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    this.filtered = result;
    this.renderDepartments(result);

    // Update count badge
    const countEl = document.getElementById('dept-count');
    if (countEl) countEl.textContent = result.length;
  }

  _bindFilterButtons() {
    _$$('[data-dept-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        _$$('[data-dept-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filterByCategory(btn.dataset.deptFilter);
      });
    });
  }

  _bindSearchInput() {
    const input = document.getElementById('dept-search-input');
    if (!input) return;
    input.addEventListener('input', _debounce((e) => {
      this.filterBySearch(e.target.value);
    }, 300));
  }

  _bindSortSelect() {
    const select = document.getElementById('dept-sort-select');
    if (!select) return;
    select.addEventListener('change', () => this.sortDepartments(select.value));
  }

  _setupModal() {
    let modal = document.getElementById('deptDetailModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = 'deptDetailModal';
      modal.tabIndex = -1;
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content border-0 rounded-4 overflow-hidden">
            <div class="modal-header bg-gradient" style="background:linear-gradient(135deg,#0a2540,#0d6efd);">
              <h5 class="modal-title text-white fw-700" id="deptModalTitle">Department</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4" id="deptModalBody"></div>
            <div class="modal-footer border-0">
              <a href="appointment.html" class="btn btn-primary rounded-pill px-4">
                <i class="fa fa-calendar-check me-2"></i>Book Appointment
              </a>
              <button type="button" class="btn btn-outline-secondary rounded-pill" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(modal);
    }
    this.modalEl = modal;
  }

  _buildDeptCard(dept) {
    const iconMap = {
      cardiology: 'fa-heart-pulse', neurology: 'fa-brain', orthopedics: 'fa-bone',
      pediatrics: 'fa-child', oncology: 'fa-ribbon', radiology: 'fa-x-ray',
      gynecology: 'fa-venus', surgery: 'fa-scalpel', ent: 'fa-ear',
      ophthalmology: 'fa-eye', psychiatry: 'fa-head-side-virus', emergency: 'fa-truck-medical',
      default: 'fa-stethoscope'
    };
    const icon = iconMap[(dept.category || '').toLowerCase()] || iconMap.default;
    const rating = dept.rating || 4.5;
    const stars = Math.round(rating);

    return `
      <div class="col-sm-6 col-lg-4">
        <div class="dept-filter-card card border-0 h-100 shadow-sm rounded-4 overflow-hidden">
          <div class="dept-card-header p-4 pb-3" style="background:linear-gradient(135deg,${dept.color || '#0d6efd'},${dept.colorLight || '#0dcaf0'});">
            <div class="d-flex align-items-start justify-content-between">
              <div class="dept-card-icon mb-2" style="width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:#fff;">
                <i class="fa ${icon}"></i>
              </div>
              <span class="badge bg-white text-primary fw-700" style="font-size:.72rem;">${dept.category || 'General'}</span>
            </div>
            <h5 class="text-white fw-700 mb-1 mt-2" style="font-size:1rem;">${_sanitize(dept.name)}</h5>
            <div class="d-flex align-items-center gap-2">
              ${Array.from({length:5},(_,i)=>`<i class="fa fa-star${i<stars?'':'-o'} fa-xs text-warning"></i>`).join('')}
              <span class="text-white-50 small">${rating.toFixed(1)}</span>
            </div>
          </div>
          <div class="card-body p-4 pt-3 d-flex flex-column">
            <p class="text-muted small mb-3" style="line-height:1.6;">${_sanitize(dept.description || 'Comprehensive care with expert specialists.')}</p>
            <div class="d-flex gap-3 mb-3">
              <div class="text-center">
                <div class="fw-800 text-primary" style="font-size:1.1rem;">${dept.doctorCount || 0}</div>
                <div class="text-muted" style="font-size:.72rem;">Doctors</div>
              </div>
              <div class="text-center">
                <div class="fw-800 text-primary" style="font-size:1.1rem;">${dept.beds || 0}</div>
                <div class="text-muted" style="font-size:.72rem;">Beds</div>
              </div>
              <div class="text-center">
                <div class="fw-800 text-primary" style="font-size:1.1rem;">${dept.experience || '20+'}y</div>
                <div class="text-muted" style="font-size:.72rem;">Experience</div>
              </div>
            </div>
            ${dept.specializations && dept.specializations.length ? `
              <div class="mb-3 d-flex flex-wrap gap-1">
                ${dept.specializations.slice(0,3).map(s => `<span class="badge bg-primary-subtle text-primary rounded-pill" style="font-size:.72rem;">${_sanitize(s)}</span>`).join('')}
                ${dept.specializations.length > 3 ? `<span class="badge bg-secondary-subtle text-secondary rounded-pill" style="font-size:.72rem;">+${dept.specializations.length - 3} more</span>` : ''}
              </div>` : ''}
            <div class="mt-auto d-flex gap-2">
              <button class="btn btn-primary btn-sm rounded-pill flex-grow-1 dept-card-open" data-id="${dept.id}">
                <i class="fa fa-circle-info me-1"></i>Details
              </button>
              <a href="appointment.html?dept=${encodeURIComponent(dept.name)}" class="btn btn-outline-primary btn-sm rounded-pill">
                <i class="fa fa-calendar-check"></i>
              </a>
            </div>
          </div>
        </div>
      </div>`;
  }

  _buildDeptModalContent(dept) {
    return `
      <div class="row g-4">
        <div class="col-md-6">
          <h6 class="fw-700 text-navy mb-2"><i class="fa fa-circle-info text-primary me-2"></i>About This Department</h6>
          <p class="text-muted small">${_sanitize(dept.description || '')}</p>
          ${dept.longDescription ? `<p class="text-muted small">${_sanitize(dept.longDescription)}</p>` : ''}
        </div>
        <div class="col-md-6">
          <h6 class="fw-700 text-navy mb-2"><i class="fa fa-list-check text-primary me-2"></i>Specializations</h6>
          <ul class="list-unstyled mb-0">
            ${(dept.specializations || ['General Consultation','Diagnostic Services','Treatment Planning']).map(s =>
              `<li class="d-flex align-items-center gap-2 mb-1"><i class="fa fa-check-circle text-success fa-sm"></i><span class="small">${_sanitize(s)}</span></li>`
            ).join('')}
          </ul>
        </div>
        <div class="col-md-6">
          <h6 class="fw-700 text-navy mb-2"><i class="fa fa-phone text-primary me-2"></i>Contact</h6>
          <ul class="list-unstyled small text-muted">
            <li class="mb-1"><i class="fa fa-phone-volume me-2 text-primary"></i>${dept.phone || '+1-555-100-XXXX'}</li>
            <li class="mb-1"><i class="fa fa-fax me-2 text-muted"></i>${dept.fax || '+1-555-100-XXXY'}</li>
            <li><i class="fa fa-envelope me-2 text-primary"></i><a href="mailto:${dept.email || 'dept@medicare-hospital.com'}">${dept.email || 'dept@medicare-hospital.com'}</a></li>
          </ul>
        </div>
        <div class="col-md-6">
          <h6 class="fw-700 text-navy mb-2"><i class="fa fa-clock text-primary me-2"></i>OPD Hours</h6>
          <div class="small text-muted">${dept.opdHours || 'Mon–Fri: 9:00 AM – 5:00 PM<br>Sat: 9:00 AM – 1:00 PM'}</div>
        </div>
      </div>`;
  }
}

/* =========================================================
   CLASS 2: DoctorFilter
   ========================================================= */

class DoctorFilter {
  /**
   * @param {string} containerSel  – CSS selector for doctor grid
   * @param {string} sidebarSel    – CSS selector for filter sidebar
   * @param {Array}  data          – Array of doctor objects
   */
  constructor(containerSel, sidebarSel, data = []) {
    this.container = _$(containerSel);
    this.sidebar = _$(sidebarSel);
    this.data = data;
    this.filtered = [...data];
    this.viewMode = 'grid';
    this.activeFilters = {
      name: '',
      departments: [],
      availability: 'any',
      experience: 'any',
      minRating: 0,
      sort: 'name'
    };
    this.modalEl = null;
    this.shownCount = 9;
  }

  /* ---- PUBLIC API ---- */

  init() {
    if (!this.container) { console.warn('[DoctorFilter] Container not found'); return this; }
    this._setupModal();
    this.renderDoctors(this.filtered, this.viewMode);
    this._bindNameSearch();
    this._bindDeptCheckboxes();
    this._bindAvailabilityRadios();
    this._bindExperienceSelect();
    this._bindRatingFilter();
    this._bindSortSelect();
    this._bindViewToggle();
    this._bindClearFilters();
    this._bindLoadMore();
    return this;
  }

  renderDoctors(doctors, viewMode = 'grid') {
    if (!this.container) return;
    this.viewMode = viewMode;

    const visible = doctors.slice(0, this.shownCount);

    if (!doctors.length) {
      this.container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fa fa-user-doctor fa-3x text-muted mb-3 d-block"></i>
          <h5 class="text-muted">No doctors match your filters.</h5>
          <button class="btn btn-outline-primary mt-3 rounded-pill" onclick="window._doctorFilterInstance?.clearFilters()">
            <i class="fa fa-rotate-left me-2"></i>Clear All Filters
          </button>
        </div>`;
      return;
    }

    this.container.innerHTML = visible.map(doc =>
      viewMode === 'grid' ? this._buildDoctorGridCard(doc) : this._buildDoctorListCard(doc)
    ).join('');

    // Load more button
    const loadMoreArea = document.getElementById('load-more-area');
    if (loadMoreArea) {
      loadMoreArea.style.display = doctors.length > this.shownCount ? '' : 'none';
    }

    // Animate
    requestAnimationFrame(() => {
      _$$('.doctor-filter-card', this.container).forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
        card.style.transition = `opacity .35s ${i * 50}ms, transform .35s ${i * 50}ms`;
        requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = 'none'; });
      });
    });

    // Bind modal open
    _$$('.doctor-profile-open', this.container).forEach(btn => {
      btn.addEventListener('click', () => this.openDoctorModal(btn.dataset.id));
    });

    // Update count
    const countEl = document.getElementById('doctor-count');
    if (countEl) countEl.textContent = doctors.length;
  }

  applyFilters() {
    let result = [...this.data];
    const f = this.activeFilters;

    if (f.name) result = this.filterByName(f.name, result);
    if (f.departments.length) result = this.filterByDept(f.departments, result);
    if (f.availability !== 'any') result = this.filterByAvailability(f.availability, result);
    if (f.experience !== 'any') result = this.filterByExperience(f.experience, result);
    if (f.minRating > 0) result = this.filterByRating(f.minRating, result);

    result = this.sortDoctors(f.sort, result);
    this.filtered = result;
    this.shownCount = 9;
    this.renderDoctors(result, this.viewMode);
  }

  filterByName(q, data = this.data) {
    const lower = q.toLowerCase();
    return data.filter(d =>
      _fuzzyMatch(d.name, lower) ||
      _fuzzyMatch(d.department, lower) ||
      _fuzzyMatch(d.specialization || '', lower)
    );
  }

  filterByDept(deptIds, data = this.data) {
    return data.filter(d => deptIds.includes(String(d.departmentId)));
  }

  filterByAvailability(avail, data = this.data) {
    const today = new Date().toISOString().split('T')[0];
    if (avail === 'today') {
      return data.filter(d => d.availableDates && d.availableDates.includes(today));
    }
    if (avail === 'week') {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      return data.filter(d =>
        d.availableDates && d.availableDates.some(date => date >= today && date <= weekEndStr)
      );
    }
    return data;
  }

  filterByExperience(range, data = this.data) {
    const ranges = {
      '0-5': [0, 5], '5-10': [5, 10], '10-20': [10, 20], '20+': [20, Infinity]
    };
    const [min, max] = ranges[range] || [0, Infinity];
    return data.filter(d => (d.experience || 0) >= min && (d.experience || 0) <= max);
  }

  filterByRating(minRating, data = this.data) {
    return data.filter(d => (d.rating || 0) >= minRating);
  }

  sortDoctors(type, data = this.filtered) {
    const sorted = [...data];
    if (type === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (type === 'experience') sorted.sort((a, b) => (b.experience || 0) - (a.experience || 0));
    else if (type === 'rating') sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return sorted;
  }

  toggleView(mode) {
    this.viewMode = mode;
    this.renderDoctors(this.filtered, mode);
  }

  openDoctorModal(id) {
    const doctor = this.data.find(d => String(d.id) === String(id));
    if (!doctor || !this.modalEl) return;

    _$('#doctorModalTitle', this.modalEl).textContent = 'Dr. ' + doctor.name;
    _$('#doctorModalBody', this.modalEl).innerHTML = this._buildDoctorModalContent(doctor);

    bootstrap.Modal.getOrCreateInstance(this.modalEl).show();
  }

  clearFilters() {
    this.activeFilters = { name: '', departments: [], availability: 'any', experience: 'any', minRating: 0, sort: 'name' };

    // Reset UI
    const nameInput = document.getElementById('doctor-name-filter');
    if (nameInput) nameInput.value = '';

    _$$('[data-dept-cb]').forEach(cb => cb.checked = false);

    const avail = _$('[name="avail-filter"][value="any"]');
    if (avail) avail.checked = true;

    const expSelect = document.getElementById('exp-filter');
    if (expSelect) expSelect.value = 'any';

    const ratingSelect = document.getElementById('rating-filter');
    if (ratingSelect) ratingSelect.value = '0';

    const sortSelect = document.getElementById('doctor-sort-select');
    if (sortSelect) sortSelect.value = 'name';

    this.applyFilters();

    if (window.showToast) showToast('info', 'Filters Cleared', 'Showing all doctors.');
  }

  /* ---- PRIVATE ---- */

  _bindNameSearch() {
    const input = document.getElementById('doctor-name-filter');
    if (!input) return;
    input.addEventListener('input', _debounce((e) => {
      this.activeFilters.name = e.target.value.trim();
      this.applyFilters();
    }, 300));
  }

  _bindDeptCheckboxes() {
    _$$('[data-dept-cb]').forEach(cb => {
      cb.addEventListener('change', () => {
        const deptIds = Array.from(_$$('[data-dept-cb]:checked')).map(c => c.value);
        this.activeFilters.departments = deptIds;
        this.applyFilters();
      });
    });
  }

  _bindAvailabilityRadios() {
    _$$('[name="avail-filter"]').forEach(radio => {
      radio.addEventListener('change', () => {
        this.activeFilters.availability = radio.value;
        this.applyFilters();
      });
    });
  }

  _bindExperienceSelect() {
    const sel = document.getElementById('exp-filter');
    if (!sel) return;
    sel.addEventListener('change', () => {
      this.activeFilters.experience = sel.value;
      this.applyFilters();
    });
  }

  _bindRatingFilter() {
    const sel = document.getElementById('rating-filter');
    if (!sel) return;
    sel.addEventListener('change', () => {
      this.activeFilters.minRating = parseFloat(sel.value) || 0;
      this.applyFilters();
    });
  }

  _bindSortSelect() {
    const sel = document.getElementById('doctor-sort-select');
    if (!sel) return;
    sel.addEventListener('change', () => {
      this.activeFilters.sort = sel.value;
      this.applyFilters();
    });
  }

  _bindViewToggle() {
    const gridBtn = document.getElementById('view-grid');
    const listBtn = document.getElementById('view-list');
    if (gridBtn) gridBtn.addEventListener('click', () => { this.toggleView('grid'); gridBtn.classList.add('active'); if (listBtn) listBtn.classList.remove('active'); });
    if (listBtn) listBtn.addEventListener('click', () => { this.toggleView('list'); listBtn.classList.add('active'); if (gridBtn) gridBtn.classList.remove('active'); });
  }

  _bindClearFilters() {
    const btn = document.getElementById('clear-doctor-filters');
    if (btn) btn.addEventListener('click', () => this.clearFilters());
  }

  _bindLoadMore() {
    const btn = document.getElementById('load-more-doctors');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const prev = this.shownCount;
      this.shownCount = Math.min(this.shownCount + 6, this.filtered.length);
      // Append new cards only
      const newDocs = this.filtered.slice(prev, this.shownCount);
      newDocs.forEach((doc, i) => {
        const div = document.createElement('div');
        div.innerHTML = this.viewMode === 'grid' ? this._buildDoctorGridCard(doc) : this._buildDoctorListCard(doc);
        const card = div.firstElementChild;
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
        this.container.appendChild(card);
        requestAnimationFrame(() => {
          card.style.transition = `opacity .35s ${i*60}ms, transform .35s ${i*60}ms`;
          card.style.opacity = '1';
          card.style.transform = 'none';
        });
        // Bind modal
        const openBtn = _$('.doctor-profile-open', card);
        if (openBtn) openBtn.addEventListener('click', () => this.openDoctorModal(openBtn.dataset.id));
      });
      if (this.shownCount >= this.filtered.length) btn.style.display = 'none';
    });
  }

  _setupModal() {
    let modal = document.getElementById('doctorProfileModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = 'doctorProfileModal';
      modal.tabIndex = -1;
      modal.innerHTML = `
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content border-0 rounded-4 overflow-hidden">
            <div class="modal-header" style="background:linear-gradient(135deg,#0a2540,#0d6efd);">
              <h5 class="modal-title text-white fw-700" id="doctorModalTitle"></h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-0" id="doctorModalBody"></div>
            <div class="modal-footer border-0">
              <a href="appointment.html" class="btn btn-primary rounded-pill px-4">
                <i class="fa fa-calendar-check me-2"></i>Book Appointment
              </a>
              <button type="button" class="btn btn-outline-secondary rounded-pill" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(modal);
    }
    this.modalEl = modal;
  }

  _buildStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) html += '<i class="fa fa-star text-warning fa-sm"></i>';
      else if (i - 0.5 <= rating) html += '<i class="fa fa-star-half-stroke text-warning fa-sm"></i>';
      else html += '<i class="fa fa-star text-secondary opacity-25 fa-sm"></i>';
    }
    return html;
  }

  _buildDoctorGridCard(doc) {
    const available = doc.availableToday !== false;
    return `
      <div class="col-sm-6 col-lg-4">
        <div class="doctor-filter-card card border-0 shadow-sm rounded-4 overflow-hidden h-100">
          <div class="position-relative">
            <div style="height:200px;background:linear-gradient(135deg,#e0f0ff,#f0f7ff);display:flex;align-items:center;justify-content:center;">
              ${doc.photo
                ? `<img src="${doc.photo}" alt="Dr. ${_sanitize(doc.name)}" style="width:130px;height:130px;border-radius:50%;object-fit:cover;border:4px solid #fff;box-shadow:0 4px 16px rgba(0,0,0,.15);" loading="lazy">`
                : `<div style="width:130px;height:130px;border-radius:50%;background:linear-gradient(135deg,#0d6efd,#0dcaf0);display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:#fff;font-weight:800;">${doc.name ? doc.name[0] : 'D'}</div>`
              }
            </div>
            <span class="position-absolute top-0 end-0 m-2 badge rounded-pill ${available ? 'bg-success' : 'bg-secondary'}" style="font-size:.7rem;">
              <i class="fa fa-circle me-1" style="font-size:.5rem;"></i>${available ? 'Available' : 'Unavailable'}
            </span>
          </div>
          <div class="card-body text-center p-4">
            <h6 class="fw-800 mb-0 text-navy" style="font-size:.95rem;">Dr. ${_sanitize(doc.name)}</h6>
            <div class="text-primary small fw-600 mb-1">${_sanitize(doc.qualification || 'MBBS, MD')}</div>
            <div class="text-muted small mb-2">${_sanitize(doc.department || 'General Medicine')}</div>
            <div class="d-flex align-items-center justify-content-center gap-1 mb-3">
              ${this._buildStars(doc.rating || 4.5)}
              <span class="text-muted small ms-1">(${doc.reviewCount || 0})</span>
            </div>
            <div class="d-flex justify-content-center gap-3 mb-3">
              <div class="text-center">
                <div class="fw-800 text-primary">${doc.experience || 0}<span class="text-muted fw-400" style="font-size:.7rem;">yr</span></div>
                <div class="text-muted" style="font-size:.7rem;">Experience</div>
              </div>
              <div class="text-center">
                <div class="fw-800 text-primary">${doc.patients || '1K+'}</div>
                <div class="text-muted" style="font-size:.7rem;">Patients</div>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-primary btn-sm rounded-pill flex-grow-1 doctor-profile-open" data-id="${doc.id}">
                <i class="fa fa-user me-1"></i>Profile
              </button>
              <a href="appointment.html?doc=${doc.id}" class="btn btn-outline-primary btn-sm rounded-pill">
                <i class="fa fa-calendar-check"></i>
              </a>
            </div>
          </div>
        </div>
      </div>`;
  }

  _buildDoctorListCard(doc) {
    const available = doc.availableToday !== false;
    return `
      <div class="col-12">
        <div class="doctor-filter-card card border-0 shadow-sm rounded-4 overflow-hidden">
          <div class="card-body p-4">
            <div class="row align-items-center g-3">
              <div class="col-auto">
                ${doc.photo
                  ? `<img src="${doc.photo}" alt="Dr. ${_sanitize(doc.name)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid #e2e8f0;" loading="lazy">`
                  : `<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#0d6efd,#0dcaf0);display:flex;align-items:center;justify-content:center;font-size:1.8rem;color:#fff;font-weight:800;">${doc.name ? doc.name[0] : 'D'}</div>`
                }
              </div>
              <div class="col">
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <h6 class="mb-0 fw-800 text-navy">Dr. ${_sanitize(doc.name)}</h6>
                  <span class="badge rounded-pill ${available ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}" style="font-size:.7rem;">
                    ${available ? 'Available Today' : 'Unavailable'}
                  </span>
                </div>
                <div class="text-primary small fw-600">${_sanitize(doc.qualification || 'MBBS, MD')}</div>
                <div class="text-muted small">${_sanitize(doc.department || 'General Medicine')}</div>
                <div class="d-flex align-items-center gap-1 mt-1">
                  ${this._buildStars(doc.rating || 4.5)}
                  <span class="text-muted small ms-1">${(doc.rating || 4.5).toFixed(1)} (${doc.reviewCount || 0} reviews)</span>
                </div>
              </div>
              <div class="col-auto d-flex gap-3">
                <div class="text-center px-3 border-start">
                  <div class="fw-800 text-primary fs-5">${doc.experience || 0}</div>
                  <div class="text-muted" style="font-size:.72rem;">Years Exp.</div>
                </div>
                <div class="text-center px-3 border-start">
                  <div class="fw-800 text-primary fs-5">${doc.patients || '1K+'}</div>
                  <div class="text-muted" style="font-size:.72rem;">Patients</div>
                </div>
              </div>
              <div class="col-auto d-flex gap-2">
                <button class="btn btn-primary btn-sm rounded-pill doctor-profile-open" data-id="${doc.id}">
                  <i class="fa fa-user me-1"></i>Profile
                </button>
                <a href="appointment.html?doc=${doc.id}" class="btn btn-outline-primary btn-sm rounded-pill">
                  <i class="fa fa-calendar-check me-1"></i>Book
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  _buildDoctorModalContent(doc) {
    return `
      <div class="p-4 pb-0" style="background:linear-gradient(135deg,#f0f7ff,#fff);">
        <div class="row align-items-center g-3 pb-4">
          <div class="col-auto">
            ${doc.photo
              ? `<img src="${doc.photo}" alt="Dr. ${_sanitize(doc.name)}" style="width:110px;height:110px;border-radius:50%;object-fit:cover;border:4px solid #fff;box-shadow:0 4px 20px rgba(13,110,253,.2);">`
              : `<div style="width:110px;height:110px;border-radius:50%;background:linear-gradient(135deg,#0d6efd,#0dcaf0);display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:#fff;font-weight:800;">${doc.name[0]}</div>`
            }
          </div>
          <div class="col">
            <h4 class="fw-800 text-navy mb-1">Dr. ${_sanitize(doc.name)}</h4>
            <div class="text-primary fw-600 mb-1">${_sanitize(doc.qualification || 'MBBS, MD')}</div>
            <div class="text-muted small mb-2">${_sanitize(doc.department || '')} &bull; ${_sanitize(doc.specialization || '')}</div>
            <div class="d-flex flex-wrap gap-2">
              <span class="badge bg-primary-subtle text-primary rounded-pill">${doc.experience || 0}+ Years Exp.</span>
              <span class="badge bg-success-subtle text-success rounded-pill"><i class="fa fa-circle me-1" style="font-size:.5rem;"></i>Available</span>
            </div>
          </div>
          <div class="col-auto d-flex gap-3 text-center">
            <div><div class="fw-800 fs-4 text-primary">${(doc.rating || 4.5).toFixed(1)}</div><div class="text-muted small">Rating</div></div>
            <div><div class="fw-800 fs-4 text-primary">${doc.patients || '2K+'}</div><div class="text-muted small">Patients</div></div>
            <div><div class="fw-800 fs-4 text-primary">${doc.reviewCount || 0}</div><div class="text-muted small">Reviews</div></div>
          </div>
        </div>
      </div>
      <div class="p-4">
        <div class="row g-4">
          <div class="col-lg-8">
            <h6 class="fw-700 text-navy mb-2"><i class="fa fa-user-doctor text-primary me-2"></i>About Dr. ${_sanitize(doc.name)}</h6>
            <p class="text-muted small">${_sanitize(doc.bio || 'An experienced specialist dedicated to providing high-quality patient care with evidence-based treatments.')}</p>
            ${doc.subspecialties ? `
              <h6 class="fw-700 text-navy mb-2 mt-3"><i class="fa fa-list-check text-primary me-2"></i>Areas of Expertise</h6>
              <div class="d-flex flex-wrap gap-2">
                ${doc.subspecialties.map(s => `<span class="badge bg-light text-primary border border-primary-subtle rounded-pill">${_sanitize(s)}</span>`).join('')}
              </div>` : ''}
          </div>
          <div class="col-lg-4">
            <div class="p-3 rounded-3 bg-light">
              <h6 class="fw-700 text-navy mb-3">Quick Info</h6>
              <ul class="list-unstyled small mb-0">
                <li class="mb-2"><i class="fa fa-stethoscope text-primary me-2"></i><strong>Dept:</strong> ${_sanitize(doc.department || 'N/A')}</li>
                <li class="mb-2"><i class="fa fa-graduation-cap text-primary me-2"></i><strong>Education:</strong> ${_sanitize(doc.qualification || 'N/A')}</li>
                <li class="mb-2"><i class="fa fa-clock text-primary me-2"></i><strong>OPD:</strong> ${_sanitize(doc.opdDays || 'Mon–Fri')}</li>
                <li><i class="fa fa-building text-primary me-2"></i><strong>Room:</strong> ${_sanitize(doc.room || 'OPD-' + (doc.id || 'XX'))}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>`;
  }
}

/* =========================================================
   CLASS 3: AppointmentFlow
   ========================================================= */

class AppointmentFlow {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.bookingData = {};
    this.modalEl = null;
    this.availableSlots = [];
  }

  init() {
    this.modalEl = document.getElementById('appointmentModal');
    if (!this.modalEl) return this;

    this._bindStepButtons();
    this._bindDatePicker();
    this._bindDoctorSelect();
    this.goToStep(1);
    return this;
  }

  goToStep(n) {
    n = Math.max(1, Math.min(n, this.totalSteps));
    this.currentStep = n;

    _$$('.appt-step', this.modalEl).forEach(el => {
      el.classList.toggle('d-none', parseInt(el.dataset.step) !== n);
    });

    // Progress indicator
    _$$('.appt-progress-dot', this.modalEl).forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      if (i + 1 === n) dot.classList.add('active');
      if (i + 1 < n) dot.classList.add('done');
    });

    // Update buttons
    const prevBtn = _$('#appt-prev', this.modalEl);
    const nextBtn = _$('#appt-next', this.modalEl);
    const submitBtn = _$('#appt-submit', this.modalEl);

    if (prevBtn) prevBtn.disabled = n === 1;
    if (nextBtn) nextBtn.classList.toggle('d-none', n === this.totalSteps);
    if (submitBtn) submitBtn.classList.toggle('d-none', n !== this.totalSteps);

    // Step 3: generate time slots
    if (n === 3) this._renderTimeSlots();

    // Step 4: summary
    if (n === 4) this._renderSummary();
  }

  validateStep(n) {
    const stepEl = _$(`.appt-step[data-step="${n}"]`, this.modalEl);
    if (!stepEl) return true;

    let valid = true;
    _$$('[required]', stepEl).forEach(field => {
      const ok = field.value && field.value.trim() !== '';
      field.classList.toggle('is-invalid', !ok);
      field.classList.toggle('is-valid', ok);
      if (!ok) valid = false;
    });

    // Collect data for this step
    _$$('[data-booking-field]', stepEl).forEach(field => {
      this.bookingData[field.dataset.bookingField] = field.value;
    });

    return valid;
  }

  generateTimeSlots(date, doctorId) {
    // Simulated available slots — in production this would be an API call
    const baseSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
      '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
      '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
    ];
    // Simulate some unavailable slots
    const seed = (new Date(date).getDate() + parseInt(doctorId || 1)) % 3;
    return baseSlots.filter((_, i) => i % (seed + 2) !== 0).map(time => ({
      time,
      available: Math.random() > 0.25
    }));
  }

  submitBooking(data) {
    return new Promise((resolve) => {
      // Simulate async API call
      setTimeout(() => {
        const refId = 'MC-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        resolve({ success: true, refId, ...data });
      }, 1800);
    });
  }

  printConfirmation() {
    if (window.printAppointmentConfirmation) {
      window.printAppointmentConfirmation(this.bookingData);
    }
  }

  /* ---- PRIVATE ---- */

  _bindStepButtons() {
    const nextBtn = _$('#appt-next', this.modalEl);
    const prevBtn = _$('#appt-prev', this.modalEl);
    const submitBtn = _$('#appt-submit', this.modalEl);

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.validateStep(this.currentStep)) this.goToStep(this.currentStep + 1);
        else if (window.showToast) showToast('error', 'Incomplete', 'Please fill all required fields.');
      });
    }

    if (prevBtn) prevBtn.addEventListener('click', () => this.goToStep(this.currentStep - 1));

    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        if (!this.validateStep(this.currentStep)) return;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Booking...';

        try {
          const result = await this.submitBooking(this.bookingData);
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa fa-check me-2"></i>Confirm Booking';

          // Show success inside modal
          const successEl = _$('#appt-success', this.modalEl);
          const refEl = _$('#appt-ref-id', this.modalEl);
          if (successEl) successEl.classList.remove('d-none');
          if (refEl) refEl.textContent = result.refId;

          if (window.showToast) showToast('success', 'Appointment Confirmed!', `Reference: ${result.refId}`);

          // Add print button
          const printBtn = _$('#print-confirmation', this.modalEl);
          if (printBtn) {
            printBtn.classList.remove('d-none');
            printBtn.addEventListener('click', () => this.printConfirmation());
          }
        } catch (err) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa fa-check me-2"></i>Confirm Booking';
          if (window.showToast) showToast('error', 'Booking Failed', 'Please try again or call us.');
        }
      });
    }

    // Reset on close
    this.modalEl.addEventListener('hidden.bs.modal', () => {
      this.bookingData = {};
      this.currentStep = 1;
      this.goToStep(1);
      _$$('.is-valid, .is-invalid', this.modalEl).forEach(el => el.classList.remove('is-valid', 'is-invalid'));
      const successEl = _$('#appt-success', this.modalEl);
      if (successEl) successEl.classList.add('d-none');
    });
  }

  _bindDatePicker() {
    const datePicker = _$('[data-booking-field="date"]', this.modalEl);
    if (!datePicker) return;

    datePicker.setAttribute('min', new Date().toISOString().split('T')[0]);
    datePicker.addEventListener('change', () => {
      this.bookingData.date = datePicker.value;
      if (this.currentStep === 2) this._renderTimeSlots();
    });
  }

  _bindDoctorSelect() {
    const sel = _$('[data-booking-field="doctorId"]', this.modalEl);
    if (!sel) return;
    sel.addEventListener('change', () => {
      this.bookingData.doctorId = sel.value;
    });
  }

  _renderTimeSlots() {
    const slotsContainer = _$('#time-slots-container', this.modalEl);
    if (!slotsContainer) return;

    const date = this.bookingData.date || new Date().toISOString().split('T')[0];
    const doctorId = this.bookingData.doctorId || '1';
    const slots = this.generateTimeSlots(date, doctorId);
    this.availableSlots = slots;

    slotsContainer.innerHTML = `
      <p class="small text-muted mb-3">Available slots for <strong>${date}</strong>:</p>
      <div class="d-flex flex-wrap gap-2">
        ${slots.map(slot => `
          <button type="button" class="btn btn-sm rounded-pill time-slot-btn ${slot.available ? 'btn-outline-primary' : 'btn-outline-secondary disabled'}" 
                  data-time="${slot.time}" ${!slot.available ? 'disabled' : ''}>
            ${slot.time} ${!slot.available ? '<i class="fa fa-lock fa-xs ms-1"></i>' : ''}
          </button>`).join('')}
      </div>`;

    _$$('.time-slot-btn', slotsContainer).forEach(btn => {
      btn.addEventListener('click', () => {
        _$$('.time-slot-btn', slotsContainer).forEach(b => b.classList.remove('active', 'btn-primary'));
        btn.classList.add('active', 'btn-primary');
        btn.classList.remove('btn-outline-primary');
        this.bookingData.time = btn.dataset.time;
      });
    });
  }

  _renderSummary() {
    const summary = _$('#appt-summary', this.modalEl);
    if (!summary) return;
    const d = this.bookingData;
    summary.innerHTML = `
      <table class="table table-borderless small mb-0">
        <tr><td class="text-muted fw-600" style="width:40%;">Patient Name</td><td class="fw-700">${_sanitize(d.patientName || 'N/A')}</td></tr>
        <tr><td class="text-muted fw-600">Email</td><td class="fw-700">${_sanitize(d.email || 'N/A')}</td></tr>
        <tr><td class="text-muted fw-600">Department</td><td class="fw-700">${_sanitize(d.department || 'N/A')}</td></tr>
        <tr><td class="text-muted fw-600">Date</td><td class="fw-700">${_sanitize(d.date || 'N/A')}</td></tr>
        <tr><td class="text-muted fw-600">Time</td><td class="fw-700">${_sanitize(d.time || 'Not selected')}</td></tr>
        <tr><td class="text-muted fw-600">Reason</td><td class="fw-700">${_sanitize(d.reason || 'N/A')}</td></tr>
      </table>`;
  }
}

/* =========================================================
   CLASS 4: ServiceFilter
   ========================================================= */

class ServiceFilter {
  /**
   * @param {string} containerSel – CSS selector for services grid
   * @param {Array}  data         – Array of service objects
   */
  constructor(containerSel, data = []) {
    this.container = _$(containerSel);
    this.data = data;
    this.filtered = [...data];
    this.activeCategory = 'all';
    this.searchQuery = '';
  }

  init() {
    if (!this.container) { console.warn('[ServiceFilter] Container not found'); return this; }
    this.renderServices(this.filtered);
    this._bindCategoryTabs();
    this._bindSearch();
    this._bindExpandCollapse();
    return this;
  }

  renderServices(services) {
    if (!this.container) return;

    if (!services.length) {
      this.container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fa fa-stethoscope fa-3x text-muted mb-3 d-block"></i>
          <h5 class="text-muted">No services found.</h5>
        </div>`;
      return;
    }

    this.container.innerHTML = services.map(svc => this._buildServiceCard(svc)).join('');

    // Bind expand toggles
    _$$('.service-expand-btn', this.container).forEach(btn => {
      btn.addEventListener('click', () => this._toggleExpand(btn.dataset.id));
    });

    // Count badge
    const countEl = document.getElementById('service-count');
    if (countEl) countEl.textContent = services.length;
  }

  filterByCategory(cat) {
    this.activeCategory = cat;
    this._applyAll();
  }

  filterBySearch(query) {
    this.searchQuery = query.trim().toLowerCase();
    this._applyAll();
  }

  expandService(id) {
    const detail = document.getElementById(`svc-detail-${id}`);
    if (detail) {
      const isExpanded = detail.classList.contains('d-none');
      detail.classList.toggle('d-none', !isExpanded);
      const btn = _$(`.service-expand-btn[data-id="${id}"]`);
      if (btn) btn.innerHTML = isExpanded
        ? '<i class="fa fa-chevron-up me-1"></i>Show Less'
        : '<i class="fa fa-chevron-down me-1"></i>Learn More';
    }
  }

  collapseAll() {
    _$$('[id^="svc-detail-"]').forEach(el => el.classList.add('d-none'));
    _$$('.service-expand-btn').forEach(btn => btn.innerHTML = '<i class="fa fa-chevron-down me-1"></i>Learn More');
  }

  /* ---- PRIVATE ---- */

  _applyAll() {
    let result = [...this.data];

    if (this.activeCategory !== 'all') {
      result = result.filter(s => s.category === this.activeCategory);
    }

    if (this.searchQuery) {
      result = result.filter(s =>
        _fuzzyMatch(s.name, this.searchQuery) ||
        _fuzzyMatch(s.description || '', this.searchQuery) ||
        _fuzzyMatch(s.category || '', this.searchQuery)
      );
    }

    this.filtered = result;
    this.renderServices(result);
  }

  _bindCategoryTabs() {
    _$$('[data-service-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        _$$('[data-service-tab]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.filterByCategory(tab.dataset.serviceTab);
      });
    });
  }

  _bindSearch() {
    const input = document.getElementById('service-search-input');
    if (!input) return;
    input.addEventListener('input', _debounce((e) => this.filterBySearch(e.target.value), 300));
  }

  _bindExpandCollapse() {
    const expandAll = document.getElementById('service-expand-all');
    const collapseAll = document.getElementById('service-collapse-all');
    if (expandAll) expandAll.addEventListener('click', () => {
      this.filtered.forEach(s => {
        const detail = document.getElementById(`svc-detail-${s.id}`);
        if (detail) detail.classList.remove('d-none');
      });
    });
    if (collapseAll) collapseAll.addEventListener('click', () => this.collapseAll());
  }

  _toggleExpand(id) {
    const detail = document.getElementById(`svc-detail-${id}`);
    if (!detail) return;
    const expanding = detail.classList.contains('d-none');
    detail.classList.toggle('d-none', !expanding);
    const btn = _$(`.service-expand-btn[data-id="${id}"]`);
    if (btn) {
      btn.innerHTML = expanding
        ? '<i class="fa fa-chevron-up me-1"></i>Show Less'
        : '<i class="fa fa-chevron-down me-1"></i>Learn More';
    }
  }

  _buildServiceCard(svc) {
    const iconMap = {
      diagnostic: 'fa-microscope', surgical: 'fa-scalpel', emergency: 'fa-truck-medical',
      preventive: 'fa-shield-halved', rehabilitation: 'fa-person-walking', laboratory: 'fa-flask',
      imaging: 'fa-x-ray', pharmacy: 'fa-pills', telemedicine: 'fa-video', support: 'fa-hands-holding-heart',
      default: 'fa-stethoscope'
    };
    const icon = iconMap[(svc.category || '').toLowerCase()] || iconMap.default;

    return `
      <div class="col-sm-6 col-lg-4">
        <div class="service-card card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
          <div class="p-4 pb-3 d-flex align-items-center gap-3"
               style="border-left:4px solid ${svc.color || '#0d6efd'};">
            <div style="width:48px;height:48px;border-radius:12px;background:${svc.colorLight || 'rgba(13,110,253,.1)'};display:flex;align-items:center;justify-content:center;font-size:1.3rem;color:${svc.color || '#0d6efd'};flex-shrink:0;">
              <i class="fa ${icon}"></i>
            </div>
            <div>
              <h6 class="fw-800 mb-0 text-navy" style="font-size:.92rem;">${_sanitize(svc.name)}</h6>
              <span class="badge rounded-pill" style="background:${svc.colorLight || 'rgba(13,110,253,.1)'};color:${svc.color || '#0d6efd'};font-size:.68rem;">${_sanitize(svc.category || 'Service')}</span>
            </div>
          </div>
          <div class="card-body pt-0 px-4 pb-4 d-flex flex-column">
            <p class="text-muted small mb-3">${_sanitize(svc.description || '')}</p>
            <div id="svc-detail-${svc.id}" class="d-none mb-3">
              ${svc.details ? `<ul class="list-unstyled small mb-0">${svc.details.map(d => `<li class="mb-1 d-flex gap-2"><i class="fa fa-check text-success fa-sm mt-1"></i><span class="text-muted">${_sanitize(d)}</span></li>`).join('')}</ul>` : ''}
              ${svc.price ? `<div class="mt-2 small fw-700 text-primary"><i class="fa fa-tag me-1"></i>Starting from: ${_sanitize(svc.price)}</div>` : ''}
            </div>
            <div class="mt-auto d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary rounded-pill service-expand-btn" data-id="${svc.id}">
                <i class="fa fa-chevron-down me-1"></i>Learn More
              </button>
              <a href="appointment.html" class="btn btn-sm btn-primary rounded-pill px-3">Book</a>
            </div>
          </div>
        </div>
      </div>`;
  }
}

/* =========================================================
   INITIALIZE ALL CLASSES ON DOM READY
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {

  // ---- Department Filter ----
  const deptContainer = document.getElementById('departments-grid');
  if (deptContainer && window.hospitalData && window.hospitalData.departments) {
    const deptFilter = new DepartmentFilter('#departments-grid', window.hospitalData.departments);
    deptFilter.init();
    window._deptFilterInstance = deptFilter;
  }

  // ---- Doctor Filter ----
  const doctorContainer = document.getElementById('doctors-container');
  const doctorSidebar = document.getElementById('doctors-sidebar');
  if (doctorContainer && window.hospitalData && window.hospitalData.doctors) {
    const doctorFilter = new DoctorFilter('#doctors-container', '#doctors-sidebar', window.hospitalData.doctors);
    doctorFilter.init();
    window._doctorFilterInstance = doctorFilter;
  }

  // ---- Appointment Flow ----
  const apptModal = document.getElementById('appointmentModal');
  if (apptModal) {
    const apptFlow = new AppointmentFlow();
    apptFlow.init();
    window._appointmentFlow = apptFlow;
  }

  // ---- Service Filter ----
  const svcContainer = document.getElementById('services-grid');
  if (svcContainer && window.hospitalData && window.hospitalData.services) {
    const svcFilter = new ServiceFilter('#services-grid', window.hospitalData.services);
    svcFilter.init();
    window._serviceFilterInstance = svcFilter;
  }

  console.log('%c✚ MediCare Filter.js – Classes Initialized', 'color:#0dcaf0;font-weight:bold;');
});

/* =========================================================
   EXPOSE CLASSES GLOBALLY
   ========================================================= */
window.DepartmentFilter = DepartmentFilter;
window.DoctorFilter = DoctorFilter;
window.AppointmentFlow = AppointmentFlow;
window.ServiceFilter = ServiceFilter;

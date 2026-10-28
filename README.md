# 🏥 MediCare General Hospital - Department Information Portal

An interactive, responsive hospital web application built with **HTML5, CSS3, JavaScript (ES6+), and Bootstrap 5**.

---

## 🌟 Overview & Key Highlights

MediCare General Hospital Information Portal provides patients, visitors, and clinicians with instant access to hospital departments, doctor directories, clinical services, facilities, room tiers, emergency hotlines, and appointment scheduling.

- **Clean Medical Aesthetics**: Medical navy (`#0a2342`), cyan-teal accents (`#00b4d8`), glassmorphism cards, and responsive typography.
- **100% Client-Side Interactive**: No build tools or backend needed. Open directly in any modern browser.
- **Accessible & Responsive**: Fully responsive grid optimized for mobile, tablet, and desktop screens with ADA-compliant touch targets.

---

## 📁 Project Structure

```text
hospital-portal/
├── index.html              # Main Landing Portal (Hero, About, Quick Services, Testimonials, News)
├── departments.html        # 12 Specialized Departments with Search, Filters & Details Modals
├── doctors.html            # 24 Specialist Doctors Directory with Filters & Multi-Step Booking Modal
├── services.html           # 20+ Medical Procedures, Diagnostic Packages & Surgery Profiles
├── facilities.html         # Interactive Floor-by-Floor Directory, Room Tiers & Robotic Tech Showcase
├── contact.html            # Emergency Hotlines, Department Extensions, Map & Inquiry Forms
│
├── css/
│   └── style.css           # Custom medical design system, animations, badges & component overrides
│
└── js/
    ├── data.js             # Hospital dataset (departments, doctors, services, facilities, FAQs)
    ├── filter.js           # Real-time search, multi-criteria filtering, and modal population
    └── main.js             # Global navigation, scroll effects, counter animations & form validation
```

---

## 🚀 Pages & Modules

### 1. `index.html` — Main Portal
* **Emergency Banner**: 24/7 hotline with pulsing indicator and emergency quick-call numbers.
* **Hero Banner**: Rotating healthcare typography, dual CTAs, and glassmorphic stat widgets.
* **Quick Access Bar**: 1-click jumps for Emergency, OPD, Health Checkups, and Lab Reports.
* **About MediCare**: 40-year milestone metrics, leadership ethos, and animated counters.
* **Department Showcase**: 12 specialty departments with quick statistics and doctor headcounts.
* **Featured Specialists**: Highlighted senior doctors with ratings, OPD availability, and profiles.
* **Patient Testimonials Carousel**: Real patient recovery stories and rating scores.
* **Accreditations Ribbon**: Badges for JCI, NABH, ISO 9001:2015, and NABL certified labs.

### 2. `departments.html` — Department Catalogue
* **Live Category Filters**: Filter by Emergency, Surgical, Medical, Pediatric, Diagnostic, and Maternity.
* **Instant Search**: Real-time filtering across department names, head doctors, and treatments.
* **Department Detail Modal**: In-depth modal with bed counts, specialized technologies, and doctors list.

### 3. `doctors.html` — Doctor Directory & Appointment Booking
* **24 Comprehensive Doctor Profiles**: Credentials (MBBS, MD, DM), experience years, OPD schedules, languages, and ratings.
* **Advanced Sidebar Filter**: Multi-filter by department, experience bracket, availability, rating, and language.
* **Interactive 4-Step Booking Modal**:
  1. Department & Doctor Selection
  2. Date Picker & Available Time Slots
  3. Patient Information & Medical Concern
  4. Instant Booking Confirmation with Print Ticket option.

### 4. `services.html` — Clinical & Diagnostic Care
* **Service Category Pills**: Emergency Care, Diagnostics, Surgery, Oncology, Maternity, and Rehabilitation.
* **Health Checkup Packages**: Transparent pricing comparison cards for Basic, Comprehensive, and Executive tiers.
* **Diagnostic Imaging Grid**: 3T MRI, 256-Slice CT, 4D Ultrasound, Digital Mammography, and PET-CT details.

### 5. `facilities.html` — Infrastructure & Inpatient Care
* **Interactive Floor Map (Basement to 9th Floor)**: Click any floor to reveal wing layouts, nursing stations, and emergency access.
* **Inpatient Room Comparison**: Multi-bed General Wards, Semi-Private, Deluxe Single, and Presidential Suites with transparent daily rates and amenity checklists.
* **Advanced Technology Showcase**: Da Vinci Xi Robotic Surgery, Silent MRI, Linear Accelerator, and ECMO life support.
* **Visiting Hours Table**: Department-wise visiting hours and family visitor policies.

### 6. `contact.html` — Emergency & Department Directory
* **Department Phone Directory**: Direct extensions, emails, and OPD consultation hours for all 12 departments.
* **Interactive Contact Form**: Floating label inputs with instant form validation and feedback alerts.
* **Direction Guide**: Navigation tips from Airport, City Center, Metro, and Bus Transit.
* **Comprehensive FAQ Accordion**: 15 answered questions regarding insurance, cashless claims, and visitor passes.

---

## 💻 Getting Started

### Prerequisites
All you need is a modern web browser (Chrome, Edge, Firefox, Safari). No heavy build toolchains or server dependencies required.

### Quick Start
1. Clone this repository:
   ```bash
   git clone https://github.com/<your-username>/hospital-department-portal.git
   cd hospital-department-portal
   ```
2. Open `index.html` directly in your browser:
   * **Windows**: Double-click `index.html` or run `start index.html`
   * **macOS**: `open index.html`
   * **Linux**: `xdg-open index.html`

3. (Optional) Run with a local live development server:
   ```bash
   # Using Python 3
   python -m http.server 8080

   # Or using Node.js
   npx serve .
   ```
   Then open `http://localhost:8080` in your browser.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

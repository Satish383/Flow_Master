/* ============================================================
   FLOW MASTER PLUMBING INC. — CUSTOM JAVASCRIPT
   Handles: scroll animations, navbar, forms, lightbox,
            carousel, back-to-top, mobile UX enhancements
   ============================================================ */

(function () {
    'use strict';

    /* ----------------------------------------------------------
       1. UTILITY HELPERS
       ---------------------------------------------------------- */
    const $ = (selector, context = document) => context.querySelector(selector);
    const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

    /* ----------------------------------------------------------
       2. STICKY NAVBAR — adds .scrolled class on scroll
       ---------------------------------------------------------- */
    const mainNav = $('#mainNav');

    function handleNavbarScroll() {
        if (!mainNav) return;
        if (window.scrollY > 60) {
            mainNav.classList.add('scrolled');
        } else {
            mainNav.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleNavbarScroll, { passive: true });
    handleNavbarScroll(); // run once on load

    /* ----------------------------------------------------------
       3. SMOOTH SCROLLING FOR ANCHOR LINKS
          (Native CSS handles it, but we close the mobile menu
          and offset for the sticky navbar.)
       ---------------------------------------------------------- */
    $$('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return; // ignore placeholder links

            const targetEl = document.querySelector(href);
            if (!targetEl) return;

            e.preventDefault();

            const navHeight = mainNav ? mainNav.offsetHeight : 0;
            const targetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight - 8;

            window.scrollTo({ top: targetTop, behavior: 'smooth' });

            // Close mobile menu if open
            const navMenu = $('#navMenu');
            if (navMenu && navMenu.classList.contains('show')) {
                const bsCollapse = bootstrap.Collapse.getInstance(navMenu);
                if (bsCollapse) bsCollapse.hide();
            }
        });
    });

    /* ----------------------------------------------------------
       4. ACTIVE NAV LINK HIGHLIGHT ON SCROLL
       ---------------------------------------------------------- */
    const navLinks = $$('.main-nav .nav-link');
    const sectionIds = ['home', 'about', 'services', 'why-us', 'reviews', 'contact'];

    function updateActiveNavLink() {
        const scrollPos = window.scrollY + 140;

        let currentId = 'home';
        sectionIds.forEach((id) => {
            const section = document.getElementById(id);
            if (section && section.offsetTop <= scrollPos) {
                currentId = id;
            }
        });

        navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
        });
    }

    window.addEventListener('scroll', updateActiveNavLink, { passive: true });
    updateActiveNavLink();

    /* ----------------------------------------------------------
       5. SCROLL REVEAL ANIMATIONS (Intersection Observer)
       ---------------------------------------------------------- */
    const revealElements = $$('.animate-on-scroll');

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        revealElements.forEach((el) => revealObserver.observe(el));
    } else {
        // Fallback for older browsers
        revealElements.forEach((el) => el.classList.add('revealed'));
    }

    /* ----------------------------------------------------------
       6. BACK-TO-TOP BUTTON
       ---------------------------------------------------------- */
    const backToTopBtn = $('#backToTop');

    function toggleBackToTop() {
        if (!backToTopBtn) return;
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    }

    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    toggleBackToTop();

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ----------------------------------------------------------
       7. GALLERY LIGHTBOX
       ---------------------------------------------------------- */
    const lightboxModal = $('#lightboxModal');
    const lightboxImage = $('#lightboxImage');
    const lightboxClose = $('#lightboxClose');
    const lightboxImages = $$('.lightbox-img');

    function openLightbox(src, alt) {
        if (!lightboxModal || !lightboxImage) return;
        lightboxImage.src = src || '';
        lightboxImage.alt = alt || 'Enlarged gallery image';
        lightboxModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightboxModal) return;
        lightboxModal.classList.remove('open');
        document.body.style.overflow = '';
        // Clear the src after transition to free memory
        setTimeout(() => {
            if (lightboxImage) lightboxImage.src = '';
        }, 350);
    }

    lightboxImages.forEach((img) => {
        img.addEventListener('click', () => {
            const fullSrc = img.getAttribute('data-src') || img.src;
            openLightbox(fullSrc, img.alt);
        });
        // Keyboard support
        img.setAttribute('tabindex', '0');
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', 'View larger image: ' + (img.alt || ''));
        img.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const fullSrc = img.getAttribute('data-src') || img.src;
                openLightbox(fullSrc, img.alt);
            }
        });
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) closeLightbox();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightboxModal && lightboxModal.classList.contains('open')) {
            closeLightbox();
        }
    });

    /* ----------------------------------------------------------
       8. CONTACT FORM VALIDATION & MAILTO SUBMISSION
       ---------------------------------------------------------- */
    const contactForm = $('#contactForm');

    if (contactForm) {
        const fullName = $('#fullName');
        const phoneNumber = $('#phoneNumber');
        const emailAddress = $('#emailAddress');
        const serviceRequired = $('#serviceRequired');
        const describeIssue = $('#describeIssue');

        // Validation helpers
        const isNotEmpty = (value) => value && value.trim().length > 0;
        const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
        const isValidPhone = (value) => /^[\d\s()+\-.]{7,20}$/.test(value.trim());

        function markInvalid(field, invalid) {
            if (!field) return;
            field.classList.toggle('is-invalid', invalid);
        }

        function validateField(field) {
            if (!field) return true;
            let valid = true;

            switch (field.id) {
                case 'fullName':
                    valid = isNotEmpty(field.value);
                    break;
                case 'phoneNumber':
                    valid = isNotEmpty(field.value) && isValidPhone(field.value);
                    break;
                case 'emailAddress':
                    valid = isNotEmpty(field.value) && isValidEmail(field.value);
                    break;
                case 'serviceRequired':
                    valid = isNotEmpty(field.value);
                    break;
                case 'describeIssue':
                    valid = isNotEmpty(field.value);
                    break;
                default:
                    valid = isNotEmpty(field.value);
            }

            markInvalid(field, !valid);
            return valid;
        }

        // Real-time validation feedback on blur
        [fullName, phoneNumber, emailAddress, serviceRequired, describeIssue].forEach((field) => {
            if (!field) return;
            field.addEventListener('blur', () => validateField(field));
            field.addEventListener('input', () => {
                if (field.classList.contains('is-invalid')) validateField(field);
            });
        });

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const fields = [fullName, phoneNumber, emailAddress, serviceRequired, describeIssue];
            let allValid = true;

            fields.forEach((field) => {
                if (!validateField(field)) allValid = false;
            });

            if (!allValid) {
                // Focus the first invalid field for accessibility
                const firstInvalid = fields.find((f) => f && f.classList.contains('is-invalid'));
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            /* ------------------------------------------------------
               Build a mailto: link because no backend is provided.
               NOTE: This opens the user's email client. It does NOT
               store or deliver submissions through a server.
               ------------------------------------------------------ */
            const recipient = 'info@flowmasterplumbing.example'; // Placeholder — update with real business email
            const subject = encodeURIComponent(
                'Plumbing Service Request — ' + serviceRequired.value
            );
            const bodyLines = [
                'New Plumbing Service Request',
                '--------------------------------',
                'Full Name: ' + fullName.value.trim(),
                'Phone Number: ' + phoneNumber.value.trim(),
                'Email Address: ' + emailAddress.value.trim(),
                'Service Required: ' + serviceRequired.value,
                '',
                'Issue Description:',
                describeIssue.value.trim(),
                '',
                '---',
                'Sent from Flow Master Plumbing website contact form.'
            ];
            const body = encodeURIComponent(bodyLines.join('\n'));

            const mailtoLink = 'mailto:' + recipient + '?subject=' + subject + '&body=' + body;

            // Show a brief confirmation before opening mail client
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>Opening Email Client...';
            }

            window.location.href = mailtoLink;

            setTimeout(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHTML;
                }
            }, 2600);
        });
    }

    /* ----------------------------------------------------------
       9. INITIALIZE BOOTSTRAP TOOLTIPS (if any are added later)
       ---------------------------------------------------------- */
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(
            document.querySelectorAll('[data-bs-toggle="tooltip"]')
        );
        tooltipTriggerList.forEach((el) => new bootstrap.Tooltip(el));
    }

    /* ----------------------------------------------------------
       10. HERO RATING CARD — subtle parallax on mouse move (desktop)
       ---------------------------------------------------------- */
    const heroCard = $('.floating-rating-card');
    const heroSection = $('.hero');

    if (heroCard && heroSection && window.matchMedia('(min-width: 992px)').matches) {
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            heroCard.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
        });

        heroSection.addEventListener('mouseleave', () => {
            heroCard.style.transform = 'translate(0, 0)';
        });
    }

    /* ----------------------------------------------------------
       11. REVIEW CAROUSEL — pause on hover (nicer UX)
       ---------------------------------------------------------- */
    const reviewsCarouselEl = $('#reviewsCarousel');
    if (reviewsCarouselEl && typeof bootstrap !== 'undefined') {
        const carouselInstance = bootstrap.Carousel.getOrCreateInstance(reviewsCarouselEl, {
            interval: 5000,
            ride: 'carousel',
            pause: 'hover',
            wrap: true
        });
        // Ensure it starts (Bootstrap auto-starts when data-bs-ride is set,
        // but this is a safety net)
        carouselInstance.cycle();
    }

    /* ----------------------------------------------------------
       12. LAZY IMAGE FALLBACK — add loading="lazy" to images
           that lack it (defensive enhancement)
       ---------------------------------------------------------- */
    $$('img').forEach((img) => {
        if (!img.hasAttribute('loading') && !img.closest('.hero')) {
            img.setAttribute('loading', 'lazy');
        }
    });

    /* ----------------------------------------------------------
       13. YEAR IN FOOTER (keeps copyright current)
           — Only updates if the year is 2026 placeholder. The brief
           requires "© 2026", so we leave it static unless changed.
       ---------------------------------------------------------- */

    /* ----------------------------------------------------------
       14. KEYBOARD ACCESSIBILITY — Escape closes mobile nav
       ---------------------------------------------------------- */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const navMenu = $('#navMenu');
            if (navMenu && navMenu.classList.contains('show')) {
                const bsCollapse = bootstrap.Collapse.getInstance(navMenu);
                if (bsCollapse) bsCollapse.hide();
            }
        }
    });

})();
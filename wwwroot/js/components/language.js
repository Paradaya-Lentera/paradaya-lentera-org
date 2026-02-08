/**
 * Language Switcher Component
 * Handles switching between Indonesian and English languages
 */

(function() {
    'use strict';

    // Language configuration
    const SUPPORTED_LANGUAGES = {
        id: 'Indonesia',
        en: 'English'
    };

    const DEFAULT_LANGUAGE = 'en';

    // Get current language from localStorage or default
    function getCurrentLanguage() {
        return localStorage.getItem('language') || DEFAULT_LANGUAGE;
    }

    // Save language preference
    function saveLanguage(lang) {
        localStorage.setItem('language', lang);
    }

    // Toggle language
    function toggleLanguage() {
        const currentLang = getCurrentLanguage();
        const newLang = currentLang === 'id' ? 'en' : 'id';
        setLanguage(newLang);
    }

    // Set language and update UI
    function setLanguage(lang) {
        if (!SUPPORTED_LANGUAGES[lang]) {
            console.warn(`Language '${lang}' is not supported`);
            return;
        }

        saveLanguage(lang);
        updateLanguageUI(lang);
        updatePageContent(lang);

        // Dispatch custom event for other components
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }

    // Update language toggle button UI
    function updateLanguageUI(lang) {
        const langToggle = document.getElementById('langToggle');
        const langText = document.getElementById('langText');

        if (langToggle && langText) {
            langText.textContent = lang.toUpperCase();
        }
    }

    // Update all "Add to Reading List" buttons
    function updateAddToListButtons(lang) {
        const addToListButtons = document.querySelectorAll('.add-to-list');
        const addToListTextId = 'Tambah ke Daftar Bacaan';
        const addToListTextEn = 'Add to Reading List';
        addToListButtons.forEach(btn => {
            const href = btn.getAttribute('href');
            // Check if it's a login link or a submit button
            if (href && href.includes('/Auth/Login')) {
                const loginTextId = 'Login untuk Menambahkan';
                const loginTextEn = 'Login to Add';
                btn.textContent = lang === 'id' ? loginTextId : loginTextEn;
            } else {
                btn.textContent = lang === 'id' ? addToListTextId : addToListTextEn;
            }
        });
    }

    // Update detail page synopsis
    function updateSynopsis(lang) {
        // Update synopsis section title
        const synopsisTitle = document.querySelector('.section-title[data-lang-id][data-lang-en]');
        if (synopsisTitle) {
            const textId = synopsisTitle.getAttribute('data-lang-id');
            const textEn = synopsisTitle.getAttribute('data-lang-en');
            synopsisTitle.textContent = lang === 'id' ? textId : textEn;
        }

        // Update "View More" / "Show Less" button
        const toggleBtn = document.getElementById('toggleSynopsis');
        if (toggleBtn) {
            const fullSynopsis = document.getElementById('synopsisFull');
            const isExpanded = fullSynopsis && fullSynopsis.style.display !== 'none';

            if (isExpanded) {
                const lessTextId = toggleBtn.getAttribute('data-lang-less-id') || 'Tampilkan Lebih Sedikit';
                const lessTextEn = toggleBtn.getAttribute('data-lang-less-en') || 'Show Less';
                toggleBtn.textContent = lang === 'id' ? lessTextId : lessTextEn;
            } else {
                const moreTextId = toggleBtn.getAttribute('data-lang-id') || 'Lihat Selengkapnya';
                const moreTextEn = toggleBtn.getAttribute('data-lang-en') || 'View More';
                toggleBtn.textContent = lang === 'id' ? moreTextId : moreTextEn;
            }
        }

        // Update "Synopsis not available" message
        const notAvailableMsg = document.querySelector('p[data-lang-id-local][data-lang-en-local]');
        if (notAvailableMsg) {
            const isLocal = notAvailableMsg.getAttribute('data-is-local') === 'true';
            if (isLocal) {
                const textId = notAvailableMsg.getAttribute('data-lang-id-local');
                const textEn = notAvailableMsg.getAttribute('data-lang-en-local');
                notAvailableMsg.textContent = lang === 'id' ? textId : textEn;
            } else {
                const textId = notAvailableMsg.getAttribute('data-lang-id-remote');
                const textEn = notAvailableMsg.getAttribute('data-lang-en-remote');
                notAvailableMsg.textContent = lang === 'id' ? textId : textEn;
            }
        }
    }

    // Update reading list page
    function updateReadingListPage(lang) {
        // Update page title and subtitle
        const pageTitle = document.querySelector('.reading-list-container .page-title[data-lang-id][data-lang-en]');
        if (pageTitle) {
            const textId = pageTitle.getAttribute('data-lang-id');
            const textEn = pageTitle.getAttribute('data-lang-en');
            pageTitle.textContent = lang === 'id' ? textId : textEn;
        }

        const pageSubtitle = document.querySelector('.reading-list-container .page-subtitle[data-lang-id][data-lang-en]');
        if (pageSubtitle) {
            const textId = pageSubtitle.getAttribute('data-lang-id');
            const textEn = pageSubtitle.getAttribute('data-lang-en');
            pageSubtitle.textContent = lang === 'id' ? textId : textEn;
        }

        // Update tab buttons
        const tabBtns = document.querySelectorAll('.tab-btn[data-lang-id][data-lang-en]');
        tabBtns.forEach(btn => {
            const textId = btn.getAttribute('data-lang-id');
            const textEn = btn.getAttribute('data-lang-en');
            btn.textContent = lang === 'id' ? textId : textEn;
        });

        // Update offline badges (read status)
        const offlineBadges = document.querySelectorAll('.offline-badge[data-lang-id][data-lang-en]');
        offlineBadges.forEach(badge => {
            const textId = badge.getAttribute('data-lang-id');
            const textEn = badge.getAttribute('data-lang-en');
            badge.textContent = lang === 'id' ? textId : textEn;
        });

        // Update book descriptions
        const bookDescriptions = document.querySelectorAll('.book-description[data-lang-id-prefix]');
        bookDescriptions.forEach(desc => {
            const pubYear = desc.getAttribute('data-pub-year');
            const pageCount = desc.getAttribute('data-page-count');
            const prefixId = desc.getAttribute('data-lang-id-prefix');
            const prefixEn = desc.getAttribute('data-lang-en-prefix');
            const suffixId = desc.getAttribute('data-lang-id-suffix');
            const suffixEn = desc.getAttribute('data-lang-en-suffix');
            const unknownId = desc.getAttribute('data-lang-id-unknown');
            const unknownEn = desc.getAttribute('data-lang-en-unknown');

            const prefix = lang === 'id' ? prefixId : prefixEn;
            const suffix = lang === 'id' ? suffixId : suffixEn;
            const unknown = lang === 'id' ? unknownId : unknownEn;

            let text = '';
            if (pubYear && pubYear !== 'null') {
                text = `${prefix}${pubYear}`;
                if (pageCount && pageCount !== 'null') {
                    text += `, ${pageCount}${suffix}`;
                }
            } else {
                text = unknown;
            }
            desc.textContent = text;
        });

        // Update "Read Now" buttons
        const readNowBtns = document.querySelectorAll('.btn-read-full[data-lang-id][data-lang-en]');
        readNowBtns.forEach(btn => {
            const textId = btn.getAttribute('data-lang-id');
            const textEn = btn.getAttribute('data-lang-en');
            btn.textContent = lang === 'id' ? textId : textEn;
        });

        // Update action button titles
        document.querySelectorAll('.btn-read-status[data-title-read-id]').forEach(btn => {
            const isActive = btn.classList.contains('active');
            const titleId = isActive ? btn.getAttribute('data-title-read-id') : btn.getAttribute('data-title-unread-id');
            const titleEn = isActive ? btn.getAttribute('data-title-read-en') : btn.getAttribute('data-title-unread-en');
            btn.setAttribute('title', lang === 'id' ? titleId : titleEn);
        });

        document.querySelectorAll('.btn-favorite[data-title-fav-id]').forEach(btn => {
            const isActive = btn.classList.contains('active');
            const titleId = isActive ? btn.getAttribute('data-title-fav-id') : btn.getAttribute('data-title-unfav-id');
            const titleEn = isActive ? btn.getAttribute('data-title-fav-en') : btn.getAttribute('data-title-unfav-en');
            btn.setAttribute('title', lang === 'id' ? titleId : titleEn);
        });

        document.querySelectorAll('.btn-remove[data-title-remove-id]').forEach(btn => {
            const titleId = btn.getAttribute('data-title-remove-id');
            const titleEn = btn.getAttribute('data-title-remove-en');
            btn.setAttribute('title', lang === 'id' ? titleId : titleEn);
        });

        // Update pagination
        const pageInfo = document.getElementById('pageInfo');
        if (pageInfo && pageInfo.hasAttribute('data-current-page')) {
            const currentPage = pageInfo.getAttribute('data-current-page');
            const totalPages = pageInfo.getAttribute('data-total-pages');
            const prefixId = pageInfo.getAttribute('data-lang-id-prefix');
            const prefixEn = pageInfo.getAttribute('data-lang-en-prefix');
            const suffixId = pageInfo.getAttribute('data-lang-id-suffix');
            const suffixEn = pageInfo.getAttribute('data-lang-en-suffix');
            const prefix = lang === 'id' ? prefixId : prefixEn;
            const suffix = lang === 'id' ? suffixId : suffixEn;
            pageInfo.textContent = `${prefix}${currentPage}${suffix}${totalPages}`;
        }

        const prevLabels = document.querySelectorAll('.pagination-label[data-lang-id]');
        prevLabels.forEach(label => {
            const textId = label.getAttribute('data-lang-id');
            const textEn = label.getAttribute('data-lang-en');
            label.textContent = lang === 'id' ? textId : textEn;
        });

        // Update empty state
        const emptyTitle = document.querySelector('.empty-state-title[data-lang-id]');
        if (emptyTitle) {
            const textId = emptyTitle.getAttribute('data-lang-id');
            const textEn = emptyTitle.getAttribute('data-lang-en');
            emptyTitle.textContent = lang === 'id' ? textId : textEn;
        }

        const emptyText = document.querySelector('.empty-state-text[data-lang-id]');
        if (emptyText) {
            const textId = emptyText.getAttribute('data-lang-id');
            const textEn = emptyText.getAttribute('data-lang-en');
            emptyText.textContent = lang === 'id' ? textId : textEn;
        }

        const addBookBtn = document.querySelector('.btn-add-book[data-lang-id]');
        if (addBookBtn) {
            const textId = addBookBtn.getAttribute('data-lang-id');
            const textEn = addBookBtn.getAttribute('data-lang-en');
            const icon = addBookBtn.querySelector('i');
            addBookBtn.innerHTML = '';
            addBookBtn.appendChild(icon);
            addBookBtn.appendChild(document.createTextNode(' ' + (lang === 'id' ? textId : textEn)));
        }
    }

    // Update detail page buttons
    function updateDetailPageButtons(lang) {
        // Update "Simpan Ke Daftar" / "Hapus dari Daftar" button
        const readingListBtn = document.getElementById('readingListBtn');
        if (readingListBtn) {
            const isInList = readingListBtn.classList.contains('btn-remove');
            if (isInList) {
                const removeTextId = 'Hapus dari Daftar';
                const removeTextEn = 'Remove from List';
                readingListBtn.innerHTML = `<i class="bi bi-bookmark-fill"></i> ${lang === 'id' ? removeTextId : removeTextEn}`;
            } else {
                const saveTextId = 'Simpan ke Daftar';
                const saveTextEn = 'Save to List';
                readingListBtn.innerHTML = `<i class="bi bi-bookmark"></i> ${lang === 'id' ? saveTextId : saveTextEn}`;
            }
        }

        // Update "Baca Sekarang" buttons
        const previewBtns = document.querySelectorAll('.btn-preview');
        const readTextId = 'Baca Sekarang';
        const readTextEn = 'Read Now';
        const loginToReadTextId = 'Login untuk Baca';
        const loginToReadTextEn = 'Login to Read';

        previewBtns.forEach(btn => {
            const href = btn.getAttribute('href');
            const isDisabled = btn.hasAttribute('disabled');

            if (isDisabled) {
                // Disabled button
                const span = btn.querySelector('span');
                if (span) {
                    // Update title attribute
                    const title = btn.getAttribute('title') || '';
                    if (title.includes('tidak tersedia')) {
                        // Keep the original Indonesian title for disabled state
                        btn.innerHTML = `<i class="bi bi-book-open"></i> ${lang === 'id' ? readTextId : readTextEn}`;
                    }
                } else {
                    btn.innerHTML = `<i class="bi bi-book-open"></i> ${lang === 'id' ? readTextId : readTextEn}`;
                }
            } else if (href && href.includes('/Auth/Login')) {
                // Login link
                btn.innerHTML = `<i class="bi bi-lock"></i> ${lang === 'id' ? loginToReadTextId : loginToReadTextEn}`;
            } else {
                // Read now link
                btn.innerHTML = `<i class="bi bi-book-open"></i> ${lang === 'id' ? readTextId : readTextEn}`;
            }
        });

        // Update "Login untuk Menambahkan" button
        const loginAddBtn = document.querySelector('.action-btn[href*="/Auth/Login"]');
        if (loginAddBtn && !loginAddBtn.closest('.btn-preview')) {
            const loginAddTextId = 'Login untuk Menambahkan';
            const loginAddTextEn = 'Login to Add';
            loginAddBtn.innerHTML = `<i class="bi bi-lock"></i> ${lang === 'id' ? loginAddTextId : loginAddTextEn}`;
        }

        // Update form submit buttons (action-btn with btn-add class)
        const addFormBtns = document.querySelectorAll('form .action-btn.btn-add');
        const saveToFormTextId = 'Simpan ke Daftar';
        const saveToFormTextEn = 'Save to List';
        addFormBtns.forEach(btn => {
            btn.innerHTML = `<i class="bi bi-bookmark"></i> ${lang === 'id' ? saveToFormTextId : saveToFormTextEn}`;
        });

        // Update "Simpan" / "Hapus" buttons in forms
        const formSubmitBtns = document.querySelectorAll('form[action*="AddToReadingList"] button, form[action*="RemoveFromReadingList"] button');
        formSubmitBtns.forEach(btn => {
            const form = btn.closest('form');
            if (form) {
                const action = form.getAttribute('action') || '';
                if (action.includes('RemoveFrom')) {
                    const removeTextId = 'Hapus dari Daftar';
                    const removeTextEn = 'Remove from List';
                    btn.innerHTML = `<i class="bi bi-bookmark-fill"></i> ${lang === 'id' ? removeTextId : removeTextEn}`;
                } else {
                    const saveTextId = 'Simpan ke Daftar';
                    const saveTextEn = 'Save to List';
                    btn.innerHTML = `<i class="bi bi-bookmark"></i> ${lang === 'id' ? saveTextId : saveTextEn}`;
                }
            }
        });
    }

    // Update page content based on language
    function updatePageContent(lang) {
        // Update hero title
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            const titleId = heroTitle.getAttribute('data-lang-id');
            const titleEn = heroTitle.getAttribute('data-lang-en');
            heroTitle.textContent = lang === 'id' ? titleId : titleEn;
        }

        // Update hero subtitle
        const heroSubtitle = document.querySelector('.hero-subtitle');
        if (heroSubtitle) {
            const subtitleId = heroSubtitle.getAttribute('data-lang-id');
            const subtitleEn = heroSubtitle.getAttribute('data-lang-en');
            heroSubtitle.innerHTML = lang === 'id' ? subtitleId : subtitleEn;
        }

        // Update all "Add to Reading List" buttons
        updateAddToListButtons(lang);

        // Update detail page buttons
        updateDetailPageButtons(lang);

        // Update synopsis section
        updateSynopsis(lang);

        // Update reading list page
        updateReadingListPage(lang);
    }

    // Initialize language switcher
    function init() {
        const langToggle = document.getElementById('langToggle');
        const currentLang = getCurrentLanguage();

        // Set initial UI state
        updateLanguageUI(currentLang);

        // Add event listener to toggle button
        if (langToggle) {
            langToggle.addEventListener('click', toggleLanguage);
        }

        // Update page content on load
        updatePageContent(currentLang);

        console.log(`Language initialized: ${SUPPORTED_LANGUAGES[currentLang] || currentLang}`);
    }

    // Public API
    window.LanguageSwitcher = {
        init: init,
        setLanguage: setLanguage,
        getLanguage: getCurrentLanguage,
        toggle: toggleLanguage,
        updateAddToListButtons: updateAddToListButtons,
        updateDetailPageButtons: updateDetailPageButtons,
        updateSynopsis: updateSynopsis,
        updateReadingListPage: updateReadingListPage
    };

    // Auto-initialize immediately (script loads after page content)
    init();
})();

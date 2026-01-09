/**
 * Font Awesome Fallback Handler
 * Detects if Font Awesome CDN fails to load and applies fallback icons
 */

(function() {
    'use strict';
    
    let fallbackApplied = false;
    
    // Check if Font Awesome is loaded
    function isFontAwesomeLoaded() {
        try {
            // Create a test element with Font Awesome class
            const testElement = document.createElement('i');
            testElement.className = 'fas fa-heart';
            testElement.style.position = 'absolute';
            testElement.style.left = '-9999px';
            testElement.style.fontSize = '16px';
            testElement.style.visibility = 'hidden';
            
            document.body.appendChild(testElement);
            
            // Get computed styles
            const computedStyle = window.getComputedStyle(testElement);
            const fontFamily = computedStyle.getPropertyValue('font-family');
            
            // Clean up
            document.body.removeChild(testElement);
            
            // Check if Font Awesome font family is applied
            const hasFontAwesome = fontFamily.includes('Font Awesome') || 
                                 fontFamily.includes('FontAwesome') ||
                                 fontFamily.includes('"Font Awesome 6 Free"');
            
            console.log('Font Awesome check - Font Family:', fontFamily, 'Has FA:', hasFontAwesome);
            return hasFontAwesome;
        } catch (e) {
            console.warn('Error checking Font Awesome:', e);
            return false;
        }
    }
    
    // Apply fallback icons
    function applyFallbackIcons() {
        if (fallbackApplied) return;
        
        console.log('Font Awesome CDN failed to load, applying fallback icons...');
        fallbackApplied = true;
        
        // Add fallback CSS class to body
        document.body.classList.add('fontawesome-fallback');
        
        // Map of Font Awesome classes to Unicode fallbacks
        const iconMap = {
            'fa-book-open': '📖',
            'fa-check-circle': '✓',
            'fa-circle': '○',
            'fa-heart': '♥',
            'fa-times': '×',
            'fa-cloud-download-alt': '↓',
            'fa-plus': '+',
            'fa-search': '🔍',
            'fa-star': '⭐',
            'fa-bookmark': '🔖',
            'fa-home': '🏠',
            'fa-user': '👤',
            'fa-cog': '⚙',
            'fa-bars': '☰',
            'fa-download': '⬇'
        };
        
        // Find all Font Awesome icons and replace with Unicode
        Object.keys(iconMap).forEach(faClass => {
            const elements = document.querySelectorAll(`.${faClass}`);
            elements.forEach(element => {
                // Only apply if element doesn't already have content
                if (!element.textContent.trim()) {
                    element.textContent = iconMap[faClass];
                    element.classList.add('fallback-icon');
                }
            });
        });
        
        // Also handle elements that might be added dynamically
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        Object.keys(iconMap).forEach(faClass => {
                            const elements = node.querySelectorAll ? 
                                           node.querySelectorAll(`.${faClass}`) : 
                                           (node.classList && node.classList.contains(faClass) ? [node] : []);
                            elements.forEach(element => {
                                if (!element.textContent.trim()) {
                                    element.textContent = iconMap[faClass];
                                    element.classList.add('fallback-icon');
                                }
                            });
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Check Font Awesome loading status
    function checkFontAwesome() {
        // Wait a bit for CSS to load
        setTimeout(() => {
            if (!isFontAwesomeLoaded()) {
                applyFallbackIcons();
            } else {
                console.log('Font Awesome loaded successfully');
            }
        }, 1500);
    }
    
    // Check for CSS load errors
    function setupCSSErrorHandling() {
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => {
            if (link.href.includes('font-awesome') || link.href.includes('fontawesome')) {
                link.addEventListener('error', () => {
                    console.warn('Font Awesome CSS failed to load from:', link.href);
                    applyFallbackIcons();
                });
            }
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setupCSSErrorHandling();
            checkFontAwesome();
        });
    } else {
        setupCSSErrorHandling();
        checkFontAwesome();
    }
    
    // Also check when window loads (in case CSS takes longer)
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (!isFontAwesomeLoaded() && !fallbackApplied) {
                applyFallbackIcons();
            }
        }, 1000);
    });
    
    // Expose function globally for manual triggering
    window.applyFontAwesomeFallback = applyFallbackIcons;
    window.checkFontAwesome = isFontAwesomeLoaded;
    
})();
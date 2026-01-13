(function() {
    'use strict';

    // Menampilkan notifikasi Bootstrap di halaman reading list
    function showReadingListNotification(message, type = 'primary', duration = 4000) {
        const readingListContainer = document.querySelector('.reading-list-container');
        if (readingListContainer) {
            showInPageNotification(message, type, duration);
        } else {
            showFloatingNotification(message, type, duration);
        }
    }

    function showInPageNotification(message, type = 'primary', duration = 4000) {
        const pageHeader = document.querySelector('.page-header');
        if (!pageHeader) return;

        let container = document.getElementById('reading-list-notifications');
        if (!container) {
            container = document.createElement('div');
            container.id = 'reading-list-notifications';
            container.style.cssText = `
                margin-top: 1.5rem;
                margin-bottom: 1.5rem;
                max-width: 600px;
                margin-left: auto;
                margin-right: auto;
            `;
            
            pageHeader.insertAdjacentElement('afterend', container);
        }

        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show reading-list-alert`;
        notification.style.cssText = `
            margin-bottom: 1rem;
            border: none;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            animation: slideInDown 0.4s ease-out;
            font-weight: 500;
            padding: 1rem 1.25rem;
            width: 100%;
        `;
        
        const colorSchemes = {
            primary: {
                bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                icon: 'fas fa-bookmark'
            },
            success: {
                bg: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
                color: '#ffffff', 
                icon: 'fas fa-check-circle'
            },
            danger: {
                bg: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
                color: '#ffffff',
                icon: 'fas fa-exclamation-circle'
            },
            warning: {
                bg: 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)',
                color: '#ffffff',
                icon: 'fas fa-exclamation-triangle'
            },
            info: {
                bg: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
                color: '#ffffff',
                icon: 'fas fa-info-circle'
            },
            secondary: {
                bg: 'linear-gradient(135deg, #485563 0%, #29323c 100%)',
                color: '#ffffff',
                icon: 'fas fa-bell'
            }
        };

        const scheme = colorSchemes[type] || colorSchemes.primary;
        notification.style.background = scheme.bg;
        notification.style.color = scheme.color;
        notification.style.border = 'none';
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="flex-shrink-0 me-3">
                    <i class="${scheme.icon}" style="font-size: 1.25rem;"></i>
                </div>
                <div class="flex-grow-1">
                    <strong>${message}</strong>
                </div>
            </div>
        `;

        if (!document.getElementById('reading-list-notifications-styles')) {
            const style = document.createElement('style');
            style.id = 'reading-list-notifications-styles';
            style.textContent = `
                @keyframes slideInDown {
                    from {
                        transform: translateY(-30px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutUp {
                    from {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateY(-30px);
                        opacity: 0;
                    }
                }
                .reading-list-alert {
                    backdrop-filter: blur(10px);
                }
                .reading-list-alert .btn-close {
                    opacity: 0.8;
                }
                .reading-list-alert .btn-close:hover {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }

        container.appendChild(notification);

        if (duration > 0) {
            setTimeout(() => {
                hideInPageNotification(notification);
            }, duration);
        }

        const closeBtn = notification.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                hideInPageNotification(notification);
            });
        }

        return notification;
    }

    function showFloatingNotification(message, type = 'primary', duration = 5000, position = 'top-right') {
        let container = document.getElementById('bootstrap-notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bootstrap-notifications-container';
            container.style.cssText = `
                position: fixed;
                z-index: 9999;
                pointer-events: none;
                padding: 20px;
            `;
            
            switch(position) {
                case 'top-right':
                    container.style.top = '20px';
                    container.style.right = '20px';
                    break;
                case 'top-left':
                    container.style.top = '20px';
                    container.style.left = '20px';
                    break;
                case 'top-center':
                    container.style.top = '20px';
                    container.style.left = '50%';
                    container.style.transform = 'translateX(-50%)';
                    break;
                case 'bottom-right':
                    container.style.bottom = '20px';
                    container.style.right = '20px';
                    break;
                case 'bottom-left':
                    container.style.bottom = '20px';
                    container.style.left = '20px';
                    break;
                case 'bottom-center':
                    container.style.bottom = '20px';
                    container.style.left = '50%';
                    container.style.transform = 'translateX(-50%)';
                    break;
            }
            
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.style.cssText = `
            pointer-events: auto;
            margin-bottom: 10px;
            min-width: 320px;
            max-width: 420px;
            width: 100%;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border: none;
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="flex-grow-1">
                    ${getIcon(type)}
                    <span class="ms-2">${message}</span>
                </div>
            </div>
        `;

        if (!document.getElementById('bootstrap-notifications-styles')) {
            const style = document.createElement('style');
            style.id = 'bootstrap-notifications-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        container.appendChild(notification);

        if (duration > 0) {
            setTimeout(() => {
                hideFloatingNotification(notification);
            }, duration);
        }

        const closeBtn = notification.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                hideFloatingNotification(notification);
            });
        }

        return notification;
    }

    function hideInPageNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutUp 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    function hideFloatingNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    function getIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle text-success"></i>',
            danger: '<i class="fas fa-exclamation-circle text-danger"></i>',
            warning: '<i class="fas fa-exclamation-triangle text-warning"></i>',
            info: '<i class="fas fa-info-circle text-info"></i>',
            primary: '<i class="fas fa-bookmark text-primary"></i>',
            secondary: '<i class="fas fa-bell text-secondary"></i>',
            light: '<i class="fas fa-lightbulb text-light"></i>',
            dark: '<i class="fas fa-moon text-dark"></i>'
        };
        return icons[type] || icons.primary;
    }

    // Fungsi shortcut untuk berbagai tipe notifikasi
    window.showSuccessNotification = (message, duration = 4000) => 
        showReadingListNotification(message, 'success', duration);
    
    window.showErrorNotification = (message, duration = 5000) => 
        showReadingListNotification(message, 'danger', duration);
    
    window.showWarningNotification = (message, duration = 4500) => 
        showReadingListNotification(message, 'warning', duration);
    
    window.showInfoNotification = (message, duration = 4000) => 
        showReadingListNotification(message, 'info', duration);
    
    window.showReadingListNotification = (message, duration = 4000) => 
        showReadingListNotification(message, 'primary', duration);

    window.showBootstrapNotification = showFloatingNotification;
    window.showInPageNotification = showInPageNotification;

    console.log('Sistem notifikasi Bootstrap dengan dukungan in-page berhasil dimuat');
})();
let isInReadingList = false;

// Mark dynamic data as loaded after page load
$(document).ready(function() {
    setTimeout(function() {
        $('.dynamic-data').addClass('loaded');
    }, 500);
});

function toggleReadingList(bookId) {
    const btn = document.getElementById('readingListBtn');
    const icon = document.getElementById('readingListIcon');
    const text = document.getElementById('readingListText');
    
    // Disable button sementara
    btn.disabled = true;
    
    $.ajax({
        url: '/Page/ToggleReadingList',
        type: 'POST',
        data: { 
            bookId: bookId,
            __RequestVerificationToken: window.antiForgeryToken || ''
        },
        success: function(response) {
            if (response.success) {
                // Update state
                isInReadingList = response.isInReadingList;
                
                // Update button appearance
                if (isInReadingList) {
                    btn.className = 'btn-danger w-100 mb-2';
                    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
                    text.textContent = 'Hapus dari Daftar';
                } else {
                    btn.className = 'btn-primary w-100 mb-2';
                    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
                    text.textContent = 'Tambahkan ke Daftar';
                }
                
                // Show success message
                showAlert(response.message, 'success');
            } else {
                showAlert(response.message, 'warning');
            }
        },
        error: function(xhr) {
            if (xhr.status === 401 || xhr.status === 403) {
                // User not authenticated, redirect to login
                window.location.href = '/Auth/Login?returnUrl=' + encodeURIComponent(window.location.pathname + window.location.search);
            } else {
                showAlert('Terjadi error saat memproses permintaan', 'danger');
            }
        },
        complete: function() {
            btn.disabled = false;
        }
    });
}

function toggleFavorite(readingListId) {
    $.post('/Page/ToggleFavorite', { 
        readingListId: readingListId,
        __RequestVerificationToken: window.antiForgeryToken || ''
    })
        .done(res => {
            if (res.success) {
                const btn = document.getElementById('favoriteBtn');
                btn.innerHTML = res.isFavorite ? '⭐ Favorit' : '☆ Favorit';
            }
            alert(res.message);
        });
}

function toggleRead(readingListId) {
    $.post('/Page/ToggleRead', { 
        readingListId: readingListId,
        __RequestVerificationToken: window.antiForgeryToken || ''
    })
        .done(res => {
            if (res.success) {
                const btn = document.getElementById('readBtn');
                btn.innerHTML = res.isRead
                    ? 'Selesai Dibaca'
                    : 'Tandai Belum Dibaca';
            }
            alert(res.message);
        });
}

function showAlert(message, type) {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    // Insert alert
    $('body').append(alertHtml);
    
    // Auto dismiss after 3 seconds
    setTimeout(function() {
        $('.alert').fadeOut();
    }, 3000);
}

function toggleSynopsisText() {
    const shortText = document.getElementById('synopsisShort');
    const fullText = document.getElementById('synopsisFull');
    const toggleBtn = document.getElementById('toggleSynopsis');
    
    if (fullText.style.display === 'none') {
        // Show full text
        shortText.style.display = 'none';
        fullText.style.display = 'block';
        toggleBtn.textContent = 'Lihat Lebih Sedikit';
    } else {
        // Show short text
        shortText.style.display = 'block';
        fullText.style.display = 'none';
        toggleBtn.textContent = 'Lihat Selengkapnya';
    }
}
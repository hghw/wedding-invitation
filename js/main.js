// Wedding Invitation — Main JS
$(function () {

    /* ============================================================
       HERO BACKGROUND IMAGE
    ============================================================ */
    (function () {
        var img     = document.getElementById('heroBgImg');
        var saved   = localStorage.getItem('weddingHeroBg');
        var DEFAULT = 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1920&q=85';

        img.src = saved || DEFAULT;

        img.addEventListener('load', function () {
            img.classList.add('loaded');
        });

        // Fallback nếu load lỗi (ví dụ offline)
        img.addEventListener('error', function () {
            img.src = DEFAULT;
            img.classList.add('loaded');
        });
    })();

    /* ============================================================
       AOS
    ============================================================ */
    AOS.init({ duration: 900, once: true, offset: 80 });

    /* ============================================================
       MUSIC TOGGLE
    ============================================================ */
    var audio     = document.getElementById('bgMusic');
    var musicBtn  = document.getElementById('musicToggle');
    var musicIcon = document.getElementById('musicIcon');
    var playing   = false;

    function setPlaying(state) {
        playing = state;
        if (state) {
            audio.play().catch(function () {});
            musicIcon.className = 'fas fa-music';
            musicBtn.classList.add('playing');
        } else {
            audio.pause();
            musicIcon.className = 'fas fa-volume-xmark';
            musicBtn.classList.remove('playing');
        }
    }

    // First user interaction → try auto-play
    $(document).one('click touchstart keydown', function () {
        if (!playing) setPlaying(true);
    });

    $('#musicToggle').on('click', function (e) {
        e.stopPropagation();
        setPlaying(!playing);
    });

    /* ============================================================
       COUNTDOWN
    ============================================================ */
    var weddingDate = new Date('2026-06-15T18:00:00');

    function updateCountdown() {
        var now  = new Date();
        var diff = weddingDate - now;

        if (diff <= 0) {
            $('#countdownWrap').html('<span style="color:#fff;font-family:\'Dancing Script\',cursive;font-size:1.6rem;">💕 Hôm nay là ngày trọng đại!</span>');
            return;
        }

        var d  = Math.floor(diff / 86400000);
        var h  = Math.floor((diff % 86400000) / 3600000);
        var m  = Math.floor((diff % 3600000)  / 60000);
        var s  = Math.floor((diff % 60000)    / 1000);

        $('#days').text(String(d).padStart(2, '0'));
        $('#hours').text(String(h).padStart(2, '0'));
        $('#minutes').text(String(m).padStart(2, '0'));
        $('#seconds').text(String(s).padStart(2, '0'));
    }

    setInterval(updateCountdown, 1000);
    updateCountdown();

    /* ============================================================
       MAP (Leaflet)
    ============================================================ */
    var LAT = 10.776889, LNG = 106.700806;
    var map = L.map('map', { zoomControl: true, scrollWheelZoom: false })
               .setView([LAT, LNG], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
    }).addTo(map);

    var markerHtml = '<div style="background:#c9485b;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 12px rgba(201,72,91,0.5);display:flex;align-items:center;justify-content:center"><i class="fas fa-heart" style="transform:rotate(45deg);color:#fff;font-size:13px"></i></div>';

    var customIcon = L.divIcon({
        html: markerHtml,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -40]
    });

    L.marker([LAT, LNG], { icon: customIcon })
     .addTo(map)
     .bindPopup('<b style="color:#c9485b">💒 Nhà Hàng Royal Palace</b><br>123 Đường Nguyễn Huệ, Q.1, TP.HCM')
     .openPopup();

    /* ============================================================
       TIMELINE
    ============================================================ */
    var defaultSchedule = [
        { time: '06:00', title: 'Lễ Đón Dâu',        description: 'Lễ đón dâu tại nhà gái, đại gia đình cùng nhau chứng kiến khoảnh khắc thiêng liêng.',        icon: 'fa-heart' },
        { time: '08:30', title: 'Lễ Rước Dâu',        description: 'Đoàn rước dâu về nhà trai trong không khí ấm áp và hạnh phúc.',                              icon: 'fa-ring' },
        { time: '11:00', title: 'Thời Khắc Trọng Đại', description: 'Nghi lễ trao nhẫn và tuyên thệ trước sự chứng kiến của gia đình, bạn bè.',                  icon: 'fa-gem' },
        { time: '18:00', title: 'Khai Tiệc',           description: 'Tiệc cưới chính thức bắt đầu, kính mời Quý khách an vị thưởng thức.',                       icon: 'fa-champagne-glasses' },
        { time: '19:00', title: 'Cắt Bánh Cưới',       description: 'Nghi thức cắt bánh cưới và cụng ly chúc mừng hạnh phúc đôi uyên ương.',                     icon: 'fa-cake-candles' },
        { time: '21:00', title: 'Kết Thúc Tiệc',       description: 'Trân trọng cảm ơn Quý khách đã đến chung vui và chia sẻ hạnh phúc cùng gia đình.',           icon: 'fa-star' }
    ];

    function loadTimeline() {
        var saved    = localStorage.getItem('weddingSchedule');
        var schedule = saved ? JSON.parse(saved) : defaultSchedule;

        if (!saved) localStorage.setItem('weddingSchedule', JSON.stringify(defaultSchedule));

        var $c = $('#timelineContainer').empty();

        schedule.forEach(function (item, i) {
            var side = i % 2 === 0 ? 'left' : 'right';
            var aosDirec = side === 'left' ? 'fade-right' : 'fade-left';
            $c.append(
                '<div class="timeline-item ' + side + '" data-aos="' + aosDirec + '" data-aos-delay="' + (i * 80) + '">' +
                '  <div class="timeline-content">' +
                '    <div class="timeline-time">' + item.time + '</div>' +
                '    <div class="timeline-icon-wrap"><i class="fas ' + item.icon + '"></i></div>' +
                '    <h3 class="timeline-title">' + item.title + '</h3>' +
                '    <p class="timeline-desc">' + item.description + '</p>' +
                '  </div>' +
                '</div>'
            );
        });

        // Re-init AOS for new elements
        AOS.refresh();
    }

    loadTimeline();

    /* ============================================================
       GALLERY (Swiper slider + Photo Wall masonry)
       Nguồn ảnh: assets/photos/photos.json (folder) + localStorage (CMS upload)
    ============================================================ */
    var defaultPhotos = [
        { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80', caption: 'Khoảnh khắc đáng nhớ' },
        { url: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=900&q=80', caption: 'Hạnh phúc đôi uyên ương' },
        { url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=900&q=80', caption: 'Ngày trọng đại' },
        { url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=900&q=80', caption: 'Tình yêu vĩnh cửu' },
        { url: 'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=900&q=80', caption: 'Bước sang trang mới' },
        { url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=900&q=80', caption: 'Mãi mãi bên nhau' },
        { url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=900&q=80', caption: 'Nụ hôn ngọt ngào' },
        { url: 'https://images.unsplash.com/photo-1543085377-b89bef7e6f08?w=900&q=80', caption: 'Hoa cưới rực rỡ' }
    ];

    var swiperInstance = null;

    function loadGallery() {
        $.getJSON('assets/photos/photos.json?v=' + Date.now())
            .done(function (list) {
                var photos = (list || [])
                    .filter(function (p) { return p && p.src; })
                    .map(function (p) { return { url: 'assets/photos/' + p.src, caption: p.caption || '' }; });
                renderGallery(photos.length ? photos : defaultPhotos);
            })
            .fail(function () {
                renderGallery(defaultPhotos);
            });
    }

    function renderGallery(photos) {
        /* ------ Slider (tất cả ảnh) ------ */
        var $wrapper = $('#galleryWrapper').empty();

        photos.forEach(function (p, i) {
            $wrapper.append(
                '<div class="swiper-slide">' +
                '  <a href="' + p.url + '" data-lightbox="gallery" data-title="' + escHtml(p.caption) + '">' +
                '    <img src="' + p.url + '" alt="' + escHtml(p.caption || ('Ảnh ' + (i + 1))) + '" loading="lazy">' +
                '  </a>' +
                '</div>'
            );
        });

        if (swiperInstance) swiperInstance.destroy(true, true);

        swiperInstance = new Swiper('.gallery-swiper', {
            slidesPerView: 1,
            spaceBetween: 16,
            loop: photos.length > 1,
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            autoplay: { delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true },
            breakpoints: {
                560:  { slidesPerView: 2, spaceBetween: 14 },
                900:  { slidesPerView: 3, spaceBetween: 18 },
                1200: { slidesPerView: 4, spaceBetween: 20 }
            }
        });

        /* ------ Photo Wall masonry (toàn bộ album) ------ */
        var $wall = $('#photoWall').empty();

        photos.forEach(function (p, i) {
            var delay = (i % 5) * 55;
            $wall.append(
                '<div class="pw-item" data-aos="fade-up" data-aos-delay="' + delay + '">' +
                '  <a href="' + p.url + '" data-lightbox="gallery" data-title="' + escHtml(p.caption) + '">' +
                '    <img src="' + p.url + '" alt="' + escHtml(p.caption || ('Ảnh ' + (i + 1))) + '" loading="lazy">' +
                (p.caption ? '<div class="pw-caption">' + escHtml(p.caption) + '</div>' : '') +
                '  </a>' +
                '</div>'
            );
        });

        // Hiện tiêu đề "Toàn Bộ Album" nếu có nhiều hơn 4 ảnh
        $('#photoWallHeader').toggle(photos.length > 4);

        AOS.refresh();
    }

    loadGallery();

    /* ============================================================
       RSVP FORM
    ============================================================ */
    $('#rsvpAttend').on('change', function () {
        $('#guestCountGroup').toggle($(this).val() !== 'no');
    });

    $('#rsvpForm').on('submit', function (e) {
        e.preventDefault();

        var entry = {
            name:      $('#rsvpName').val().trim(),
            phone:     $('#rsvpPhone').val().trim(),
            attend:    $('#rsvpAttend').val(),
            guests:    $('#rsvpGuests').val(),
            note:      $('#rsvpNote').val().trim(),
            timestamp: new Date().toISOString()
        };

        var list = JSON.parse(localStorage.getItem('weddingRSVPs') || '[]');
        list.push(entry);
        localStorage.setItem('weddingRSVPs', JSON.stringify(list));

        $('#rsvpForm').fadeOut(300, function () {
            $('#rsvpSuccess').fadeIn(400);
        });
    });

    /* ============================================================
       WISHES FORM
    ============================================================ */
    function loadWishes() {
        var wishes = JSON.parse(localStorage.getItem('weddingWishes') || '[]');
        var $list  = $('#wishesList').empty();

        if (!wishes.length) {
            $list.html('<p class="empty-msg">Hãy là người đầu tiên gửi lời chúc! 💕</p>');
            return;
        }

        var recent = wishes.slice().reverse().slice(0, 10);
        recent.forEach(function (w) {
            var d = new Date(w.timestamp).toLocaleDateString('vi-VN');
            $list.append(
                '<div class="wish-card">' +
                '  <div class="wish-avatar"><i class="fas fa-heart"></i></div>' +
                '  <div class="wish-content">' +
                '    <p class="wish-name">' + escHtml(w.name) + '</p>' +
                '    <p class="wish-message">' + escHtml(w.message) + '</p>' +
                '    <span class="wish-date">' + d + '</span>' +
                '  </div>' +
                '</div>'
            );
        });
    }

    $('#wishesForm').on('submit', function (e) {
        e.preventDefault();

        var name    = $('#wishName').val().trim();
        var message = $('#wishMessage').val().trim();
        if (!name || !message) return;

        var wish = { name: name, message: message, timestamp: new Date().toISOString() };
        var list = JSON.parse(localStorage.getItem('weddingWishes') || '[]');
        list.push(wish);
        localStorage.setItem('weddingWishes', JSON.stringify(list));

        $('#wishName').val('');
        $('#wishMessage').val('');
        loadWishes();
        showToast('Cảm ơn lời chúc của bạn! 💕');
    });

    loadWishes();

    /* ============================================================
       SMOOTH SCROLL
    ============================================================ */
    $(document).on('click', 'a[href^="#"]', function (e) {
        var target = $($(this).attr('href'));
        if (target.length) {
            e.preventDefault();
            $('html, body').animate({ scrollTop: target.offset().top - 60 }, 700);
        }
    });

    /* ============================================================
       TOAST
    ============================================================ */
    function showToast(msg) {
        var $t = $('#toast').text(msg).addClass('show');
        setTimeout(function () { $t.removeClass('show'); }, 3000);
    }

    /* ============================================================
       HELPERS
    ============================================================ */
    function escHtml(s) {
        return String(s || '')
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#039;');
    }

    // Expose for admin refresh
    window.weddingApp = { loadGallery: loadGallery, loadTimeline: loadTimeline, loadWishes: loadWishes };
});

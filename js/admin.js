// Wedding CMS — Admin JS
$(function () {

    /* ============================================================
       AUTH
    ============================================================ */
    var DEFAULT_PASS = 'admin123';

    function getPass() {
        return localStorage.getItem('weddingAdminPass') || DEFAULT_PASS;
    }

    function isLoggedIn() {
        return sessionStorage.getItem('weddingAdminAuth') === '1';
    }

    function showPanel() {
        $('#loginScreen').fadeOut(400, function () { $(this).hide(); });
        $('#adminPanel').fadeIn(400);
        initAll();
    }

    if (isLoggedIn()) {
        showPanel();
    }

    $('#loginForm').on('submit', function (e) {
        e.preventDefault();
        var pw = $('#loginPass').val();
        if (pw === getPass()) {
            sessionStorage.setItem('weddingAdminAuth', '1');
            showPanel();
        } else {
            $('#loginPass').val('').attr('placeholder', '❌ Sai mật khẩu, thử lại...')
                .css('border-color', '#c9485b');
            setTimeout(function () {
                $('#loginPass').attr('placeholder', 'Mật khẩu').css('border-color', '');
            }, 2000);
        }
    });

    $('#logoutBtn').on('click', function () {
        sessionStorage.removeItem('weddingAdminAuth');
        location.reload();
    });

    /* ============================================================
       TAB NAVIGATION
    ============================================================ */
    var tabTitles = {
        photos:   'Quản Lý Ảnh Cưới',
        schedule: 'Chương Trình Đám Cưới',
        wishes:   'Lời Chúc Nhận Được',
        rsvps:    'Danh Sách Xác Nhận Tham Dự',
        settings: 'Cài Đặt Hệ Thống'
    };

    $('.nav-item').on('click', function (e) {
        e.preventDefault();
        var tab = $(this).data('tab');
        switchTab(tab);
        if ($(window).width() < 900) closeSidebar();
    });

    function switchTab(tab) {
        $('.nav-item').removeClass('active');
        $('.nav-item[data-tab="' + tab + '"]').addClass('active');
        $('.tab-content').removeClass('active');
        $('#tab-' + tab).addClass('active');
        $('#pageTitle').text(tabTitles[tab] || tab);
    }

    // Sidebar toggle (mobile)
    $('#sidebarToggle').on('click', function () {
        if ($('#sidebar').hasClass('open')) closeSidebar();
        else $('#sidebar').addClass('open');
    });

    function closeSidebar() { $('#sidebar').removeClass('open'); }

    /* ============================================================
       INIT ALL
    ============================================================ */
    function initAll() {
        loadPhotos();
        loadSchedule();
        loadWishes();
        loadRSVPs();
        loadSettings();
    }

    /* ============================================================
       PHOTOS  —  IndexedDB (WeddingDB), lưu Blob không qua base64
    ============================================================ */
    var editingPhotoId = null;

    // Migrate ảnh cũ từ localStorage (nếu có)
    WeddingDB.migrate().then(function (n) {
        if (n > 0) { showToast('Đã chuyển ' + n + ' ảnh cũ sang bộ nhớ mới.'); loadPhotos(); }
    });

    /* ---- Upload zone drag-and-drop ---- */
    var $zone = $('#uploadZone');

    $zone.on('dragover dragenter', function (e) {
        e.preventDefault(); $(this).addClass('drag-over');
    }).on('dragleave dragend', function (e) {
        e.preventDefault(); $(this).removeClass('drag-over');
    }).on('drop', function (e) {
        e.preventDefault();
        $(this).removeClass('drag-over');
        processPhotoFiles(e.originalEvent.dataTransfer.files);
    });

    $('#photoInput').on('change', function () {
        processPhotoFiles(this.files);
        this.value = '';
    });

    function processPhotoFiles(files) {
        if (!files || !files.length) return;
        var valid = Array.from(files).filter(function (f) { return f.type.startsWith('image/'); });

        if (!valid.length) { showToast('Không có ảnh hợp lệ.', 'warn'); return; }

        var done  = 0;
        var total = valid.length;
        $('#uploadProgress').show();
        $('#progressFill').css('width', '0%');

        valid.forEach(function (file) {
            // File kế thừa Blob — lưu thẳng vào IndexedDB, không cần base64
            WeddingDB.add({
                blob:      file,
                caption:   file.name.replace(/\.[^/.]+$/, ''),
                name:      file.name,
                timestamp: Date.now()
            }).then(function () {
                done++;
                $('#progressFill').css('width', Math.round(done / total * 100) + '%');
                if (done === total) {
                    setTimeout(function () { $('#uploadProgress').hide(); }, 500);
                    loadPhotos();
                    showToast('Đã tải lên ' + done + ' ảnh!');
                }
            }).catch(function (err) {
                done++;
                showToast('Lỗi: ' + (err.message || err), 'warn');
            });
        });
    }

    /* ---- Hiển thị thư viện ảnh ---- */
    function loadPhotos() {
        WeddingDB.getAll().then(function (photos) {
            var $grid  = $('#photoGrid').empty();
            var isList = $grid.hasClass('list-mode');
            $('#photoCount').text(photos.length + ' ảnh');

            if (!photos.length) {
                $grid.html('<p class="empty-msg">Chưa có ảnh nào. Hãy tải ảnh lên!</p>');
                return;
            }

            photos.forEach(function (p, seq) {
                var src    = URL.createObjectURL(p.blob);
                var badge  = '<span class="photo-order-badge">#' + (seq + 1) + '</span>';
                var btns   =
                    '<div class="photo-overlay">' +
                    '  <button class="btn-view" data-id="' + p.id + '" title="Xem / Sửa"><i class="fas fa-eye"></i></button>' +
                    '  <button class="btn-dl"   data-id="' + p.id + '" title="Tải xuống"><i class="fas fa-download"></i></button>' +
                    '  <button class="btn-del"  data-id="' + p.id + '" title="Xóa ảnh"><i class="fas fa-trash"></i></button>' +
                    '</div>';

                var $item = $('<div class="photo-item">');
                if (isList) {
                    $item.html(
                        '<img src="' + src + '" alt="' + escHtml(p.caption) + '" loading="lazy">' +
                        badge +
                        '<div class="photo-caption">' + escHtml(p.caption || '(Chưa có chú thích)') + '</div>' +
                        btns
                    );
                } else {
                    $item.html(
                        '<img src="' + src + '" alt="' + escHtml(p.caption) + '" loading="lazy">' +
                        btns +
                        '<div class="photo-caption">' + escHtml(p.caption || '') + '</div>'
                    );
                }
                $grid.append($item);
            });

            $grid.find('.btn-view').on('click', function (e) {
                e.stopPropagation();
                openPhotoModal(parseInt($(this).data('id')));
            });

            $grid.find('.btn-dl').on('click', function (e) {
                e.stopPropagation();
                var id = parseInt($(this).data('id'));
                WeddingDB.get(id).then(function (p) {
                    if (!p) return;
                    var url = URL.createObjectURL(p.blob);
                    var a   = document.createElement('a');
                    a.href  = url; a.download = p.name || 'photo.jpg'; a.click();
                    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
                });
            });

            $grid.find('.btn-del').on('click', function (e) {
                e.stopPropagation();
                var id = parseInt($(this).data('id'));
                if (confirm('Xóa ảnh này?')) {
                    WeddingDB.remove(id).then(function () { loadPhotos(); showToast('Đã xóa ảnh.'); });
                }
            });
        });
    }

    $('#clearAllPhotos').on('click', function () {
        if (confirm('Xóa toàn bộ ảnh? Không thể khôi phục!')) {
            WeddingDB.clear().then(function () { loadPhotos(); showToast('Đã xóa toàn bộ ảnh.'); });
        }
    });

    /* ===== VIEW TOGGLE (grid / list) ===== */
    $('#viewGrid').on('click', function () {
        $('#photoGrid').removeClass('list-mode');
        $(this).addClass('active');
        $('#viewList').removeClass('active');
        loadPhotos();
    });

    $('#viewList').on('click', function () {
        $('#photoGrid').addClass('list-mode');
        $(this).addClass('active');
        $('#viewGrid').removeClass('active');
        loadPhotos();
    });

    /* ===== EXPORT photos.json ===== */
    $('#exportPhotosJsonBtn').on('click', function () {
        WeddingDB.getAll().then(function (photos) {
            if (!photos.length) { showToast('Chưa có ảnh nào để xuất.', 'warn'); return; }
            var manifest = photos.map(function (p, i) {
                var pad   = String(i + 1).padStart(2, '0');
                var fname = (p.caption || 'photo_' + pad)
                    .replace(/[^a-z0-9 _-]/gi, '_').replace(/\s+/g, '_').toLowerCase() || 'photo_' + pad;
                return { src: fname + '.jpg', caption: p.caption || '' };
            });
            downloadText(JSON.stringify(manifest, null, 2), 'photos.json');
            showToast('Đã xuất photos.json!');
        });
    });

    /* ===== DOWNLOAD TẤT CẢ ẢNH ===== */
    $('#downloadAllPhotosBtn').on('click', function () {
        WeddingDB.getAll().then(function (photos) {
            if (!photos.length) { showToast('Chưa có ảnh nào.', 'warn'); return; }
            showToast('Đang tải xuống ' + photos.length + ' ảnh...');
            photos.forEach(function (p, i) {
                setTimeout(function () {
                    var url = URL.createObjectURL(p.blob);
                    var a   = document.createElement('a');
                    a.href  = url; a.download = p.name || ('photo_' + String(i+1).padStart(2,'0') + '.jpg');
                    a.click();
                    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
                }, i * 500);
            });
        });
    });

    /* ===== PHOTO MODAL ===== */
    function openPhotoModal(id) {
        editingPhotoId = id;
        WeddingDB.get(id).then(function (p) {
            if (!p) return;
            var url = URL.createObjectURL(p.blob);
            $('#modalImg').attr('src', url);
            $('#modalCaption').text(p.caption || '');
            $('#modalCaptionInput').val(p.caption || '');
            $('#photoModal').addClass('open');
        });
    }

    $('#modalClose, #modalBackdrop').on('click', function () { $('#photoModal').removeClass('open'); });

    $('#saveCaptionBtn').on('click', function () {
        if (editingPhotoId === null) return;
        WeddingDB.updateCaption(editingPhotoId, $('#modalCaptionInput').val().trim()).then(function () {
            loadPhotos();
            $('#photoModal').removeClass('open');
            showToast('Đã lưu chú thích.');
        });
    });

    /* ============================================================
       SCHEDULE
    ============================================================ */
    var defaultSchedule = [
        { time: '06:00', title: 'Lễ Đón Dâu',        description: 'Lễ đón dâu tại nhà gái, đại gia đình cùng nhau chứng kiến khoảnh khắc thiêng liêng.',        icon: 'fa-heart' },
        { time: '08:30', title: 'Lễ Rước Dâu',        description: 'Đoàn rước dâu về nhà trai trong không khí ấm áp và hạnh phúc.',                              icon: 'fa-ring' },
        { time: '11:00', title: 'Thời Khắc Trọng Đại', description: 'Nghi lễ trao nhẫn và tuyên thệ trước sự chứng kiến của gia đình, bạn bè.',                  icon: 'fa-gem' },
        { time: '18:00', title: 'Khai Tiệc',           description: 'Tiệc cưới chính thức bắt đầu, kính mời Quý khách an vị thưởng thức.',                       icon: 'fa-champagne-glasses' },
        { time: '19:00', title: 'Cắt Bánh Cưới',       description: 'Nghi thức cắt bánh cưới và cụng ly chúc mừng hạnh phúc đôi uyên ương.',                     icon: 'fa-cake-candles' },
        { time: '21:00', title: 'Kết Thúc Tiệc',       description: 'Trân trọng cảm ơn Quý khách đã đến chung vui và chia sẻ hạnh phúc cùng gia đình.',           icon: 'fa-star' }
    ];

    var editingSchIdx = null;

    function getSchedule() {
        return JSON.parse(localStorage.getItem('weddingSchedule') || JSON.stringify(defaultSchedule));
    }

    function saveSchedule(arr) { localStorage.setItem('weddingSchedule', JSON.stringify(arr)); }

    function loadSchedule() {
        var sched = getSchedule();
        var $list = $('#scheduleList').empty();

        if (!sched.length) {
            $list.html('<p class="empty-msg">Chưa có chương trình nào.</p>');
            return;
        }

        sched.forEach(function (item, i) {
            $list.append(
                '<div class="schedule-item" data-i="' + i + '">' +
                '  <span class="sch-time">' + item.time + '</span>' +
                '  <div class="sch-icon"><i class="fas ' + escHtml(item.icon) + '"></i></div>' +
                '  <div class="sch-body">' +
                '    <div class="sch-title">' + escHtml(item.title) + '</div>' +
                '    <div class="sch-desc">'  + escHtml(item.description) + '</div>' +
                '  </div>' +
                '  <div class="sch-actions">' +
                '    <button class="btn-icon-sm edit-sch" data-i="' + i + '" title="Sửa"><i class="fas fa-pen"></i></button>' +
                '    <button class="btn-icon-sm del  del-sch"  data-i="' + i + '" title="Xóa"><i class="fas fa-trash"></i></button>' +
                '  </div>' +
                '</div>'
            );
        });

        $('#scheduleList .edit-sch').on('click', function () {
            var idx = parseInt($(this).data('i'));
            var item = getSchedule()[idx];
            editingSchIdx = idx;
            $('#sch-time').val(item.time);
            $('#sch-title').val(item.title);
            $('#sch-icon').val(item.icon);
            $('#sch-desc').val(item.description);
            $('#scheduleSubmitBtn').html('<i class="fas fa-save"></i> Lưu Thay Đổi');
            $('#scheduleCancelEdit').show();
            $('html, body').animate({ scrollTop: $('#scheduleForm').offset().top - 80 }, 300);
        });

        $('#scheduleList .del-sch').on('click', function () {
            var idx = parseInt($(this).data('i'));
            if (confirm('Xóa công đoạn này?')) {
                var arr = getSchedule();
                arr.splice(idx, 1);
                saveSchedule(arr);
                loadSchedule();
                showToast('Đã xóa công đoạn.');
            }
        });
    }

    $('#scheduleForm').on('submit', function (e) {
        e.preventDefault();

        var item = {
            time:        $('#sch-time').val(),
            title:       $('#sch-title').val().trim(),
            description: $('#sch-desc').val().trim(),
            icon:        $('#sch-icon').val().trim() || 'fa-heart'
        };

        var arr = getSchedule();

        if (editingSchIdx !== null) {
            arr[editingSchIdx] = item;
            editingSchIdx = null;
            $('#scheduleSubmitBtn').html('<i class="fas fa-plus"></i> Thêm Công Đoạn');
            $('#scheduleCancelEdit').hide();
            showToast('Đã cập nhật công đoạn.');
        } else {
            arr.push(item);
            // Sort by time
            arr.sort(function (a, b) { return a.time.localeCompare(b.time); });
            showToast('Đã thêm công đoạn.');
        }

        saveSchedule(arr);
        loadSchedule();
        this.reset();
        $('#sch-icon').val('fa-heart');
    });

    $('#scheduleCancelEdit').on('click', function () {
        editingSchIdx = null;
        $('#scheduleForm')[0].reset();
        $('#sch-icon').val('fa-heart');
        $('#scheduleSubmitBtn').html('<i class="fas fa-plus"></i> Thêm Công Đoạn');
        $(this).hide();
    });

    $('#resetScheduleBtn').on('click', function () {
        if (confirm('Đặt lại chương trình về mặc định?')) {
            saveSchedule(defaultSchedule);
            loadSchedule();
            showToast('Đã đặt lại chương trình mặc định.');
        }
    });

    /* ============================================================
       WISHES
    ============================================================ */
    function getWishes() { return JSON.parse(localStorage.getItem('weddingWishes') || '[]'); }

    function loadWishes() {
        var wishes = getWishes();
        var $body  = $('#wishesTableBody').empty();
        $('#wishCountLabel').text(wishes.length + ' lời chúc');

        if (!wishes.length) {
            $body.html('<tr><td colspan="5" class="empty-msg">Chưa có lời chúc nào.</td></tr>');
            return;
        }

        wishes.slice().reverse().forEach(function (w, ri) {
            var i   = wishes.length - 1 - ri;
            var dt  = new Date(w.timestamp);
            var dts = dt.toLocaleString('vi-VN');
            $body.append(
                '<tr>' +
                '  <td>' + (wishes.length - ri) + '</td>' +
                '  <td><strong>' + escHtml(w.name) + '</strong></td>' +
                '  <td>' + escHtml(w.message) + '</td>' +
                '  <td style="font-size:0.8rem;color:#9a8a9a">' + dts + '</td>' +
                '  <td><button class="btn-icon-sm del del-wish" data-i="' + i + '"><i class="fas fa-trash"></i></button></td>' +
                '</tr>'
            );
        });

        $('#wishesTableBody .del-wish').on('click', function () {
            var idx = parseInt($(this).data('i'));
            if (confirm('Xóa lời chúc này?')) {
                var arr = getWishes();
                arr.splice(idx, 1);
                localStorage.setItem('weddingWishes', JSON.stringify(arr));
                loadWishes();
                showToast('Đã xóa lời chúc.');
            }
        });
    }

    $('#exportWishesBtn').on('click', function () {
        var wishes = getWishes();
        if (!wishes.length) { showToast('Chưa có lời chúc nào để xuất.', 'warn'); return; }

        var lines = ['=== LỜI CHÚC MỪNG ĐÁM CƯỚI ===', 'Tổng: ' + wishes.length + ' lời chúc', ''];
        wishes.forEach(function (w, i) {
            var dt = new Date(w.timestamp).toLocaleString('vi-VN');
            lines.push((i + 1) + '. ' + w.name + ' — ' + dt);
            lines.push('   ' + w.message);
            lines.push('');
        });

        downloadText(lines.join('\n'), 'loi-chuc-dam-cuoi.txt');
        showToast('Đã xuất file lời chúc!');
    });

    $('#clearWishesBtn').on('click', function () {
        if (confirm('Xóa toàn bộ lời chúc? Không thể khôi phục!')) {
            localStorage.removeItem('weddingWishes');
            loadWishes();
            showToast('Đã xóa toàn bộ lời chúc.');
        }
    });

    /* ============================================================
       RSVPs
    ============================================================ */
    function getRSVPs() { return JSON.parse(localStorage.getItem('weddingRSVPs') || '[]'); }

    function loadRSVPs() {
        var rsvps = getRSVPs();
        var $body = $('#rsvpTableBody').empty();

        var yes   = rsvps.filter(function (r) { return r.attend === 'yes'; });
        var no    = rsvps.filter(function (r) { return r.attend === 'no'; });
        var total = yes.reduce(function (s, r) { return s + parseInt(r.guests || 1); }, 0);

        $('#rsvpStats').text(rsvps.length + ' phản hồi');
        $('#rsvpSummary').html(
            '<div class="summary-box"><span class="summary-num">' + rsvps.length + '</span><span class="summary-lbl">Tổng phản hồi</span></div>' +
            '<div class="summary-box"><span class="summary-num" style="color:#2e7d4f">' + yes.length + '</span><span class="summary-lbl">Tham dự</span></div>' +
            '<div class="summary-box"><span class="summary-num" style="color:#c9485b">' + no.length + '</span><span class="summary-lbl">Vắng mặt</span></div>' +
            '<div class="summary-box"><span class="summary-num" style="color:#c8a96e">' + total + '</span><span class="summary-lbl">Khách tham dự</span></div>'
        );

        if (!rsvps.length) {
            $body.html('<tr><td colspan="7" class="empty-msg">Chưa có xác nhận nào.</td></tr>');
            return;
        }

        rsvps.slice().reverse().forEach(function (r, ri) {
            var dt  = new Date(r.timestamp).toLocaleString('vi-VN');
            var badge = r.attend === 'yes'
                ? '<span class="badge badge-yes">✅ Tham dự</span>'
                : '<span class="badge badge-no">❌ Vắng mặt</span>';
            $body.append(
                '<tr>' +
                '  <td>' + (rsvps.length - ri) + '</td>' +
                '  <td><strong>' + escHtml(r.name)  + '</strong></td>' +
                '  <td>' + escHtml(r.phone || '—')  + '</td>' +
                '  <td>' + badge + '</td>' +
                '  <td style="text-align:center">' + (r.attend === 'yes' ? escHtml(r.guests) : '—') + '</td>' +
                '  <td>' + escHtml(r.note || '—')   + '</td>' +
                '  <td style="font-size:0.8rem;color:#9a8a9a">' + dt + '</td>' +
                '</tr>'
            );
        });
    }

    $('#exportRsvpBtn').on('click', function () {
        var rsvps = getRSVPs();
        if (!rsvps.length) { showToast('Chưa có xác nhận nào để xuất.', 'warn'); return; }

        var yes   = rsvps.filter(function (r) { return r.attend === 'yes'; });
        var no    = rsvps.filter(function (r) { return r.attend === 'no'; });
        var total = yes.reduce(function (s, r) { return s + parseInt(r.guests || 1); }, 0);

        var lines = [
            '=== DANH SÁCH XÁC NHẬN THAM DỰ ===',
            'Tổng phản hồi: ' + rsvps.length,
            'Sẽ tham dự: ' + yes.length + ' người | Vắng mặt: ' + no.length + ' người',
            'Tổng số khách tham dự: ' + total + ' người',
            ''
        ];

        rsvps.forEach(function (r, i) {
            var dt = new Date(r.timestamp).toLocaleString('vi-VN');
            lines.push(
                (i + 1) + '. ' + r.name +
                ' | ' + (r.attend === 'yes' ? 'Tham dự (' + r.guests + ' người)' : 'Vắng mặt') +
                ' | ĐT: ' + (r.phone || 'N/A') +
                ' | ' + dt +
                (r.note ? '\n   Ghi chú: ' + r.note : '')
            );
        });

        downloadText(lines.join('\n'), 'xac-nhan-tham-du.txt');
        showToast('Đã xuất file xác nhận!');
    });

    $('#clearRsvpBtn').on('click', function () {
        if (confirm('Xóa toàn bộ xác nhận tham dự?')) {
            localStorage.removeItem('weddingRSVPs');
            loadRSVPs();
            showToast('Đã xóa toàn bộ xác nhận.');
        }
    });

    /* ============================================================
       HERO BACKGROUND
    ============================================================ */
    var HERO_DEFAULT = 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=75';

    function loadHeroBgPreview() {
        var saved = localStorage.getItem('weddingHeroBg');
        var src   = saved || HERO_DEFAULT;
        $('#heroBgPreviewImg').attr('src', src);
    }

    loadHeroBgPreview();

    // heroBgInput — click xử lý natively bởi <label for="heroBgInput">
    $('#heroBgInput').on('change', function () {
        var file = this.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Chỉ hỗ trợ file ảnh!', 'warn'); return;
        }
        if (file.size > 8 * 1024 * 1024) {
            showToast('Ảnh quá lớn! Tối đa 8MB.', 'warn'); return;
        }

        var reader = new FileReader();
        reader.onload = function (ev) {
            var data = ev.target.result;
            localStorage.setItem('weddingHeroBg', data);
            $('#heroBgPreviewImg').attr('src', data);
            showToast('Đã cập nhật ảnh nền trang chủ! ✅');
        };
        reader.readAsDataURL(file);
        this.value = '';
    });

    $('#resetHeroBgBtn').on('click', function () {
        if (confirm('Xóa ảnh tùy chỉnh và dùng lại ảnh mặc định?')) {
            localStorage.removeItem('weddingHeroBg');
            $('#heroBgPreviewImg').attr('src', HERO_DEFAULT);
            showToast('Đã đặt lại ảnh mặc định.');
        }
    });

    /* ============================================================
       SETTINGS
    ============================================================ */
    function loadSettings() {
        var cfg = JSON.parse(localStorage.getItem('weddingConfig') || '{}');
        if (cfg.bride)   $('#cfg-bride').val(cfg.bride);
        if (cfg.groom)   $('#cfg-groom').val(cfg.groom);
        if (cfg.date)    $('#cfg-date').val(cfg.date);
        if (cfg.venue)   $('#cfg-venue').val(cfg.venue);
        if (cfg.address) $('#cfg-address').val(cfg.address);
        if (cfg.time)    $('#cfg-time').val(cfg.time);
    }

    $('#coupleForm').on('submit', function (e) {
        e.preventDefault();
        var cfg = {
            bride:   $('#cfg-bride').val().trim(),
            groom:   $('#cfg-groom').val().trim(),
            date:    $('#cfg-date').val(),
            venue:   $('#cfg-venue').val().trim(),
            address: $('#cfg-address').val().trim(),
            time:    $('#cfg-time').val()
        };
        localStorage.setItem('weddingConfig', JSON.stringify(cfg));
        showToast('Đã lưu cài đặt!');
    });

    $('#passForm').on('submit', function (e) {
        e.preventDefault();
        var cur     = $('#pw-current').val();
        var newPw   = $('#pw-new').val();
        var confirm = $('#pw-confirm').val();

        if (cur !== getPass()) {
            showToast('Mật khẩu hiện tại không đúng!', 'warn'); return;
        }
        if (newPw.length < 4) {
            showToast('Mật khẩu mới phải có ít nhất 4 ký tự!', 'warn'); return;
        }
        if (newPw !== confirm) {
            showToast('Xác nhận mật khẩu không khớp!', 'warn'); return;
        }

        localStorage.setItem('weddingAdminPass', newPw);
        this.reset();
        showToast('Đã đổi mật khẩu thành công!');
    });

    $('#nukeBtn').on('click', function () {
        var msg = prompt('Nhập "XOA TOAN BO" để xác nhận xóa toàn bộ dữ liệu:');
        if (msg === 'XOA TOAN BO') {
            ['weddingSchedule', 'weddingWishes', 'weddingRSVPs', 'weddingConfig', 'weddingHeroBg'].forEach(function (k) {
                localStorage.removeItem(k);
            });
            WeddingDB.clear().then(function () {
                initAll();
                showToast('Đã xóa toàn bộ dữ liệu.');
            });
        } else if (msg !== null) {
            showToast('Xác nhận không đúng, không xóa.', 'warn');
        }
    });

    /* ============================================================
       HELPERS
    ============================================================ */
    function showToast(msg, type) {
        var $t = $('#adminToast').text(msg).addClass('show');
        if (type === 'warn') $t.css('border-left-color', '#c8a96e');
        else $t.css('border-left-color', '#c9485b');
        setTimeout(function () { $t.removeClass('show'); }, 3000);
    }

    function escHtml(s) {
        return String(s || '')
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#039;');
    }

    function downloadText(text, filename) {
        var blob = new Blob(['﻿' + text], { type: 'text/plain;charset=utf-8' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href     = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
});

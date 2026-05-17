/**
 * WeddingDB — IndexedDB wrapper cho ảnh cưới
 * Lưu trực tiếp dạng Blob, không qua base64 → không bị giới hạn localStorage
 */
var WeddingDB = (function () {
    'use strict';

    var DB_NAME    = 'weddingPhotoDB';
    var DB_VERSION = 1;
    var STORE      = 'photos';
    var _db        = null;

    /* ---- Mở / khởi tạo DB ---- */
    function open() {
        return new Promise(function (resolve, reject) {
            if (_db) { resolve(_db); return; }

            var req = indexedDB.open(DB_NAME, DB_VERSION);

            req.onupgradeneeded = function (e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
                }
            };

            req.onsuccess = function (e) { _db = e.target.result; resolve(_db); };
            req.onerror   = function ()  { reject(new Error('Không thể mở IndexedDB')); };
        });
    }

    /* ---- CRUD ---- */
    function getAll() {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
                req.onsuccess = function () { resolve(req.result || []); };
                req.onerror   = function () { reject(req.error); };
            });
        });
    }

    function get(id) {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
                req.onsuccess = function () { resolve(req.result); };
                req.onerror   = function () { reject(req.error); };
            });
        });
    }

    function add(photo) {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var req = db.transaction(STORE, 'readwrite').objectStore(STORE).add(photo);
                req.onsuccess = function () { resolve(req.result); };   // returns new id
                req.onerror   = function () { reject(req.error); };
            });
        });
    }

    function remove(id) {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var req = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id);
                req.onsuccess = function () { resolve(); };
                req.onerror   = function () { reject(req.error); };
            });
        });
    }

    function updateCaption(id, caption) {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var store  = db.transaction(STORE, 'readwrite').objectStore(STORE);
                var getReq = store.get(id);
                getReq.onsuccess = function () {
                    var photo = getReq.result;
                    if (!photo) { reject(new Error('Không tìm thấy ảnh')); return; }
                    photo.caption = caption;
                    var putReq = store.put(photo);
                    putReq.onsuccess = function () { resolve(); };
                    putReq.onerror   = function () { reject(putReq.error); };
                };
                getReq.onerror = function () { reject(getReq.error); };
            });
        });
    }

    function clear() {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var req = db.transaction(STORE, 'readwrite').objectStore(STORE).clear();
                req.onsuccess = function () { resolve(); };
                req.onerror   = function () { reject(req.error); };
            });
        });
    }

    function count() {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var req = db.transaction(STORE, 'readonly').objectStore(STORE).count();
                req.onsuccess = function () { resolve(req.result); };
                req.onerror   = function () { reject(req.error); };
            });
        });
    }

    /* ---- Migration từ localStorage (base64) sang IndexedDB ---- */
    function migrateFromLocalStorage() {
        var raw = localStorage.getItem('weddingPhotos');
        if (!raw) return Promise.resolve(0);

        var list;
        try { list = JSON.parse(raw); } catch (e) { return Promise.resolve(0); }
        if (!list || !list.length) return Promise.resolve(0);

        var promises = list.map(function (p) {
            return fetch(p.data)
                .then(function (r) { return r.blob(); })
                .then(function (blob) {
                    return add({
                        blob:      blob,
                        caption:   p.caption || '',
                        name:      p.name || 'photo.jpg',
                        timestamp: Date.now()
                    });
                });
        });

        return Promise.all(promises).then(function () {
            localStorage.removeItem('weddingPhotos');
            return list.length;
        }).catch(function () {
            return 0;
        });
    }

    return {
        getAll:        getAll,
        get:           get,
        add:           add,
        remove:        remove,
        updateCaption: updateCaption,
        clear:         clear,
        count:         count,
        migrate:       migrateFromLocalStorage
    };
})();

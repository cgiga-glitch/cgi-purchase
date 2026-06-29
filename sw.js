// CGI Purchase Request - Service Worker
const CACHE_NAME = 'cgi-purchase-v1';
const URLS_TO_CACHE = [
  '/cgi-purchase/',
  '/cgi-purchase/index.html'
];

// 설치 시 캐시
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 활성화 시 이전 캐시 삭제
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// 네트워크 우선, 실패 시 캐시 사용
self.addEventListener('fetch', function(event) {
  // Apps Script POST 요청은 캐시 제외
  if (event.request.method === 'POST') return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // 성공 시 캐시 업데이트
        if (response && response.status === 200 && response.type === 'basic') {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // 오프라인 시 캐시에서 반환
        return caches.match(event.request);
      })
  );
});

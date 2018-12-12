const offlineURL = '/offline';
const staticFile = ["/", "/manifest.json", "/css/style.css", "/image/banner.png", "/image/logo/ic_launcher48.png", "/image/favicon.ico"].concat(offlineURL)
const version = "v2.0";
const cache_host = [location.host, 'c.xinstatic.com'];

self.addEventListener("install", function (e) {
    console.log("install11");
    e.waitUntil(
        caches.open(version).then(cache => {
            return cache.addAll(staticFile)
        }).then(() => {
            self.skipWaiting();
        }).catch(err => {
            console.log(err)
        })
    )

})

self.addEventListener('activate', event => {

    console.log('service worker: activate');

    // delete old caches
    event.waitUntil(
        caches.keys().then(keylist => {
            console.log(keylist)
            return Promise.all(
                keylist
                    .filter(key => key !== version)
                    .map(key => {
                        caches.delete(key);
                        self.clients.matchAll()
                            .then(function (clients) {
                                if (clients && clients.length) {
                                    clients.forEach(function (client) {
                                        // 发送字符串'sw.update'
                                        client.postMessage('update');
                                    })
                                }
                            })
                    })
            );

        }).then(() => self.clients.claim())
    )

});

self.addEventListener("message", e => {
    console.log(e);
    e.source.postMessage('send')
})

self.addEventListener("fetch", e => {
    e.respondWith(
        handleFetchRequest(e.request)
    )
})

const isNeedCache = function (url) {
    return cache_host.some(function (host) {
        return url.search(host) !== -1;
    });
};

const isCORSRequest = function (url, host) {
    return url.search(host) === -1;
};

const isValidResponse = function (response) {
    return response && response.status >= 200 && response.status < 400;
};

const handleFetchRequest = function (req) {
    if (isNeedCache(req.url)) {
        const request = isCORSRequest(req.url, location.host) ? new Request(req.url, {mode: 'cors'}) : req;
        return caches.match(request)
            .then(function (response) {
                // Cache hit - return response directly
                if (response) {
                    // Update Cache for next time enter
                    fetch(request)
                        .then(function (response) {

                            // Check a valid response
                            if (isValidResponse(response)) {
                                caches
                                    .open(version)
                                    .then(function (cache) {
                                        cache.put(request, response);
                                    });
                            } else {
                                console.log('Update cache ' + request.url + ' fail: ' + response.message);
                            }
                        })
                        .catch(function (err) {
                            console.log('Update cache ' + request.url + ' fail: ' + err.message);
                            return new Response(
                                '<svg role="img" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><title>offline</title><path d="M0 0h400v300H0z" fill="#eee" /><text x="200" y="150" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="50" fill="#ccc">offline</text></svg>',
                                { headers: {
                                        'Content-Type': 'image/svg+xml',
                                        'Cache-Control': 'no-store'
                                    }}
                            );
                        });
                    // return response;
                }

                // Return fetch response
                return fetch(request)
                    .then(function (response) {
                        // Check if we received an unvalid response
                        if (!isValidResponse(response)) {
                            return response;
                        }

                        const clonedResponse = response.clone();

                        caches
                            .open(version)
                            .then(function (cache) {
                                cache.put(request, clonedResponse);
                            });

                        return response;
                    });
            });
    } else {
        return fetch(req);
    }
};


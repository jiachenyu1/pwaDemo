const offlineURL = '/offline';
const staticFile = ["/", "/manifest.json", "/css/style.css", "/image/banner.png", "/image/logo/ic_launcher48.png", "/image/favicon.ico"].concat(offlineURL)
const version = "v1.5";
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
                    .map(key => caches.delete(key))
            );

        }).then(() => self.clients.claim())
    )

});

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
                        });
                    return response;
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


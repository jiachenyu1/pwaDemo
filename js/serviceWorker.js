const offlineURL = '/offline';
const staticFile = ["/", "/manifest.json", "/css/style.css", "/image/banner.png", "/image/logo/ic_launcher48.png", "/image/favicon.ico"].concat(offlineURL)
const version = "v2.5";
const cache_host = [location.host, 'c.xinstatic.com'];

this.addEventListener("install", function (e) { // 安装
    console.log("install13");
    e.waitUntil(  //安装成功的回调
        caches.open(version).then(cache => { //缓存一些默认需要缓存的
            return cache.addAll(staticFile)
        }).then(() => {
            self.skipWaiting(); //跳过等待直接进入  active状态
        }).catch(err => {
            console.log(err)
        })
    )

})

self.addEventListener('activate', event => { //激活状态

    console.log('service worker: activate');

    event.waitUntil(
        caches.keys().then(keylist => {  //删除掉旧的缓存
            console.log(keylist)
            return Promise.all(
                keylist
                    .filter(key => key !== version)
                    .map(key => {
                        caches.delete(key);
                        self.clients.matchAll()  //所有展示在前台的浏览器
                            .then(function (clients) {
                                if (clients && clients.length) {
                                    clients.forEach(function (client) {
                                        client.postMessage('update');
                                    })
                                }
                            })
                    })
            );

        }).then(() => self.clients.claim())
    )

});

self.addEventListener("message", e => {  //监听页面的消息
    console.log(e);
    e.source.postMessage('send')
})

self.addEventListener("fetch", e => { //监听fetch
    console.log("fetch:", e)
    if (e.request.method === "POST") {
        return;
    }
    e.respondWith(  //发送请求
        handleFetchRequest(e.request)
    )
})

self.addEventListener("push", e => {   //监听推送
    console.log(JSON.parse(e.data.text()));
    const res = JSON.parse(e.data.text());
    url = res.url;
    e.waitUntil(
        self.registration.showNotification(res.title, { //展示推送
            body: res.msg,
            url: res.url,
            icon: res.icon,
            data: res.url
        })
    )
})

self.addEventListener("notificationclick", e => {  //控制推送点击
    console.log(e)
    e.notification.close();
    e.waitUntil(
        clients.matchAll({
            type: "window"
        }).then(function () {
            return clients.openWindow(e.notification.data);
        })
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
    if (isNeedCache(req.url)) { //判断是否需要缓存
        const request = isCORSRequest(req.url, location.host) ? new Request(req.url, {mode: 'cors'}) : req; //判断是否需要跨域
        return caches.match(request)  //现在缓存中比对
            .then(function (response) {
                if (response) { //缓存里有就直接返回
                    fetch(request).then(res => {
                        if (isValidResponse(res)) {
                            caches.open(version).then(cache => {
                                cache.put(request, res);
                            })
                        }
                    })
                    return response
                }

                return fetch(request) //没有去请求一次缓存上
                    .then(function (response) {
                        console.log(2)
                        if (!isValidResponse(response)) {  //请求失败的返回另一个页面
                            return caches.open(version).then(cache => {
                                return cache.match(offlineURL)
                            })
                        }
                        const clonedResponse = response.clone();

                        caches
                            .open(version)
                            .then(function (cache) {
                                cache.put(request, clonedResponse);
                            });

                        return response;
                    }).catch((err) => {
                        return caches.open(version).then(cache => {
                            return cache.match(offlineURL)
                        })
                    });
            });
    } else {
        return fetch(req); //不需要缓存直接返回
    }
};


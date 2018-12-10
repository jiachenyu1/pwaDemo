const offlineURL = '/offline/';
const staticFile = ["/", ".mainfest.json", "/css/style.css", "/images/banner.png", "/images/logo/ic_launcher144.png"].concat(offlineURL)
const version = "v1.0"
this.addEventListener("install", function (e) {
    e.waitUntil(
        caches.open(version).then(cache=>{
            cache.addAll(staticFile)
        }).catch(err=>{
            console.log(err)
        })
    )
})
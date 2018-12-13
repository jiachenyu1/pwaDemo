(function () {

    'use strict';
    const
        http = require('http'),
        url = require('url'),
        path = require('path'),
        fs = require('fs'),
        webPush = require("web-push"),
        port = parseInt(process.argv[2] || 8000, 10),
        mime = {
            '.html': ['text/html', 86400],
            '.htm': ['text/html', 86400],
            '.css': ['text/css', 86400],
            '.js': ['application/javascript', 86400],
            '.json': ['application/json', 86400],
            '.jpg': ['image/jpeg', 0],
            '.jpeg': ['image/jpeg', 0],
            '.png': ['image/png', 0],
            '.gif': ['image/gif', 0],
            '.ico': ['image/x-icon', 100000],
            '.svg': ['image/svg+xml', 0],
            '.txt': ['text/plain', 86400],
            'err': ['text/plain', 30]
        };
    const publicVapidKey = "BEMfDUy0BLKiUyXB4ivlNb5pkkAcVejNq8DsrQXBTlAOKgVGEsZj-ZUNLZHmXvwnLyiyEBnSFcwz-lAq8sP6mC0";
    const privateVapidKey = "QsPaF7BsLSyBA8Ap4OM66FxEiXVL9Lf-7coQZKBv5Oc";
    webPush.setVapidDetails('mailto:1539981050@qq.com', publicVapidKey, privateVapidKey);
// new server
    http.createServer(function (req, res) {
        let body = "";
        req.on("data", data => {
            body += data;
        })
        req.on("end", () => {
            let filename = req.url
            if (req.method === "POST") {
                if (filename === "/register") {
                    console.log(JSON.parse(body))
                    webPush.sendNotification(JSON.parse(body),
                        JSON.stringify({
                            msg: "这是一个push推送",
                            url: "http://localhost:8000/offline",
                            icon: "http://localhost:8000/image/logo/ic_launcher144.png",
                            title: "hello world"
                        })
                    ).then(result => {
                        console.log("1:", result)
                        res.end(JSON.stringify({
                            msg: "成功"
                        }));
                    }).catch(err => {
                        console.log(err)
                        // res.end(JSON.stringify({
                        //     msg: "失败"
                        // }));
                    })
                }
                else if(filename === "/push"){
                    const sub = JSON.parse(body)
                    console.log(sub)
                    webPush.sendNotification(sub.sub,
                        JSON.stringify({
                            msg: sub.content,
                            url: sub.url,
                            icon: "http://localhost:8000/image/logo/ic_launcher144.png",
                            title: sub.title
                        })
                    ).then(result => {
                        // console.log("1:", result)
                        res.end(JSON.stringify({
                            msg: "成功"
                        }));
                    })
                }
            }
            else {
                if (filename === "/" || filename === "/offline" || filename === "/push") {
                    filename += '/index.html';
                }

                if (filename === "/serviceWorker.js") {
                    filename = "/js/serviceWorker.js"
                }
                filename = path.join(process.cwd(), filename);
                // read file
                fs.readFile(filename, (err, file) => {
                    console.log(filename)
                    if (err) {
                        // error reading
                        serve(500, err + '\n');
                    }
                    else {
                        // return file
                        serve(200, file, path.extname(filename));
                    }
                });
            }
        })

        // serve content
        function serve(code, content, type) {

            let head = mime[type] || mime['err'];

            res.writeHead(code, {
                'Content-Type': head[0],
                'Cache-Control': 'must-revalidate, max-age=' + (head[1] || 2419200),
                'Content-Length': Buffer.byteLength(content)
            });
            res.write(content);
            res.end();

        }

    }).listen(port);


    console.log('Server running at http://localhost:' + port);

}());

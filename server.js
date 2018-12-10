#!/usr/bin/env node

/*
server.js: launches a static file web server from the current folder

make executable with `chmod +x ./server.js`
run with `./server.js [port]`
where `[port]` is an optional HTTP port (8888 by default)
*/
(function () {

    'use strict';

    const
        http = require('http'),
        url = require('url'),
        path = require('path'),
        fs = require('fs'),
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
            '.ico': ['image/x-icon', 0],
            '.svg': ['image/svg+xml', 0],
            '.txt': ['text/plain', 86400],
            'err': ['text/plain', 30]
        };

// new server
    http.createServer(function (req, res) {
        console.log(req.url)
        let filename = req.url

        // file available?

        // not found
        // index.html default
        if (filename === "/") filename += '/index.html';
        if (filename === "/serviceWorker.js") {
            filename = "/js/serviceWorker.js"
        }
        filename = path.join(process.cwd(), filename);
        console.log(filename)
        // read file
        fs.readFile(filename, (err, file) => {

            if (err) {
                // error reading
                serve(500, err + '\n');
            }
            else {
                // return file
                serve(200, file, path.extname(filename));
            }

        });

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

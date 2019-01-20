const request = require('request')
const cheerio = require('cheerio')


const j = request.jar();
const cookie = request.cookie('over18 = 1');
var url = 'https://www.ptt.cc/bbs/Gossiping/index.html'
j.setCookie(cookie, url);

var time = 10
var keyword = "肥宅"

search_start()


function search_start() {

    var p = new Promise((r) => {
        r()
    })

    p
        //          if over throw error
        .then(() => search_keyword())
        //          again
        .then(() => search_start())
        .catch(() => { console.log('over') })
}


function search_keyword() {

    return new Promise(r =>
        request({ url: url, jar: j }, (err, res, body) => {

            var $ = cheerio.load(body)

            $('#main-container .action-bar .btn').each(function (i, elem) {

                var text = $(this).text()

                if (text === '‹ 上頁')
                    url = 'https://www.ptt.cc' + $(this).attr('href')


            })

            $('#main-container .r-ent .title').each(function (i, elem) {

                var text = $(this).text()

                if (text.search(keyword) != -1) {

                    text = text.trim()
                    console.log(text)

                    if (--time <= 0) {
                        throw ('over')
                    }

                }

            })

            r();

        }))
}


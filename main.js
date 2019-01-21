const request = require('request')
const cheerio = require('cheerio')
const fs = require('fs')


const j = request.jar()
const cookie = request.cookie('over18 = 1')
var url = 'https://www.ptt.cc/bbs/Gossiping/index.html'
j.setCookie(cookie, url)

const txtFile = "data.txt"
var first_use = false
var time = 10
var keyword = "問卦"
var end_time, art_time



read_data()

save_time()

search_start()



function read_data() {
    try {

        var str = fs.readFileSync(txtFile, 'utf8')

        console.log('----------------------------')
        console.log('\nlast search  :  ' + str + '\n')
        console.log('----------------------------')


        end_time = convert_time(str)
    }
    catch (err) {

        first_use = true
        fs.appendFile(txtFile, '', function (err2) {
            if (err2) throw err2;
        });
        console.log('----------------------------')
        console.log('\nfirst use ~~~\n')
        console.log('\nwelcome :) \n')
        console.log('----------------------------')
    }
}


function save_time() {
    request({ url: url, jar: j }, (err, res, body) => {

        var $ = cheerio.load(body)
        var over = false
        var last_url

        $('div .r-ent .title').each(function (i, elem) {

            var text = $(this).text()

            if (over) return

            if (text.search('公告') == -1
                && text.search('協尋') == -1) {

                $(this).find('div > a').each(function (index, element) {
                    last_url = 'https://www.ptt.cc' + $(element).attr('href')
                });
            }
            else {

                over = true

                request({ url: last_url, jar: j }, (err, res, body) => {
                    var $ = cheerio.load(body)
                    var reg = /\w\w\w \w\w\w \d\d \d\d:\d\d:\d\d \d\d\d\d/

                    $('#main-content .article-metaline .article-meta-value').each(function (i, elem) {

                        var text = $(this).text()
                        text = text.trim()

                        if (text.search(reg) != -1) {
                            console.log('\nstorage time :  ' + text + '\n')
                            console.log('----------------------------')
                            fs.writeFile(txtFile, text, function (err2) {
                                if (err2) throw err2;
                            });
                        }
                    })
                })
            }
        })
    })
}


function get_time() {
    return new Promise(r =>
        request({ url: url, jar: j }, (err, res, body) => {

            var $ = cheerio.load(body)

            $('div .r-ent .title').each(function (i, elem) {

                if (i >= 1) return

                var text = $(this).text()
                text = text.trim()

                var this_url = 'https://www.ptt.cc' + $('.title a[href]').attr('href')

                request({ url: this_url, jar: j }, (err, res, body) => {
                    $ = cheerio.load(body)
                    var reg = /\w\w\w \w\w\w \d\d \d\d:\d\d:\d\d \d\d\d\d/

                    $('#main-content .article-metaline .article-meta-value').each(function (i, elem) {

                        var text = $(this).text()
                        text = text.trim()

                        if (text.search(reg) != -1) {

                            art_time = convert_time(text)
                            compare_time()
                            // next func
                            r()
                        }
                    })
                })
            })
        })
    )
}


function search_start() {

    var p = new Promise((r) => {
        r()
    })

    p
        .then(() => get_time())
        //          if over throw error
        .then(() => search_keyword())
        //          again
        .then(() => search_start())
        .catch(() => { })
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
                        throw ('search time over')
                    }
                }
            })
            // next func
            r();

        }))
}


function convert_time(str) {

    str = str.split(" ")
    var t = str[3].split(":")

    return {
        year: parseInt(str[4]),
        month: get_month(),
        date: parseInt(str[2]),
        hour: parseInt(t[0]),
        min: parseInt(t[1]),
        sec: parseInt(t[2])
    }


    function get_month() {
        switch (str[1]) {
            case 'Jan':
                return 1
            case 'Feb':
                return 2
            case 'Mar':
                return 3
            case 'Apr':
                return 4
            case 'May':
                return 5
            case 'Jun':
                return 6
            case 'Jul':
                return 7
            case 'Aug':
                return 8
            case 'Sep':
                return 9
            case 'Oct':
                return 10
            case 'Nov':
                return 11
            case 'Dec':
                return 12
            default:
                return 0
        }
    }
}


function compare_time() {

    var flag = false
    if (first_use) return

    if (end_time.year > art_time.year)
        flag = true
    else if (end_time.year === art_time.year) {
        if (end_time.month > art_time.month)
            flag = true
        else if (end_time.month === art_time.month) {
            if (end_time.date > art_time.date)
                flag = true
            else if (end_time.date === art_time.date) {
                if (end_time.hour > art_time.hour)
                    flag = true
                else if (end_time.hour === art_time.hour) {
                    if (end_time.min > art_time.min)
                        flag = true
                    else if (end_time.min === art_time.min) {
                        if (end_time.sec >= art_time.sec)
                            flag = true
                    }
                }
            }
        }
    }

    if (flag) throw ('last time over')
}

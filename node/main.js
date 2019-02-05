const request = require('request')
const cheerio = require('cheerio')
const fs = require('fs')
const readline = require('readline');


const j = request.jar()
const cookie = request.cookie('over18 = 1')
var url =
    ['https://www.ptt.cc/bbs/Gossiping/index.html',
        'https://www.ptt.cc/bbs/WomenTalk/index.html',
        'https://www.ptt.cc/bbs/Marginalman/index.html']

j.setCookie(cookie, url[0])


const dataFile = "data.txt"
const settingFile = "setting.txt"

var board_name = ["Gossiping", "WomenTalk", "Marginalman"]
var board_i = []
const reg = /\w\w\w \w\w\w .\d \d\d:\d\d:\d\d \d\d\d\d/
var index = 0
const default_search_time = 1
const default_keyword = "初音"
const default_board_i = 0
var search_time = 1, time = 1
var keyword = []
var no_data = true
var end_time = [], art_time
var get_time_over = false


read_file()
process()



function read_file() {

    // setting
    if (!fs.existsSync(settingFile)) {

        fs.appendFile(settingFile, 'search_time: ' + default_search_time + '\nkeyword: ' + default_keyword, function (err2) {
            if (err2) throw err2;
            search_time = default_search_time
            time = search_time
            keyword.push(default_keyword)
            board_i.push(default_board_i)
        });
    }
    else {

        var inputStream = fs.createReadStream(settingFile);
        var lineReader = readline.createInterface({ input: inputStream });

        lineReader.on('line', function (line) {
            line = line.split(" ")
            switch (line[0]) {
                case "search_time:":
                    search_time = parseInt(line[1])
                    time = search_time
                    break
                case "keyword:":
                    for (var i = 1; i < line.length; ++i)
                        keyword.push(line[i])
                    break
                case "board:":
                    board_i = line[1].split("")
                    break
            }
        });
    }

    // data
    if (!fs.existsSync(dataFile)) {

        fs.appendFile(dataFile, '', function (err2) {
            if (err2) throw err2;
        });
        console.log('----------------------------')
        console.log('\nfirst use ~~~\n')
        console.log('\nwelcome :) \n')
        console.log('----------------------------')
    }
    else {

        var inputStream2 = fs.createReadStream(dataFile);
        var lineReader2 = readline.createInterface({ input: inputStream2 });

        lineReader2.on('line', function (line) {
            if (line.search(reg) != -1) {
                no_data = false
                end_time.push(convert_time(line))
            }
        });
    }
}


function process() {

    console.log('----- ' + board_name[index] + ' -----')
    save_time()
    search_start()
}


function save_time() {
    request({ url: url[index], jar: j }, (err, res, body) => {

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

                    $('#main-content .article-metaline .article-meta-value').each(function (i, elem) {

                        var text = $(this).text()
                        text = text.trim()

                        if (text.search(reg) != -1) {

                            if (index != 0) {
                                fs.appendFile(dataFile, '\n' + text, function (err2) {
                                    if (err2) throw err2
                                })
                            }
                            else {
                                fs.writeFile(dataFile, text, function (err2) {
                                    if (err2) throw err2
                                })
                            }
                        }
                    })
                })
            }
        })
    })
}


function search_start() {
    var p = new Promise((p_res, p_rej) => {
        p_res()
    })
    p
        .then(() => get_time())
        //          if over throw error
        .then(() => search_keyword())
        //          again
        .then(() => search_start())
        .catch(() => {
            // next board
            if (++index <= (board_i.length - 1)) {
                time = search_time
                process()
            }
            else
                console.log('\nover~~~')
        })
}


function get_time() {

    var url_i = 0;
    var url_arr = []

    get_time_over = false

    return new Promise((p_res, p_rej) =>
        request({ url: url[index], jar: j }, (err, res, body) => {

            var $ = cheerio.load(body)
            var p = Promise.resolve();

            p = p.then(function () {

                $('div .r-ent .title').each(function (i, elem) {

                    var text = $(this).text()
                    text = text.trim()

                    try {
                        url_arr.push('https://www.ptt.cc' + elem.children[1].attribs.href)
                    } catch (error) {

                    }
                })
            });

            p.then(function () {
                search_one_of_urls(p_res, p_rej)
            });
        })
    )

    function search_one_of_urls(p_res, p_rej) {
        request({ url: url_arr[url_i], jar: j }, (err, res, body) => {

            $ = cheerio.load(body)
            var p = Promise.resolve();

            p = p.then(function () {
                $('#main-content .article-metaline .article-meta-value').each(function (i, elem) {
                    var text = $(this).text()
                    text = text.trim()
                    if (text.search(reg) != -1) {

                        get_time_over = true
                        art_time = convert_time(text)
                        compare_time(p_rej)
                        // next func
                        p_res()
                    }
                })
            })

            p.then(function () {
                if (!get_time_over) {
                    ++url_i
                    search_one_of_urls(p_res, p_rej)
                }
            });
        })
    }
}



function search_keyword() {
    return new Promise((p_res, p_rej) =>
        request({ url: url[index], jar: j }, (err, res, body) => {

            var $ = cheerio.load(body)

            $('#main-container .action-bar .btn').each(function (i, elem) {

                var text = $(this).text()

                if (text === '‹ 上頁')
                    url[index] = 'https://www.ptt.cc' + $(this).attr('href')
            })

            $('#main-container .r-ent .title').each(function (i, elem) {

                var text = $(this).text()
                if (text.search(keyword) != -1) {

                    text = text.trim()
                    console.log(text)

                    if (--time <= 0)
                        p_rej(new Error("search time over"))
                }
            })
            // next func
            p_res();

        }))
}


function convert_time(str) {

    var gap = 0
    str = str.split(" ")
    // date >= 10 ?
    if (str[2] == '')
        gap = 1
    var t = str[3 + gap].split(":")

    return {
        year: parseInt(str[4 + gap]),
        month: get_month(),
        date: parseInt(str[2 + gap]),
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


function compare_time(p_rej) {

    var flag = false
    if (no_data) return

    if (end_time[index].year > art_time.year)
        flag = true
    else if (end_time[index].year === art_time.year) {
        if (end_time[index].month > art_time.month)
            flag = true
        else if (end_time[index].month === art_time.month) {
            if (end_time[index].date > art_time.date)
                flag = true
            else if (end_time[index].date === art_time.date) {
                if (end_time[index].hour > art_time.hour)
                    flag = true
                else if (end_time[index].hour === art_time.hour) {
                    if (end_time[index].min > art_time.min)
                        flag = true
                    else if (end_time[index].min === art_time.min) {
                        if (end_time[index].sec >= art_time.sec)
                            flag = true
                    }
                }
            }
        }
    }

    if (flag) p_rej(new Error("last time over"))
}


const request = require('request')
const cheerio = require('cheerio')
const fs = require('fs')
const readline = require('readline');


const j = request.jar()
const cookie = request.cookie('over18 = 1')
const url_host = 'https://www.ptt.cc'
var url =
    ['https://www.ptt.cc/bbs/Gossiping/index.html',
        'https://www.ptt.cc/bbs/WomenTalk/index.html',
        'https://www.ptt.cc/bbs/Marginalman/index.html']

j.setCookie(cookie, url[0])


const dataFile = "data.txt"
const settingFile = "setting.txt"

var board_name = ["Gossiping", "WomenTalk", "Marginalman"]
var board_i = []
var search_board_time = 0
const reg = /\w\w\w \w\w\w .\d \d\d:\d\d:\d\d \d\d\d\d/
var index = 0
const default_search_time = 1
const default_keyword = "肥宅"
const default_board_i = 0
var search_time = 1, time = 1
var keyword = []
var no_data = true
var end_time = [], art_time


var id
var password
var content
var push_mode

var title_arr = []
var author_arr = []
var found_each_board = [0, 0, 0]

// flag
var found = false
var this_board_over = false
var leave_comment = false


read_file()

process()



function read_file() {

    // setting
    if (!fs.existsSync(settingFile)) {
        var str = 'search_time: ' + default_search_time + '\nkeyword: ' + default_keyword + '\nboard: ' + default_board_i + '\nleave_comment: false\nid: \npassword: \npush_mode: 2\ncontent: test'
        fs.appendFile(settingFile, str, function (err2) {
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
                case 'leave_comment:':
                    if (line[1] == 'true')
                        leave_comment = true
                    break
                case 'id:':
                    id = line[1]
                    break
                case 'password:':
                    password = line[1]
                    break
                case 'push_mode:':
                    push_mode = line[1]
                    break
                case 'content:':
                    content = line[1]
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

    this_board_over = false

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

    var p = new Promise((resolve) => {
        resolve()
    })
    p
        .then(() => search_one_page())
        .then((temp) => handle_temp(temp))
        .catch(() => {
            if (!this_board_over)
                search_start()
            else {
                // next board
                if (++search_board_time < board_i.length) {
                    index = board_i[search_board_time]
                    time = search_time
                    process()
                }
                else {
                    console.log(title_arr)
                    console.log(author_arr)
                    console.log(found_each_board)
                    console.log('\nsearch over~~~')
                    console.log('\commend start~~~')

                    if (found && leave_comment)
                        comment()
                }
            }


        })
}

function search_one_page() {

    return new Promise((resolve, reject) =>
        request({ url: url[index], jar: j }, (err, res, body) => {

            var $ = cheerio.load(body)
            var temp = []
            var p = Promise.resolve();

            // -----------------------------------
            //          get last page url
            // -----------------------------------

            p = p.then(() => {
                $('#main-container .action-bar .btn').each(function (i, elem) {

                    var text = $(this).text()

                    if (text === '‹ 上頁')
                        url[index] = url_host + $(this).attr('href')
                })
            })

            // -----------------------------------
            //     search this page keywords
            // -----------------------------------

            p.then(() => {
                $('#main-container .r-ent').each(function (i, elem) {

                    var text = $(this).text()

                    if (text.search(keyword) != -1) {

                        var title = $(this)['0'].children[3].children[1].children[0].data
                        var author = $(this)['0'].children[5].children[1].children[0].data
                        var a_url = $(this)['0'].children[3].children[1].attribs.href

                        temp.push({
                            'title': title.trim(),
                            'author': author.trim(),
                            'url': a_url.trim()
                        })
                    }
                })
            })

            p.then(() => {
                if (time <= temp.length) {

                    var gap = temp.length - time
                    temp.splice(0, gap)
                }
                if (temp.length == 0)
                    reject()

                resolve(temp)
            })
        }))
}


function handle_temp(temp) {

    var i = temp.length - 1
    var time_up = false

    return new Promise((resolve, reject) => {
        search_one_of_urls(resolve, reject)
    })

    function search_one_of_urls(resolve, reject) {

        var url = url_host + temp[i].url

        request({ url: url, jar: j }, (err, res, body) => {

            $ = cheerio.load(body)
            var p = Promise.resolve();

            // -----------------------------------
            //      check this article's time
            // -----------------------------------

            p = p.then(() => {
                $('#main-content .article-metaline .article-meta-value').each(function (j, elem) {
                    var text = $(this).text()
                    text = text.trim()
                    if (text.search(reg) != -1) {

                        art_time = convert_time(text)
                        if (compare_time())
                            time_up = true
                        else
                            console.log(temp[i].title)
                    }
                })
            })

            // -------------------------------------------
            //     decide to check next article's time 
            //     ,or return reject() of this promise
            // -------------------------------------------

            p.then(() => {

                if (--i >= 0 && !time_up)
                    search_one_of_urls(resolve, reject)
                else {

                    if (time <= temp.length || time_up) {

                        this_board_over = true

                        // where temp's article time up
                        var pos = (i == -1) ? (i + 1) : (i + 2)
                        temp.splice(0, pos)
                    }
                    else {
                        time -= temp.length
                    }

                    for (i = 0; i < temp.length; ++i) {

                        title_arr.push(temp[i].title)
                        author_arr.push(temp[i].author)
                        ++found_each_board[index]
                        found = true
                    }

                    reject()
                }
            })
        })
    }
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


function compare_time() {

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

    if (flag) return true
    else return false
    //reject(new Error("last time over"))
}


function comment() {
    const Client = require('ssh2').Client;
    const conn = new Client();
    var s, d

    var i = 0

    // flag
    var start = false
    var isLogin = false
    var isComment = false

    conn.on('ready', function () {
        console.log('Client :: ready');

        conn.shell(function (err, stream) {
            if (err) throw err;

            stream.on('close', function (code, signal) {
                console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
                conn.end();
            }).on('data', function (data) {
                s = stream
                d = data
                console.log('STDOUT: ' + data);

                if (!start)
                    connect()

            }).stderr.on('data', function (data) {
                console.log('STDERR: ' + data);
            });
        });
    }).connect({
        host: '140.112.172.11',
        port: 22,
        username: 'bbsu',
        password: ''
    });

    // init
    (() => {
        console.log('\n\n\n\n\n\n\n\n------init-------')
        search_board_time = 0
        index = board_i[search_board_time]
    })()


    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    async function connect() {
        start = true
        if (d.includes('系統過載')) {
            console.log('系統過載, 等等再來吧QQ')
            process.exit()
        }
        await sleep(2000)
        login()
    }


    async function login() {

        console.log('login...');
        s.write(id + '\r\n')
        s.write(password + '\r\n')
        await sleep(2000)
        handleLoginProblem()
    }

    async function handleLoginProblem() {

        if (d.includes('這裡沒有這個人啦')) {
            console.log('帳密錯誤...')
            console.log('88888')
            process.exit()
        }

        if (d.includes('您想刪除其他重複登入')) {
            console.log('\n\n\n\n\n\n\n\n\n刪除其他重複登入的連線....')
            s.write('y\r\n')
            await sleep(5000);
        }

        if (d.includes('系統負荷量大時會需時較久')) {
            console.log('\n\n\n\n\n\n\n\n\n系統負荷量大，再多等一下...')
            await sleep(5000);
        }

        if (d.includes('請勿頻繁登入以免造成系統過度負荷')) {
            console.log('\n\n\n\n\n\n\n\n\n不要頻繁登入喔喔喔....')
            s.write('\r\n')
            await sleep(2000);
        }

        if (d.includes('請按任意鍵繼續')) {
            console.log('\n\n\n\n\n\n\n\n\n按任意鍵繼續....')
            s.write('\r\n')
            await sleep(2000);
        }

        if (d.includes('您要刪除以上錯誤嘗試的記錄嗎')) {
            console.log('刪除錯誤嘗試')
            s.write('y\r\n')
            await sleep(3000);
        }


        if (d.includes('您有一篇文章尚未完成')) {
            console.log('刪除尚未完成文章')
            s.write('q\r\n')
            await sleep(2000);
        }

        await sleep(2000)
        leaveComment()
    }

    async function leaveComment() {

        var j = 0

        if (search_board_time > 0) {
            for (var k = 0; k < search_board_time; ++k) {
                j += found_each_board[board_i[k]]
            }
            j += i
        }
        else {
            j = i
        }

        console.log('\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n推文中...');
        console.log('j : ' + j)
        console.log(board_name[index])
        console.log(title_arr[j])
        console.log(author_arr[j])
        
        // enter board
        s.write('s')
        await sleep(500);
        s.write(board_name[index] + '\r\n')
        await sleep(2000);
        s.write('\r\n')

        
        // search author
        s.write('a')
        await sleep(500);
        s.write(author_arr[j] + '\r\n')
        await sleep(2000);

        
        // search article
        s.write('\057')
        await sleep(500);
        s.write(title_arr[j] + '\r\n')
        await sleep(2000);

        /*
        // leave comment
        s.write('X2')
        await sleep(500);
        s.write(content + '\r\n')
        await sleep(2000);
        s.write('y\r\n')*/

        console.log('-------------------')
        console.log('推文成功!')
        console.log('-------------------')

        nextComment()
    }


    async function nextComment() {

        console.log('\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n-----------next------------')

        if (++i > found_each_board[index] - 1) {

            if (++search_board_time <= board_i.length - 1) {
                i = 0
                index = board_i[search_board_time]
            }
            else{
                console.log('-----------comment over------------')
                return false
            }
                
        }

        leaveComment()
    }
}


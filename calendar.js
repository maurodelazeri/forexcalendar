#!/usr/bin/env node
// Mauro Delazeri
// maurodelazeri@gmail.com
// https://www.hitback.us

var request = require('request');
var cheerio = require('cheerio');
var dateFormat = require('dateformat');
var fs = require('fs');

var monthNames = ["jan", "fev", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
var dateRef  = process.argv[2];
var dateEnd  = process.argv[3];
var viewJson = process.argv[4];

if ((process.argv[2] === undefined) || (process.argv[3] === undefined)) {
    console.log("Please specify the parameters of inicial and final date: \nnode calendar.js yyyy-mm-dd yyy-mm-dd \nor\nnode calendar.js yyyy-mm-dd yyy-mm-dd json");
    return;
}

if (isDate(dateRef)) {
    if (isDate(dateEnd)) {
        asyncLoop(daysBetween(dateRef, dateEnd), function(loop) {
                var date = new Date(dateEnd);
                var dd = date.setDate(date.getDate() - loop.iteration());
                var datasent = dateFormat(new Date(dd), "yyyy") + "-" + dateFormat(new Date(dd), "mm") + "-" + dateFormat(new Date(dd), "dd");
                getEvents(monthNames[dateFormat(new Date(dd), "m") - 1] + dateFormat(new Date(dd), "d") + "." + dateFormat(new Date(dd), "yyyy"), datasent, function(result) {
                    loop.next();
                })
            },

            function() {
                console.log('cycle ended')
            }
        );
    } else {
        console.log("Invalid Date");
    }
} else {
    console.log("Invalid Date");
}

function asyncLoop(iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        next: function() {
            if (done) {
                return;
            }

            if (index < iterations) {
                index++;
                func(loop);

            } else {
                done = true;
                callback();
            }
        },

        iteration: function() {
            return index - 1;
        },

        break: function() {
            done = true;
            callback();
        }
    };
    loop.next();
    return loop;
}

function isDate(date) {
    return (new Date(date) !== "Invalid Date") && !isNaN(new Date(date));
}

function daysBetween(startDate, endDate) {
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
}

function treatAsUTC(date) {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
}

function trim_space(str) {
    str = str.replace(/^\s+/, '');
    for (var i = str.length - 1; i >= 0; i--) {
        if (/\S/.test(str.charAt(i))) {
            str = str.substring(0, i + 1);
            break;
        }
    }
    return str;
}

function convertTo24Hour(time) {
    var hours = parseInt(time.substr(0, 2));
    if (time.indexOf('am') != -1 && hours == 12) {
        time = time.replace('12', '0');
    }
    if (time.indexOf('pm') != -1 && hours < 12) {
        time = time.replace(hours, (hours + 12));
    }
    return time.replace(/(am|pm)/, '');
}

function saveLog(text) {
    var file = "result.sql";
    fs.appendFile(file, text, function(err) {
        if (err) return console.log(err);
        console.log('successfully appended "' + text + '"');
    });
}

function getEvents(time, datasent, callback) {
    request("https://www.forexfactory.com/calendar.php?day=" + time, function(error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);
            var title, release, rating;
            var calendar_json = {};
            var time = "";
            var calendar_time = "";
        
            $('.calendar__row').filter(function() {
                var data = $(this);

                if (data.find('.calendar__time').text() == "") {
                    calendar_time = time;
                } else {
                    calendar_time = convertTo24Hour(data.find('.calendar__time').text());
                    time = convertTo24Hour(data.find('.calendar__time').text());
                }

                var currency = data.find('.calendar__currency').text();
                var title = trim_space(data.find('.calendar__event').text());
                var actual = data.find('.calendar__actual').text();
                var forecast = data.find('.calendar__forecast').text();
                var previous = data.find('.calendar__previous').text();
                var calendar_date = datasent;

		if (process.argv[4] === undefined) {
                    insert = "INSERT INTO calendar (\"date\",\"time\",\"symbol\",\"title\",\"actual\",\"forecast\",\"previous\") VALUES (\"" + calendar_date + "\", \"" + calendar_time + "\", \"" + currency + "\", \"" + title + "\", \"" + actual + "\", \"" + forecast + "\", \"" + previous + "\" )\n";
                   saveLog(insert);
		}else{
                   calendar_json = {
                       date: calendar_date,
                       time: calendar_time,
                       symbol: currency,
                       title: title,
                       actual: actual,
                       forecast: forecast,
                       previous: previous
                   };
            	   console.log(JSON.stringify(calendar_json));
		}

            });
            callback();
        }else{
	   console.log("error on the request");  
           callback();
	}
    });
}

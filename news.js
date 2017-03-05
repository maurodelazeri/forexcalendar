#!/usr/bin/env node
// Mauro Delazeri
// maurodelazeri@gmail.com
// https://www.hitback.us

var request = require('request');
var cheerio = require('cheerio');

request("https://www.forexfactory.com/calendar.php?day=jan9.2017", function (error, response, html) {
    if (!error) {
        var $ = cheerio.load(html);
        var title, release, rating;
        var json = {};
	var time = "";

        $('.calendar__table .calendar__row--grey').filter(function () {
            var data = $(this);
	            
	    if (data.find('.calendar__time').text() == "")  {
		json.time = time;
	    }else{
		json.time = data.find('.calendar__time').text();
		time = data.find('.calendar__time').text();
	    }
	     
	    json.currency 	= data.find('.calendar__currency').text();
	    json.title 		= data.find('.calendar__event').text();
	    json.actual 	= data.find('.calendar__actual').text();
	    json.forecas 	= data.find('.calendar__forecast').text();
	    json.previous 	= data.find('.calendar__previous').text();
	
          console.log(JSON.stringify(json));
        });

    }
});

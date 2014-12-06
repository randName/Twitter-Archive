var Grailbird = function (type, date, data) {
  Grailbird.data = Grailbird.data || {};
  Grailbird.data[type+'_'+date] = data;
};

(function(exports) {
  "use strict";

  var User = {},
      Tweets = {},
      mixins = {};

// change the mustache tag delimiters so that it will leave the runtime variables alone
//
  var templates = {
    empty_hour: Hogan.compile('<li class="without-tweets" title="" rel="tooltip" data-placement="bottom" data-date="" data-count="0"><span class="value">{{this_hour}}</span></li>'),
    hour_bar: Hogan.compile('<li><a href="#" class="with-tweets" title="{{str_title}}: {{str_count}}" rel="tooltip" data-placement="bottom" data-idx="{{data_idx}}" data-date="{{str_title}}" data-count="{{this_count}}"><span class="bar" style="height: {{this_height}}%;"></span><span class="value">{{this_hour}}</span></a></li>'),
    header_str: Hogan.compile('{{title_str}} <span class="count">{{tweet_count}}</span>'),
    nav_tab: Hogan.compile('<li class="{{sectionClass}}"><a href="#">{{sectionName}}</a></li>'),
    singular_tweet_count: Hogan.compile('{{count}} Tweet'),
    plural_tweet_count: Hogan.compile('{{count}} Tweets')
  };
//

  exports.init = function () {
    Grailbird.localizeStrings();
    var doc = $(document),
        header = $('.tweets-header');

    twt.settings.showLocalTimes = true;
    twt.settings.showRelativeTimes = true;
    twt.settings.product = 'archive';
    twt.settings.lang = 'en';

    // since twt is an imported library, we're going to mess with how it formats dates here, so that the changes aren't
    // overwritten. hopefully in the future it will use cldr properly and we can remove this.
    // we want it to look like it does on twitter.com: 10:15 AM - Mar 7, 2013, properly localized and in local time
    twt.formattedDate = function(str) {
      var d = twt.parseDate(str);
      var fmt = new TwitterCldr.DateTimeFormatter();
      var date, time;

      if (!d) return str;

      time = fmt.format(d, {"format": "additional", "type": "hm"});
      date = fmt.format(d, {"format": "date", "type": "long"})
      return [time, date].join(' - ')
    };

    twt.timeAgo = function(d, relative) {
      var fmt;
      var then = twt.parseDate(d), rightNow = new Date();

      if (!then) return "";

      var diff_seconds = Math.abs(rightNow.getTime() - then.getTime()) / 1000;
      var diff_minutes = Math.floor(diff_seconds / 60);
      var unit;

      if ((relative !== false) && (diff_minutes < (60 * 24 * 31)))  {
      // tweeted less than a month ago, so display time difference by unit "10 d"
        if (diff_minutes === 0) {
          unit = "second"
        } else if (diff_minutes < 60) {
          unit = "minute"
        } else if (diff_minutes < 60 * 24) {
          unit = "hour"
        } else if (diff_minutes < 60 * 24 * 31) {
          unit = "day"
        }
        // so many time units ago
        fmt = new TwitterCldr.TimespanFormatter();
        return fmt.format(diff_seconds, {direction: "none", type: "short", unit: unit});
      } else if (diff_minutes < 60 * 24 * 365) {
      // tweeted more than a month ago, but less than a year so show the month and day: "Mar 10"
        fmt = new TwitterCldr.DateTimeFormatter();
        return fmt.format(then, {"format": "additional", "type": "MMMd"});
      } else {
      // tweeted more than a year ago, so show the full date: Mar 10, 2012
        fmt = new TwitterCldr.DateTimeFormatter();
        return fmt.format(then, {format: "date", type: "long"});
      }
    };

    Grailbird.data = Grailbird.data || {};
    Grailbird.current_index = 0;

    Tweets = Grailbird.tweets();

    Tweets.init();

    $('.brand').click(function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      $('.row .contents, .sidebar').removeClass('container-messages');
      $('.tweets-header .nav-clear').hide();
      // $('.container').removeClass('searching');
      // User.setState(Tweets);
      Tweets.init();
    });

    $('.tweets-header .nav-arrow').tooltip().click(function() {
      Tweets.displayTweets(Number($(this).attr('data-idx')));
      $(this).tooltip('show');
    });

    $(document).keyup(function (e) {
        // nav left if possible on keyup of left arrow
        if(e.keyCode === 37) {
          e.preventDefault();
          $('.nav-arrow-left:visible').click();
          $('.nav-arrow-right').tooltip('hide');
        }
        // nav right if possible on keyup of right arrow
        if(e.keyCode === 39) {
          e.preventDefault();
          $('.nav-arrow-right:visible').click();
          $('.nav-arrow-left').tooltip('hide');
        }
    });

    $(".container").touchwipe({
        wipeRight: function(){ $(".nav-arrow-left:visible").click(); $(".nav-arrow-right").tooltip("hide") },
        wipeLeft: function(){ $(".nav-arrow-right:visible").click(); $(".nav-arrow-left").tooltip("hide") }
    });

    $(window).scroll(function() {
      var pos = doc.scrollTop();
      if(pos > 0) {
        header.addClass('raised');
      } else {
        header.removeClass('raised');
      }
    });
  };

  exports.extend = function (obj) {
    var args = Array.prototype.slice.call(arguments, 1),
        i = 0,
        l = args.length,
        prop,
        source;

    for (i; i < l; i++) {
      source = args[i];
      for (prop in source) {
        if (source[prop] !== undefined) {
          obj[prop] = source[prop];
        }
      }
    }
    return obj;
  };

  (function(exports) {
    exports.base = {
      init: function () {
        this.buildNavigation();
        this.displayTweets(0);
      },
      buildNavigation: function () {
        // Note: Every DOM element constructed in this function must be removed and reinitialized as this
        // is called every time you click on a section nav element. If the DOM elements aren't flushed and
        // recreated, any click handlers bound to them will be bound to them again

        // build nav for each year/month
        var number_formatter = new TwitterCldr.DecimalFormatter();
        var date_formatter = new TwitterCldr.DateTimeFormatter();
        var count, status_file;
        var temp_date = new Date();
        var months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ],
            self = this,
            $day_chart = $('<div class="histogram"><h3></h3><ol class="hours unstyled"></ol></div>'),
            $day_chart_clone,
            hour_bar = [],
            day_curr;

        $('.content-nav').empty();
        var hour_count_max = _.max(this.status_index, function (hour) {return hour['tweet_count'];}),
            renderDay = function() {
              if ($day_chart_clone) {
                hour_bar = hour_bar.reverse();
                if (hour_bar.length < 24) {
                  for (var h = 0; h < 24; h++) {
                    if (!hour_bar[h] || hour_bar[h].match(/class="value">(\d+)<\/span>/)[1] != h) {
                       hour_bar.splice(h,0,templates.empty_hour.render({this_hour:h}));
                    }
                  }
                }
                $day_chart_clone.find('.hours').append(hour_bar.join(''));
              }
            };

        for (var i = 0, l = this.status_index.length; i < l; i++) {
          status_file = this.status_index[i];
          temp_date.setUTCFullYear(status_file.year, status_file.month - 1, status_file.day);
          var day_str = date_formatter.format(temp_date, {"format": "additional", "type": "yMMMd"});
          var title_str = (status_file.hour<10?"0":"") + status_file.hour + "00h — " + day_str;
          count = number_formatter.format(status_file.tweet_count);
          var count_str = status_file.tweet_count > 1 ?
                            templates.plural_tweet_count.render({"count" : count}) :
                            templates.singular_tweet_count.render({"count" : count});
          var hour_index = {
                this_year: status_file.year,
                this_month: status_file.month,
		this_day: status_file.day,
		this_hour: status_file.hour,
                this_count: count,
                this_height: (status_file.tweet_count / hour_count_max.tweet_count) * 100,
                str_title: title_str,
		str_day: day_str,
                str_count: count_str,
                data_idx: i
              };

          status_file.title_str = title_str;

          if (status_file.day !== day_curr) {
            renderDay();

            $day_chart_clone = $day_chart.clone();
            hour_bar = [];

            $day_chart_clone.find('h3').text(hour_index.str_day);
            $('.content-nav').append($day_chart_clone);
            day_curr = hour_index.this_day;
          }
          hour_bar.push(templates.hour_bar.render(hour_index));
        }
        renderDay();

        $('.hours .with-tweets').tooltip().click(function() {
          self.displayTweets(Number($(this).attr('data-idx')));
        });
      },

      displayTweets: function (tweet_index_id) {

        Grailbird.current_index = tweet_index_id;

        var timeline_options = {border: false, showMedia: true, popupWebIntents: true};
        var number_formatter = new TwitterCldr.DecimalFormatter();

        if (this.status_index.length === 0) return;

        var prev_hour = 0,
            next_hour = 0,
            tweet_hour = this.status_index[tweet_index_id],
            tweet_array_name = tweet_hour['var_name'],
            hour_count = number_formatter.format(tweet_hour.tweet_count),
            title = templates.header_str.render({
              title_str: tweet_hour['title_str'],
              tweet_count: tweet_hour.tweet_count > 1 ?
                            templates.plural_tweet_count.render({"count" : hour_count}) :
                            templates.singular_tweet_count.render({"count" : hour_count}),
            }),
            showTweets = function() {
              var header_title = $('.tweets-header-title');
              header_title.fadeOut(100);
              $('.container .contents .tweets').fadeOut(100, function () {
                header_title.empty().html(title).attr('title', '');
                $(this).empty();
                $(window).scrollTop(0);

                twt.timeline(
                  Grailbird.data[tweet_array_name],
                  timeline_options
                ).renderTo('.tweets');
                header_title.fadeIn(100);
                $(this).fadeIn(100);
              });
            };

        if (tweet_hour.day === undefined) {
          timeline_options.showActions = false;
        } else {
          $('.hours .with-tweets, .histogram').removeClass('active');
          $('.hours .with-tweets[data-idx="'+tweet_index_id+'"]').addClass('active').parents('.histogram').addClass('active');
        }

        prev_hour = Number(tweet_index_id)+1;
        next_hour = Number(tweet_index_id)-1;
        if(tweet_index_id === 0) {
          next_hour = null;
          $('.tweets-header .nav-arrow-right').hide();
        }
        if (this.status_index.length-1 == tweet_index_id) {
          prev_hour = null;
          $('.tweets-header .nav-arrow-left').hide();
        }
        if(tweet_index_id < this.status_index.length-1) {
          $('.tweets-header .nav-arrow-left').attr({
            'data-idx': prev_hour,
            'data-original-title': this.status_index[prev_hour]['title_str']
          }).show();
        }

        if(tweet_index_id > 0) {
          $('.tweets-header .nav-arrow-right').attr({
            'data-idx': next_hour,
            'data-original-title': this.status_index[next_hour]['title_str']
          }).show();
        }

        if (!Grailbird.data[tweet_array_name]) {
          Grailbird.loadScript(tweet_hour, showTweets);
        } else {
          showTweets();
        }
      },
      pluralize: function (value) {
        return (Number(value) === 1) ? this.str_singular : this.str_plural;
      },
    };
  })(mixins);

  (function(exports) {
    var Tweets = function () {
      this.str_singular       = 'Tweet';
      this.str_plural         = 'Tweets';
      this.status_index       = tweet_index;
    };

    Tweets.prototype = Grailbird.extend({}, mixins.base);
    exports.tweets = function () {
      return new Tweets();
    };

  })(Grailbird);

  (function (exports){

    exports.localizeStrings = function() {
      $('html').attr('lang', 'en');
      document.title = "Timeline";
    }

  })(Grailbird);


  exports.createNavTab = function (title, sectionObj) {
    var selector = 'nav-'+title.toLowerCase();

    $('#primary-nav').append(
      templates.nav_tab.render({
        sectionClass: selector,
        sectionName: title
      })
    );

    var sectionTab = $('.'+selector);
    sectionTab.click(function(e) {
      $(this).addClass('active').siblings().removeClass('active');
      $('.row .contents, .sidebar').removeClass('container-messages');
      User.setState(sectionObj);
      sectionObj.init();
    });
    return sectionTab;
  };

  exports.loadScript = function (tweet_hour, callback) {
    var newScript = document.createElement('script'),
        loadCallback = function () {
          tweet_hour.loaded = true;
          callback && callback();
        };

    newScript.src = tweet_hour['file_name'];
    newScript.charset = 'utf-8';
    newScript.onreadystatechange = function() {
      if (this.readyState == 'complete' || this.readyState == 'loaded') {
        loadCallback();
      }
    };
    newScript.onload = loadCallback;
    document.getElementsByTagName('head')[0].appendChild(newScript);
  };

  exports.insertCommas = function InsertCommmas(num) {
    num = num.toString();
    return (num.length > 3) ? self.Grailbird.insertCommas(num.substr(0, num.length - 3)) + "," + num.substr(num.length - 3) : num ;
  };

})(Grailbird);

jQuery.fn.highlight = function (str, class_name) {
// change the mustache tag delimiters so that it will leave the runtime variables alone
//
  var regex = new RegExp(str, "gi"),
      search_highlight = Hogan.compile('<span class="{{class_name}}">{{{match}}}</span>');
//

  return this.each(function () {
    $(this).contents().filter(function() {
      return (this.nodeType == 3 && regex.test(this.nodeValue)) || ($(this).text().toLowerCase() === str.toLowerCase());
    }).replaceWith(function() {
      if(this.nodeValue === null) {
        return search_highlight.render({
          class_name: class_name,
          match: $(this).html()
        });
      } else {
        return (this.nodeValue || "").replace(regex, function(match) {
          return search_highlight.render({
            class_name: class_name,
            match: match
          });
        });
      }
    });
  });
};

$(document).ready(function(){
  Grailbird.init();
});

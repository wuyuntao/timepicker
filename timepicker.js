/*
 * Yet Another jQuery Timepicker Plugin
 * version 0.2
 *
 * Copyright (c) 2008 Wu Yuntao <http://luliban.com/blog/>
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://plugins.jquery.com/project/yatimepicker
 *
 */ 

(function($) {

var PROP_NAME = 'timepicker';

/* Scoreboard plugin.
 * Used as a single hour, minute and second picker in Timepicker
 */
$.fn.scoreboard = function(options) {
    if (!this.length) return this;

    var debug = false,
        increaseInterval = null,
        decreaseInterval = null,
        _frequency = 200,
        _mainWrapClass = 'scoreboard',
        _increaseButtonClass = 'increase-button',
        _decreaseButtonClass = 'decrease-button',
        _scoreWrapClass = 'score';

    options = $.extend({
        /* minimum value of score */
        min: 0,
        /* maximum value of score */
        max: 20,
        /* initial value of score */
        init: 10,
        /* if ``loop`` is true, value turns to its maxium when reaching its minimum,
         * and vice versa */
        loop: true,
        /* digit of score */
        digit: 2
    }, options || {});
    /* Verify options */
    if (options.min >= options.max) throw new Error("``max`` cannot less than ``min``");
    if (options.init < options.min || options.init > options.max) 
        throw new Error("``init`` cannot less than ``min`` or great than ``max``");
    var score = options.init;

    /* HTML Template */
    var _html = '<div class="' + _mainWrapClass + '"><div class="' + _increaseButtonClass
              + '"><span></span></div><div class="' + _scoreWrapClass + '"><span>'
              + padLeft(score) + '</span></div><div class="' + _decreaseButtonClass
              + '"><span></span></div></div>';
    this.html(_html);
    var _increaseButton = this.find('div.' + _increaseButtonClass + ' span');
    var _decreaseButton = this.find('div.' + _decreaseButtonClass + ' span');
    var _scoreWrap = this.find('div.' + _scoreWrapClass + ' span');

    /* When increase-button clicked, score increases. When button is continuously pressed,
     * score increases every 0.2 second. The same as decrease-button.
     */
    _increaseButton.click(function(e) {
        increase();
    }).mousedown(function(e) {
        if (!isRightClick(e)) increaseInterval = window.setInterval(increase, _frequency);
    }).mouseup(function(e) {
        if (!isRightClick(e)) window.clearInterval(increaseInterval);
    }).mouseout(function(e) {
        if (!isRightClick(e)) window.clearInterval(increaseInterval);
    });

    _decreaseButton.click(function(e) {
        decrease();
    }).mousedown(function(e) {
        if (!isRightClick(e)) decreaseInterval = window.setInterval(decrease, _frequency);
    }).mouseup(function(e) {
        if (!isRightClick(e)) window.clearInterval(decreaseInterval);
    }).mouseout(function(e) {
        if (!isRightClick(e)) window.clearInterval(decreaseInterval);
    });

    function isRightClick(e) {
        var rightclick;
	        if (!e) var e = window.event;
	        if (e.which) rightclick = (e.which == 3);
	        else if (e.button) rightclick = (e.button == 2);
        return rightclick;
    }

    function getScore() {
        return parseInt(_scoreWrap.html(), 10);
    }

    function increase() {
        score = getScore();
        score == options.max ? score = (options.loop ? options.min : score) : ++score;
        _scoreWrap.html(padLeft(score));
        return score;
    }

    function decrease() {
        score = getScore();
        score == options.min ? score = (options.loop ? options.max : score) : --score;
        _scoreWrap.html(padLeft(score));
        return score;
    }

    function padLeft(val) {
        if (val.toString().length >= options.digit) return String(val);
        return padLeft("0" + val);
    }

};

/* Timepicker plugin
 * Use timeboard to pick up any time.
 */
$.fn.timepicker = function(options) {
    if (!this.length) return this;

    var debug = false,
        _input = this,
        _timepicker = null,
        _timepickerPosition = null,
        _hourpicker = null,
        _minutepicker = null,
        _secondpicker = null,
        _hourScore = null,
        _minuteScore = null,
        _secondScore = null,
        _timepickerShowing = false,
        _mainClass = 'timepicker',
        _inputClass = 'timepicker-input',
        _mainWrap = 'time-picker-wrap',
        _timeboardWrapClass = 'time-board-wrap',
        _hourWrapClass = 'hour-picker-wrap',
        _minuteWrapClass = 'minute-picker-wrap',
        _secondWrapClass = 'second-picker-wrap',
        _suggestWrapClass = 'suggest-picker-wrap',
        _timeSuggestWrapClass = 'time-suggest-wrap',
        _buttonWrapClass = 'button-wrap',
        _clearWrapClass = 'clear-wrap',
		    _clearText = 'Clear', // Display text for clear link
        _closeWrapClass = 'close-wrap',
		    _closeText = 'Close', // Display text for close link
        _suggestTimeNames = {
            'Now':          null,    // Calculate when needed
            '6 a.m.':        [6, 0, 0],
            'Noon':          [12, 0, 0],
            '8 p.m.':        [20, 0, 0],
            'Midnight':      [0, 0, 0]
        };

    var _html = '<div id="' + _mainWrap + '" class="' + _mainClass
              + '" style="display:none;"><table><tbody><tr class="'
              + _timeboardWrapClass + '"><td class="' + _hourWrapClass
              + '"></td><td>:</td><td class="' + _minuteWrapClass
              + '"></td><td>:</td><td class="' + _secondWrapClass
              + '"></td></tr><tr class="' + _timeSuggestWrapClass
              + '"><td class="grey" colspan="5">Now</td></tr><tr class="' + _timeSuggestWrapClass
              + '"><td colspan="5">6 a.m.</td></tr><tr class="' + _timeSuggestWrapClass
              + '"><td class="grey" colspan="5">Noon</td></tr><tr class="' + _timeSuggestWrapClass
              + '"><td colspan="5">8 p.m.</td></tr><tr class="' + _timeSuggestWrapClass
              + '"><td class="grey" colspan="5">Midnight</td></tr><tr class="' + _buttonWrapClass
              + '"><td class="' + _clearWrapClass + '" colspan="2"><span>' + _clearText
              + '</span></td><td></td><td class="' + _closeWrapClass
              + '" colspan="2"><span>' + _closeText
              + '</span></td></tr></tbody></table></div>';

    /* Default options
    */ 
    options = $.extend({
        showAnim: 'show',   // name of jQuery animation for popup
        duration: 'normal',  // Duration of display/closure
        defaultTime: '00:00:00'  // Used when field is blank: 00:00:00 
    }, options || {});

    // Convert date object into time string 
    if (typeof options.defaultTime == 'object') 
        options.defaultTime = options.defaultTime.toTimeString().split(' ')[0];
    this.focus(showTimepicker).click(showTimepicker).keydown(doKeyDown);
    $(document.body).mousedown(checkExternalClick);

    function initialTimepicker() {
        _input.after(_html);
        _input.addClass(_inputClass);
        _timepicker = $('#' + _mainWrap);
        _hourpicker = _timepicker.find('td.' + _hourWrapClass),
        _minutepicker = _timepicker.find('td.' + _minuteWrapClass),
        _secondpicker = _timepicker.find('td.' + _secondWrapClass);
        _hourpicker.scoreboard({ 'min': 0, 'max': 23, 'init': 0, 'digit': 2 });
        _minutepicker.scoreboard({ 'min': 0, 'max': 59, 'init': 0, 'digit': 2 });
        _secondpicker.scoreboard({ 'min': 0, 'max': 59, 'init': 0, 'digit': 2 });
        _hourScore = _hourpicker.find('.score span');
        _minuteScore = _minutepicker.find('.score span');
        _secondScore = _secondpicker.find('.score span');

        _timepicker.find('td.' + _clearWrapClass).click(doClear);
        _timepicker.find('td.' + _closeWrapClass).click(doClose);
        _timepicker.find('tr.' + _timeSuggestWrapClass + ' td').click(doTimeSuggest);

        if (options.defaultTime) {
            var time = options.defaultTime.split(':');
            setTime(time[0], time[1], time[2]);
        }
    }

    function showTimepicker() {
        if (_timepicker == null) initialTimepicker();
        if (!_timepickerShowing) {
            var current = _input.val();
            if (current.match(/^[0-9]{1,2}:[0-9]{1,2}(:[0-9]{1,2})?$/)) {
                current = current.split(':');
                setTime(current[0], current[1], current[2]);
            }
            setPosition(this);
            switch (options.showAnim) {
                case 'show': _timepicker.show(options.duration);
                             break;
                case 'fade': _timepicker.fadeIn(options.duration);
                             break;
                case 'slide': _timepicker.slideDown(options.duration);
                              break;
            }
            _timepickerShowing = true;
            return;
        }
    }

    function hideTimepicker() {
        if (_timepickerShowing) {
            switch (options.showAnim) {
                case 'show': _timepicker.hide(options.duration);
                             break;
                case 'fade': _timepicker.fadeOut(options.duration);
                             break;
                case 'slide': _timepicker.slideUp(options.duration);
                              break;
            }
            _timepickerShowing = false;
            return;
        }
    }

    function toggleTimepicker() {
        if (_timepickerShowing) hideTimepicker();
        else showTimepicker();
    }

    // Set position of timepicker
    function setPosition(input) {
        var _inputPosition = $(input).offset();
        _timepickerPosition = [_inputPosition.left, _inputPosition.top + input.offsetHeight];
        if ($.browser.opera) { // correction for Opera when scrolled
			_timepickerPosition[0] -= document.documentElement.scrollLeft;
	    		_timepickerPosition[1] -= document.documentElement.scrollTop;
        }
        _timepicker.css({ 'left': _timepickerPosition[0] + 'px',
                          'top': _timepickerPosition[1] + 'px' });
    }

    function doKeyDown(e) {
        var handled = true;
        if (_timepickerShowing) {
            switch (e.keyCode) {
                // Tab key
                case 9: getTime();
                        hideTimepicker();
                        break;
                // ESC key
                case 27: hideTimepicker();
                         break;
            }
        } else {
            handled = false;
        }
		    if (handled) {
			    e.preventDefault();
			e.stopPropagation();
	    	}
    }

    function doTimeSuggest(e) {
        var suggest = $(this).html();
        if (suggest == 'Now') {
            // If suggests "Now", calculate time immediately
            var now = new Date();
            _suggestTimeNames[suggest] = [now.getHours(), now.getMinutes(), now.getSeconds()];
        }
        var time = _suggestTimeNames[suggest];
        setTime(time[0], time[1], time[2]);
        return time;
    }

    function doClear() {
        // Clear time in the ``_input``
        _input.val("");
        hideTimepicker();
        return;
    }

    function doClose() {
        // Get time on board and insert the time into ``_input``
        getTime();
        hideTimepicker();
        return;
    }

    function getTime() {
        // Get time on board
        var time = _hourScore.html() + ':' + _minuteScore.html() + ':' + _secondScore.html();
        _input.val(time);
        return time;
    }

    function setTime(hour, minute, second) {
        // Set time on board
        if (typeof hour == 'undefined') hour = 0;
        if (typeof minute == 'undefined') minute = 0;
        if (typeof second == 'undefined') second = 0;
        _hourScore.html(padLeft(hour));
        _minuteScore.html(padLeft(minute));
        _secondScore.html(padLeft(second));
        return getTime();
    }

    function padLeft(val) {
        if (val.toString().length >= 2) return String(val);
        return padLeft("0" + val);
    }

    function checkExternalClick(e) {
        if (!_timepickerShowing) return;
        var target = $(e.target);
        if ((target.parents('#' + _mainWrap).length == 0) &&
            !target.hasClass(_inputClass) &&
            !target.hasClass(_mainClass))
            hideTimepicker();
    }

};

})(jQuery);

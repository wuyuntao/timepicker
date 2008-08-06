/*
 * jQuery Timepicker Plugin
 * version 0.2
 *
 * Copyright (c) 2008 Wu Yuntao <http://luliban.com/blog/>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */ 

(function($) {

    /* Scoreboard plugin.
     * Used as a single hour, minute and second picker in Timepicker
     */
    $.fn.scoreboard = function(options) {
        if (!this.length) return this;

        var debug = false,
            increaseInterval = null,
            decreaseInterval = null,
            _frequency = 200,
            _mainWrapperClass = 'scoreboard',
            _increaseButtonClass = 'increase-button',
            _decreaseButtonClass = 'decrease-button',
            _scoreWrapperClass = 'score';

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
        var _html = '<div class="' + _mainWrapperClass + '"><div class="' + _increaseButtonClass
                  + '"><span></span></div><div class="' + _scoreWrapperClass + '"><span>'
                  + padLeft(score) + '</span></div><div class="' + _decreaseButtonClass
                  + '"><span></span></div></div>';
        this.html(_html);
        var _increaseButton = this.find('div.' + _increaseButtonClass + ' span');
        var _decreaseButton = this.find('div.' + _decreaseButtonClass + ' span');
        var _scoreWrapper = this.find('div.' + _scoreWrapperClass + ' span');

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
            return parseInt(_scoreWrapper.html(), 10);
        }

        function increase() {
            score = getScore();
            score == options.max ? score = (options.loop ? options.min : score) : ++score;
            _scoreWrapper.html(padLeft(score));
            return score;
        }

        function decrease() {
            score = getScore();
            score == options.min ? score = (options.loop ? options.max : score) : --score;
            _scoreWrapper.html(padLeft(score));
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
            _mainWrapper = 'time-picker-wrap',
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

        var _html = '<div id="' + _mainWrapper + '" class="hidden"><table><tbody><tr class="'
                  + _timeboardWrapClass + '"><td class="' + _hourWrapClass
                  + '"></td><td>:</td><td class="' + _minuteWrapClass
                  + '"></td><td>:</td><td class="' + _secondWrapClass
                  + '"></td></tr><tr class="' + _timeSuggestWrapClass
                  + '"><td colspan="5">Now</td></tr><tr class="' + _timeSuggestWrapClass
                  + '"><td colspan="5">6 a.m.</td></tr><tr class="' + _timeSuggestWrapClass
                  + '"><td colspan="5">Noon</td></tr><tr class="' + _timeSuggestWrapClass
                  + '"><td colspan="5">8 p.m.</td></tr><tr class="' + _timeSuggestWrapClass
                  + '"><td colspan="5">Midnight</td></tr><tr class="' + _buttonWrapClass
                  + '"><td class="' + _clearWrapClass + '" colspan="2"><span>' + _clearText
                  + '</span></td><td></td><td class="' + _closeWrapClass
                  + '" colspan="2"><span>' + _closeText
                  + '</span></td></tr></tbody></table></div>';

        /* Default options
        options = $.extend({ }, options || {});
        */ 

        this.focus(showTimepicker).click(showTimepicker).keydown(doKeyDown);

        function initialTimepicker() {
            _input.after(_html);
            _timepicker = $('#' + _mainWrapper);
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
        }

        function showTimepicker() {
            if (!_timepickerShowing) {
                var current = _input.val();
                if (current.match(/^[0-9]{1,2}:[0-9]{1,2}(:[0-9]{1,2})?$/)) {
                    current = current.split(':');
                    setTime(current[0], current[1], current[2]);
                }
                if (!_timepicker) initialTimepicker();
                _timepicker.removeClass('hidden');
                setPosition(this);
                _timepickerShowing = true;
            }
        }

        function hideTimepicker() {
            if (_timepickerShowing) {
                _timepicker.addClass('hidden');
                _input.focus();
                _timepickerShowing = false;
            }
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
        }

        function doClose() {
            // Get time on board and insert the time into ``_input``
            getTime();
            hideTimepicker();
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

    };

 })(jQuery);

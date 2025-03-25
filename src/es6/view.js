let Template = require("./template");
let Helper = require("./helper");
let Mustache = require("mustache");

/**
 * As its name suggests, all rendering works do in this object
 */
class View {
  /**
   *
   * @param {Datepicker} model
   * @return {View}
   */
  constructor(model) {
    /**
     * @type {number}
     */
    this.yearsViewCount = 12;

    /**
     *
     * @type {Datepicker}
     */
    this.model = model;

    /**
     *
     * @type {null}
     */
    this.rendered = null;

    /**
     *
     * @type {null}
     */
    this.$container = null;

    /**
     *
     * @type {string}
     */
    this.id = `persianDateInstance-${parseInt(Math.random(100) * 1000)}`;
    let that = this;

    if (this.model.state.ui.isInline) {
      this.$container = $(
        '<div  id="' + this.id + '" class="datepicker-container-inline"></div>',
      ).appendTo(that.model.inputElement);
    } else {
      this.$container = $(
        '<div  id="' + this.id + '" class="datepicker-container"></div>',
      ).appendTo("body");
      this.hide();
      this.setPickerBoxPosition();
      this.addCompatibilityClass();
    }
    return this;
  }

  /**
   * @desc add css class to handle compatibility ui things
   */
  addCompatibilityClass() {
    if (Helper.isMobile && this.model.options.responsive) {
      this.$container.addClass("pwt-mobile-view");
    }
  }

  /**
   * @desc remove datepicker container element from dom
   */
  destroy() {
    this.$container.remove();
  }

  /**
   * @desc set datepicker container element based on <input/> element position
   */
  setPickerBoxPosition() {
    let inputPosition = this.model.input.getInputPosition(),
      inputSize = this.model.input.getInputSize();

    if (Helper.isMobile && this.model.options.responsive) {
      return false;
    }

    if (this.model.options.position === "auto") {
      this.$container.css({
        left: inputPosition.left + "px",
        top: inputSize.height + inputPosition.top + "px",
      });
    } else {
      this.$container.css({
        left: this.model.options.position[1] + inputPosition.left + "px",
        top: this.model.options.position[0] + inputPosition.top + "px",
      });
    }
  }

  /**
   * @desc show datepicker container element
   */
  show() {
    this.$container.removeClass("pwt-hide");
    this.setPickerBoxPosition();
  }

  /**
   * @desc hide datepicker container element
   */
  hide() {
    this.$container.addClass("pwt-hide");
  }

  /**
   * @desc toggle datepicker container element
   */
  toggle() {
    this.$container.toggleClass("pwt-hide");
  }

  /**
   * @desc return navigator switch text
   * @param {String} data -  accept day, month, year
   * @private
   * @return {String}
   */
  _getNavSwitchText(data) {
    let output;
    if (this.model.state.viewMode == "day") {
      output = this.model.options.dayPicker.titleFormatter.call(
        this,
        data.year,
        data.month,
      );
    } else if (this.model.state.viewMode == "month") {
      output = this.model.options.monthPicker.titleFormatter.call(
        this,
        data.dateObject.valueOf(),
      );
    } else if (this.model.state.viewMode == "year") {
      output = this.model.options.yearPicker.titleFormatter.call(
        this,
        data.year,
      );
    }
    return output;
  }

  /**
   * @desc check year is accessible
   * @param {Number} year - year number
   * @return {Boolean}
   */
  checkYearAccess(year) {
    let output = true;
    if (this.model.state.filetredDate) {
      let startYear = this.model.state.filterDate.start.year,
        endYear = this.model.state.filterDate.end.year;
      if (startYear && year < startYear) {
        return false;
      } else if (endYear && year > endYear) {
        return false;
      }
    }
    if (output) {
      return this.model.options.checkYear(year);
    }
  }

  /**
   * @private
   * @param viewState
   * @return {{enabled: boolean, viewMode: boolean, list: Array}}
   */
  _getYearViewModel(viewState) {
    let isEnabled = this.model.options.yearPicker.enabled;
    // Make performance better
    if (!isEnabled) {
      return {
        enabled: false,
      };
    }
    /**
     * @description Generate years list based on viewState year
     * @return ['1380',n+12,'1392']
     */
    let list = [...Array(this.yearsViewCount).keys()].map(
      (value) =>
        value +
        parseInt(viewState.year / this.yearsViewCount) * this.yearsViewCount,
    );
    /*
     * @description Generate years object based on list
     */
    let yearsModel = [],
      yearStr = this.model.PersianDate.date();
    for (let i of list) {
      yearStr.year([i]);
      yearsModel.push({
        title: yearStr.format("YYYY"),
        enabled: this.checkYearAccess(i),
        dataYear: i,
        selected: this.model.state.selected.year == i,
      });
    }
    return {
      enabled: isEnabled,
      viewMode: this.model.state.viewMode == "year",
      list: yearsModel,
    };
  }

  /**
   * @desc check month is accessible
   * @param {Number} month - month number
   * @return {Boolean}
   */
  checkMonthAccess(month) {
    month = month + 1;
    let output = true,
      y = this.model.state.view.year;
    if (this.model.state.filetredDate) {
      let startMonth = this.model.state.filterDate.start.month,
        endMonth = this.model.state.filterDate.end.month,
        startYear = this.model.state.filterDate.start.year,
        endYear = this.model.state.filterDate.end.year;
      if (
        (startMonth &&
          endMonth &&
          ((y == endYear && month > endMonth) || y > endYear)) ||
        (y == startYear && month < startMonth) ||
        y < startYear
      ) {
        return false;
      } else if (
        endMonth &&
        ((y == endYear && month > endMonth) || y > endYear)
      ) {
        return false;
      } else if (
        startMonth &&
        ((y == startYear && month < startMonth) || y < startYear)
      ) {
        return false;
      }
    }
    if (output) {
      return this.model.options.checkMonth(month, y);
    }
  }

  /**
   * @private
   * @return {{enabled: boolean, viewMode: boolean, list: Array}}
   */
  _getMonthViewModel() {
    let isEnaled = this.model.options.monthPicker.enabled;
    // Make performance better
    if (!isEnaled) {
      return {
        enabled: false,
      };
    }

    let monthModel = [],
      that = this;
    for (let [index, month] of that.model.PersianDate.date()
      .rangeName()
      .months.entries()) {
      monthModel.push({
        title: month,
        enabled: this.checkMonthAccess(index),
        year: this.model.state.view.year,
        dataMonth: index + 1,
        selected:
          this.model.state.selected.year == this.model.state.view.year &&
          this.model.state.selected.month == index + 1,
      });
    }
    return {
      enabled: isEnaled,
      viewMode: this.model.state.viewMode == "month",
      list: monthModel,
    };
  }

  /**
   * @desc check day is accessible
   * @param {Number} thisUnix - month number
   * @return {Boolean}
   */
  checkDayAccess(unixtimespan) {
    let self = this,
      output = true;
    self.minDate = this.model.options.minDate;
    self.maxDate = this.model.options.maxDate;

    // بررسی محدودیت روزهای هفته
    if (
      this.model.options.disabledWeekdays &&
      this.model.options.disabledWeekdays.enabled
    ) {
      let dayOfWeek = new persianDate(unixtimespan).day();
      if (this.model.options.disabledWeekdays.list.includes(dayOfWeek)) {
        return false;
      }
    }

    // بررسی تاریخ‌های خاص غیرفعال
    if (
      this.model.options.disabledDates &&
      this.model.options.disabledDates.enabled
    ) {
      let pd = new persianDate(unixtimespan);
      let checkDate = [pd.year(), pd.month(), pd.date()];

      // بررسی لیست تاریخ‌های غیرفعال
      for (let date of this.model.options.disabledDates.list) {
        if (Array.isArray(date)) {
          // اگر تاریخ به صورت آرایه [سال، ماه، روز] باشد
          if (
            date[0] === checkDate[0] &&
            date[1] === checkDate[1] &&
            date[2] === checkDate[2]
          ) {
            return false;
          }
        } else if (typeof date === "number") {
          // اگر تاریخ به صورت unix timestamp باشد
          if (Math.abs(date - unixtimespan) < 86400000) {
            // تفاوت کمتر از یک روز
            return false;
          }
        }
      }
      // بررسی تابع سفارشی
      if (typeof this.model.options.disabledDates.customCheck === "function") {
        if (
          this.model.options.disabledDates.customCheck(unixtimespan, checkDate)
        ) {
          return false;
        }
      }
    }

    if (self.model.state.filetredDate) {
      if (self.minDate && self.maxDate) {
        self.minDate = self.model.PersianDate.date(self.minDate)
          .startOf("day")
          .valueOf();
        self.maxDate = self.model.PersianDate.date(self.maxDate)
          .endOf("day")
          .valueOf();
        if (!(unixtimespan >= self.minDate && unixtimespan <= self.maxDate)) {
          return false;
        }
      } else if (self.minDate) {
        self.minDate = self.model.PersianDate.date(self.minDate)
          .startOf("day")
          .valueOf();
        if (unixtimespan <= self.minDate) {
          return false;
        }
      } else if (self.maxDate) {
        self.maxDate = self.model.PersianDate.date(self.maxDate)
          .endOf("day")
          .valueOf();
        if (unixtimespan >= self.maxDate) {
          return false;
        }
      }
    }
    if (output) {
      return self.model.options.checkDate(unixtimespan);
    }
  }

  _getEventsForDate(dateArray) {
    if (
      !this.model.options.events ||
      !this.model.options.events.enabled ||
      !this.model.options.events.list.length
    ) {
      return [];
    }

    return this.model.options.events.list.filter((event) => {
      if (Array.isArray(event.date)) {
        return (
          event.date[0] === dateArray[0] &&
          event.date[1] === dateArray[1] &&
          event.date[2] === dateArray[2]
        );
      } else if (typeof event.date === "number") {
        let eventDate = new persianDate(event.date);
        return (
          eventDate.year() === dateArray[0] &&
          eventDate.month() === dateArray[1] &&
          eventDate.date() === dateArray[2]
        );
      }
      return false;
    });
  }

  /**
   * @private
   * @return {object}
   */
  _getDayViewModel() {
    if (this.model.state.viewMode != "day") {
      return [];
    }

    let isEnabled = this.model.options.dayPicker.enabled;
    // Make performance better
    if (!isEnabled) {
      return {
        enabled: false,
      };
    }

    //log('if you see this many time your code has performance issue');
    const viewMonth = this.model.state.view.month,
      viewYear = this.model.state.view.year;
    let pdateInstance = this.model.PersianDate.date(),
      daysCount = pdateInstance.daysInMonth(viewYear, viewMonth),
      firstWeekDayOfMonth =
        pdateInstance.getFirstWeekDayOfMonth(viewYear, viewMonth) - 1,
      outputList = [],
      daysListindex = 0,
      nextMonthListIndex = 0;
    // daysMatrix = [
    //     ['null', 'null', 'null', 'null', 'null', 'null', 'null'],
    //     ['null', 'null', 'null', 'null', 'null', 'null', 'null'],
    //     ['null', 'null', 'null', 'null', 'null', 'null', 'null'],
    //     ['null', 'null', 'null', 'null', 'null', 'null', 'null'],
    //     ['null', 'null', 'null', 'null', 'null', 'null', 'null'],
    //     ['null', 'null', 'null', 'null', 'null', 'null', 'null']
    // ];

    const weeksCount =
      this.model.options.displayWeeks && this.model.options.displayWeeks.count
        ? this.model.options.displayWeeks.count
        : 6;

    // ایجاد ماتریس روزهای تقویم با تعداد هفته‌های مشخص شده
    let daysMatrix = Array(weeksCount)
      .fill()
      .map(() => Array(7).fill("null"));

    const anotherCalendar = this._getAnotherCalendar();
    for (let [rowIndex, daysRow] of daysMatrix.entries()) {
      outputList[rowIndex] = [];
      for (let [dayIndex] of daysRow.entries()) {
        let calcedDate, otherMonth;

        // Set hour 12 prevent issues with DST times
        if (rowIndex === 0 && dayIndex < firstWeekDayOfMonth) {
          calcedDate = this.model.state.view.dateObject
            .startOf("month")
            .hour(12)
            .subtract("days", firstWeekDayOfMonth - dayIndex);
          otherMonth = true;
        } else if (
          (rowIndex === 0 && dayIndex >= firstWeekDayOfMonth) ||
          (rowIndex <= 5 && daysListindex < daysCount)
        ) {
          daysListindex += 1;
          calcedDate = new persianDate([
            this.model.state.view.year,
            this.model.state.view.month,
            daysListindex,
          ]);
          otherMonth = false;
        } else {
          nextMonthListIndex += 1;
          calcedDate = this.model.state.view.dateObject
            .endOf("month")
            .hour(12)
            .add("days", nextMonthListIndex);
          otherMonth = true;
        }

        let dateArray = [
          calcedDate.year(),
          calcedDate.month(),
          calcedDate.date(),
        ];
        let events = this._getEventsForDate(dateArray);

        let dayObject = {
          title: calcedDate.format("D"),
          alterCalTitle: new persianDate(calcedDate.valueOf())
            .toCalendar(anotherCalendar[0])
            .toLocale(anotherCalendar[1])
            .format("D"),
          dataDate: dateArray.join(","),
          dataUnix: calcedDate.hour(12).valueOf(),
          otherMonth: otherMonth,
          enabled: this.checkDayAccess(calcedDate.valueOf()),
        };

        if (events && events.length > 0) {
          dayObject.events = events;
          console.log("events in _getDayViewModel", events);
          // dayObject.events = JSON.stringify(events);
          dayObject.hasEvent = events.length > 0;

          dayObject.hasEvent = true;

          // Add className for styling
          if (events[0].className) {
            dayObject.className = events[0].className;
          }
        }
        // // اضافه کردن اطلاعات رویدادها
        // if (events && events.length > 0) {
        //     dayObject.events = events;
        //     dayObject.hasEvent = true;

        //     // اضافه کردن کلاس‌های CSS برای روزهای خاص
        //     if (events[0].className) {
        //         dayObject.className = events[0].className;
        //     }
        // }
        outputList[rowIndex].push(dayObject);
        // outputList[rowIndex].push({
        //     title: calcedDate.format('D'),
        //     alterCalTitle: new persianDate(calcedDate.valueOf()).toCalendar(anotherCalendar[0]).toLocale(anotherCalendar[1]).format('D'),
        //     // dataDate: [calcedDate.year(), calcedDate.month(), calcedDate.date()].join(','),
        //     dataDate: dateArray.join(','),
        //     dataUnix: calcedDate.hour(12).valueOf(),
        //     otherMonth: otherMonth,
        //     // TODO: make configurable
        //     enabled: this.checkDayAccess(calcedDate.valueOf()),
        //     events: events,
        //     hasEvent: events.length > 0,
        //     className: events.length > 0 ? events.map(e => e.className || '').join(' ') : '',
        //     color: events.length > 0 ? (events[0].color || '') : ''
        //
        // });
      }
    }
    return {
      enabled: isEnabled,
      viewMode: this.model.state.viewMode == "day",
      list: outputList,
    };
  }

  markSelectedDay() {
    const selected = this.model.state.selected;
    const selectedDateString = [
      selected.year,
      selected.month,
      selected.date,
    ].join(",");

    this.$container.find(".table-days td").each(function () {
      const $this = $(this);
      if ($this.data("date") == selectedDateString) {
        $this.addClass("selected");
      } else {
        $this.removeClass("selected");
      }
    });
    if (
      this.model.options.events &&
      this.model.options.events.enabled &&
      this.model.options.events.showTooltip
    ) {
      this._initEventTooltips();
    }
  }

  markToday() {
    const today = new persianDate();
    this.$container.find(".table-days td").each(function () {
      if (
        $(this).data("date") ==
        [today.year(), today.month(), today.date()].join(",")
      ) {
        $(this).addClass("today");
      } else {
        $(this).removeClass("today");
      }
    });
  }

  /**
   * @private
   * @return {{enabled: boolean, hour: {title, enabled: boolean}, minute: {title, enabled: boolean}, second: {title, enabled: boolean}, meridian: {title: (meridian|{title, enabled}|ClassDatepicker.ClassConfig.timePicker.meridian|{enabled}|string|string), enabled: boolean}}}
   */
  _getTimeViewModel() {
    let isEnabled = this.model.options.timePicker.enabled;
    // Make performance better
    if (!isEnabled) {
      return {
        enabled: false,
      };
    }

    let hourTitle;
    if (this.model.options.timePicker.meridian.enabled) {
      hourTitle = this.model.state.view.dateObject.format("hh");
    } else {
      hourTitle = this.model.state.view.dateObject.format("HH");
    }

    return {
      enabled: isEnabled,
      hour: {
        title: hourTitle,
        enabled: this.model.options.timePicker.hour.enabled,
      },
      minute: {
        title: this.model.state.view.dateObject.format("mm"),
        enabled: this.model.options.timePicker.minute.enabled,
      },
      second: {
        title: this.model.state.view.dateObject.format("ss"),
        enabled: this.model.options.timePicker.second.enabled,
      },
      meridian: {
        title: this.model.state.view.dateObject.format("a"),
        enabled: this.model.options.timePicker.meridian.enabled,
      },
    };
  }

  /**
   *
   * @return {{enabled: boolean, list: (*|Array)}}
   * @private
   */
  _getWeekViewModel() {
    return {
      enabled: true,
      list: this.model.PersianDate.date().rangeName().weekdaysMin,
    };
  }

  /**
   *
   * @return {string}
   */
  getCssClass() {
    return [
      this.model.state.ui.isInline ? "datepicker-plot-area-inline-view" : "",
      !this.model.options.timePicker.meridian.enabled
        ? "datepicker-state-no-meridian"
        : "",
      this.model.options.onlyTimePicker ? "datepicker-state-only-time" : "",
      !this.model.options.timePicker.second.enabled
        ? "datepicker-state-no-second"
        : "",
      this.model.options.calendar_ == "gregorian"
        ? "datepicker-gregorian"
        : "datepicker-persian",
    ].join(" ");
  }

  /**
   * @param data
   * @return {*}
   */
  getViewModel(data) {
    const anotherCalendar = this._getAnotherCalendar();
    return {
      plotId: "",
      navigator: {
        enabled: this.model.options.navigator.enabled,
        switch: {
          enabled: true,
          text: this._getNavSwitchText(data),
        },
        text: this.model.options.navigator.text,
      },
      selected: this.model.state.selected,
      time: this._getTimeViewModel(data),
      days: this._getDayViewModel(data),
      weekdays: this._getWeekViewModel(data),
      month: this._getMonthViewModel(data),
      year: this._getYearViewModel(data),
      toolbox: this.model.options.toolbox,
      cssClass: this.getCssClass(),
      onlyTimePicker: this.model.options.onlyTimePicker,
      altCalendarShowHint:
        this.model.options.calendar[anotherCalendar[0]].showHint,
      calendarSwitchText: this.model.state.view.dateObject
        .toCalendar(anotherCalendar[0])
        .toLocale(anotherCalendar[1])
        .format(this.model.options.toolbox.calendarSwitch.format),
      todayButtonText: this._getButtonText().todayButtontext,
      submitButtonText: this._getButtonText().submitButtonText,
    };
  }

  _getButtonText() {
    let output = {};
    if (this.model.options.locale_ == "fa") {
      output.todayButtontext = this.model.options.toolbox.todayButton.text.fa;
      output.submitButtonText = this.model.options.toolbox.submitButton.text.fa;
    } else if (this.model.options.locale_ == "en") {
      output.todayButtontext = this.model.options.toolbox.todayButton.text.en;
      output.submitButtonText = this.model.options.toolbox.submitButton.text.en;
    }
    return output;
  }

  _getAnotherCalendar() {
    let that = this,
      cal,
      loc;
    if (that.model.options.calendar_ == "persian") {
      cal = "gregorian";
      loc = that.model.options.calendar.gregorian.locale;
    } else {
      cal = "persian";
      loc = that.model.options.calendar.persian.locale;
    }
    return [cal, loc];
  }

  _initEventTooltips() {
    if (
      !this.model.options.events ||
      !this.model.options.events.enabled ||
      !this.model.options.events.showTooltip
    ) {
      return;
    }

    // Check if we have a custom tooltip handler
    if (typeof this.model.options.events.tooltipHandler === "function") {
      this.model.options.events.tooltipHandler(this.$container);
      return;
    }

    const self = this;

    // Try to use tippy.js if available
    if (typeof window.tippy !== "undefined") {
      this._initTippyTooltips();
    } else {
      // Fallback to simple tooltip
      this._initSimpleTooltip();
    }
  }

  _initTippyTooltips() {
    const self = this;

    // Use event delegation for better performance
    this.$container.on(
      "mouseenter",
      '.table-days td[data-event="true"]',
      function () {
        const $td = $(this);
        const events = $td.data("events");

        if (!events || !events.length) return;

        // Create or show tooltip
        let $tooltip = $(".event-tooltip");
        if ($tooltip.length === 0) {
          $tooltip = $('<div class="event-tooltip"></div>').appendTo("body");
        }

        // Build tooltip content
        let content = '<div class="event-tooltip-content">';
        events.forEach((event) => {
          content += `
                <div class="event-item" style="color: ${event.color || "inherit"}">
                    <strong>${event.title || "Event"}</strong>
                    ${event.description ? `<p>${event.description}</p>` : ""}
                </div>
            `;
        });
        content += "</div>";

        // Position and show tooltip
        $tooltip
          .html(content)
          .css({
            top: $td.offset().top - $tooltip.outerHeight() - 10,
            left:
              $td.offset().left +
              $td.outerWidth() / 2 -
              $tooltip.outerWidth() / 2,
          })
          .show();
      },
    );

    this.$container.on(
      "mouseleave",
      '.table-days td[data-event="true"]',
      function () {
        $(".event-tooltip").hide();
      },
    );
    // this.$container.find('.table-days td[data-event="true"]').each(function () {
    //   const $td = $(this);
    //   const eventsData = $td.data("events");
    //
    //   if (!eventsData || !Array.isArray(eventsData) || !eventsData.length) {
    //     return;
    //   }
    //
    //   try {
    //     tippy(this, {
    //       content: self._createTooltipContent(eventsData),
    //       allowHTML: true,
    //       theme: "calendar-events",
    //       placement: "top",
    //       animation: "scale",
    //       duration: [200, 150],
    //     });
    //   } catch (error) {
    //     console.warn("Error initializing tippy:", error);
    //     // Fallback to simple tooltip
    //     self._initSimpleTooltip();
    //   }
    // });
  }

  _createTooltipContent(events) {
    if (!events || !events.length) return "";

    let html = '<div class="event-tooltip-container">';
    events.forEach((event) => {
      html += `<div class="event-tooltip-item">
                <div class="event-tooltip-title">${event.title || "Event"}</div>
                ${event.description ? `<div class="event-tooltip-desc">${event.description}</div>` : ""}
            </div>`;
    });
    html += "</div>";

    return html;
  }

  // یک راه‌حل ساده بدون کتابخانه خارجی
  _initSimpleTooltip() {
    const $container = this.$container;

    // Add tooltip style if needed
    if ($("#simple-tooltip-style").length === 0) {
      $("head").append(`
                <style id="simple-tooltip-style">
                    .simple-tooltip {
                        position: absolute;
                        display: none;
                        background-color: #333;
                        color: white;
                        padding: 10px;
                        border-radius: 4px;
                        z-index: 10000;
                        max-width: 200px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                    }
                    [data-theme="dark"] .simple-tooltip {
                        background-color: #424242;
                    }
                    .simple-tooltip .event-tooltip-item {
                        padding: 5px 0;
                        border-bottom: 1px solid rgba(255,255,255,0.1);
                    }
                    .simple-tooltip .event-tooltip-item:last-child {
                        border-bottom: none;
                    }
                    .simple-tooltip .event-tooltip-title {
                        font-weight: bold;
                        margin-bottom: 3px;
                    }
                    .simple-tooltip .event-tooltip-desc {
                        font-size: 12px;
                        opacity: 0.8;
                    }
                </style>
            `);
    }

    // Create tooltip element if it doesn't exist
    if ($container.find(".simple-tooltip").length === 0) {
      $container.append('<div class="simple-tooltip"></div>');
    }

    const $tooltip = $container.find(".simple-tooltip");

    // Remove any previous event handlers
    $container
      .find('.table-days td[data-event="true"]')
      .off("mouseenter mouseleave");

    // Add event handlers to show/hide tooltip
    $container.find('.table-days td[data-event="true"]').each(function () {
      const $td = $(this);
      let events;

      try {
        events = $td.data("events");
        if (typeof events === "string") {
          events = JSON.parse(events);
        }
      } catch (e) {
        events = [];
        console.warn("Error parsing events data", e);
      }

      if (!events || !events.length) {
        return;
      }

      $td.on("mouseenter", function (e) {
        let html = '<div class="event-tooltip-container">';
        events.forEach((event) => {
          html += `<div class="event-tooltip-item">
                        <div class="event-tooltip-title">${event.title || "Event"}</div>
                        ${event.description ? `<div class="event-tooltip-desc">${event.description}</div>` : ""}
                    </div>`;
        });
        html += "</div>";

        $tooltip.html(html).css({
          display: "block",
          top: $td.offset().top - $tooltip.outerHeight() - 10,
          left:
            $td.offset().left +
            $td.outerWidth() / 2 -
            $tooltip.outerWidth() / 2,
        });

        // Adjust position if tooltip is out of viewport
        const tooltipRect = $tooltip[0].getBoundingClientRect();
        if (tooltipRect.left < 0) {
          $tooltip.css("left", "0px");
        } else if (tooltipRect.right > window.innerWidth) {
          $tooltip.css("left", window.innerWidth - tooltipRect.width + "px");
        }
      });

      $td.on("mouseleave", function () {
        $tooltip.hide();
      });
    });
  }
  /**
   * @desc render times area, prevent performance issue with scroll and time section
   */
  renderTimePartial() {
    const timeViewModel = this._getTimeViewModel(this.model.state.view);
    this.$container
      .find('[data-time-key="hour"] input')
      .val(timeViewModel.hour.title);
    this.$container
      .find('[data-time-key="minute"] input')
      .val(timeViewModel.minute.title);
    this.$container
      .find('[data-time-key="second"] input')
      .val(timeViewModel.second.title);
    this.$container
      .find('[data-time-key="meridian"] input')
      .val(timeViewModel.meridian.title);
  }

  /**
   * @render datepicker view element
   * @param data
   */
  render(data) {
    if (!data) {
      data = this.model.state.view;
    }
    Helper.debug(this, "render");
    Mustache.parse(Template);
    this.rendered = $(
      Mustache.render(this.model.options.template, this.getViewModel(data)),
    );
    this.$container.empty().append(this.rendered);
    this.markSelectedDay();
    this.markToday();
    this.afterRender();
  }

  reRender() {
    let data = this.model.state.view;
    this.render(data);
  }

  /**
   * @desc do after render work like attache events
   */
  afterRender() {
    if (this.model.navigator) {
      this.model.navigator.liveAttach();
    }
    // Initialize tooltips for events
    if (
      this.model.options.events &&
      this.model.options.events.enabled &&
      this.model.options.events.showTooltip
    ) {
      setTimeout(() => {
        this._initEventTooltips();
      }, 100); // Small delay to ensure DOM is ready
    }
    // // اضافه کردن tooltip برای رویدادها
    // this._initEventTooltips();
  }
}

module.exports = View;

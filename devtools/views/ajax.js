Spine = window.Spine || {};
Spine.AjaxView = Backbone.View.extend({
  className: 'spine-ajax-view toolbar',
  events: {
    'change input': 'setTrace'
  },
  template: '\
    <h1>Ajax Events</h1>\
    <div class="input-group">\
      <div class="input-group-left">\
        <span>Sources</span>\
      </div>\
      <div class="input-group-right column align-start">\
        <label><input class="start" type="checkbox"></input>Start</label>\
        <label><input class="send" type="checkbox"></input>Send</label>\
        <label><input class="success" type="checkbox"></input>Success</label>\
        <label><input class="error" type="checkbox"></input>Error</label>\
        <label><input class="complete" type="checkbox"></input>Complete</label>\
        <label><input class="stop" type="checkbox"></input>Stop</label>\
      </div>\
    </div>\
    <!-- TODO toggle\
    <div class="explanation">\
      Select the AJAX events you would like to trace. These events will be logged to the console with\
      the jQXHR object, the ajax settings, and a stack trace where the event was captured.\
    </div>\
    -->\
  ',
  initialize: function () {
    this.ajaxEvents = ['start', 'send', 'success', 'error', 'complete', 'stop'];

    this.model.on('change:enabled', function (model, enabled) {
      if (enabled) this.enable();
      else this.disable();
    }.bind(this));
  },
  setTrace: function () {
    var ajaxTraces = [];
    this.ajaxEvents.forEach(function (e) {
      if (this.$('.' + e).prop('checked')) {
        ajaxTraces.push(e);
      }
    });
    this.model.set('ajaxTraces', ajaxTraces);
  },
  disable: function () {
    this.$('input').attr('disabled', 'disabled');
    this.$el.addClass('disabled');
  },
  enable: function () {
    this.$('input').removeAttr('disabled');
    this.$el.removeClass('disabled');
  },
  render: function () {
    this.$el.html(this.template);
    this.ajaxEvents.forEach(function (e) {
      this.$('.' + e).prop('checked', this.model.get('ajaxTraces').indexOf(e) !== -1);
    }.bind(this));
    if (!this.model.get('enabled')) this.disable();
    return this;
  }
});

Spine = window.Spine || {};
Spine.AjaxView = Backbone.View.extend({
  className: 'spine-ajax-view',
  events: {
    'change input': 'setTrace'
  },
  initialize: function () {
    this.ajaxEvents = ['start', 'send', 'success', 'error', 'complete', 'stop'];
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
  render: function () {
    this.$el.append(_.template(this.template));
    this.ajaxEvents.forEach(function (e) {
      this.$('.' + e).prop('checked', this.model.get('ajaxTraces').indexOf(e) !== -1);
    }.bind(this));
    return this.el;
  },
  template: '<b>Trace Ajax</b><br/>\
  <label><input class="start" type="checkbox"></input>Start</label><br/>\
  <label><input class="send" type="checkbox"></input>Send</label><br/>\
  <label><input class="success" type="checkbox"></input>Success</label><br/>\
  <label><input class="error" type="checkbox"></input>Error</label><br/>\
  <label><input class="complete" type="checkbox"></input>Complete</label><br/>\
  <label><input class="stop" type="checkbox"></input>Stop</label><br/>\
  '
});

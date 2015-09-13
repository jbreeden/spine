Spine = window.Spine || {};
Spine.BackboneView = Backbone.View.extend({
  className: 'spine-backbone-view',
  events: {
    'change input': 'setTrace'
  },
  initialize: function () {
    this.bbTypes = ['models', 'collections', 'views', 'routers'];

    this.model.on('change:enabled', function (model, enabled) {
      if (enabled) this.enable();
      else this.disable();
    }.bind(this));
  },
  setTrace: function () {
    var backboneTraces = [];
    this.bbTypes.forEach(function (e) {
      if (this.$('.' + e).prop('checked')) {
        backboneTraces.push(e);
      }
    });
    this.model.set('backboneTraces', backboneTraces);
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
    this.bbTypes.forEach(function (e) {
      this.$('.' + e).prop('checked', this.model.get('backboneTraces').indexOf(e) !== -1);
    }.bind(this));
    if (!this.model.get('enabled')) this.disable();
    return this;
  },
  template: '\
  <div class="toolbar">\
    <h1>Backbone Events</h1>\
    <label><input class="backbone" type="checkbox"></input>Backbone</label>\
    <label><input class="models" type="checkbox"></input>Models</label>\
    <label><input class="collections" type="checkbox"></input>Collections</label>\
    <label><input class="views" type="checkbox"></input>Views</label>\
    <label><input class="routers" type="checkbox"></input>Routers</label>\
    <div class="explanation">\
      Select the Backbone components you would like to trace events from. These events will be logged to the console with\
      the handler arguments, handler context (this), and a stack trace where the event was captured. If the component is\
      a view, the DOM element will be output as well.\
    </div>\
  </div>\
  '
});

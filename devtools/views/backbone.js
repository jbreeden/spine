Spine = window.Spine || {};
Spine.BackboneView = Backbone.View.extend({
  className: 'spine-backbone-view toolbar',
  events: {
    'change input': 'setTrace'
  },
  template: '\
    <h1>Backbone Events</h1>\
    <div class="input-group">\
      <div class="inline-column input-group-left">\
        <span>Sources</span>\
      </div>\
      <div class="inline-column align-start input-group-right">\
        <label><input class="backbone" type="checkbox"></input>Backbone</label>\
        <label><input class="models" type="checkbox"></input>Models</label>\
        <label><input class="collections" type="checkbox"></input>Collections</label>\
        <label><input class="views" type="checkbox"></input>Views</label>\
        <label><input class="routers" type="checkbox"></input>Routers</label>\
      </div>\
    </div>\
    <div class="input-group">\
      <div class="inline-column input-group-left">\
        <span>Filter</span>\
      </div>\
      <div class="inline-column input-group-right">\
        <input class="filter" type="text"></input>\
        <div class="explanation">\
          Enter a regular expression to filter events by name.\
        </div>\
      </div>\
    </div>\
    <!-- TODO: Make expandable, collapsed by default. \
    <div class="explanation">\
      Select the Backbone components you would like to trace events from. These events will be logged to the console with\
      the handler arguments, handler context (this), and a stack trace where the event was captured. If the component is\
      a view, the DOM element will be output as well.\
    </div>\
    -->\
  ',
  initialize: function () {
    this.bbTypes = ['backbone', 'models', 'collections', 'views', 'routers'];

    this.model.on('change:enabled', function (model, enabled) {
      if (enabled) this.enable();
      else this.disable();
    }.bind(this));
  },
  setTrace: function () {
    var backboneTraces = [];
    this.bbTypes.forEach(function (type) {
      if (this.$('.' + type).prop('checked')) {
        backboneTraces.push(type);
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
    if (!this.rendered) {
      this.$el.html(this.template);
      this.bbTypes.forEach(function (e) {
        this.$('.' + e).prop('checked', this.model.get('backboneTraces').indexOf(e) !== -1);
      }.bind(this));

      this.$('.filter').val(this.model.get('backboneEventFilter'));
      this.$('.filter').on('change', function () {
        this.model.set('backboneEventFilter', this.$('.filter').val());
      }.bind(this));

      if (!this.model.get('enabled')) this.disable();
    }
    this.rendered = true;
    return this;
  }
});

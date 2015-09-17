Spine = window.Spine || {};
Spine.ActionsView = Backbone.View.extend({
  className: 'spine-actions-view',
  events: {
    'change .enabled': 'onSetEnabled'
  },
  template: '\
  <div class="toolbar">\
    <h1>Actions</h1>\
    <label><input class="enabled" type="checkbox"></input>Enabled</label>\
    <div class="explanation">\
      Action tracing will group all AJAX & Backbone events that occur consecutively, \
      within 200ms of eachother, into groups and ouput them to the console with context-specific information about each event.\
    </div>\
  </div>\
  ',
  initialize: function () {
    this.model.on('change:enabled', function (model, enabled) {
      if (enabled) this.enable();
      else this.disable();
    }.bind(this));
  },
  onSetEnabled: function () {
    this.model.set('traceActions', this.$('input.enabled').prop('checked'));
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
    this.$('input.enabled').prop('checked', this.model.traceActions);
    if (!this.model.get('enabled')) this.disable();
    return this;
  }
});

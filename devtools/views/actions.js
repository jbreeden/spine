Spine = window.Spine || {};
Spine.ActionsView = Backbone.View.extend({
  className: 'spine-actions-view toolbar',
  events: {
    'change .enabled': 'onSetEnabled'
  },
  template: '\
    <h1>Actions</h1>\
    <div class="input-group">\
      <div class="input-group-left">\
        <span>Enabled</span>\
      </div>\
      <div class="input-group-right">\
        <label><input class="enabled" type="checkbox"></input>Shut up and take my money!</label>\
        <div class="explanation">\
          Group consecutive events as actions, store them, and log the details to the console.\
        </div>\
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

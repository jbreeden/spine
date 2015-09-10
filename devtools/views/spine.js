Spine.View = Backbone.View.extend({
  className: 'spine-view',
  events: {
    'change .enabled': 'setEnabled'
  },
  setEnabled: function () {
    this.model.set('enabled', this.$('.enabled').prop('checked'));
  },
  render: function () {
    this.$el.append(_.template(this.template));
    this.$('.enabled').prop('checked', this.model.get('enabled'));
    this.delegateEvents();
    return this.el;
  },
  template: '<label><input class="enabled" type="checkbox"></intput>Enabled</label>'
});

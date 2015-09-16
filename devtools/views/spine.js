Spine = window.Spine || {};
Spine.EnableView = Backbone.View.extend({
  className: 'spine-enable-view',
  events: {
    'change .enabled': 'setEnabled',
    'change .verbose': 'setVerbose'
  },
  template: '\
  <div class="toolbar">\
    <h1>Spine Settings</h1>\
    <label><input class="enabled" type="checkbox"></intput>Enabled</label>\
    <label><input class="verbose" type="checkbox"></intput>Verbose</label>\
    <div class="explanation">\
      <ul>\
        <li><b>Enabled</b> Enable or disable the extension as a whole. If the extension was disabled on page load\
                     you will have to refresh the page after enabling.</li>\
        <li><b>Verbose</b> While enabled, spine will output extra debugging information.\
                     For example, every call to `render` on a Backbone view will emit "debug:render:being"\
                     and "debug:render:end" events, which can be traced by enabling Backbone View tracing.\
        </li>\
      </ul>\
    </div>\
  </div>',
  setEnabled: function () {
    this.model.set('enabled', this.$('.enabled').prop('checked'));
  },
  setVerbose: function () {
    this.model.set('verbose', this.$('.verbose').prop('checked'));
  },
  render: function () {
    this.$el.html(this.template);
    this.$('.enabled').prop('checked', this.model.get('enabled'));
    this.$('.debug').prop('checked', this.model.get('debug'));
    return this;
  }
});

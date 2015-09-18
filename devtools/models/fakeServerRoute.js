window.Spine = window.Spine || {};
Spine.FakeServerRoute = Backbone.Model.extend({
  defaults: {
    applied: false,
    url: '.*',
    method: 'GET|POST|PUT|DELETE',
    status: 200,
    headers: { "Content-Type": "application/json" },
    content: '{ "success": true }',
    hitCount: 0
  },
  initialize: function () {
    this.on('change', function () {
      if (this.get('applied') && !this.hasChanged('applied')) this.set('tainted', true);
      if (this.hasChanged('applied')) this.set('tainted', false);
    });
  }
});

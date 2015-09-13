window.Spine = window.Spine || {};
Spine.FakeServerRoute = Backbone.Model.extend({
  defaults: {
    applied: false,
    url: '.*',
    method: 'GET',
    status: 200,
    headers: { "Content-Type": "application/json" },
    content: '{ "success": true }'
  }
});

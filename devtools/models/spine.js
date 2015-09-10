Spine = Backbone.Model.extend({
  initialize: function () {
    if (!this.has('enabled')) this.set('enabled', false);
  }
});

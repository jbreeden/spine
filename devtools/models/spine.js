Spine = window.Spine || {};
Spine.Model = Backbone.Model.extend({
  initialize: function () {
    if (!this.has('enabled')) this.set('enabled', false);
    if (!this.has('ajaxTraces')) this.set('ajaxTraces', []);
  }
});

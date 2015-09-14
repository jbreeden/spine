window.Spine = window.Spine || {};
Spine.DevtoolsLayout = Backbone.View.extend({
  className: 'spine-devtools-layout-view',
  events : {
    'click .nav': function (e) {
      this.gotoPanel(e.target.getAttribute('data-panel'));
    }
  },
  initialize: function () {
    this.panels = {};
    this.initializeDOM();
    this.panels = new Backbone.Collection();
    this.panels.on('add', this.insertPanel, this);
  },
  addPanel: function (title, $el) {
    this.panels.add({
      title: title,
      $el: $el
    });
    if (this.panels.length == 1) {
      this.gotoPanel(title);
    }
  },
  initializeDOM: function () {
    this.$el.html(this.template);
    return this;
  },
  gotoPanel: function (title) {
    this.$('.content > *').css('display', 'none');
    this.$('.sidebar > .nav').removeClass('active-panel');
    var activePanel = this.panels.where({title: title})[0]
    activePanel.get('$el').css('display', 'block');
    this.$('.sidebar .nav[data-panel="' + title + '"]').addClass('active-panel');
  },
  insertPanel: function (panel) {
    this.$('.sidebar').append(this.renderNavItemForPanel(panel.attributes));
    this.$('.row > .content').append(panel.get('$el'));
    panel.get('$el').css('display', 'none').addClass('devtools-layout-content-panel');
  },
  render: function () {
    return this;
  },
  renderNavItemForPanel: function (context) {
    this.navItemTemplate = this.navItemTemplate || _.template('<div class="nav" data-panel="<%= title %>"><%= title %></div>');
    return this.navItemTemplate(context);
  },
  template: '\
    <div class="row">\
      <div class="sidebar inline-column no-flex">\
      </div>\
      <div class="content inline-column flex">\
      </div>\
    </div>\
  '
});

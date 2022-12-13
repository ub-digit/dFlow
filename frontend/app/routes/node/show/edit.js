import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend(AuthenticatedRouteMixin, {
  i18n: Ember.inject.service(),
  model: function(params) {
    return this.store.find('treenode', params.id);
  },

  setupController: function(controller, model) {
    controller.set('model', model);
    controller.set('performingUpdate', false);
    controller.set('performingDelete', false);
  },

  actions: {
    deleteNode: function(id) {
      var should_delete = confirm(this.get('i18n').t("nodes.confirm_delete"));
      this.controller.set('performingDelete', true);
      var that = this; // To be used in nested functions
      if (should_delete){
        this.store.destroy('treenode', id).then(
          () => {
            that.transitionTo('index');
          },
          (errorObject) => {
            that.controller.set('performingDelete', false);
            that.controller.set('error', errorObject.error);
          }
        );
      }
    },
    updateNode: function(model) {
      var that = this;
       // If we have a new_parent_id, ask user if it actually should be moved
       if(model.new_parent_id && model.new_parent_id !== '') {
        if(model.new_parent_id === 'root') {
          if(!this.get('session.data.authenticated.can_manage_tree_root')) {
           alert(this.get('i18n').t("nodes.move_root_denied"));
           return;
          }
          var should_save = confirm(this.get('i18n').t("nodes.move_confirm_root"));
          if(should_save) {
            model.parent_id = null;
            delete model.new_parent_id;
            this.send('saveNode', model);
          }
        } else {
          this.store.find('treenode', model.new_parent_id, {show_breadcrumb: true, show_breadcrumb_as_string: true}).then(
            // Fetch parent we want to move object to
            function(new_model) {
              var should_save = confirm(that.get('i18n').t("nodes.move_confirm") + "\n" + new_model.breadcrumb);
              if(should_save) {
                model.parent_id = model.new_parent_id;
                delete model.new_parent_id;
                that.send('saveNode', model);
              }
            },
            // Failed to fetch parent (no such node?)
            function() {
              alert(that.get('i18n').t("nodes.move_parent_not_found"));
            }
          );
        }
      } else {
        this.send('saveNode', model);
      }
    },
    saveNode: function(model) {
      var that = this; // To be used in nested functions
      this.controller.set('performingUpdate', true);
      this.store.save('treenode', model).then(
        // Success function
        function(model) {
          that.send('refreshModel', model.parent_id); // Refresh children of current model
          that.transitionTo('node.show', model.parent_id);
        },
        // Failed function
        function(errorObject) {
          that.controller.set('performingUpdate', false);
          that.controller.set('error', errorObject.error);
        }
      );
    }
  }
});

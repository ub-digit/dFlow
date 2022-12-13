import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend(AuthenticatedRouteMixin, {
  model: function() {
    return {
      flow_parameters: {}
    };
  },
  setupController: function(controller, model) {
    if(controller.get('preventUpdate')) {
      controller.set('preventUpdate', false);
    } else {
      controller.set('model', model);
      controller.set('error', null);
      controller.set('process_id', null);
    }
  }
});

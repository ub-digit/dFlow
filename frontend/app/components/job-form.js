import Ember from 'ember';

export default Ember.Component.extend({
  performingCreate: false,
  isNew: Ember.computed('model.id', function(){
    return !this.get('model.id');
  }),

  currentFlow: Ember.computed('model.flow_id', function(){
    return this.get('flows').findBy('id', this.get('model.flow_id'));
  }),

  actions: {
    create: function(model) {
      var that = this;
      that.controller.set('performingCreate', true);
      that.store.save('job', model).then(
        // callback function for store to use in case of success
        function() {
					that.triggerAction({action: 'createSuccess'});
        },
        // callback function for store to use in case of failure
        function(errorObject) {
          that.controller.set('error', errorObject.error);
          that.controller.set('performingCreate', false);
        }
      );
    },
		abort: function() {
			this.triggerAction({action: 'createAbort'});
		}
  }
});

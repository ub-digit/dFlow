import Ember from 'ember';

export default Ember.Controller.extend({
  modes: ['tree','code'],
  steps_mode: 'code',
  parameters_mode: 'code',
  folder_paths_mode: 'code',

  actions: {
    save(model) {
      var that = this;
      this.set('savingMessage', 'Sparar...');
      this.store.save('flow', model).then(function(){
        that.set('savingMessage', 'Sparat!');
      },
      function(response){
        that.set('savingMessage', 'Kunde inte spara!');
      }); 
    }

  }

});
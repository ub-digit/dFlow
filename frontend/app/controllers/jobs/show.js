import Ember from 'ember';
import ENV from 'd-flow-ember/config/environment';

export default Ember.Controller.extend({
  session: Ember.inject.service(),
  application: Ember.inject.controller(),
  flowSelection: Ember.computed.alias('application.flowSelection'),
  flows: Ember.computed.alias('application.flows'),
  open: '',
  setFlowParams: Ember.computed.equal('model.flow_step.process', 'ASSIGN_FLOW_PARAMETERS'),

  metadataIsOpen: Ember.computed.equal('open', 'metadata'),
  jobActivityIsOpen: Ember.computed.equal('open', 'job_activity'),
  filesIsOpen: Ember.computed.equal('open', 'files'),
  flowIsOpen: Ember.computed.equal('open', 'flow'),
  pubLogIsOpen: Ember.computed.equal('open', 'pub_log'),
  recreateFlow: true,

  numberOfPages: Ember.computed('model', function() {
    return this.get("model.package_metadata.image_count");
  }),

  showMetadata: Ember.computed('model.flow_step', function() {
    if ((this.get("model.flow_step.process") === "ASSIGN_METADATA") && (this.get("model.flow_step.params.manual"))) {
      return true;
    }
    return false;
  }),

  pdfUrl: Ember.computed('model', function() {
    var token =  this.get('session.data.authenticated.token');
    return ENV.APP.serviceURL + '/assets/file?file_path=' + this.get('model.flow_step.parsed_params.pdf_file_path') + '&token=' + token;
  }),

  currentFlow: Ember.computed('model.flow_id', function(){
    return this.get('flows').findBy('id', this.get('model.flow_id'));
  }),

  isPriorityNormal: Ember.computed('model.priority', function(){
    return (this.get('model.priority') == 2);
  }),
  isPriorityHigh: Ember.computed('model.priority', function(){
    return (this.get('model.priority') == 1);
  }),
  isPriorityLow: Ember.computed('model.priority', function(){
    return (this.get('model.priority') == 3);
  }),

  flowStepItems: Ember.computed('model.flow', 'model.flow_steps', 'model.current_flow_step', function(){
    var flowStepItems = [];
    for(var y = 0 ; y < this.get('model.flow_steps').sortBy('step').length ; y++ ){
      var flowStep = this.get('model.flow_steps')[y];
      var prefix = '';
      if (flowStep.finished_at) {
        prefix = '-';
      }
      if (flowStep.step === this.get('model.current_flow_step')){
        prefix = '*';
      }
      var label = prefix + flowStep.step + ". " + flowStep.description;
      var item = {label: label, value: parseInt(flowStep.step)};
      flowStepItems.pushObject(item);
    }
    return flowStepItems.sortBy('value');
  }),

  actions: {
    flowStepSuccess(flowStep) {
      this.send('flowStepSuccessDoStuff', this.get('model'), flowStep);
    },
    setOpen(string) {
      this.set('open', string);
      if (string === 'files') {
        if (!this.get('files')) {
          this.set('filesLoading', true);
          let job_id = this.get('model.id');
          this.store.find('file', {job_id: job_id}).then(
            (files) => {
              this.set('files', files);
              this.set('filesLoading', false);
            }
          );
        }
      }
    }
  }
  
});

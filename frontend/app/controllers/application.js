import Ember from 'ember';

export default Ember.Controller.extend({
  session: Ember.inject.service(),
  ticket: null,
  queryParams: ["ticket"],

  formatNoOfJobsInQuarantine: Ember.computed('jobsInQuarantine', function() {
    if (this.get('jobsInQuarantine') > 0) {
      return " (" + this.get('jobsInQuarantine') + ")";
    } else {
      return "";
    }
  }),
  anyJobInQuarantine: Ember.computed('jobsInQuarantine', function() {
    return this.get('jobsInQuarantine') > 0;
  })
});


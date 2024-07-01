import Ember from 'ember';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';
import ENV from 'd-flow-ember/config/environment';

export default Ember.Route.extend(ApplicationRouteMixin, {
  i18n: Ember.inject.service(),
  session: Ember.inject.service(),
  casService: function() {
    var baseUrl = window.location.origin;
    var routeUrl = this.router.generate('application');
    console.log('routeurl', routeUrl);
    return baseUrl + routeUrl;
  },
  checkLoggedInState: function() {
    var that = this;
    var token = this.get('session.data.authenticated.token');
    Ember.run.later(function() {
      if(token) {
        Ember.$.ajax({
			    type: 'GET',
			    url: ENV.APP.authenticationBaseURL+'/'+token+'?no_extend=true'
		    }).then(function(data) {
          if(data.access_token !== token) {
            that.get('session').invalidate();
          }
		    }, function(response) {
          if(response.status === 401) {
            that.get('session').invalidate();
            console.log("User expired", response);
          }
        });
      }
      that.checkLoggedInState();
    },1000*60*10); // Check every 10 minutes
  },

  checkNotifications: function(controller) {
    var that = this;
    // Check if user has permission to see notifications
    if (that.get('session.data.authenticated.can_manage_jobs')) {
      that.store.find('notification').then(function(notifications ) {
        controller.set('queueManagerStopped', notifications.queue_manager_stopped);
        controller.set('jobsInQuarantine', notifications.jobs_in_quarantine);
      });
    }
    if (controller.get('updateNotifications')) {
      Ember.run.later(function() {
        that.checkNotifications(controller);
      }, 1000 * 10); // Check every 10 seconds
    }
  },

  beforeModel: function(transition) {
    var that = this;
    var session = this.get('session');
    var ticket = transition.queryParams.ticket;
    if(ticket) {
      session.authenticate('authenticator:gub', {
        cas_ticket: ticket,
        cas_service: this.casService()
      }).then(null, function(error){
        that.controllerFor('login').set('error', error);
        that.transitionTo('login');
      });
    }
    return this._super(transition);
  },
  model: function() {
    var that = this;
    // Used to load data that will not be changed during runtime
    return Ember.RSVP.hash({
      roles: that.store.find('config', 'roles'),
      sources: that.store.find('source'),
      states: that.store.find('config', 'states'),
      casUrl: that.store.find('config', 'cas_url'),
      flows: that.store.find('flow'),
      version_info: that.store.find('config', 'version_info')
    });
  },
  setupController: function(controller, model) {
    // To be able to access from specific controllers
    controller.set('model', {});
    controller.set('ticket', null);
    //console.log(model.roles);
    controller.set('roleSelection', model.roles.roles);
    controller.set('sourceSelection', model.sources.filter(function(source) {
      return !source.hidden;
    }));
    controller.set('copyrightSelection', [
      {label: this.get('i18n').t('jobs.copyright_values.unselected'), value: null},
      {label: this.get('i18n').t('jobs.copyright_values.true'), value: true},
      {label: this.get('i18n').t('jobs.copyright_values.false'), value: false}
      ]);

    var flowSelectionArray = Ember.A([]);
    model.flows.forEach(function(flow){
      if (flow.selectable) {
        flowSelectionArray.push({label: flow.name, value: flow.id});
      }
    });
    controller.set('flowSelection', flowSelectionArray);
    controller.set('flows', model.flows);

    var stateItems = [];
    for(var y = 0 ; y < model.states.states.length ; y++ ){
      var state = model.states.states[y];
      var item2 = {label: this.get('i18n').t('jobs.states.' + state), value: state};
      stateItems.pushObject(item2);
    }
    controller.set('stateSelection', stateItems);

    // Set CAS login URL
    if (model.casUrl.cas_url) {
      var casLoginUrl = model.casUrl.cas_url + '/login?'+Ember.$.param({service: this.casService()});
      controller.set('casLoginUrl', casLoginUrl);
    }

    controller.set('version_info', model.version_info);
    this.checkLoggedInState();

    controller.set('updateNotifications', true);
    this.checkNotifications(controller);
  },
  actions: {
    sessionAuthenticationFailed: function(error) {
      this.controllerFor('login').set('error', error);
    },
    showJob: function(job_id) {
      var that = this;
      this.controller.set('job_id', null);
      this.controller.set('job_id_error', null);

      if (job_id) {
        Ember.$("#app-outer").addClass("loading");
        that.store.find('job', job_id).then(function(job) {
          that.transitionTo('jobs.show', job);
        },
        function(){
          Ember.$("#app-outer").removeClass("loading");
          that.controller.set('job_id_error', that.get('i18n').t('jobs.idMissing') + ': ' + job_id);
        });
      }
    },
    findJobs: function(search_term) {
      this.controller.set('search_term', null);
      this.transitionTo('jobs.index', {queryParams: {query: search_term, page: 1, state: null, quarantined: ""}});
    },
    invalidateSession: function(){
      this.get('session').invalidate();
    },
    refreshApplication: function(){
      this.refresh();
    },
    willTransition: function() {
      this.controller.set('job_id_error', null);
    }
  }
});

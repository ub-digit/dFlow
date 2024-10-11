import Ember from 'ember';

export default Ember.Controller.extend({
  session: Ember.inject.service(),
  application: Ember.inject.controller(),
  i18n: Ember.inject.service(),

  actions: {
    authenticate() {
      let { identification, password } = this.getProperties('identification', 'password');
      this.get('session').authenticate('authenticator:gub', {identification: identification, password: password}).catch(() => {
        // Alwways show the same error message, regardless backend response
        this.set('errorMessage', this.get('i18n').t('login.loginError'));
      });
    }
  }
});

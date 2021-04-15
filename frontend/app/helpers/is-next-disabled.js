import Ember from 'ember';

export function isNextDisabled(params/*, hash*/) {
  if (params[0] === params[1]) {
    return "disabled";
  }
  return null;
}

export default Ember.Helper.helper(isNextDisabled);

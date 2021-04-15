import Ember from 'ember';

export function isPreviousDisabled(params/*, hash*/) {
  if (params[0] === 1) {
    return "disabled";
  }
  return null;
}

export default Ember.Helper.helper(isPreviousDisabled);

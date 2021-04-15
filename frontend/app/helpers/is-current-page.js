import Ember from 'ember';

export function isCurrentPage(params/*, hash*/) {
  if (params[0] === params[1]) {
    return 'active';
  }
  return null;
}

export default Ember.Helper.helper(isCurrentPage);

import Ember from 'ember';
import ENV from 'd-flow-ember/config/environment';
export default Ember.Object.extend({
  session: Ember.inject.service(),
  endpoints: {
    treenode:  { path: 'api/treenodes'  },
    user: { path: 'api/users'},
    config: { path: 'api/config'},
    source: { path: 'api/sources'},
    job: { path: 'api/jobs'},
    file: { path: 'api/files'},
    process: { path: 'api/process', singular: 'job'},
    flow: { path: 'api/flows'},
    thumbnail: {path: 'assets/thumbnail'},
    queue: {path: 'api/queued_jobs', singular: 'flow_step', plural: 'flow_steps'},
    script: {path: 'api/script', singular: 'script', plural: 'scripts'},
    statistics: {path: 'api/statistics'},
    queue_manager: {path: 'api/queue_manager', singular: 'queue_manager', plural: 'queue_managers'},
    notification: {path: 'api/notifications'},
  },
  sessionHeaders: function() {
    var session = this.get('session');
    var headers = {};
    if(session && session.get('isAuthenticated')) {
      headers["Authorization"] = "Token " + session.get('data.authenticated.token');
    }
    return headers;
  },
  findOne: function(name, id, params) {
    var that = this;
    return this.fetch(this.urlOne(name, id, params))
    .then(function(data) {
      return that.extractOne(name, data);
    }, this.extractErrors);
  },
  findMany: function(name, params) {
    var that = this;
    return this.fetch(this.urlMany(name, params))
    .then(function(data) {
      return that.extractMany(name, data);
    }, this.extractErrors);
  },
  fetch: function(url) {
    var that = this;
    return Ember.$.ajax({
      url: url,
      method: 'get',
      crossDomain: true,
      type: 'json',
      headers: that.sessionHeaders()
    });
  },
  // Replacer to remove container from objects, if it exists, before running JSON.stringify
  replacer: function(key, value) {
    if (key==="container") {
      return undefined;
    }
    else { 
      return value;
    }
  },
  send: function(url, method, data) {
    var that = this;
    return Ember.$.ajax({
      url: url,
      method: method,
      crossDomain: true,
      type: 'json',
      data: JSON.stringify(data, that.replacer),
      headers: that.sessionHeaders(),
      contentType: 'application/json'
    });
  },
  sendDelete: function(url) {
    var that = this;
    return Ember.$.ajax({
      url: url,
      method: 'delete',
      crossDomain: true,
      type: 'json',
      headers: that.sessionHeaders()
    });
  },
  endpoint: function(name) {
    if(this.endpoints[name]) {
      return this.endpoints[name];
    } else {
      console.log("ERROR! Missing endpoint for", name);
      return undefined;
    }
  },
  plural: function(name) {
    if(this.endpoint(name) && this.endpoint(name).plural) {
      return this.endpoint(name).plural;
    } else {
      return name+'s';
    }
  },
  singular: function(name) {
    if(this.endpoint(name) && this.endpoint(name).singular) {
      return this.endpoint(name).singular;
    } else {
      return name;
    }
  },
  urlOne: function(name, id, params) {
    var url = ENV.APP.serviceURL + '/' + this.endpoint(name).path + '/' + id;
    if(params) {
      url += '?' + Ember.$.param(params);
    }
    return url;
  },
  urlMany: function(name, params) {
    var url = ENV.APP.serviceURL + '/' + this.endpoint(name).path;
    if(params) {
      url += '?' + Ember.$.param(params);
    }
    return url;
  },
  extractOne: function(name, data) {
    var singularName = this.singular(name);
    if(data.meta) {
      data[singularName].meta = data.meta;
    }
    data[singularName].error = this.extractErrors(data);
    return data[singularName];
  },
  extractMany: function(name, data) {
    var pluralName = this.plural(name);
    var list = data[pluralName];
    if(data.meta) {
      list.meta = data.meta;
    }
    list.error = this.extractErrors(data);
    return list;
  },
  extractErrors: function(reason_or_data) {
    if(reason_or_data.responseJSON) {
      return {
        error: reason_or_data.responseJSON.error,
        status: reason_or_data.status
      };
    } else {
      return reason_or_data.error;
    }
    return undefined;
  },
  destroy: function(name, id) {
    return this.sendDelete(this.urlOne(name, id));
  },
  saveUpdate: function(name, id, data) {
    var that = this;
    var dataObject = {};
    dataObject[name] = data;
    return this.send(this.urlOne(name, id), 'put', dataObject)
    .then(function(data) {
      return that.extractOne(name, data);
    }, this.extractErrors);
  },
  saveCreate: function(name, data) {
    var that = this;
    var dataObject = {};
    dataObject[name] = data;
    return this.send(this.urlMany(name), 'post', dataObject)
    .then(function(data) {
      return that.extractOne(name, data);
    }, this.extractErrors);
  }
});

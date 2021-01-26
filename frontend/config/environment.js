/* jshint node: true */

module.exports = function(environment) {
  var ENV = {
   modulePrefix: 'd-flow-ember',
   environment: environment,
   rootURL: '/',
   locationType: 'auto',
   EmberENV: {
     FEATURES: {
       // Here you can enable experimental features on an ember canary build
       // e.g. 'with-controller': true
     }
   },

   i18n: {
    defaultLocale: 'sv'
   },

   APP: {
     authenticationBaseURL: '/session',
     serviceURL:''
     // Here you can pass flags/options to your application instance
     // when it is created
   }
  };

  let baseURL = null;
  let hostName = null;

  if (environment === 'development') {
    hostName = 'localhost';
    baseURL = 'http://' + hostName + ':' + process.env.DFLOW_SERVICE_PORT;
    // ENV.APP.LOG_RESOLVER = true;
    ENV.APP.LOG_ACTIVE_GENERATION = true;
    ENV.APP.LOG_TRANSITIONS = true;
    ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    //ENV.APP.LOG_VIEW_LOOKUPS = true;
    ENV.contentSecurityPolicyHeader = 'Disabled-Content-Security-Policy';
  }
  else if (environment === 'production') {
    hostName = process.env.DFLOW_SERVICE_HOSTNAME;
    baseURL = 'http://' + hostName;

    ENV.contentSecurityPolicy = {
     'font-src': "'self' fonts.gstatic.com",
     'style-src': "'self' 'unsafe-inline' fonts.googleapis.com"
    };
  }
  else if (environment === 'staging') {
    baseURL = process.env.DFLOW_SERVICE_HOSTNAME;
    ENV.contentSecurityPolicy = {
     'font-src': "'self' fonts.gstatic.com",
     'style-src': "'self' 'unsafe-inline' fonts.googleapis.com"
    };
  }
  else if (environment === 'lab') {
    baseURL = process.env.DFLOW_SERVICE_HOSTNAME;
    ENV.contentSecurityPolicy = {
     'font-src': "'self' fonts.gstatic.com",
     'style-src': "'self' 'unsafe-inline' fonts.googleapis.com"
    };
  }
  if (baseURL) {
    ENV.APP.serviceURL = baseURL + ENV.APP.serviceURL;
    ENV.APP.authenticationBaseURL = baseURL + ENV.APP.authenticationBaseURL;
  }

  ENV.contentSecurityPolicy = {
    'default-src': "'none'",
    'font-src': "'self' fonts.gstatic.com",
    'img-src': "'self'",
    'style-src': "'self' fonts.googleapis.com",
    'style-src': "'self' 'unsafe-inline' fonts.googleapis.com",
    'report-uri': "/"
  };

  if (hostName) {
    ENV.contentSecurityPolicy['script-src'] = "'self' " + hostName;
  }

  return ENV;
};

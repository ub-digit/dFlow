"use strict";

/* jshint ignore:start */



/* jshint ignore:end */

define('d-flow-ember/adapters/dflow', ['exports', 'ember', 'd-flow-ember/config/environment'], function (exports, _ember, _dFlowEmberConfigEnvironment) {
  exports['default'] = _ember['default'].Object.extend({
    session: _ember['default'].inject.service(),
    endpoints: {
      treenode: { path: 'api/treenodes' },
      user: { path: 'api/users' },
      config: { path: 'api/config' },
      source: { path: 'api/sources' },
      job: { path: 'api/jobs' },
      file: { path: 'api/files' },
      process: { path: 'api/process', singular: 'job' },
      flow: { path: 'api/flows' },
      thumbnail: { path: 'assets/thumbnail' },
      queue: { path: 'api/queued_jobs', singular: 'flow_step', plural: 'flow_steps' },
      script: { path: 'api/script', singular: 'script', plural: 'scripts' },
      statistics: { path: 'api/statistics' },
      queue_manager: { path: 'api/queue_manager', singular: 'queue_manager', plural: 'queue_managers' }
    },
    sessionHeaders: function sessionHeaders() {
      var session = this.get('session');
      var headers = {};
      if (session && session.get('isAuthenticated')) {
        headers["Authorization"] = "Token " + session.get('data.authenticated.token');
      }
      return headers;
    },
    findOne: function findOne(name, id, params) {
      var that = this;
      return this.fetch(this.urlOne(name, id, params)).then(function (data) {
        return that.extractOne(name, data);
      }, this.extractErrors);
    },
    findMany: function findMany(name, params) {
      var that = this;
      return this.fetch(this.urlMany(name, params)).then(function (data) {
        return that.extractMany(name, data);
      }, this.extractErrors);
    },
    fetch: function fetch(url) {
      var that = this;
      return _ember['default'].$.ajax({
        url: url,
        method: 'get',
        crossDomain: true,
        type: 'json',
        headers: that.sessionHeaders()
      });
    },
    // Replacer to remove container from objects, if it exists, before running JSON.stringify
    replacer: function replacer(key, value) {
      if (key === "container") {
        return undefined;
      } else {
        return value;
      }
    },
    send: function send(url, method, data) {
      var that = this;
      return _ember['default'].$.ajax({
        url: url,
        method: method,
        crossDomain: true,
        type: 'json',
        data: JSON.stringify(data, that.replacer),
        headers: that.sessionHeaders(),
        contentType: 'application/json'
      });
    },
    sendDelete: function sendDelete(url) {
      var that = this;
      return _ember['default'].$.ajax({
        url: url,
        method: 'delete',
        crossDomain: true,
        type: 'json',
        headers: that.sessionHeaders()
      });
    },
    endpoint: function endpoint(name) {
      if (this.endpoints[name]) {
        return this.endpoints[name];
      } else {
        console.log("ERROR! Missing endpoint for", name);
        return undefined;
      }
    },
    plural: function plural(name) {
      if (this.endpoint(name) && this.endpoint(name).plural) {
        return this.endpoint(name).plural;
      } else {
        return name + 's';
      }
    },
    singular: function singular(name) {
      if (this.endpoint(name) && this.endpoint(name).singular) {
        return this.endpoint(name).singular;
      } else {
        return name;
      }
    },
    urlOne: function urlOne(name, id, params) {
      var url = _dFlowEmberConfigEnvironment['default'].APP.serviceURL + '/' + this.endpoint(name).path + '/' + id;
      if (params) {
        url += '?' + _ember['default'].$.param(params);
      }
      return url;
    },
    urlMany: function urlMany(name, params) {
      var url = _dFlowEmberConfigEnvironment['default'].APP.serviceURL + '/' + this.endpoint(name).path;
      if (params) {
        url += '?' + _ember['default'].$.param(params);
      }
      return url;
    },
    extractOne: function extractOne(name, data) {
      var singularName = this.singular(name);
      if (data.meta) {
        data[singularName].meta = data.meta;
      }
      data[singularName].error = this.extractErrors(data);
      return data[singularName];
    },
    extractMany: function extractMany(name, data) {
      var pluralName = this.plural(name);
      var list = data[pluralName];
      if (data.meta) {
        list.meta = data.meta;
      }
      list.error = this.extractErrors(data);
      return list;
    },
    extractErrors: function extractErrors(reason_or_data) {
      if (reason_or_data.responseJSON) {
        return {
          error: reason_or_data.responseJSON.error,
          status: reason_or_data.status
        };
      } else {
        return reason_or_data.error;
      }
      return undefined;
    },
    destroy: function destroy(name, id) {
      return this.sendDelete(this.urlOne(name, id));
    },
    saveUpdate: function saveUpdate(name, id, data) {
      var that = this;
      var dataObject = {};
      dataObject[name] = data;
      return this.send(this.urlOne(name, id), 'put', dataObject).then(function (data) {
        return that.extractOne(name, data);
      }, this.extractErrors);
    },
    saveCreate: function saveCreate(name, data) {
      var that = this;
      var dataObject = {};
      dataObject[name] = data;
      return this.send(this.urlMany(name), 'post', dataObject).then(function (data) {
        return that.extractOne(name, data);
      }, this.extractErrors);
    }
  });
});
define('d-flow-ember/app', ['exports', 'ember', 'd-flow-ember/resolver', 'ember-load-initializers', 'd-flow-ember/config/environment'], function (exports, _ember, _dFlowEmberResolver, _emberLoadInitializers, _dFlowEmberConfigEnvironment) {

  var App = undefined;

  _ember['default'].MODEL_FACTORY_INJECTIONS = true;

  App = _ember['default'].Application.extend({
    modulePrefix: _dFlowEmberConfigEnvironment['default'].modulePrefix,
    podModulePrefix: _dFlowEmberConfigEnvironment['default'].podModulePrefix,
    Resolver: _dFlowEmberResolver['default']
  });

  (0, _emberLoadInitializers['default'])(App, _dFlowEmberConfigEnvironment['default'].modulePrefix);

  exports['default'] = App;
});
define('d-flow-ember/authenticators/gub', ['exports', 'ember', 'ember-simple-auth/authenticators/base', 'd-flow-ember/config/environment', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _ember, _emberSimpleAuthAuthenticatorsBase, _dFlowEmberConfigEnvironment, _emberSimpleAuthMixinsAuthenticatedRouteMixin) {
	exports['default'] = _emberSimpleAuthAuthenticatorsBase['default'].extend({
		restore: function restore(properties) {
			return new _ember['default'].RSVP.Promise(function (resolve, reject) {
				_ember['default'].$.ajax({
					type: 'GET',
					url: _dFlowEmberConfigEnvironment['default'].APP.authenticationBaseURL + '/' + properties.token
				}).then(function () {
					resolve(properties);
				}, function () {
					reject();
				});
			});
		},
		authenticate: function authenticate(credentials) {

			var authCredentials = {};
			if (credentials.cas_ticket && credentials.cas_service) {
				authCredentials = credentials;
			} else {
				authCredentials = {
					username: credentials.identification,
					password: credentials.password
				};
			}
			return new _ember['default'].RSVP.Promise(function (resolve, reject) {
				_ember['default'].$.ajax({
					type: 'POST',
					url: _dFlowEmberConfigEnvironment['default'].APP.authenticationBaseURL,
					data: JSON.stringify(authCredentials),
					contentType: 'application/json'
				}).then(function (response) {
					var token = response.access_token;
					_ember['default'].run(function () {
						resolve({
							authenticated: true,
							token: token,
							username: response.user.username,
							name: response.user.name,
							can_view_users: _ember['default'].$.inArray('view_users', response.user.role.rights) !== -1,
							can_manage_tree: _ember['default'].$.inArray('manage_tree', response.user.role.rights) !== -1,
							can_manage_tree_root: _ember['default'].$.inArray('manage_tree_root', response.user.role.rights) !== -1,
							can_manage_jobs: _ember['default'].$.inArray('manage_jobs', response.user.role.rights) !== -1,
							can_manage_statistics: _ember['default'].$.inArray('manage_statistics', response.user.role.rights) !== -1
						});
					});
				}, function (xhr) {
					_ember['default'].run(function () {
						reject(xhr.responseJSON.error);
					});
				});
			});
		},
		invalidate: function invalidate() {
			return new _ember['default'].RSVP.Promise(function (resolve) {
				resolve();
			});
		}
	});

	_emberSimpleAuthMixinsAuthenticatedRouteMixin['default'].reopen({
		beforeModel: function beforeModel(transition) {
			var session = this.get('session');
			var token = null;
			if (session) {
				token = session.get('data.authenticated.token');
			}
			_ember['default'].$.ajax({
				type: 'GET',
				url: _dFlowEmberConfigEnvironment['default'].APP.authenticationBaseURL + '/' + token
			}).then(null, function () {
				session.invalidate();
			});
			return this._super(transition);
		}
	});
});
define('d-flow-ember/components/app-version', ['exports', 'ember-cli-app-version/components/app-version', 'd-flow-ember/config/environment'], function (exports, _emberCliAppVersionComponentsAppVersion, _dFlowEmberConfigEnvironment) {

  var name = _dFlowEmberConfigEnvironment['default'].APP.name;
  var version = _dFlowEmberConfigEnvironment['default'].APP.version;

  exports['default'] = _emberCliAppVersionComponentsAppVersion['default'].extend({
    version: version,
    name: name
  });
});
define('d-flow-ember/components/dscribe-wrapper', ['exports', 'ember', 'd-flow-ember/mixins/in-view-port'], function (exports, _ember, _dFlowEmberMixinsInViewPort) {
  exports['default'] = _ember['default'].Component.extend(_dFlowEmberMixinsInViewPort['default'], {
    session: _ember['default'].inject.service(),
    store: _ember['default'].inject.service(),
    init: function init() {
      var that = this;
      var token = this.get('session.data.authenticated.token');
      if (this.get('imagesFolderPath') && this.get('imagesSource')) {
        var filetypeString = '';
        if (!!this.get('filetype')) {
          filetypeString = "&filetype=" + this.get('filetype');
        }
        this.store.find('thumbnail', '?source_dir=' + this.get('imagesFolderPath') + '&source=' + this.get('imagesSource') + '&size=200&image=' + this.get('image.num') + filetypeString + '&token=' + token).then(function (response) {
          that.set('small', response.thumbnail);
        });
      }
      this._super();
    },

    showLogical: _ember['default'].computed('image.page_content', function () {
      if (this.get('image.page_content') === "undefined" || this.get('image.page_content') === "Undefined" || this.get('image.page_content') === undefined) {
        return false;
      }
      return true;
    }),

    showPhysical: _ember['default'].computed('image.page_type', function () {
      if (this.get('image.page_type') === "undefined" || this.get('image.page_type') === "Undefined" || this.get('image.page_type') === undefined) {
        return false;
      }
      return true;
    }),

    fileUrl: _ember['default'].computed('imagesFolderPath', 'imagesSource', 'image.num', 'filetype', function () {
      var token = this.get('session.data.authenticated.token');
      var file_path = this.get('imagesFolderPath') + "/" + this.get('imagesSource') + "/" + this.get('image.num') + '.' + this.get('filetype');
      return "/assets/file?file_path=" + file_path + '&token=' + token;
    }),

    mouseEnter: function mouseEnter() {
      this.set('activeFrame', true);
    },
    mouseLeave: function mouseLeave() {
      this.set('activeFrame', false);
    },
    togglePhysical: function togglePhysical(page_type) {
      if (this.get("image.page_type") === page_type) {
        this.set('image.page_type', undefined);
      } else {
        this.set('image.page_type', page_type);
      }
      return false;
    },
    toggleLogical: function toggleLogical(page_content) {
      if (this.get("image.page_content") === page_content) {
        this.set('image.page_content', undefined);
      } else {
        this.set('image.page_content', page_content);
      }
      return false;
    },

    actions: {
      catchPhysical: function catchPhysical(event) {
        if (event.srcElement.nodeName === "I") {
          this.togglePhysical(event.srcElement.parentNode.id);
        } else if (event.srcElement.nodeName === 'BUTTON') {
          this.togglePhysical(event.srcElement.id);
        }
      },
      catchLogical: function catchLogical(event) {
        if (event.srcElement.nodeName === "I") {
          this.toggleLogical(event.srcElement.parentNode.id);
        } else if (event.srcElement.nodeName === 'BUTTON') {
          this.toggleLogical(event.srcElement.id);
        }
      },
      setLogical: function setLogical(page_content) {
        this.set('image.page_content', page_content);
      },
      clickToggleSelect: function clickToggleSelect(e) {
        if (e.target.type === "submit" || e.target.localName === "i") {
          if (e.target.className === "fa fa-search") {
            window.open(this.get("fileUrl"), '_blank' // <- This is what makes it open in a new window.
            );
          }
          return false;
        }
        if (e.shiftKey) {
          if (!this.get("latestSelected")) {
            return;
          }
          var pageNumbersToSelect = [];
          if (this.get("latestSelected") === this.get("image.num")) {
            return;
          }
          if (this.get("image.num") > this.latestSelected) {
            for (var i = parseInt(this.latestSelected); i <= parseInt(this.get("image.num")); i++) {
              var padded = ('000' + i).slice(-4);
              pageNumbersToSelect.push(padded);
            }
          } else if (this.get("image.num") < this.latestSelected) {
            for (var i = parseInt(this.get("image.num")); i < parseInt(this.latestSelected); i++) {
              var padded = ('000' + i).slice(-4);
              pageNumbersToSelect.push(padded);
            }
          }
          // create array with pages to select

          // if pageNumberToUse is undefined find the closest to the clicked page
          if (pageNumbersToSelect.length) {
            this.get("images").forEach(function (item, index) {
              if (pageNumbersToSelect.includes(item.num)) {
                _ember['default'].set(item, 'selected', true);
              }
            });
          }

          // Find closest already selected and select from that to the clicked
        } else {
            if (e.ctrlKey === false && this.get("image.num") !== this.get("latestSelected")) {
              this.get("images").forEach(function (item) {
                _ember['default'].set(item, "selected", false);
              });
            }
            this.set('image.selected', this.get('image.selected') ? false : true);
            this.set('latestSelected', this.get("image.num"));
          }
      }
    }
  });
});
define('d-flow-ember/components/fa-icon', ['exports', 'ember-font-awesome/components/fa-icon'], function (exports, _emberFontAwesomeComponentsFaIcon) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFontAwesomeComponentsFaIcon['default'];
    }
  });
});
define('d-flow-ember/components/fa-list', ['exports', 'ember-font-awesome/components/fa-list'], function (exports, _emberFontAwesomeComponentsFaList) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFontAwesomeComponentsFaList['default'];
    }
  });
});
define('d-flow-ember/components/fa-stack', ['exports', 'ember-font-awesome/components/fa-stack'], function (exports, _emberFontAwesomeComponentsFaStack) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFontAwesomeComponentsFaStack['default'];
    }
  });
});
define('d-flow-ember/components/flow-step', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    tagName: 'tr',
    performingAction: false,

    classNameBindings: ['isNotActivated:default', 'isActivated:warning', 'isRunning:info', 'isFinished:success'],

    isNotActivated: _ember['default'].computed('flowStep.entered_at', function () {
      return !this.get('flowStep.entered_at');
    }),

    isFinished: _ember['default'].computed('flowStep.finished_at', function () {
      return !!this.get('flowStep.finished_at');
    }),

    isRunning: _ember['default'].computed('flowStep.started_at', function () {
      return !!this.get('flowStep.started_at') && !this.get('isFinished');
    }),

    isActivated: _ember['default'].computed('flowStep.entered_at', function () {
      return !!this.get('flowStep.entered_at') && !this.get('isRunning') && !this.get('isFinished');
    }),

    enteredAt: _ember['default'].computed('flowStep.entered_at', function () {
      if (this.get('flowStep.entered_at')) {
        return moment(this.get('flowStep.entered_at')).format("YYYY-MM-DD HH:mm:ss");
      } else {
        return "";
      }
    }),

    startedAt: _ember['default'].computed('flowStep.started_at', function () {
      if (this.get('flowStep.started_at')) {
        return moment(this.get('flowStep.started_at')).format("YYYY-MM-DD HH:mm:ss");
      } else {
        return "";
      }
    }),

    finishedAt: _ember['default'].computed('flowStep.finished_at', function () {
      if (this.get('flowStep.finished_at')) {
        return moment(this.get('flowStep.finished_at')).format("YYYY-MM-DD HH:mm:ss");
      } else {
        return "";
      }
    }),

    paramsString: _ember['default'].computed('flowStep.params', function () {
      return JSON.stringify(this.get('flowStep.params'));
    }),

    flowStepSuccessAction: 'flowStepSuccess',

    actions: {
      flowStepSuccess: function flowStepSuccess(flowStep) {
        this.set('performingAction', true);
        this.sendAction('flowStepSuccessAction', flowStep);
      }
    }
  });
});
define('d-flow-ember/components/flow-table', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    tagName: 'div',

    flowStepsSorted: _ember['default'].computed('flowSteps', function () {
      return this.get('flowSteps').sortBy('step');
    }),

    flowStepSuccessAction: 'flowStepSuccess',

    actions: {
      flowStepSuccess: function flowStepSuccess(id, step) {
        this.sendAction('flowStepSuccessAction', id, step);
      }
    }

  });
});
define('d-flow-ember/components/focus-input', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].TextField.extend({
    becomeFocused: (function () {
      this.$().focus();
    }).on('didInsertElement')
  });
});
define('d-flow-ember/components/icon-link', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    i18n: _ember['default'].inject.service(),
    tagName: 'i',
    text: '',
    classNames: ['fa'],
    attributeBindings: ['title'],
    title: _ember['default'].computed('title', function () {
      if (this.get('titleKey')) {
        return this.get('i18n').t(this.get('titleKey'));
      } else {
        return '';
      }
    })
  });
});
define('d-flow-ember/components/job-activity', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    i18n: _ember['default'].inject.service(),
    tagName: 'tr',

    // Returns a translated event name
    displayedEvent: _ember['default'].computed('activity.event', function () {
      return this.get('i18n').t('activityevent.' + this.get('activity.event'));
    }),

    // Returns a translated message if message begins with '_' or 'STATUS'
    displayedMessage: _ember['default'].computed('activity.message', function () {
      if (this.get('activity.message')) {
        if (this.get('activity.message').charAt(0) === '_') {
          var string = this.get('activity.message').slice(1);
          return this.get('i18n').t('activitymessage.' + string);
        } else {
          return this.get('activity.message');
        }
      } else {
        return "";
      }
    }),

    // Formats date
    displayedDate: _ember['default'].computed('activity.created_at', function () {
      return moment(this.get('activity.created_at')).format("YYYY-MM-DD HH:mm:ss");
    })
  });
});
define('d-flow-ember/components/job-form', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    performingCreate: false,
    isNew: _ember['default'].computed('model.id', function () {
      return !this.get('model.id');
    }),

    currentFlow: _ember['default'].computed('model.flow_id', function () {
      return this.get('flows').findBy('id', this.get('model.flow_id'));
    }),

    actions: {
      create: function create(model) {
        var that = this;
        that.controller.set('performingCreate', true);
        that.store.save('job', model).then(
        // callback function for store to use in case of success
        function () {
          that.triggerAction({ action: 'createSuccess' });
        },
        // callback function for store to use in case of failure
        function (errorObject) {
          that.controller.set('error', errorObject.error);
          that.controller.set('performingCreate', false);
        });
      },
      abort: function abort() {
        this.triggerAction({ action: 'createAbort' });
      }
    }
  });
});
define('d-flow-ember/components/job-row', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    session: _ember['default'].inject.service(),
    tagName: 'tr',
    showTree: true,
    showWorkOrder: true,
    classNameBindings: ['isDone:success', 'isError:danger', 'isProcessing:info', 'isWaitingForAction:warning'],

    isNotStarted: _ember['default'].computed('job.main_status', function () {
      return this.get('job.main_status') === 'NOT_STARTED';
    }),
    isDone: _ember['default'].computed('job.main_status', function () {
      return this.get('job.main_status') === 'DONE';
    }),
    isError: _ember['default'].computed('job.main_status', function () {
      return this.get('job.main_status') === 'ERROR';
    }),
    isProcessing: _ember['default'].computed('job.main_status', function () {
      return this.get('job.main_status') === 'PROCESSING';
    }),
    isWaitingForAction: _ember['default'].computed('job.main_status', function () {
      return this.get('job.main_status') === 'WAITING_FOR_ACTION';
    })
  });
});
define('d-flow-ember/components/json-editor', ['exports', 'ember', 'ember-jsoneditor/components/json-editor'], function (exports, _ember, _emberJsoneditorComponentsJsonEditor) {
  exports['default'] = _emberJsoneditorComponentsJsonEditor['default'];
});
define('d-flow-ember/components/metadata-setter', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    page_type: undefined,
    page_content: undefined,
    select_all: true,
    select_odd: true,
    select_even: true,
    latestSelected: null,

    hasSelected: _ember['default'].computed('packageMetadata.images.@each.selected', function () {
      if (this.get("packageMetadata.images")) {
        return this.get("packageMetadata.images").filter(function (image) {
          return image.selected;
        }).length;
      }
    }),
    setup: (function () {
      $('[data-toggle="tooltip"]').tooltip({
        trigger: 'hover'
      });
    }).on('didRender'),

    actions: {
      /*  generatePageTypes() {
          var that = this;
          this.get('packageMetadata.images').forEach((image, index) =>{
            var even = 'Undefined';
            var odd = 'Undefined';
            var currIndex = index;
            if (this.get('startNr')) {
              if (index < this.get('startNr')-1) {
                return;
              }
              currIndex = index - this.get('startNr') + 1;
            }
            switch (this.get('sequence')) {
              case 'right-left':
                even = 'RightPage';
                odd = 'LeftPage';
                break;
              case 'left-right':
                even = 'LeftPage';
                odd = 'RightPage';
                break;
              case 'right':
                even = 'RightPage';
                odd = 'RightPage';
                break;
              case 'left':
                even = 'LeftPage';
                odd = 'LeftPage';
                break;
              default:
                even = 'Undefined';
                odd = 'Undefined';
            }
            if (currIndex % 2 === 0) {
              Ember.set(image, 'page_type', even);
            } else {
              Ember.set(image, 'page_type', odd);
            }
          })
        },*/

      saveMetaData: function saveMetaData(flowStep) {
        var r = confirm("Är du säker på att du vill spara metadatan?");
        if (r == true) {
          this.get('flowStepSuccess')(flowStep);
          $('#myModal').modal('hide');
        }
      },

      applyMetadataSequence: function applyMetadataSequence() {
        var _this = this;

        this.get('packageMetadata.images').filter(function (item) {
          return item.selected;
        }).forEach(function (image, index) {
          var even = 'Undefined';
          var odd = 'Undefined';
          var currIndex = index;
          switch (_this.get('sequence')) {
            case 'right-left':
              even = 'RightPage';
              odd = 'LeftPage';
              break;
            case 'left-right':
              even = 'LeftPage';
              odd = 'RightPage';
              break;
            default:
              even = undefined;
              odd = undefined;
          }
          if (currIndex % 2 === 0) {
            _ember['default'].set(image, 'page_type', even);
          } else {
            _ember['default'].set(image, 'page_type', odd);
          }
        });
      },
      applyMetadataPhysical: function applyMetadataPhysical() {
        var _this2 = this;

        this.get('packageMetadata.images').forEach(function (image, index) {
          if (image.selected) {
            _ember['default'].set(image, 'page_type', _this2.page_type);
            // Ember.set(image, 'page_content', this.page_content);
          }
        });
      },
      applyMetadataLogical: function applyMetadataLogical() {
        var _this3 = this;

        this.get('packageMetadata.images').forEach(function (image, index) {
          if (image.selected) {
            _ember['default'].set(image, 'page_content', _this3.page_content);
          }
        });
      },
      selectAll: function selectAll() {
        this.get('packageMetadata.images').forEach(function (image, index) {
          _ember['default'].set(image, 'selected', true);
        });
        this.set("latestSelected", null);
      },

      deselectAll: function deselectAll() {
        this.get('packageMetadata.images').forEach(function (image, index) {
          _ember['default'].set(image, 'selected', false);
        });
      }

    }
  });
});
define('d-flow-ember/components/pagination-pager-data', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    tagName: 'div',
    classNames: [],
    pageStart: (function () {
      var currentPage = this.get('pagination.page');
      var perPage = this.get('pagination.per_page');
      if (!perPage) {
        return 0;
      }
      return (currentPage - 1) * perPage + 1;
    }).property('pagination.page', 'pagination.per_page'),
    pageEnd: (function () {
      var currentPage = this.get('pagination.page');
      var perPage = this.get('pagination.per_page');
      var total = this.get('total');
      if (!perPage) {
        return 0;
      }
      var pageEnd = (currentPage - 1) * perPage + perPage;
      if (pageEnd > total) {
        return total;
      } else {
        return pageEnd;
      }
    }).property('pagination.page', 'pagination.per_page', 'total'),
    singleResult: (function () {
      if (this.get('total') === 1) {
        return true;
      }
      return false;
    }).property('total'),
    noResult: (function () {
      if (this.get('total') === 0) {
        return true;
      }
      return false;
    }).property('total')
  });
});
define('d-flow-ember/components/pagination-pager', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    pageArray: (function () {
      var pagePadding = 3; //Pages showing around current selection and at start/end
      var pArray = [];
      var i;
      var p;
      if (4 * pagePadding + 1 > this.get('pagination.pages') - 2) {
        for (i = 0; i < this.get('pagination.pages'); i++) {
          p = { page: i + 1 };
          if (this.get('pagination.page') === i + 1) {
            p['active'] = true;
          }
          pArray.push(p);
        }
        return _ember['default'].ArrayProxy.create({ content: _ember['default'].A(pArray) });
      } else {
        var tmpArray = [];
        var current_page = this.get('pagination.page') - 1;
        var max_page = this.get('pagination.pages') - 1;
        for (i = 0; i < max_page + 1; i++) {
          if (i <= pagePadding - 1 || i >= current_page - pagePadding && i <= current_page + pagePadding || i >= max_page - (pagePadding - 1)) {
            p = { page: i + 1 };
            if (this.get('pagination.page') === i + 1) {
              p['active'] = true;
            }
            tmpArray.push(p);
          } else {
            tmpArray.push({ spacer: true });
          }
        }
        var lastSpacer = false;
        tmpArray.forEach(function (item) {
          if (lastSpacer && item.spacer) {
            return;
          }
          pArray.push(item);
          lastSpacer = item.spacer;
        });
        return _ember['default'].ArrayProxy.create({ content: _ember['default'].A(pArray) });
      }
    }).property('pagination.pages', 'pagination.page')
  });
});
define('d-flow-ember/components/parameter-input', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    prompt: true,
    initValue: (function () {
      this.set('value', this.get('values.' + this.get('parameter.name')));
    }).on('init'),

    isRadio: _ember['default'].computed.equal('parameter.type', 'radio'),
    isText: _ember['default'].computed.equal('parameter.type', 'text'),

    valueObserver: _ember['default'].observer('value', function () {
      this.set('values.' + this.get('parameter.name'), this.get('value'));
    }),

    optionList: _ember['default'].computed('parameter.options', function () {
      return this.get('parameter.options').map(function (option) {
        if (typeof option === "string") {
          return {
            value: option,
            label: option
          };
        } else {
          return option;
        }
      });
    })
  });
});
define('d-flow-ember/components/print-link', ['exports', 'ember', 'd-flow-ember/config/environment'], function (exports, _ember, _dFlowEmberConfigEnvironment) {
  exports['default'] = _ember['default'].Component.extend({
    i18n: _ember['default'].inject.service(),
    tagName: 'a',
    attributeBindings: ['target', 'href', 'title'],
    target: '_blank',
    classNameBindings: ['isButton:btn', 'isButton:navbar-btn'],
    isButton: (function () {
      return this.get('type') === 'button';
    }).property('type'),
    isIcon: (function () {
      return this.get('type') === 'icon';
    }).property('type'),
    href: (function () {
      return _dFlowEmberConfigEnvironment['default'].APP.serviceURL + '/assets/work_order/' + this.get('jobId') + '.pdf';
    }).property('jobId'),
    title: (function () {
      if (this.get('titleKey')) {
        return this.get('i18n').t(this.get('titleKey'));
      } else {
        return '';
      }
    }).property('titleKey')
  });
});
define('d-flow-ember/components/state-groups', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    tagName: 'span',
    classNames: ['navbar-link'],

    inProgress: _ember['default'].computed('stateGroups', function () {
      var actionVal = 0;
      if (this.get('stateGroups.ACTION')) {
        actionVal = this.get('stateGroups.ACTION');
      }
      var processVal = 0;
      if (this.get('stateGroups.PROCESS')) {
        processVal = this.get('stateGroups.PROCESS');
      }
      return actionVal + processVal;
    }),

    start: _ember['default'].computed('stateGroups', function () {
      var val = 0;
      if (this.get('stateGroups.START')) {
        val = this.get('stateGroups.START');
      }
      return val;
    }),

    done: _ember['default'].computed('stateGroups', function () {
      var val = 0;
      if (this.get('stateGroups.FINISH')) {
        val = this.get('stateGroups.FINISH');
      }
      return val;
    })
  });
});
define('d-flow-ember/components/step-row', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    tagName: 'tr',

    enteredAt: _ember['default'].computed('step.entered_at', function () {
      if (this.get('step.entered_at')) {
        return moment(this.get('step.entered_at')).format("YYYY-MM-DD HH:mm:ss");
      } else {
        return "";
      }
    }),

    sinceEntered: _ember['default'].computed('step.entered_at', function () {
      if (this.get('step.entered_at')) {
        return moment(this.get('step.entered_at')).fromNow();
      } else {
        return "";
      }
    }),

    startedAt: _ember['default'].computed('step.started_at', function () {
      if (this.get('step.started_at')) {
        return moment(this.get('step.started_at')).format("YYYY-MM-DD HH:mm:ss");
      } else {
        return "";
      }
    }),

    sinceStarted: _ember['default'].computed('step.started_at', function () {
      if (this.get('step.started_at')) {
        return moment(this.get('step.started_at')).fromNow();
      } else {
        return "";
      }
    })
  });
});
define('d-flow-ember/components/tree-item', ['exports', 'ember', 'd-flow-ember/config/environment'], function (exports, _ember, _dFlowEmberConfigEnvironment) {
  exports['default'] = _ember['default'].Component.extend({
    session: _ember['default'].inject.service(),
    tagName: 'div',
    isExpanded: false,
    parentPath: '',

    byteString: _ember['default'].computed('item.size', function () {
      var size = this.get('item.size');
      var i = -1;
      var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
      do {
        size = size / 1024;
        i++;
      } while (size > 1024);

      return Math.max(size, 0.1).toFixed(1) + byteUnits[i];
    }),

    extension: _ember['default'].computed('item.name', function () {
      return this.get('item.name').split('.').pop();
    }),

    isImage: _ember['default'].computed('extension', function () {
      return ['jpg', 'jpeg', 'tif', 'tiff', 'png', 'jp2'].contains(this.get('extension'));
    }),

    isPdf: _ember['default'].computed('extension', function () {
      return ['pdf'].contains(this.get('extension'));
    }),

    isText: _ember['default'].computed('extension', function () {
      return ['xml', 'txt'].contains(this.get('extension'));
    }),

    isFile: _ember['default'].computed('isImage', 'isPdf', 'isText', function () {
      return !this.isImage && !this.isPdf && !this.isText;
    }),

    path: _ember['default'].computed('parentPath', 'item.name', function () {
      return this.get('parentPath') + this.get('item.name') + '/';
    }),

    fileUrl: _ember['default'].computed('item', function () {
      var token = this.get('session.data.authenticated.token');
      return _dFlowEmberConfigEnvironment['default'].APP.serviceURL + '/assets/file?file_path=' + this.get('parentPath') + this.get('item.name') + '&token=' + token;
    }),

    icon: _ember['default'].computed('isImage', 'isPdf', 'isFile', 'isText', function () {
      if (this.get('isImage')) {
        return 'fa-file-image-o';
      } else if (this.get('isPdf')) {
        return 'fa-file-pdf-o';
      } else if (this.get('isText')) {
        return 'fa-file-text-o';
      } else if (this.get('isFile')) {
        return 'fa-file-o';
      }
    }),

    actions: {
      toggle: function toggle() {
        this.toggleProperty('isExpanded');
      }
    }
  });
});
define('d-flow-ember/components/x-option', ['exports', 'emberx-select/components/x-option'], function (exports, _emberxSelectComponentsXOption) {
  exports['default'] = _emberxSelectComponentsXOption['default'];
});
define('d-flow-ember/components/x-select', ['exports', 'emberx-select/components/x-select'], function (exports, _emberxSelectComponentsXSelect) {
  exports['default'] = _emberxSelectComponentsXSelect['default'];
});
define('d-flow-ember/components/xml-link', ['exports', 'ember', 'd-flow-ember/config/environment'], function (exports, _ember, _dFlowEmberConfigEnvironment) {
  exports['default'] = _ember['default'].Component.extend({
    tagName: 'a',
    attributeBindings: ['target', 'href'],
    target: '_blank',
    href: (function () {
      return _dFlowEmberConfigEnvironment['default'].APP.serviceURL + '/api/jobs/' + this.get('jobId') + '.xml';
    }).property('jobId')
  });
});
define("d-flow-ember/controllers/application", ["exports", "ember"], function (exports, _ember) {
  exports["default"] = _ember["default"].Controller.extend({
    session: _ember["default"].inject.service(),
    ticket: null,
    queryParams: ["ticket"]
  });
});
define('d-flow-ember/controllers/flows/index', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({

    actions: {
      create: function create() {
        var that = this;
        var flow = { name: moment().format('YYYY-MM-DD_HH_mm_ss') + "_NEW_FLOW" };
        this.store.save('flow', flow).then(function (response) {
          that.transitionToRoute('flows.show.edit', response.id);
        });
      }
    }
  });
});
define('d-flow-ember/controllers/flows/show/edit', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    modes: ['tree', 'code'],
    steps_mode: 'code',
    parameters_mode: 'code',
    folder_paths_mode: 'code',

    actions: {
      save: function save(model) {
        var that = this;
        this.set('savingMessage', 'Sparar...');
        this.store.save('flow', model).then(function () {
          that.set('errors', null);
          that.set('savingMessage', 'Sparat!');
          that.send('refreshApplication');
        }, function (response) {
          that.set('errors', response.error.errors);
          that.set('savingMessage', 'Kunde inte spara!');
        });
      }

    }

  });
});
define('d-flow-ember/controllers/flows/show/index', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({

    flow_steps_json: _ember['default'].computed('model.flow_steps', function () {
      return JSON.stringify(this.get('model.flow_steps'), null, 4);
    }),

    parameters_json: _ember['default'].computed('model.parameters', function () {
      return JSON.stringify(this.get('model.parameters'), null, 4);
    }),

    folder_paths_json: _ember['default'].computed('model.folder_paths', function () {
      return JSON.stringify(this.get('model.folder_paths'), null, 4);
    }),

    actions: {
      'delete': function _delete(model) {
        var that = this;
        var confirm = window.confirm('Är du säker på att du vill radera flödet helt och hållet? Det kommer att försvinna från listan!');
        if (confirm) {
          this.store.destroy('flow', model.id).then(function () {
            that.transitionToRoute('flows.index');
          });
        }
      }
    }
  });
});
define('d-flow-ember/controllers/jobs/index', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    application: _ember['default'].inject.controller(),
    queryParams: ['page', 'query', 'quarantined', 'state'],
    stateSelection: _ember['default'].computed.alias('application.stateSelection'),
    page: 1,
    query: "",
    state: null,
    quarantined: ""
  });
});
define('d-flow-ember/controllers/jobs/queue', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({});
});
define('d-flow-ember/controllers/jobs/show', ['exports', 'ember', 'd-flow-ember/config/environment'], function (exports, _ember, _dFlowEmberConfigEnvironment) {
  exports['default'] = _ember['default'].Controller.extend({
    session: _ember['default'].inject.service(),
    application: _ember['default'].inject.controller(),
    flowSelection: _ember['default'].computed.alias('application.flowSelection'),
    flows: _ember['default'].computed.alias('application.flows'),
    open: '',
    setFlowParams: _ember['default'].computed.equal('model.flow_step.process', 'ASSIGN_FLOW_PARAMETERS'),

    metadataIsOpen: _ember['default'].computed.equal('open', 'metadata'),
    jobActivityIsOpen: _ember['default'].computed.equal('open', 'job_activity'),
    filesIsOpen: _ember['default'].computed.equal('open', 'files'),
    flowIsOpen: _ember['default'].computed.equal('open', 'flow'),
    pubLogIsOpen: _ember['default'].computed.equal('open', 'pub_log'),
    recreateFlow: true,

    numberOfPages: _ember['default'].computed('model', function () {
      return this.get("model.package_metadata.image_count");
    }),

    showMetadata: _ember['default'].computed('model.flow_step', function () {
      if (this.get("model.flow_step.process") === "ASSIGN_METADATA" && this.get("model.flow_step.params.manual")) {
        return true;
      }
      return false;
    }),

    pdfUrl: _ember['default'].computed('model', function () {
      var token = this.get('session.data.authenticated.token');
      return _dFlowEmberConfigEnvironment['default'].APP.serviceURL + '/assets/file?file_path=' + this.get('model.flow_step.parsed_params.pdf_file_path') + '&token=' + token;
    }),

    currentFlow: _ember['default'].computed('model.flow_id', function () {
      return this.get('flows').findBy('id', this.get('model.flow_id'));
    }),

    isPriorityNormal: _ember['default'].computed('model.priority', function () {
      return this.get('model.priority') == 2;
    }),
    isPriorityHigh: _ember['default'].computed('model.priority', function () {
      return this.get('model.priority') == 1;
    }),
    isPriorityLow: _ember['default'].computed('model.priority', function () {
      return this.get('model.priority') == 3;
    }),

    flowStepItems: _ember['default'].computed('model.flow', 'model.flow_steps', 'model.current_flow_step', function () {
      var flowStepItems = [];
      for (var y = 0; y < this.get('model.flow_steps').sortBy('step').length; y++) {
        var flowStep = this.get('model.flow_steps')[y];
        var prefix = '';
        if (flowStep.finished_at) {
          prefix = '-';
        }
        if (flowStep.step === this.get('model.current_flow_step')) {
          prefix = '*';
        }
        var label = prefix + flowStep.step + ". " + flowStep.description;
        var item = { label: label, value: parseInt(flowStep.step) };
        flowStepItems.pushObject(item);
      }
      return flowStepItems.sortBy('value');
    }),

    actions: {
      flowStepSuccess: function flowStepSuccess(flowStep) {
        this.send('flowStepSuccessDoStuff', this.get('model'), flowStep);
      },
      setOpen: function setOpen(string) {
        var _this = this;

        this.set('open', string);
        if (string === 'files') {
          if (!this.get('files')) {
            this.set('filesLoading', true);
            var job_id = this.get('model.id');
            this.store.find('file', { job_id: job_id }).then(function (files) {
              _this.set('files', files);
              _this.set('filesLoading', false);
            });
          }
        }
      }
    }

  });
});
define('d-flow-ember/controllers/jobs/show/edit', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    application: _ember['default'].inject.controller(),
    copyrightSelection: _ember['default'].computed.alias('application.copyrightSelection'),
    flowSelection: _ember['default'].computed.alias('application.flowSelection'),
    flows: _ember['default'].computed.alias('application.flows')
  });
});
define('d-flow-ember/controllers/login', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    session: _ember['default'].inject.service(),
    application: _ember['default'].inject.controller(),

    actions: {
      authenticate: function authenticate() {
        var _this = this;

        var _getProperties = this.getProperties('identification', 'password');

        var identification = _getProperties.identification;
        var password = _getProperties.password;

        this.get('session').authenticate('authenticator:gub', { identification: identification, password: password })['catch'](function (reason) {
          _this.set('errorMessage', reason.error || reason);
        });
      }
    }
  });
});
define('d-flow-ember/controllers/node/show', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    session: _ember['default'].inject.service(),
    application: _ember['default'].inject.controller(),
    stateSelection: _ember['default'].computed.alias('application.stateSelection'),
    queryParams: ['page', 'query', 'quarantined', 'state'],
    page: 1,
    query: "",
    quarantined: "",
    state: null,
    isRoot: _ember['default'].computed.empty('model.id')
  });
});
define('d-flow-ember/controllers/node/show/jobs/import', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    application: _ember['default'].inject.controller(),
    node: _ember['default'].inject.controller('node/show'),
    copyrightSelection: _ember['default'].computed.alias('application.copyrightSelection'),
    flowSelection: _ember['default'].computed.alias('application.flowSelection'),
    sourceSelection: _ember['default'].computed.alias('application.sourceSelection'),
    importId: null,

    isAborted: _ember['default'].computed.equal('progress.state', 'ABORTED'),
    isDone: _ember['default'].computed.equal('progress.state', 'DONE'),
    isRunning: _ember['default'].computed.equal('progress.state', 'RUNNING'),
    jobError: _ember['default'].computed.equal('progress.action', 'JOB_ERROR'),

    currentFlow: _ember['default'].computed('model.flow_id', function () {
      return this.get('application.flows').findBy('id', this.get('model.flow_id'));
    }),

    actions: {
      importFile: function importFile(model) {
        var that = this;
        this.set('progress', null);
        this.store.save('script', {
          process_name: "IMPORT_JOBS",
          params: {
            copyright: model.copyright,
            treenode_id: that.get('node.model.id'),
            flow_id: model.flow_id,
            source_name: model.source_name,
            file_path: model.file_path,
            flow_parameters: model.flow_parameters
          }
        }).then(function (response) {
          that.set('process_id', response.id);
          that.send('updateStatus', response.id);
        }, function (error) {
          that.set('error', error.error);
        });
      },
      updateStatus: function updateStatus(process_id) {
        var that = this;
        this.store.find('script', process_id).then(function (response) {
          that.set('progress', response);
          var fetch_again = true;
          if (response.state === "DONE") {
            fetch_again = false;
            that.set('preventUpdate', true);
            that.send('refreshModel', that.get('node.model.id'));
          }
          if (response.state === "ABORTED") {
            fetch_again = false;
          }

          if (fetch_again) {
            _ember['default'].run.later(function () {
              that.send('updateStatus', process_id);
            }, 1000);
          }
        });
      }
    }
  });
});
define('d-flow-ember/controllers/node/show/jobs/source', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    application: _ember['default'].inject.controller(),
    sourceSelection: _ember['default'].computed.alias('application.sourceSelection'),

    isDC: _ember['default'].computed.equal('model.source', 'dc')
  });
});
define('d-flow-ember/controllers/node/show/jobs/source/new', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    application: _ember['default'].inject.controller(),
    copyrightSelection: _ember['default'].computed.alias('application.copyrightSelection'),
    flowSelection: _ember['default'].computed.alias('application.flowSelection'),
    flows: _ember['default'].computed.alias('application.flows')
  });
});
define('d-flow-ember/controllers/queuemanager', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    meta: {},
    lastFlowStepArray: _ember['default'].computed('model.last_flow_step', function () {
      var array = _ember['default'].A();
      array.pushObject(this.get('model.last_flow_step'));
      return array;
    }),
    abortedAt: _ember['default'].computed('model.aborted_at', function () {
      if (this.get('model.aborted_at')) {
        return moment(this.get('model.aborted_at')).format("YYYY-MM-DD HH:mm:ss");
      } else {
        return "";
      }
    }),

    startedAt: _ember['default'].computed('model.started_at', function () {
      if (this.get('model.started_at')) {
        return moment(this.get('model.started_at')).format("YYYY-MM-DD HH:mm:ss");
      } else {
        return "";
      }
    }),

    finishedAt: _ember['default'].computed('model.finished_at', function () {
      if (this.get('model.finished_at')) {
        return moment(this.get('model.finished_at')).format("YYYY-MM-DD HH:mm:ss");
      } else {
        return "";
      }
    }),

    canStart: _ember['default'].computed('meta.can_start', 'disable', function () {
      if (this.get('meta.can_start') && !this.get('disable')) {
        return true;
      } else {
        return false;
      }
    }),

    canStop: _ember['default'].computed('meta.can_stop', 'disable', function () {
      if (this.get('meta.can_stop') && !this.get('disable')) {
        return true;
      } else {
        return false;
      }
    })
  });
});
define('d-flow-ember/controllers/statistics', ['exports', 'ember', 'd-flow-ember/config/environment'], function (exports, _ember, _dFlowEmberConfigEnvironment) {
  exports['default'] = _ember['default'].Controller.extend({

    session: _ember['default'].inject.service(),
    i18n: _ember['default'].inject.service(),

    isPollingStarted: _ember['default'].computed.gt('pollCounter', 0),

    actions: {

      // If the user has supplied valid dates, and agreed to the generated file name,
      // createJobDataForStatisticsFile tells (indirectly) the backend through the
      // statistics api to run the EXPORT_JOB_DATA_FOR_STATISTICS process. The process
      // runs a database query to generate the info for the job data for statistics Excel
      // file, and then creates the file. While createJobDataForStatisticsFile waits for
      // the file to get ready for download, it polls the server through the statistics
      // api with the process id serving as file id. When the server returns build state
      // READY_FOR_DOWNLOAD, the file download button is displayed on screen and the
      // user can download the file through the statistics api, i.e. outside of the
      // control of this action.

      createJobDataForStatisticsFile: function createJobDataForStatisticsFile(startDate, endDate) {

        if (!this.validateDateInputs(startDate, endDate)) {
          return;
        }

        var fileName = this.buildFileName(startDate, endDate);
        var sheetName = this.buildSheetName(startDate, endDate);

        if (!confirm(this.buildConfirmMessage(fileName))) {
          return;
        }

        // The date inputs are valid, the setup is done, and the user wants to continue...

        this.prepareAttributesForNewRun();

        // Send a request (indirectly) to the backend to start building the file...
        var that = this;
        this.store.save('statistics', {
          process_name: 'EXPORT_JOB_DATA_FOR_STATISTICS',
          params: {
            start_date: startDate,
            end_date: endDate,
            file_name: fileName,
            sheet_name: sheetName
          }
        })
        // ... and poll for a file ready for download status
        .then(function (response) {
          console.log(response);
          that.pollToCheckIfFileIsReadyForDownload(response.id);
        }, function (error) {
          that.set('error', error.error);
          that.set('statusMessage', this.t('statistics.file_creation_error'));
        });
      }
    },

    prepareAttributesForNewRun: function prepareAttributesForNewRun() {
      this.set('fileCreationButtonDisabled', true);
      this.set('statusMessage', '');
      this.set('fileReadyForDownload', false);
      this.set('fileUrl', '');
      this.set('pollCounter', 0);
    },

    // Polls the backend asking if the file is ready for download. The process id
    // (integer) is used as file id, i.e. the file does not have an id of its own
    pollToCheckIfFileIsReadyForDownload: function pollToCheckIfFileIsReadyForDownload(processAndFileId) {
      var interval = arguments.length <= 1 || arguments[1] === undefined ? this.get('pollInterval') : arguments[1];

      // If we know that the file is ready for download or we have encountered an error, we stop polling
      if (this.get('fileReadyForDownload') || this.get('error') != null) {
        return;
      }
      // Otherwise we poll the backend...
      this.checkIfFileIsReadyForDownload(processAndFileId);
      this.increasePollCounter();
      // ... and schedule a recursive call
      _ember['default'].run.later(this, function () {
        this.pollToCheckIfFileIsReadyForDownload(processAndFileId, interval);
      }, interval);
    },

    increasePollCounter: function increasePollCounter() {
      this.set('pollCounter', this.get('pollCounter') + 1);
    },

    // Check if the file is ready for download, and set relevant attributes if it is,
    // in order to stop the polling and prepare the user interface for download
    checkIfFileIsReadyForDownload: function checkIfFileIsReadyForDownload(processAndFileId) {
      var that = this;
      this.store.find('statistics', processAndFileId, {}).then(function (response) {
        that.setStatusMessageFromBuildStatus(that, response.build_status);
        if (response.build_status === 'READY_FOR_DOWNLOAD') {
          that.set('fileCreationButtonDisabled', false);
          that.set('fileReadyForDownload', true);
          var token = that.get('session.data.authenticated.token');
          that.set('fileUrl', _dFlowEmberConfigEnvironment['default'].APP.serviceURL.concat('/api/statistics/download/' + processAndFileId, '?token=' + token));
        }
      }, function (error) {
        that.set('error', error.error);
        that.set('statusMessage', this.t('statistics.file_creation_error'));
      });
    },

    // Set status messages based on the build status names coming from the backend
    setStatusMessageFromBuildStatus: function setStatusMessageFromBuildStatus(that, buildStatus) {
      var statusMessage = that.get('statusMessage');
      statusMessage = buildStatus === 'QUERYING_DATABASE' && String(statusMessage).startsWith(String(this.tbs('QUERYING_DATABASE'))) ? statusMessage + '.' : this.tbs(buildStatus);
      that.set('statusMessage', statusMessage);
    },

    // [T]ranslate [b]uild [s]tatus names coming from the backend
    tbs: function tbs(buildStatus) {
      switch (buildStatus) {
        case 'INITIALIZING':
          return this.t('statistics.build_status.initializing');
        case 'QUERYING_DATABASE':
          return this.t('statistics.build_status.querying_database');
        case 'DATABASE_QUERIED':
          return this.t('statistics.build_status.database_queried');
        case 'WORKBOOK_BUILT':
          return this.t('statistics.build_status.workbook_built');
        case 'XLS_DATA_OUTPUT':
          return this.t('statistics.build_status.xls_data_output');
        case 'READY_FOR_DOWNLOAD':
          return this.t('statistics.build_status.ready_for_download');
        default:
          return '';
      }
    },

    validateDateInputs: function validateDateInputs(startDate, endDate) {

      // Validate the start date
      if (!moment(startDate, this.get('dateFormat'), true).isValid()) {
        this.set('validationErrorStartDate', true);
        alert(this.t('statistics.start_date_alert'));
        return false;
      }
      this.set('validationErrorStartDate', false);

      // Validate the end date
      if (!moment(endDate, this.get('dateFormat'), true).isValid()) {
        this.set('validationErrorEndDate', true);
        alert(this.t('statistics.end_date_alert'));
        return false;
      }
      this.set('validationErrorEndDate', false);

      // Both the dates are correct
      return true;
    },

    // Build a file name for the Excel file
    // e.g. "dFlow-statistikdata_2019-01-01_till_2019-01-31_(uttaget_2019-03-26_14.09.15).xls"
    buildFileName: function buildFileName(startDate, endDate) {
      var now = moment().format(this.t('statistics.file_name.now_format').string);
      var fileNameParts = [];
      fileNameParts[0] = this.t('statistics.file_name.header');
      fileNameParts[1] = startDate;
      fileNameParts[2] = this.t('statistics.file_name.until');
      fileNameParts[3] = endDate;
      fileNameParts[4] = "(" + this.t('statistics.file_name.extracted');
      fileNameParts[5] = now + ").xls";
      return fileNameParts.join('_');
    },

    // Build a message that asks the user to confirm that the creation of a file with the
    // given filename should proceed. The reason for having such a dialog is not the
    // naming of the file, but to prevent that accidental clicking of the create file button
    // will lead to unnecessary activity on the server and waiting times for the user.
    // A request may take a long time to fulfill.
    buildConfirmMessage: function buildConfirmMessage(fileName) {
      return ["\n" + this.t('statistics.confirm_create_file'), "\"" + fileName + "\"\n\n"].join("\n\n");
    },

    // Build a sheet name for the (only) sheet in the workbook
    // e.g. "2019-01-01 till 2019-01-31"
    buildSheetName: function buildSheetName(startDate, endDate) {
      return [startDate, this.t('statistics.file_name.until'), endDate].join(' ');
    },

    // Shortcut for translation
    t: function t(translation_node) {
      return this.get('i18n').t(translation_node);
    }

  });
});
define('d-flow-ember/controllers/users/index', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    session: _ember['default'].inject.service()
  });
});
define('d-flow-ember/controllers/users/index/edit', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    application: _ember['default'].inject.controller(),
    roleSelection: _ember['default'].computed.alias('application.roleSelection')
  });
});
define('d-flow-ember/controllers/users/index/new', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    application: _ember['default'].inject.controller(),
    roleSelection: _ember['default'].computed.alias('application.roleSelection')
  });
});
define("d-flow-ember/helpers/markdown-text", ["exports", "ember"], function (exports, _ember) {
  exports.markdownText = markdownText;

  function markdownText(params) {
    var value = params[0];
    value = value || "";
    value = value.replace(/\n/g, '  \n');
    return new _ember["default"].Handlebars.SafeString(markdown.toHTML(value));
  }

  exports["default"] = _ember["default"].Helper.helper(markdownText);
});
define('d-flow-ember/helpers/pluralize', ['exports', 'ember-inflector/lib/helpers/pluralize'], function (exports, _emberInflectorLibHelpersPluralize) {
  exports['default'] = _emberInflectorLibHelpersPluralize['default'];
});
define('d-flow-ember/helpers/singularize', ['exports', 'ember-inflector/lib/helpers/singularize'], function (exports, _emberInflectorLibHelpersSingularize) {
  exports['default'] = _emberInflectorLibHelpersSingularize['default'];
});
define('d-flow-ember/helpers/t', ['exports', 'ember-i18n/helper'], function (exports, _emberI18nHelper) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberI18nHelper['default'];
    }
  });
});
define('d-flow-ember/initializers/app-version', ['exports', 'ember-cli-app-version/initializer-factory', 'd-flow-ember/config/environment'], function (exports, _emberCliAppVersionInitializerFactory, _dFlowEmberConfigEnvironment) {
  exports['default'] = {
    name: 'App Version',
    initialize: (0, _emberCliAppVersionInitializerFactory['default'])(_dFlowEmberConfigEnvironment['default'].APP.name, _dFlowEmberConfigEnvironment['default'].APP.version)
  };
});
define('d-flow-ember/initializers/container-debug-adapter', ['exports', 'ember-resolver/container-debug-adapter'], function (exports, _emberResolverContainerDebugAdapter) {
  exports['default'] = {
    name: 'container-debug-adapter',

    initialize: function initialize() {
      var app = arguments[1] || arguments[0];

      app.register('container-debug-adapter:main', _emberResolverContainerDebugAdapter['default']);
      app.inject('container-debug-adapter:main', 'namespace', 'application:main');
    }
  };
});
define('d-flow-ember/initializers/data-adapter', ['exports'], function (exports) {
  /*
    This initializer is here to keep backwards compatibility with code depending
    on the `data-adapter` initializer (before Ember Data was an addon).
  
    Should be removed for Ember Data 3.x
  */

  exports['default'] = {
    name: 'data-adapter',
    before: 'store',
    initialize: function initialize() {}
  };
});
define('d-flow-ember/initializers/ember-cli-rails-addon-csrf', ['exports', 'ember'], function (exports, _ember) {
  var $ = _ember['default'].$;
  exports['default'] = {
    name: 'ember-cli-rails-addon-csrf',

    initialize: function initialize() {
      $.ajaxPrefilter(function (options, originalOptions, xhr) {
        var token = $('meta[name="csrf-token"]').attr('content');
        xhr.setRequestHeader('X-CSRF-Token', token);
      });
    }
  };
});
define('d-flow-ember/initializers/ember-data', ['exports', 'ember-data/setup-container', 'ember-data'], function (exports, _emberDataSetupContainer, _emberData) {

  /*
  
    This code initializes Ember-Data onto an Ember application.
  
    If an Ember.js developer defines a subclass of DS.Store on their application,
    as `App.StoreService` (or via a module system that resolves to `service:store`)
    this code will automatically instantiate it and make it available on the
    router.
  
    Additionally, after an application's controllers have been injected, they will
    each have the store made available to them.
  
    For example, imagine an Ember.js application with the following classes:
  
    ```app/services/store.js
    import DS from 'ember-data';
  
    export default DS.Store.extend({
      adapter: 'custom'
    });
    ```
  
    ```app/controllers/posts.js
    import { Controller } from '@ember/controller';
  
    export default Controller.extend({
      // ...
    });
  
    When the application is initialized, `ApplicationStore` will automatically be
    instantiated, and the instance of `PostsController` will have its `store`
    property set to that instance.
  
    Note that this code will only be run if the `ember-application` package is
    loaded. If Ember Data is being used in an environment other than a
    typical application (e.g., node.js where only `ember-runtime` is available),
    this code will be ignored.
  */

  exports['default'] = {
    name: 'ember-data',
    initialize: _emberDataSetupContainer['default']
  };
});
define("d-flow-ember/initializers/ember-i18n", ["exports", "d-flow-ember/instance-initializers/ember-i18n"], function (exports, _dFlowEmberInstanceInitializersEmberI18n) {
  exports["default"] = {
    name: _dFlowEmberInstanceInitializersEmberI18n["default"].name,

    initialize: function initialize() {
      var application = arguments[1] || arguments[0]; // depending on Ember version
      if (application.instanceInitializer) {
        return;
      }

      _dFlowEmberInstanceInitializersEmberI18n["default"].initialize(application);
    }
  };
});
define('d-flow-ember/initializers/ember-simple-auth', ['exports', 'ember', 'd-flow-ember/config/environment', 'ember-simple-auth/configuration', 'ember-simple-auth/initializers/setup-session', 'ember-simple-auth/initializers/setup-session-service'], function (exports, _ember, _dFlowEmberConfigEnvironment, _emberSimpleAuthConfiguration, _emberSimpleAuthInitializersSetupSession, _emberSimpleAuthInitializersSetupSessionService) {
  exports['default'] = {
    name: 'ember-simple-auth',
    initialize: function initialize(registry) {
      var config = _dFlowEmberConfigEnvironment['default']['ember-simple-auth'] || {};
      config.baseURL = _dFlowEmberConfigEnvironment['default'].baseURL;
      _emberSimpleAuthConfiguration['default'].load(config);

      (0, _emberSimpleAuthInitializersSetupSession['default'])(registry);
      (0, _emberSimpleAuthInitializersSetupSessionService['default'])(registry);
    }
  };
});
define('d-flow-ember/initializers/export-application-global', ['exports', 'ember', 'd-flow-ember/config/environment'], function (exports, _ember, _dFlowEmberConfigEnvironment) {
  exports.initialize = initialize;

  function initialize() {
    var application = arguments[1] || arguments[0];
    if (_dFlowEmberConfigEnvironment['default'].exportApplicationGlobal !== false) {
      var theGlobal;
      if (typeof window !== 'undefined') {
        theGlobal = window;
      } else if (typeof global !== 'undefined') {
        theGlobal = global;
      } else if (typeof self !== 'undefined') {
        theGlobal = self;
      } else {
        // no reasonable global, just bail
        return;
      }

      var value = _dFlowEmberConfigEnvironment['default'].exportApplicationGlobal;
      var globalName;

      if (typeof value === 'string') {
        globalName = value;
      } else {
        globalName = _ember['default'].String.classify(_dFlowEmberConfigEnvironment['default'].modulePrefix);
      }

      if (!theGlobal[globalName]) {
        theGlobal[globalName] = application;

        application.reopen({
          willDestroy: function willDestroy() {
            this._super.apply(this, arguments);
            delete theGlobal[globalName];
          }
        });
      }
    }
  }

  exports['default'] = {
    name: 'export-application-global',

    initialize: initialize
  };
});
define('d-flow-ember/initializers/inject-store', ['exports', 'd-flow-ember/models/store'], function (exports, _dFlowEmberModelsStore) {
  exports['default'] = {
    name: 'inject-store',
    initialize: function initialize(app) {
      app.register('store:main', _dFlowEmberModelsStore['default']);
      app.inject('route', 'store', 'store:main');
      app.inject('controller', 'store', 'store:main');
      app.inject('component', 'store', 'store:main');
    }
  };
});
define('d-flow-ember/initializers/injectStore', ['exports'], function (exports) {
  /*
    This initializer is here to keep backwards compatibility with code depending
    on the `injectStore` initializer (before Ember Data was an addon).
  
    Should be removed for Ember Data 3.x
  */

  exports['default'] = {
    name: 'injectStore',
    before: 'store',
    initialize: function initialize() {}
  };
});
define('d-flow-ember/initializers/store', ['exports'], function (exports) {
  /*
    This initializer is here to keep backwards compatibility with code depending
    on the `store` initializer (before Ember Data was an addon).
  
    Should be removed for Ember Data 3.x
  */

  exports['default'] = {
    name: 'store',
    after: 'ember-data',
    initialize: function initialize() {}
  };
});
define('d-flow-ember/initializers/transforms', ['exports'], function (exports) {
  /*
    This initializer is here to keep backwards compatibility with code depending
    on the `transforms` initializer (before Ember Data was an addon).
  
    Should be removed for Ember Data 3.x
  */

  exports['default'] = {
    name: 'transforms',
    before: 'store',
    initialize: function initialize() {}
  };
});
define("d-flow-ember/instance-initializers/ember-data", ["exports", "ember-data/initialize-store-service"], function (exports, _emberDataInitializeStoreService) {
  exports["default"] = {
    name: "ember-data",
    initialize: _emberDataInitializeStoreService["default"]
  };
});
define("d-flow-ember/instance-initializers/ember-i18n", ["exports", "ember", "ember-i18n/stream", "ember-i18n/legacy-helper", "d-flow-ember/config/environment"], function (exports, _ember, _emberI18nStream, _emberI18nLegacyHelper, _dFlowEmberConfigEnvironment) {
  exports["default"] = {
    name: 'ember-i18n',

    initialize: function initialize(appOrAppInstance) {
      if (_emberI18nLegacyHelper["default"] != null) {
        (function () {
          // Used for Ember < 1.13
          var i18n = appOrAppInstance.container.lookup('service:i18n');

          i18n.localeStream = new _emberI18nStream["default"](function () {
            return i18n.get('locale');
          });

          _ember["default"].addObserver(i18n, 'locale', i18n, function () {
            this.localeStream.value(); // force the stream to be dirty
            this.localeStream.notify();
          });

          _ember["default"].HTMLBars._registerHelper('t', _emberI18nLegacyHelper["default"]);
        })();
      }
    }
  };
});
define('d-flow-ember/instance-initializers/ember-simple-auth', ['exports', 'ember-simple-auth/instance-initializers/setup-session-restoration'], function (exports, _emberSimpleAuthInstanceInitializersSetupSessionRestoration) {
  exports['default'] = {
    name: 'ember-simple-auth',
    initialize: function initialize(instance) {
      (0, _emberSimpleAuthInstanceInitializersSetupSessionRestoration['default'])(instance);
    }
  };
});
define("d-flow-ember/locales/en/translations", ["exports"], function (exports) {
  exports["default"] = {
    other_lang: 'en',
    main: {
      title: "DFLOW",
      description: "Flödeshantering för digitalisering - Göteborgs Unviversitetsbibliotek"
    },
    menu: {
      login: "Logga in",
      logout: "Logga ut",
      nodes: "Bläddra",
      logged_in_as: "Inloggad som:",
      statistics: "Statistik",
      users: "Användare",
      jobs: "Jobblista",
      quarantine: "Karantän"
    },
    statistics: {
      create_file: "Skapa statistikunderlag",
      start_date: "Startdatum",
      start_date_placeholder: "åååå-mm-dd",
      start_date_alert: "Startdatumet måste vara ett giltigt datum på formen 'ÅÅÅÅ-MM-DD'",
      end_date: "Slutdatum",
      end_date_placeholder: "åååå-mm-dd",
      end_date_alert: "Slutdatumet måste vara ett giltigt datum på formen 'ÅÅÅÅ-MM-DD'",
      start_creation: "Skapa fil",
      download_file: "Ladda ned fil",
      confirm_create_file: "Välj OK om du vill skapa följande fil:",
      file_name: {
        header: "dFlow-statistikdata",
        until: "till",
        extracted: "uttaget",
        now_format: "YYYY-MM-DD_HH.mm.ss"
      },
      build_status: {
        initializing: "Förbereder",
        querying_database: "Kör databasfråga",
        database_queried: "Resultat erhållet från databasen. Skapar arbetsbok",
        workbook_built: "Arbetsbok skapad",
        xls_data_output: "Xls-data utskrivet till IO",
        ready_for_download: "Klart för nedladdning"
      },
      file_creation_error: "Kunde inte skapa filen."
    },
    login: {
      password: "Lösenord",
      username: "Användarnamn",
      login: "Logga in",
      casLogin: "Logga in med CAS"
    },
    nodes: {
      id: "ID",
      name: "Namn",
      "new": "Skapa ny katalog",
      create: "Spara",
      creating: "Sparar",
      edit: "Redigera",
      update: "Spara ändringar",
      updating: "Sparar ändringar",
      cancel: "Avbryt",
      children: {
        header: "Kataloger"
      },
      root: "Topp",
      new_parent_id: "ID på ny förälder",
      move_confirm_root: "Är du säker på att du vill flytta katalogen till toppnivå?",
      move_root_denied: "Du har inte rätt att flytta kataloger till toppnivå!",
      move_confirm: "Är du säker på att du vill flytta katalogen till",
      move_parent_not_found: "Kunde inte hitta destinationskatalogen",
      "delete": "Radera katalogen",
      deleting: "Raderar katalogen",
      generalError: "Det uppstod ett fel när katalogen skulle flyttas eller raderas",
      confirm_delete: "Är du säker på att du vill radera katalogen och ALLA dess underliggande kataloger och jobb från systemet?",
      hasActionStates: "Innehåller jobb som väntar på manuell åtgärd"
    },
    users: {
      id: "ID",
      header: "Användare",
      name: "Namn",
      username: "Användarnamn",
      role: "Roll",
      email: "E-post",
      "new": "Skapa ny användare",
      create: "Skapa användare",
      edit: "Redigera",
      update: "Spara ändringar",
      cancel: "Avbryt",
      "delete": "Radera användare",
      confirm_delete: "Är du säker på att du vill radera användaren från systemet?"
    },
    sources: {
      formlabel: "Källa",
      id: "ID",
      name: "Namn",
      label: "etikett",
      fetch: "Hämta",
      dc: {
        title: "DC Title",
        creator: "DC Creator",
        subject: "DC Subject",
        description: "DC Description",
        publisher: "DC Publisher",
        contributor: "DC Contributor",
        date: "DC Date",
        type: "DC Type",
        format: "DC Format",
        identifier: "DC Identifier",
        source: "DC Source",
        language: "DC Language",
        relation: "DC Relation",
        coverage: "DC Coverage",
        rights: "DC Rights"
      }
    },
    jobs: {
      header: "Jobb",
      "new": "Skapa jobb",
      cancel: "Avbryt",
      source: "Källa",
      catalog_id: "ID",
      name: "Namn",
      title: "Titel",
      author: "Författare",
      copyright: "Copyright",
      priority: "Prioritet",
      comment: "Kommentarer",
      object_info: "Objektinformation",
      id: "ID",
      idMissing: "Ogiltigt jobb-ID",
      edit: "Redigera",
      save: "Spara",
      saving: "Sparar",
      breadcrumb: "Placering",
      copyright_values: {
        'unselected': "Välj",
        'true': "Får EJ publiceras",
        'false': "Får publiceras"
      },
      priority_values: {
        "normal": "Normal",
        "high": "Hög",
        "low": "Låg",
        "none": "Ingen"
      },
      search: "Sök",
      searchById: "Jobb-ID",
      print: "Utskrift",
      start: "Starta digitalisering",
      "delete": "Radera jobb",
      confirm_delete: "Är du säker på att du vill radera jobbet från systemet?",
      pdfLink: "Öppna PDF",
      type_of_record: {
        label: "Typ",
        am: "Monografi",
        as: "Periodika",
        tm: "Handskrift"
      },
      status: "Status",
      state: "Läge",
      message: "Meddelande",
      statuses: {
        waiting_for_digitizing: "Väntar på digitalisering",
        digitizing: "Digitalisering pågår",
        post_processing: "Efterbearbetning",
        post_processing_user_input: "Manuell efterbearbetning",
        quality_control: "Kvalitetskontroll",
        waiting_for_package_metadata_import: "Väntar på metadataimport",
        package_metadata_import: "Importerar metadata",
        mets_control: "Metskontroll",
        mets_production: "Metsproduktion",
        waiting_for_mets_control: "Väntar på metskontroll",
        done: "Klar!"
      },
      history: "Historik",
      other: "Övrigt",
      xml: "XML",
      files: "Filer",
      loadingFiles: "Fillista hämtas...",
      noFiles: "Inga filer att visa.",
      ordinality: "Ordinalitet",
      chronology: "Kronologi",
      key: "Nyckel",
      value: "Värde",
      ordOneKeyPH: "Ex. Årg.",
      ordTwoKeyPH: "Ex. Nr.",
      ordThreeKeyPH: "",
      ordOneValuePH: "Ex. 13",
      ordTwoValuePH: "Ex. 42",
      ordThreeValuePH: "",
      chronOneKeyPH: "Ex. År",
      chronTwoKeyPH: "Ex. Månad",
      chronThreeKeyPH: "Ex. Dag",
      chronOneValuePH: "Ex. 1934",
      chronTwoValuePH: "Ex. 42",
      chronThreeValuePH: "Ex. 12",
      quarantine: "Sätt i karantän",
      unQuarantine: "Ta ur karantän",
      qualityControl: "Kvalitetskontroll OK",
      restart: "Starta om jobb",
      preview: "Förhandsgranskning",
      flow: "Flöde",
      flowStep: "Flödessteg",
      number_of_images: "Antal sidor",
      metadata: "Metadata",
      publicationLog: "Publiceringslogg",
      states: {
        start: "Ej påbörjade",
        inProgress: "Pågående",
        done: "Klara",
        START: "Ej påbörjad",
        FINISH: "Klar",
        PROCESS: "Under arbete",
        ACTION: "Väntar på manuell hantering",
        WAITFOR: "Väntar på filer"
      }
    },
    activityevent: {
      STATUS: 'Byte av status',
      CREATE: 'Jobb skapat',
      QUARANTINE: 'Satt i karantän',
      UNQUARANTINE: 'Plockats ur karantän',
      RESTART: 'Startats om',
      STARTED: 'Flödessteg aktiverat',
      FINISHED: 'Flödessteg klart!',
      FLOW_STEP: 'Nytt flödessteg',
      SKIPPED: 'Hoppat över steg!'
    },
    activitymessage: {
      UNQUARANTINED: '',
      ACTIVITY_CREATED: ''
    },
    paginator: {
      showing: "Visar",
      of: "av",
      hit: "träff",
      hits: "träffar",
      noHits: "Sökningen gav inga träffar!",
      page: "sida",
      pages: "sidor"
    },
    flowStep: {
      startedSince: "Startad: ",
      waitingSince: "Aktiverad: ",
      step: "ID",
      description: "Namn",
      process: "Processtyp",
      params: "Parametrar",
      goto_true: "Gå till (sant)",
      goto_false: "Gå till (falskt)",
      entered_at: "Aktiverad",
      started_at: "Startad",
      finished_at: "Avslutad",
      manual_finish: "Avsluta manuellt",
      set_new_flow_step: "Byt flödessteg"
    }
  };
});
define("d-flow-ember/locales/sv/translations", ["exports"], function (exports) {
  exports["default"] = {
    other_lang: 'en',
    main: {
      title: "DFLOW",
      description: "Flödeshantering för digitalisering - Göteborgs Unviversitetsbibliotek"
    },
    menu: {
      login: "Logga in",
      logout: "Logga ut",
      nodes: "Bläddra",
      logged_in_as: "Inloggad som:",
      statistics: "Statistik",
      users: "Användare",
      jobs: "Jobblista",
      quarantine: "Karantän"
    },
    statistics: {
      create_file: "Skapa statistikunderlag",
      start_date: "Startdatum",
      start_date_placeholder: "åååå-mm-dd",
      start_date_alert: "Startdatumet måste vara ett giltigt datum på formen 'ÅÅÅÅ-MM-DD'",
      end_date: "Slutdatum",
      end_date_placeholder: "åååå-mm-dd",
      end_date_alert: "Slutdatumet måste vara ett giltigt datum på formen 'ÅÅÅÅ-MM-DD'",
      start_creation: "Skapa fil",
      download_file: "Ladda ned fil",
      confirm_create_file: "Välj OK om du vill skapa följande fil:",
      file_name: {
        header: "dFlow-statistikdata",
        until: "till",
        extracted: "uttaget",
        now_format: "YYYY-MM-DD_HH.mm.ss"
      },
      build_status: {
        initializing: "Förbereder",
        querying_database: "Kör databasfråga",
        database_queried: "Resultat erhållet från databasen. Skapar arbetsbok",
        workbook_built: "Arbetsbok skapad",
        xls_data_output: "Xls-data utskrivet till IO",
        ready_for_download: "Klart för nedladdning"
      },
      file_creation_error: "Kunde inte skapa filen."
    },
    login: {
      password: "Lösenord",
      username: "Användarnamn",
      login: "Logga in",
      casLogin: "Logga in med CAS"
    },
    nodes: {
      id: "ID",
      name: "Namn",
      "new": "Skapa ny katalog",
      create: "Spara",
      creating: "Sparar",
      edit: "Redigera",
      update: "Spara ändringar",
      updating: "Sparar ändringar",
      cancel: "Avbryt",
      children: {
        header: "Kataloger"
      },
      root: "Topp",
      new_parent_id: "ID på ny förälder",
      move_confirm_root: "Är du säker på att du vill flytta katalogen till toppnivå?",
      move_root_denied: "Du har inte rätt att flytta kataloger till toppnivå!",
      move_confirm: "Är du säker på att du vill flytta katalogen till",
      move_parent_not_found: "Kunde inte hitta destinationskatalogen",
      "delete": "Radera katalogen",
      deleting: "Raderar katalogen",
      generalError: "Det uppstod ett fel när katalogen skulle flyttas eller raderas",
      confirm_delete: "Är du säker på att du vill radera katalogen och ALLA dess underliggande kataloger och jobb från systemet?",
      hasActionStates: "Innehåller jobb som väntar på manuell åtgärd"
    },
    users: {
      id: "ID",
      header: "Användare",
      name: "Namn",
      username: "Användarnamn",
      role: "Roll",
      email: "E-post",
      "new": "Skapa ny användare",
      create: "Skapa användare",
      edit: "Redigera",
      update: "Spara ändringar",
      cancel: "Avbryt",
      "delete": "Radera användare",
      confirm_delete: "Är du säker på att du vill radera användaren från systemet?",
      password: "Lösenord",
      password_confirmation: "Bekräfta lösenord"
    },
    sources: {
      formlabel: "Källa",
      id: "ID",
      name: "Namn",
      label: "etikett",
      fetch: "Hämta",
      dc: {
        title: "DC Title",
        creator: "DC Creator",
        subject: "DC Subject",
        description: "DC Description",
        publisher: "DC Publisher",
        contributor: "DC Contributor",
        date: "DC Date",
        type: "DC Type",
        format: "DC Format",
        identifier: "DC Identifier",
        source: "DC Source",
        language: "DC Language",
        relation: "DC Relation",
        coverage: "DC Coverage",
        rights: "DC Rights"
      }
    },
    jobs: {
      header: "Jobb",
      "import": "Importera jobb",
      file_path: "Filsökväg",
      node_name: "Katalognamn",
      import_success: "Korrekta jobb",
      import_file_error_row: "Fel på radnummer",
      import_running: "Import pågår",
      import_finished: "Import klar",
      import_aborted: "Import avbruten p g a fel",
      "new": "Skapa jobb",
      cancel: "Avbryt",
      source: "Källa",
      catalog_id: "ID",
      name: "Namn",
      title: "Titel",
      author: "Författare",
      copyright: "Copyright",
      priority: "Prioritet",
      comment: "Kommentarer",
      object_info: "Objektinformation",
      id: "ID",
      idMissing: "Ogiltigt jobb-ID",
      edit: "Redigera",
      save: "Spara",
      saving: "Sparar",
      breadcrumb: "Placering",
      copyright_values: {
        'unselected': "Välj",
        'true': "Får EJ publiceras",
        'false': "Får publiceras"
      },
      priority_values: {
        "normal": "Normal",
        "high": "Hög",
        "low": "Låg",
        "none": "Ingen"
      },
      search: "Sök",
      searchById: "Jobb-ID",
      print: "Utskrift",
      start: "Starta digitalisering",
      "delete": "Radera jobb",
      confirm_delete: "Är du säker på att du vill radera jobbet från systemet?",
      pdfLink: "Öppna PDF",
      type_of_record: {
        label: "Typ",
        am: "Monografi",
        as: "Periodika",
        tm: "Handskrift"
      },
      status: "Status",
      state: "Läge",
      message: "Meddelande",
      statuses: {
        waiting_for_digitizing: "Väntar på digitalisering",
        digitizing: "Digitalisering pågår",
        post_processing: "Efterbearbetning",
        post_processing_user_input: "Manuell efterbearbetning",
        quality_control: "Kvalitetskontroll",
        waiting_for_package_metadata_import: "Väntar på metadataimport",
        package_metadata_import: "Importerar metadata",
        mets_control: "Metskontroll",
        mets_production: "Metsproduktion",
        waiting_for_mets_control: "Väntar på metskontroll",
        done: "Klar!"
      },
      history: "Historik",
      other: "Övrigt",
      xml: "XML",
      files: "Filer",
      loadingFiles: "Fillista hämtas...",
      noFiles: "Inga filer att visa.",
      ordinality: "Ordinalitet",
      chronology: "Kronologi",
      key: "Nyckel",
      value: "Värde",
      ordOneKeyPH: "Ex. Årg.",
      ordTwoKeyPH: "Ex. Nr.",
      ordThreeKeyPH: "",
      ordOneValuePH: "Ex. 13",
      ordTwoValuePH: "Ex. 42",
      ordThreeValuePH: "",
      chronOneKeyPH: "Ex. År",
      chronTwoKeyPH: "Ex. Månad",
      chronThreeKeyPH: "Ex. Dag",
      chronOneValuePH: "Ex. 1934",
      chronTwoValuePH: "Ex. 42",
      chronThreeValuePH: "Ex. 12",
      quarantine: "Sätt i karantän",
      unQuarantine: "Ta ur karantän",
      qualityControl: "Kvalitetskontroll OK",
      restart: "Starta om jobb",
      preview: "Förhandsgranskning",
      flow: "Flöde",
      flowStep: "Flödessteg",
      number_of_images: "Antal sidor",
      metadata: "Metadata",
      publicationLog: "Publiceringslogg",
      states: {
        start: "Ej påbörjade",
        inProgress: "Pågående",
        done: "Klara",
        START: "Ej påbörjad",
        FINISH: "Klar",
        PROCESS: "Under arbete",
        ACTION: "Väntar på manuell hantering",
        WAITFOR: "Väntar på filer"
      }
    },
    activityevent: {
      STATUS: 'Byte av status',
      CREATE: 'Jobb skapat',
      QUARANTINE: 'Satt i karantän',
      UNQUARANTINE: 'Plockats ur karantän',
      RESTART: 'Startats om',
      STARTED: 'Flödessteg aktiverat',
      FINISHED: 'Flödessteg klart!',
      FLOW_STEP: 'Nytt flödessteg',
      SKIPPED: 'Hoppat över steg!'
    },
    activitymessage: {
      UNQUARANTINED: '',
      ACTIVITY_CREATED: ''
    },
    paginator: {
      showing: "Visar",
      of: "av",
      hit: "träff",
      hits: "träffar",
      noHits: "Sökningen gav inga träffar!",
      page: "sida",
      pages: "sidor"
    },
    flowStep: {
      startedSince: "Startad: ",
      waitingSince: "Aktiverad: ",
      step: "ID",
      description: "Namn",
      process: "Processtyp",
      params: "Parametrar",
      goto_true: "Gå till (sant)",
      goto_false: "Gå till (falskt)",
      entered_at: "Aktiverad",
      started_at: "Startad",
      finished_at: "Avslutad",
      manual_finish: "Avsluta manuellt",
      set_new_flow_step: "Byt flödessteg"
    }
  };
});
define('d-flow-ember/mixins/in-view-port', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Mixin.create({
    scrollTimeout: 100,
    boundingClientRect: 0,
    windowHeight: 0,
    windowWidth: 0,
    enteredViewport: Em.computed('boundingClientRect', 'windowHeight', 'windowWidth', function () {
      var rect, windowHeight, windowWidth;
      rect = this.get('boundingClientRect');
      windowHeight = this.get('windowHeight');
      windowWidth = this.get('windowWidth');
      //console.log(rect.height)
      return rect.top >= -200 - rect.height && rect.left >= 0 && rect.bottom <= windowHeight + 200 + rect.height && rect.right <= windowWidth;
    }),
    exitedViewport: Em.computed.not('enteredViewport'),
    _updateBoundingClientRect: function _updateBoundingClientRect() {
      var el;
      el = this.$()[0];
      this.set('boundingClientRect', el.getBoundingClientRect());
    },
    _setup: (function () {
      return Em.run.scheduleOnce('afterRender', this, function () {
        this._updateBoundingClientRect();
        this.set('windowHeight', window.innerHeight || document.documentElement.clientHeight);
        this.set('windowWidth', window.innerWidth || document.documentElement.clientWidth);
      });
    }).on('didInsertElement'),
    _scrollHandler: function _scrollHandler() {
      return Em.run.debounce(this, '_updateBoundingClientRect', this.get('scrollTimeout'));
    },
    _bindScroll: (function () {
      var scrollHandler;
      scrollHandler = this._scrollHandler.bind(this);
      _ember['default'].$(document).on('touchmove.scrollable', scrollHandler);
      _ember['default'].$(window).on('scroll.scrollable', scrollHandler);
    }).on('didInsertElement'),
    _unbindScroll: (function () {
      _ember['default'].$(window).off('.scrollable');
      _ember['default'].$(document).off('.scrollable');
    }).on('willDestroyElement')
  });
});
define('d-flow-ember/models/job', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Object.extend({
    i18n: _ember['default'].inject.service(),
    type_of_record_string: (function () {
      return this.get('i18n').t('jobs.type_of_record.' + this.get('metadata.type_of_record'));
    }).property('metadata'),

    hasTypeOfRecord: _ember['default'].computed('metadata', function () {
      return !!this.get('metadata.type_of_record');
    }),
    status_string: (function () {
      if (this.get('main_status') === "DONE") {
        return this.get('i18n').t('jobs.states.FINISH');
      } else {
        return this.get('status');
      }
    }).property('status'),

    waitingForManualAction: (function () {
      return this.get('flow_step.params.manual');
    }).property('flow_step'),

    sinceStarted: _ember['default'].computed('flow_step.entered_at', 'flow_step.started_at', function () {
      if (this.get('flow_step.entered_at')) {
        if (this.get('flow_step.started_at')) {
          return this.get('i18n').t('flowStep.startedSince') + moment(this.get('flow_step.started_at')).fromNow();
        } else {
          return this.get('i18n').t('flowStep.waitingSince') + moment(this.get('flow_step.entered_at')).fromNow();
        }
      }
    }),

    copyright_string: (function () {
      return this.get('i18n').t('jobs.copyright_values.' + this.get('copyright'));
    }).property('copyright'),

    chronology_string: (function () {
      var string;
      if (this.get('metadata.chron_1_key') && this.get('metadata.chron_1_value')) {
        string = this.get('metadata.chron_1_key') + ' ' + this.get('metadata.chron_1_value');
      }
      if (this.get('metadata.chron_2_key') && this.get('metadata.chron_2_value')) {
        string += ', ' + this.get('metadata.chron_2_key') + ' ' + this.get('metadata.chron_2_value');
      }
      if (this.get('metadata.chron_3_key') && this.get('metadata.chron_3_value')) {
        string += ', ' + this.get('metadata.chron_3_key') + ' ' + this.get('metadata.chron_3_value');
      }
      return string;
    }).property('metadata'),

    ordinality_string: (function () {
      var string;
      if (this.get('metadata.ordinal_1_key') && this.get('metadata.ordinal_1_value')) {
        string = this.get('metadata.ordinal_1_key') + ' ' + this.get('metadata.ordinal_1_value');
      }
      if (this.get('metadata.ordinal_2_key') && this.get('metadata.ordinal_2_value')) {
        string += ', ' + this.get('metadata.ordinal_2_key') + ' ' + this.get('metadata.ordinal_2_value');
      }
      if (this.get('metadata.ordinal_3_key') && this.get('metadata.ordinal_3_value')) {
        string += ', ' + this.get('metadata.ordinal_3_key') + ' ' + this.get('metadata.ordinal_3_value');
      }
      return string;
    }).property('metadata'),

    isDone: _ember['default'].computed.equal('main_status', 'DONE'),
    isError: _ember['default'].computed('main_status', function () {
      return this.get('main_status') === 'ERROR';
    }),
    isProcessing: _ember['default'].computed('main_status', function () {
      return this.get('main_status') === 'PROCESSING';
    }),
    isWaitingForAction: _ember['default'].computed('main_status', function () {
      return this.get('main_status') === 'WAITING_FOR_ACTION' || this.get('main_status') === 'NOT_STARTED';
    })
  });
});
define('d-flow-ember/models/store', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Object.extend({
    adapter: function adapter() {
      //return this.container.lookup('adapter:dflow');
      return _ember['default'].getOwner(this).lookup('adapter:dflow');
    },
    id: function id(id_or_params) {
      if (typeof id_or_params === "number" || typeof id_or_params === "string") {
        return id_or_params;
      } else if (typeof id_or_params === "object") {
        return id_or_params.id;
      } else {
        return null;
      }
    },
    params: function params(id_or_params, maybe_params) {
      if (typeof id_or_params === "number" || typeof id_or_params === "string") {
        return maybe_params;
      } else if (typeof id_or_params === "object") {
        delete id_or_params.id;
        return id_or_params;
      } else {
        return null;
      }
    },
    find: function find(name, id_or_params, maybe_params) {
      if (this.id(id_or_params)) {
        return this.adapter().findOne(name, this.id(id_or_params), this.params(id_or_params, maybe_params));
      } else {
        return this.adapter().findMany(name, this.params(id_or_params, maybe_params));
      }
    },
    save: function save(name, model) {
      if (model.id) {
        return this.adapter().saveUpdate(name, model.id, model);
      } else {
        return this.adapter().saveCreate(name, model);
      }
    },
    destroy: function destroy(name, id) {
      return this.adapter().destroy(name, id);
    }
  });
});
define('d-flow-ember/resolver', ['exports', 'ember-resolver'], function (exports, _emberResolver) {
  exports['default'] = _emberResolver['default'];
});
define('d-flow-ember/router', ['exports', 'ember', 'd-flow-ember/config/environment'], function (exports, _ember, _dFlowEmberConfigEnvironment) {

  var Router = _ember['default'].Router.extend({
    location: _dFlowEmberConfigEnvironment['default'].locationType,
    rootURL: _dFlowEmberConfigEnvironment['default'].rootURL
  });

  Router.map(function () {
    this.route('statistics');
    this.route('queuemanager');
    this.route('node', function () {
      this.route('show', { path: '/:node_id' }, function () {
        this.route('new');
        this.route('edit', { path: '/edit/:id' });
        this.route('jobs', function () {
          this.route('edit', { path: '/edit/:id' });
          this.route('import');
          this.route('source', function () {
            this.route('new');
          });
        });
      });
    });
    this.route('login');
    this.route('users', function () {
      this.route('index', { path: '/' }, function () {
        this.route('new');
        this.route('edit', { path: '/edit/:id' });
      });
    });
    this.route('jobs', function () {
      this.route('show', { path: '/:id' }, function () {
        this.route('edit');
      });
      this.route('queue');
    });
    this.route('flows', function () {
      this.route('show', { path: '/:id' }, function () {
        this.route('edit');
      });
      this.route("new");
    });
  });

  exports['default'] = Router;
});
define('d-flow-ember/routes/application', ['exports', 'ember', 'ember-simple-auth/mixins/application-route-mixin', 'd-flow-ember/config/environment'], function (exports, _ember, _emberSimpleAuthMixinsApplicationRouteMixin, _dFlowEmberConfigEnvironment) {
  exports['default'] = _ember['default'].Route.extend(_emberSimpleAuthMixinsApplicationRouteMixin['default'], {
    i18n: _ember['default'].inject.service(),
    session: _ember['default'].inject.service(),
    casService: function casService() {
      var baseUrl = window.location.origin;
      var routeUrl = this.router.generate('application');
      console.log('routeurl', routeUrl);
      return baseUrl + routeUrl;
    },
    checkLoggedInState: function checkLoggedInState() {
      var that = this;
      var token = this.get('session.data.authenticated.token');
      _ember['default'].run.later(function () {
        if (token) {
          _ember['default'].$.ajax({
            type: 'GET',
            url: _dFlowEmberConfigEnvironment['default'].APP.authenticationBaseURL + '/' + token + '?no_extend=true'
          }).then(function (data) {
            if (data.access_token !== token) {
              that.get('session').invalidate();
            }
          }, function (response) {
            if (response.status === 401) {
              that.get('session').invalidate();
              console.log("User expired", response);
            }
          });
        }
        that.checkLoggedInState();
      }, 1000 * 60 * 10); // Check every 10 minutes
    },
    beforeModel: function beforeModel(transition) {
      var that = this;
      var session = this.get('session');
      var ticket = transition.queryParams.ticket;
      if (ticket) {
        session.authenticate('authenticator:gub', {
          cas_ticket: ticket,
          cas_service: this.casService()
        }).then(null, function (error) {
          that.controllerFor('login').set('error', error);
          that.transitionTo('login');
        });
      }
      return this._super(transition);
    },
    model: function model() {
      var that = this;
      // Used to load data that will not be changed during runtime
      return _ember['default'].RSVP.hash({
        roles: that.store.find('config', 'roles'),
        sources: that.store.find('source'),
        states: that.store.find('config', 'states'),
        casUrl: that.store.find('config', 'cas_url'),
        flows: that.store.find('flow'),
        version_info: that.store.find('config', 'version_info')
      });
    },
    setupController: function setupController(controller, model) {
      // To be able to access from specific controllers
      controller.set('model', {});
      controller.set('ticket', null);
      //console.log(model.roles);
      controller.set('roleSelection', model.roles.roles);
      controller.set('sourceSelection', model.sources.filter(function (source) {
        return !source.hidden;
      }));
      controller.set('copyrightSelection', [{ label: this.get('i18n').t('jobs.copyright_values.unselected'), value: null }, { label: this.get('i18n').t('jobs.copyright_values.true'), value: true }, { label: this.get('i18n').t('jobs.copyright_values.false'), value: false }]);

      var flowSelectionArray = _ember['default'].A([]);
      model.flows.forEach(function (flow) {
        if (flow.selectable) {
          flowSelectionArray.push({ label: flow.name, value: flow.id });
        }
      });
      controller.set('flowSelection', flowSelectionArray);
      controller.set('flows', model.flows);

      var stateItems = [];
      for (var y = 0; y < model.states.states.length; y++) {
        var state = model.states.states[y];
        var item2 = { label: this.get('i18n').t('jobs.states.' + state), value: state };
        stateItems.pushObject(item2);
      }
      controller.set('stateSelection', stateItems);

      // Set CAS login URL
      if (model.casUrl.cas_url) {
        var casLoginUrl = model.casUrl.cas_url + '/login?' + _ember['default'].$.param({ service: this.casService() });
        controller.set('casLoginUrl', casLoginUrl);
      }

      controller.set('version_info', model.version_info);
      this.checkLoggedInState();
    },
    actions: {
      sessionAuthenticationFailed: function sessionAuthenticationFailed(error) {
        this.controllerFor('login').set('error', error);
      },
      showJob: function showJob(job_id) {
        var that = this;
        this.controller.set('job_id', null);
        this.controller.set('job_id_error', null);

        if (job_id) {
          _ember['default'].$("#app-outer").addClass("loading");
          that.store.find('job', job_id).then(function (job) {
            that.transitionTo('jobs.show', job);
          }, function () {
            _ember['default'].$("#app-outer").removeClass("loading");
            that.controller.set('job_id_error', that.get('i18n').t('jobs.idMissing') + ': ' + job_id);
          });
        }
      },
      findJobs: function findJobs(search_term) {
        this.controller.set('search_term', null);
        this.transitionTo('jobs.index', { queryParams: { query: search_term, page: 1, state: null, quarantined: "" } });
      },
      invalidateSession: function invalidateSession() {
        this.get('session').invalidate();
      },
      refreshApplication: function refreshApplication() {
        this.refresh();
      },
      willTransition: function willTransition() {
        this.controller.set('job_id_error', null);
      }
    }
  });
});
define('d-flow-ember/routes/flows/index', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    model: function model() {
      return this.store.find('flow');
    }
  });
});
define('d-flow-ember/routes/flows/new', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({});
});
define('d-flow-ember/routes/flows/show', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    model: function model(id) {
      return this.store.find('flow', id);
    }
  });
});
define('d-flow-ember/routes/flows/show/edit', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    model: function model() {
      return this.modelFor('flows/show');
    }
  });
});
define('d-flow-ember/routes/index', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    beforeModel: function beforeModel() {
      this.transitionTo('node.show', 'root');
    }
  });
});
define('d-flow-ember/routes/jobs/index', ['exports', 'ember', 'd-flow-ember/models/job'], function (exports, _ember, _dFlowEmberModelsJob) {
  exports['default'] = _ember['default'].Route.extend({
    queryParams: {
      page: { refreshModel: true },
      query: { refreshModel: true },
      quarantined: { refreshModel: true },
      state: { refreshModel: true }
    },
    model: function model(params) {
      if (!params.page) {
        params.page = 1;
      }
      return this.store.find('job', params);
    },
    setupController: function setupController(controller, model) {
      var that = this;
      var jobs = _ember['default'].A([]);
      model.forEach(function (job) {
        jobs.pushObject(_dFlowEmberModelsJob['default'].create(_ember['default'].$.extend(job, { container: _ember['default'].getOwner(that) })));
      });
      controller.set('model', jobs);
      controller.set('model.meta', model.meta);

      if (controller.get('page') > controller.get('model.meta.pagination.pages')) {
        controller.transitionToRoute('jobs.index', { queryParams: { page: 1 } });
        controller.set('page', 1);
      }
    }
  });
});
define('d-flow-ember/routes/jobs/queue', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    model: function model() {
      return this.store.find('queue');
    },

    setupController: function setupController(controller, model) {
      controller.set('model', model);
    },

    actions: {
      refreshModel: function refreshModel() {
        this.refresh();
      }
    }
  });
});
define('d-flow-ember/routes/jobs/show', ['exports', 'ember', 'd-flow-ember/models/job'], function (exports, _ember, _dFlowEmberModelsJob) {
  exports['default'] = _ember['default'].Route.extend({
    i18n: _ember['default'].inject.service(),
    beforeModel: function beforeModel() {
      _ember['default'].$("#app-outer").addClass("loading");
    },
    model: function model(params) {
      return this.store.find('job', params.id);
    },
    setupController: function setupController(controller, model) {
      var that = this;
      var job_model;
      _ember['default'].$("#app-outer").removeClass("loading");
      if (!!model.container) {
        job_model = model;
      } else {
        job_model = _dFlowEmberModelsJob['default'].create(_ember['default'].$.extend(model, { container: _ember['default'].getOwner(that) }));
      }
      _ember['default'].run.later(function () {
        controller.set('newFlowStep', model.current_flow_step);
      });
      controller.set('model', job_model);
      controller.set('files', null);
      controller.set('performingManualAction', false);
    },
    actions: {

      // Sets job status to 'digitizing'
      flowStepSuccessDoStuff: function flowStepSuccessDoStuff(job, flowStep) {
        var _this = this;

        this.controller.set('performingManualAction', true);
        // If save param is true, save job first
        if (flowStep.params.save === true) {
          this.store.save('job', job).then(function () {
            _this.store.find('process', job.id, { status: 'success', step: flowStep.step }).then(function () {
              _this.refresh(job.id); // Refresh children of current model
            }, function (errorObject) {
              _this.controller.set('performingManualAction', false);
              _this.controller.set('error', errorObject.error);
            });
          }, function (errorObject) {
            _this.controller.set('performingManualAction', false);
            _this.controller.set('error', errorObject.error);
          });
        } else {
          this.store.find('process', job.id, { status: 'success', step: flowStep.step }).then(function () {
            _this.refresh(job.id); // Refresh children of current model
          }, function (errorObject) {
            _this.controller.set('performingManualAction', false);
            _this.controller.set('error', errorObject.error);
          });
        }
      },

      // Deletes job from database
      deleteJob: function deleteJob(id) {
        var _this2 = this;

        // Send confirmation box before delete
        var should_delete = confirm(this.get('i18n').t("jobs.confirm_delete"));
        if (should_delete) {
          this.store.destroy('job', id).then(function () {
            _this2.transitionTo('index');
          }, function (errorObject) {
            _this2.controller.set('error', errorObject.error);
          });
        }
      },

      // Sets quarantine flag for job
      quarantineJob: function quarantineJob(job, message) {
        var _this3 = this;

        this.store.find('job', job.id + '/quarantine?message=' + message).then(function () {
          _this3.refresh(job.id); // Refresh children of current model
        }, function (errorObject) {
          job.set('quarantined', false);
          _this3.controller.set('error', errorObject.error);
        });
      },

      // Resets quarantine flag for job
      unQuarantineJob: function unQuarantineJob(job) {
        var _this4 = this;

        job.set('current_flow_step', this.controller.get('newFlowStep'));
        this.store.find('job', job.id + '/unquarantine?step=' + job.current_flow_step).then(function () {
          _this4.refresh(job.id); // Refresh children of current model
        }, function (errorObject) {
          job.set('quarantined', true);
          _this4.controller.set('error', errorObject.error);
        });
      },

      // Resets quarantine flag for job
      setFlowStep: function setFlowStep(job, recreateFlow) {
        var _this5 = this;

        job.set('current_flow_step', this.controller.get('newFlowStep'));
        this.store.find('job', job.id + '/new_flow_step?step=' + job.current_flow_step + '&recreate_flow=' + recreateFlow).then(function () {
          _this5.refresh(job.id); // Refresh children of current model
        }, function (errorObject) {
          _this5.controller.set('error', errorObject.error);
        });
      },

      // Restarts job, sets to first status and moves packagefiles to trash
      restartJob: function restartJob(job, message, recreateFlow) {
        var _this6 = this;

        job.set('message', message);
        this.store.find('job', job.id + '/restart?message=' + message + "&recreate_flow=" + recreateFlow).then(function () {
          _this6.refresh(job.id); // Refresh children of current model
        }, function (errorObject) {
          _this6.controller.set('error', errorObject.error);
        });
      },

      refreshModel: function refreshModel() {
        this.refresh();
      }
    }
  });
});
define('d-flow-ember/routes/jobs/show/edit', ['exports', 'ember'], function (exports, _ember) {
	exports['default'] = _ember['default'].Route.extend({
		model: function model() {
			// get the model data from the upstream source form
			return this.modelFor('jobs.show');
		},
		//setupController: function(controller, model) {
		//  var that = this;
		//  controller.set('model', Job.create(Ember.$.extend(model, {container: Ember.getOwner(that)})));
		//},
		actions: {
			createSuccess: function createSuccess() {
				this.send('refreshModel');
				this.transitionTo('jobs.show');
			},
			createAbort: function createAbort() {
				this.transitionTo('jobs.show');
			}
		}
	});
});
define('d-flow-ember/routes/node/show', ['exports', 'ember', 'd-flow-ember/models/job'], function (exports, _ember, _dFlowEmberModelsJob) {
  exports['default'] = _ember['default'].Route.extend({
    queryParams: {
      page: { refreshModel: true },
      query: { refreshModel: true },
      state: { refreshModel: true }
    },
    model: function model(params) {
      if (!params.page) {
        params.page = 1;
      }
      return _ember['default'].RSVP.hash({
        treenode: this.store.find('treenode', params.node_id, {
          show_children: true,
          show_breadcrumb: true
        }),
        jobs: this.store.find('job', params)
      });
    },
    setupController: function setupController(controller, model) {
      var that = this;
      model.treenode.breadcrumb.push({ name: model.treenode.name });
      controller.set('model', model.treenode);
      if (model.treenode.id) {
        var jobs = _ember['default'].A([]);
        model.jobs.forEach(function (job) {
          jobs.pushObject(_dFlowEmberModelsJob['default'].create(_ember['default'].$.extend(job, { container: _ember['default'].getOwner(that) })));
        });
        controller.set('model.jobs', jobs);
        controller.set('model.jobs.meta', model.jobs.meta);
      }
    },
    actions: {
      // Refresh model to be called from other nested routes/controllers
      refreshModel: function refreshModel(modelId) {
        this.refresh(modelId);
      }
    }
  });
});
define('d-flow-ember/routes/node/show/edit', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    i18n: _ember['default'].inject.service(),
    model: function model(params) {
      return this.store.find('treenode', params.id);
    },

    setupController: function setupController(controller, model) {
      controller.set('model', model);
      controller.set('performingUpdate', false);
      controller.set('performingDelete', false);
    },

    actions: {
      deleteNode: function deleteNode(id) {
        var should_delete = confirm(this.get('i18n').t("nodes.confirm_delete"));
        this.controller.set('performingDelete', true);
        var that = this; // To be used in nested functions
        if (should_delete) {
          this.store.destroy('treenode', id).then(function () {
            that.transitionTo('index');
          }, function (errorObject) {
            that.controller.set('performingDelete', false);
            that.controller.set('error', errorObject.error);
          });
        }
      },
      updateNode: function updateNode(model) {
        var that = this;
        // If we have a new_parent_id, ask user if it actually should be moved
        if (model.new_parent_id && model.new_parent_id !== '') {
          if (model.new_parent_id === 'root') {
            if (!this.get('session.data.authenticated.can_manage_tree_root')) {
              alert(this.get('i18n').t("nodes.move_root_denied"));
              return;
            }
            var should_save = confirm(this.get('i18n').t("nodes.move_confirm_root"));
            if (should_save) {
              model.parent_id = null;
              delete model.new_parent_id;
              this.send('saveNode', model);
            }
          } else {
            this.store.find('treenode', model.new_parent_id, { show_breadcrumb: true, show_breadcrumb_as_string: true }).then(
            // Fetch parent we want to move object to
            function (new_model) {
              var should_save = confirm(that.get('i18n').t("nodes.move_confirm") + "\n" + new_model.breadcrumb);
              if (should_save) {
                model.parent_id = model.new_parent_id;
                delete model.new_parent_id;
                that.send('saveNode', model);
              }
            },
            // Failed to fetch parent (no such node?)
            function () {
              alert(that.get('i18n').t("nodes.move_parent_not_found"));
            });
          }
        } else {
          this.send('saveNode', model);
        }
      },
      saveNode: function saveNode(model) {
        var that = this; // To be used in nested functions
        this.controller.set('performingUpdate', true);
        this.store.save('treenode', model).then(
        // Success function
        function (model) {
          that.send('refreshModel', model.parent_id); // Refresh children of current model
          that.transitionTo('node.show', model.parent_id);
        },
        // Failed function
        function (errorObject) {
          that.controller.set('performingUpdate', false);
          that.controller.set('error', errorObject.error);
        });
      }
    }
  });
});
define('d-flow-ember/routes/node/show/jobs/import', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    model: function model() {
      return {
        flow_parameters: {}
      };
    },
    setupController: function setupController(controller, model) {
      if (controller.get('preventUpdate')) {
        controller.set('preventUpdate', false);
      } else {
        controller.set('model', model);
        controller.set('error', null);
        controller.set('process_id', null);
      }
    }
  });
});
define('d-flow-ember/routes/node/show/jobs/source', ['exports', 'ember'], function (exports, _ember) {
  // console.log(model.roles);
  // export default Ember.Route.extend({
  //   model: function(params) {
  //     return this.store.find('source');
  //   }
  // });

  exports['default'] = _ember['default'].Route.extend({
    model: function model() {
      var node = this.modelFor('node.show').treenode;
      return { treenode_id: node.id }; // Beginning with this data
    },
    setupController: function setupController(controller, model) {
      controller.set('hasFetchedData', false);
      controller.set('model', model);
      controller.set('model.dc', {});
    },
    actions: {
      fetchSource: function fetchSource(model) {
        var that = this;
        this.store.find('source', model.source, { catalog_id: model.catalog_id, dc: model.dc }).then(function (source_data) {

          console.log(source_data.duplicate);
          if (!source_data.duplicate || source_data.duplicate && confirm('Detta id finns redan i dFLow, vill du gå vidare ändå?')) {
            that.controller.set('model.catalog_id', source_data.catalog_id);
            that.controller.set('model.title', source_data.title);
            that.controller.set('model.author', source_data.author);
            that.controller.set('model.xml', source_data.xml);
            that.controller.set('model.metadata', source_data.metadata);
            that.controller.set('model.is_periodical', source_data.is_periodical);
            that.controller.set('model.source_label', source_data.source_label);
            that.controller.set('model.flow_parameters', {});
            that.controller.set('error', null);
            that.controller.set('hasFetchedData', true);
            that.transitionTo('node.show.jobs.source.new');
          }
        }, function (errorObject) {
          that.controller.set('error', errorObject.error);
        });
      },

      clearFlags: function clearFlags() {
        this.controller.set('hasFetchedData', false);
      }
    }
  });
});
/*
 * source.js
 */
define('d-flow-ember/routes/node/show/jobs/source/new', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    beforeModel: function beforeModel() {
      if (this.modelFor('node.show.jobs.source').catalog_id === undefined) {
        this.transitionTo('node.show.jobs.source');
      }
    },
    model: function model() {
      // get the model data from the upstream source form
      return this.modelFor('node.show.jobs.source');
    },

    deactivate: function deactivate() {
      this.send('clearFlags');
    },

    actions: {
      createSuccess: function createSuccess() {
        this.send('refreshModel');
        this.transitionTo('node.show');
      },
      createAbort: function createAbort() {
        this.transitionTo('node.show');
      }
    }
  });
});
define('d-flow-ember/routes/node/show/new', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    model: function model() {
      var parent = this.modelFor('node.show').treenode;
      return { parent_id: parent.id };
    },
    setupController: function setupController(controller, model) {
      controller.set('model', model);
      controller.set('performingCreate', false);
    },

    actions: {
      createNode: function createNode(model) {
        var that = this; // To be used in nested functions
        this.controller.set('performingCreate', true);
        this.store.save('treenode', model).then(
        // Success function
        function (model) {
          that.send('refreshModel', model.parent_id); // Refresh children of current model
          that.transitionTo('node.show', model.parent_id);
        },
        // Failed function
        function (errorObject) {
          that.controller.set('performingCreate', false);
          that.controller.set('error', errorObject.error);
        });
      }
    }
  });
});
define('d-flow-ember/routes/queuemanager', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    model: function model() {
      return this.store.find('queue_manager');
    },
    updateStatus: function updateStatus(controller) {
      var that = this;
      if (controller.get('updateStatus')) {
        _ember['default'].run.later(function () {
          that.store.find('queue_manager').then(function (model) {
            controller.set('model', model[0]);
            if (model.meta) {
              controller.set('meta', model.meta);
            }
            if (controller.get('disable') > 0) {
              controller.set('disable', controller.get('disable') - 1);
            }
          });
          that.updateStatus(controller);
        }, 1000);
      }
    },
    setupController: function setupController(controller, model) {
      var that = this;
      controller.set('model', model[0]);
      if (model.meta) {
        controller.set('meta', model.meta);
      }
      controller.set('updateStatus', true);
      controller.set('disable', 0);
      this.updateStatus(controller);
    },
    resetController: function resetController(controller) {
      console.log("resetController");
      controller.set('updateStatus', false);
    },
    actions: {
      startQueueManager: function startQueueManager() {
        if (confirm('Är du säker på att du vill starta köhanteraren?')) {
          var that = this;
          this.store.save('queue_manager', {}).then(function () {
            that.controller.set('disable', 3);
          });
        }
      },
      stopQueueManager: function stopQueueManager(pid) {
        if (confirm('Är du säker på att du vill stoppa köhanteraren?')) {
          var that = this;
          this.store.destroy('queue_manager', pid).then(function () {
            that.controller.set('disable', 3);
          });
        }
      }
    }
  });
});
define('d-flow-ember/routes/statistics', ['exports', 'ember'], function (exports, _ember) {
		exports['default'] = _ember['default'].Route.extend({

				setupController: function setupController(controller, model) {

						// Tweakable "constant"
						controller.set('pollInterval', 1000); // milliseconds

						// Non-tweakable "constant"
						controller.set('dateFormat', 'YYYY-MM-DD');

						// Initialization
						controller.set('pollCounter', 0);
						controller.set('error', null);
				}
		});
});
define('d-flow-ember/routes/users/index', ['exports', 'ember', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _ember, _emberSimpleAuthMixinsAuthenticatedRouteMixin) {
  exports['default'] = _ember['default'].Route.extend(_emberSimpleAuthMixinsAuthenticatedRouteMixin['default'], {
    model: function model() {
      return this.store.find('user');
    },
    actions: {
      // Refresh model to be called from other nested routes/controllers
      refreshModel: function refreshModel() {
        this.refresh();
      }
    }
  });
});
define('d-flow-ember/routes/users/index/edit', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    i18n: _ember['default'].inject.service(),
    model: function model(params) {
      return this.store.find('user', params.id);
    },
    setupController: function setupController(controller, model) {
      controller.set('model', model);
      controller.set('error', null);
    },
    actions: {
      saveUser: function saveUser(model) {
        var that = this; // To be used in nested functions
        this.store.save('user', model).then(
        // Success function
        function () {
          that.send('refreshModel'); // Refresh children of current model
          that.transitionTo('users.index');
        },
        // Failed function
        function (errorObject) {
          that.controller.set('error', errorObject.error);
        });
      },
      deleteUser: function deleteUser(id) {
        var that = this;
        // Send confirmation box before delete
        var should_delete = confirm(this.get('i18n').t("users.confirm_delete"));
        if (should_delete) {
          this.store.destroy('user', id).then(function () {
            that.send('refreshModel');
            that.transitionTo('users.index');
          }, function (errorObject) {
            that.controller.set('error', errorObject.error);
          });
        }
      }
    }
  });
});
define('d-flow-ember/routes/users/index/new', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    model: function model() {
      return {}; // Data to include in create form
    },
    setupController: function setupController(controller, model) {
      controller.set('model', model);
      controller.set('error', null);
    },
    actions: {
      createUser: function createUser(model) {
        var that = this; // To be used in nested functions
        this.store.save('user', model).then(
        // Success function
        function () {
          that.send('refreshModel'); // Refresh children of current model
          that.transitionTo('users.index');
        },
        // Failed function
        function (errorObject) {
          that.controller.set('error', errorObject.error);
        });
      }
    }
  });
});
define('d-flow-ember/services/ajax', ['exports', 'ember-ajax/services/ajax'], function (exports, _emberAjaxServicesAjax) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberAjaxServicesAjax['default'];
    }
  });
});
define('d-flow-ember/services/i18n', ['exports', 'ember-i18n/services/i18n'], function (exports, _emberI18nServicesI18n) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberI18nServicesI18n['default'];
    }
  });
});
define('d-flow-ember/services/session', ['exports', 'ember-simple-auth/services/session'], function (exports, _emberSimpleAuthServicesSession) {
  exports['default'] = _emberSimpleAuthServicesSession['default'];
});
define('d-flow-ember/session-stores/application', ['exports', 'ember-simple-auth/session-stores/adaptive'], function (exports, _emberSimpleAuthSessionStoresAdaptive) {
  exports['default'] = _emberSimpleAuthSessionStoresAdaptive['default'].extend();
});
define("d-flow-ember/templates/-menu", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 4,
              "column": 6
            },
            "end": {
              "line": 4,
              "column": 65
            }
          },
          "moduleName": "d-flow-ember/templates/-menu.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["inline", "t", ["main.title"], [], ["loc", [null, [4, 47], [4, 65]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 7,
              "column": 10
            },
            "end": {
              "line": 7,
              "column": 59
            }
          },
          "moduleName": "d-flow-ember/templates/-menu.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["inline", "t", ["menu.nodes"], [], ["loc", [null, [7, 41], [7, 59]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 8,
              "column": 10
            },
            "end": {
              "line": 8,
              "column": 91
            }
          },
          "moduleName": "d-flow-ember/templates/-menu.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["inline", "t", ["menu.jobs"], [], ["loc", [null, [8, 74], [8, 91]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 10,
                "column": 10
              },
              "end": {
                "line": 10,
                "column": 101
              }
            },
            "moduleName": "d-flow-ember/templates/-menu.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["inline", "t", ["menu.quarantine"], [], ["loc", [null, [10, 78], [10, 101]]], 0, 0]],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 11,
                "column": 10
              },
              "end": {
                "line": 11,
                "column": 44
              }
            },
            "moduleName": "d-flow-ember/templates/-menu.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Processkö");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child2 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 12,
                "column": 10
              },
              "end": {
                "line": 12,
                "column": 48
              }
            },
            "moduleName": "d-flow-ember/templates/-menu.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Köhanterare");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 9,
              "column": 6
            },
            "end": {
              "line": 13,
              "column": 6
            }
          },
          "moduleName": "d-flow-ember/templates/-menu.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 0, 0);
          morphs[1] = dom.createMorphAt(dom.childAt(fragment, [3]), 0, 0);
          morphs[2] = dom.createMorphAt(dom.childAt(fragment, [5]), 0, 0);
          return morphs;
        },
        statements: [["block", "link-to", ["jobs.index", ["subexpr", "query-params", [], ["quarantined", "true", "query", ""], ["loc", [null, [10, 34], [10, 76]]], 0, 0]], [], 0, null, ["loc", [null, [10, 10], [10, 113]]]], ["block", "link-to", ["jobs.queue"], [], 1, null, ["loc", [null, [11, 10], [11, 56]]]], ["block", "link-to", ["queuemanager"], [], 2, null, ["loc", [null, [12, 10], [12, 60]]]]],
        locals: [],
        templates: [child0, child1, child2]
      };
    })();
    var child4 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 15,
              "column": 4
            },
            "end": {
              "line": 23,
              "column": 4
            }
          },
          "moduleName": "d-flow-ember/templates/-menu.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "form-group navbar-form navbar-left");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "form-group navbar-form navbar-left");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("span");
          dom.setAttribute(el2, "class", "job-id-error");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element2 = dom.childAt(fragment, [3]);
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          morphs[1] = dom.createMorphAt(element2, 1, 1);
          morphs[2] = dom.createMorphAt(dom.childAt(element2, [3]), 0, 0);
          return morphs;
        },
        statements: [["inline", "input", [], ["enter", "findJobs", "class", "form-control", "value", ["subexpr", "@mut", [["get", "search_term", ["loc", [null, [17, 58], [17, 69]]], 0, 0, 0, 0]], [], [], 0, 0], "placeholder", ["subexpr", "t", ["jobs.search"], [], ["loc", [null, [17, 82], [17, 99]]], 0, 0]], ["loc", [null, [17, 6], [17, 101]]], 0, 0], ["inline", "input", [], ["enter", "showJob", "class", "form-control", "value", ["subexpr", "@mut", [["get", "job_id", ["loc", [null, [20, 57], [20, 63]]], 0, 0, 0, 0]], [], [], 0, 0], "placeholder", ["subexpr", "t", ["jobs.searchById"], [], ["loc", [null, [20, 76], [20, 97]]], 0, 0]], ["loc", [null, [20, 6], [20, 99]]], 0, 0], ["content", "job_id_error", ["loc", [null, [21, 33], [21, 49]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child5 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 28,
                "column": 12
              },
              "end": {
                "line": 28,
                "column": 44
              }
            },
            "moduleName": "d-flow-ember/templates/-menu.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Flöden");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 30,
                  "column": 12
                },
                "end": {
                  "line": 30,
                  "column": 60
                }
              },
              "moduleName": "d-flow-ember/templates/-menu.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["inline", "t", ["menu.statistics"], [], ["loc", [null, [30, 37], [30, 60]]], 0, 0]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 29,
                "column": 8
              },
              "end": {
                "line": 31,
                "column": 8
              }
            },
            "moduleName": "d-flow-ember/templates/-menu.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("li");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 0, 0);
            return morphs;
          },
          statements: [["block", "link-to", ["statistics"], [], 0, null, ["loc", [null, [30, 12], [30, 72]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      var child2 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 32,
                "column": 12
              },
              "end": {
                "line": 32,
                "column": 56
              }
            },
            "moduleName": "d-flow-ember/templates/-menu.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["inline", "t", ["menu.users"], [], ["loc", [null, [32, 38], [32, 56]]], 0, 0]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 26,
              "column": 6
            },
            "end": {
              "line": 34,
              "column": 6
            }
          },
          "moduleName": "d-flow-ember/templates/-menu.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("ul");
          dom.setAttribute(el1, "class", "nav navbar-nav");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("li");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("li");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element1 = dom.childAt(fragment, [1]);
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(dom.childAt(element1, [1]), 0, 0);
          morphs[1] = dom.createMorphAt(element1, 3, 3);
          morphs[2] = dom.createMorphAt(dom.childAt(element1, [5]), 0, 0);
          return morphs;
        },
        statements: [["block", "link-to", ["flows.index"], [], 0, null, ["loc", [null, [28, 12], [28, 56]]]], ["block", "if", [["get", "session.data.authenticated.can_manage_statistics", ["loc", [null, [29, 14], [29, 62]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [29, 8], [31, 15]]]], ["block", "link-to", ["users.index"], [], 2, null, ["loc", [null, [32, 12], [32, 68]]]]],
        locals: [],
        templates: [child0, child1, child2]
      };
    })();
    var child6 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 35,
              "column": 6
            },
            "end": {
              "line": 40,
              "column": 6
            }
          },
          "moduleName": "d-flow-ember/templates/-menu.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("p");
          dom.setAttribute(el1, "class", "navbar-text");
          var el2 = dom.createElement("i");
          dom.setAttribute(el2, "class", "fa fa-user");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("strong");
          var el3 = dom.createTextNode(" ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("a");
          dom.setAttribute(el2, "href", "javascript:void(0)");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [3, 1]);
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1, 1]), 1, 1);
          morphs[1] = dom.createElementMorph(element0);
          morphs[2] = dom.createMorphAt(element0, 0, 0);
          return morphs;
        },
        statements: [["content", "session.data.authenticated.name", ["loc", [null, [36, 64], [36, 99]]], 0, 0, 0, 0], ["element", "action", ["invalidateSession"], [], ["loc", [null, [38, 37], [38, 67]]], 0, 0], ["inline", "t", ["menu.logout"], [], ["loc", [null, [38, 68], [38, 87]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child7 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 42,
                "column": 7
              },
              "end": {
                "line": 42,
                "column": 45
              }
            },
            "moduleName": "d-flow-ember/templates/-menu.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["inline", "t", ["menu.login"], [], ["loc", [null, [42, 27], [42, 45]]], 0, 0]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 40,
              "column": 6
            },
            "end": {
              "line": 44,
              "column": 5
            }
          },
          "moduleName": "d-flow-ember/templates/-menu.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          var el2 = dom.createTextNode("\n       ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n     ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["block", "link-to", ["login"], [], 0, null, ["loc", [null, [42, 7], [42, 57]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 48,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/-menu.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("nav");
        dom.setAttribute(el1, "class", "navbar navbar-default");
        dom.setAttribute(el1, "role", "navigation");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "container-fluid");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "navbar-header");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("ul");
        dom.setAttribute(el3, "class", "nav navbar-nav");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("li");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("li");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("ul");
        dom.setAttribute(el3, "class", "nav navbar-nav navbar-right");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("li");
        var el5 = dom.createElement("a");
        var el6 = dom.createTextNode("Version: ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("   ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element3 = dom.childAt(fragment, [0, 1]);
        var element4 = dom.childAt(element3, [3]);
        var element5 = dom.childAt(element3, [7]);
        var element6 = dom.childAt(element5, [1, 0]);
        var morphs = new Array(9);
        morphs[0] = dom.createMorphAt(dom.childAt(element3, [1]), 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element4, [1]), 0, 0);
        morphs[2] = dom.createMorphAt(dom.childAt(element4, [3]), 0, 0);
        morphs[3] = dom.createMorphAt(element4, 5, 5);
        morphs[4] = dom.createMorphAt(element3, 5, 5);
        morphs[5] = dom.createAttrMorph(element6, 'href');
        morphs[6] = dom.createMorphAt(element6, 1, 1);
        morphs[7] = dom.createMorphAt(element5, 3, 3);
        morphs[8] = dom.createMorphAt(element5, 4, 4);
        return morphs;
      },
      statements: [["block", "link-to", ["index"], ["class", "navbar-brand"], 0, null, ["loc", [null, [4, 6], [4, 77]]]], ["block", "link-to", ["node.show", "root"], [], 1, null, ["loc", [null, [7, 10], [7, 71]]]], ["block", "link-to", ["jobs.index", ["subexpr", "query-params", [], ["quarantined", "", "query", ""], ["loc", [null, [8, 34], [8, 72]]], 0, 0]], [], 2, null, ["loc", [null, [8, 10], [8, 103]]]], ["block", "if", [["get", "session.isAuthenticated", ["loc", [null, [9, 12], [9, 35]]], 0, 0, 0, 0]], [], 3, null, ["loc", [null, [9, 6], [13, 13]]]], ["block", "if", [["get", "session.isAuthenticated", ["loc", [null, [15, 10], [15, 33]]], 0, 0, 0, 0]], [], 4, null, ["loc", [null, [15, 4], [23, 11]]]], ["attribute", "href", ["concat", ["http://github.com/ub-digit/dFlow/commit/", ["get", "version_info.commit", ["loc", [null, [25, 61], [25, 80]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["content", "version_info.version", ["loc", [null, [25, 93], [25, 117]]], 0, 0, 0, 0], ["block", "if", [["get", "session.data.authenticated.can_view_users", ["loc", [null, [26, 12], [26, 53]]], 0, 0, 0, 0]], [], 5, null, ["loc", [null, [26, 6], [34, 13]]]], ["block", "if", [["get", "session.isAuthenticated", ["loc", [null, [35, 12], [35, 35]]], 0, 0, 0, 0]], [], 6, 7, ["loc", [null, [35, 6], [44, 12]]]]],
      locals: [],
      templates: [child0, child1, child2, child3, child4, child5, child6, child7]
    };
  })());
});
define("d-flow-ember/templates/application", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 11,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/application.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "id", "app-outer");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "id", "spinner");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("i");
        dom.setAttribute(el3, "class", "fa fa-circle-o-notch fa-spin");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "container-fluid");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        var morphs = new Array(2);
        morphs[0] = dom.createMorphAt(element0, 3, 3);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [5]), 1, 1);
        return morphs;
      },
      statements: [["inline", "partial", ["menu"], [], ["loc", [null, [6, 0], [6, 18]]], 0, 0], ["content", "outlet", ["loc", [null, [8, 0], [8, 10]]], 0, 0, 0, 0]],
      locals: [],
      templates: []
    };
  })());
});
define("d-flow-ember/templates/components/dscribe-wrapper", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 8,
              "column": 12
            },
            "end": {
              "line": 11,
              "column": 12
            }
          },
          "moduleName": "d-flow-ember/templates/components/dscribe-wrapper.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("img");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("i");
          dom.setAttribute(el1, "class", "fa fa-search");
          dom.setAttribute(el1, "data-toggle", "tooltip");
          dom.setAttribute(el1, "data-placement", "top");
          dom.setAttribute(el1, "title", "Öppna bildfil i nytt fönster");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(1);
          morphs[0] = dom.createAttrMorph(element0, 'src');
          return morphs;
        },
        statements: [["attribute", "src", ["concat", ["data:image/jpeg;base64,", ["get", "small", ["loc", [null, [9, 51], [9, 56]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 47,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/components/dscribe-wrapper.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("  ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "col-xs-12 disable-select");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        var el3 = dom.createTextNode("\n      ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "dscribe-header");
        var el4 = dom.createElement("h4");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("span");
        dom.setAttribute(el4, "class", "icon");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n      ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "row");
        var el4 = dom.createTextNode("\n\n        ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "col-xs-12");
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "image-thumbnail");
        var el6 = dom.createTextNode("\n");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("          ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "col-xs-12");
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "row");
        var el6 = dom.createTextNode("\n            ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6, "class", "col-xs-12");
        var el7 = dom.createTextNode("\n              ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("div");
        dom.setAttribute(el7, "class", "toolbar-physical");
        var el8 = dom.createTextNode("\n                  ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("button");
        dom.setAttribute(el8, "id", "BookCover");
        dom.setAttribute(el8, "data-toggle", "tooltip");
        dom.setAttribute(el8, "data-placement", "top");
        dom.setAttribute(el8, "title", "Omslag");
        var el9 = dom.createElement("i");
        dom.setAttribute(el9, "class", "fas fa-book");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n                  ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("button");
        dom.setAttribute(el8, "id", "LeftPage");
        dom.setAttribute(el8, "data-toggle", "tooltip");
        dom.setAttribute(el8, "data-placement", "top");
        dom.setAttribute(el8, "title", "Vänstersida");
        var el9 = dom.createTextNode(" ");
        dom.appendChild(el8, el9);
        var el9 = dom.createElement("i");
        dom.setAttribute(el9, "class", "fas fa-arrow-alt-circle-left");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n                  ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("button");
        dom.setAttribute(el8, "id", "RightPage");
        dom.setAttribute(el8, "data-toggle", "tooltip");
        dom.setAttribute(el8, "data-placement", "top");
        dom.setAttribute(el8, "title", "Högersida");
        var el9 = dom.createTextNode(" ");
        dom.appendChild(el8, el9);
        var el9 = dom.createElement("i");
        dom.setAttribute(el9, "class", "fas fa-arrow-alt-circle-right");
        dom.appendChild(el8, el9);
        var el9 = dom.createTextNode(" ");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n                  ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("button");
        dom.setAttribute(el8, "id", "DoublePage");
        dom.setAttribute(el8, "data-toggle", "tooltip");
        dom.setAttribute(el8, "data-placement", "top");
        dom.setAttribute(el8, "title", "Uppslag");
        var el9 = dom.createElement("i");
        dom.setAttribute(el9, "class", "fas fa-book-open");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n                  ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("button");
        dom.setAttribute(el8, "id", "FoldOut");
        dom.setAttribute(el8, "data-toggle", "tooltip");
        dom.setAttribute(el8, "data-placement", "top");
        dom.setAttribute(el8, "title", "Utvik");
        var el9 = dom.createTextNode(" ");
        dom.appendChild(el8, el9);
        var el9 = dom.createElement("i");
        dom.setAttribute(el9, "class", "far fa-map");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n                  ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("button");
        dom.setAttribute(el8, "id", "LoosePage");
        dom.setAttribute(el8, "data-toggle", "tooltip");
        dom.setAttribute(el8, "data-placement", "top");
        dom.setAttribute(el8, "title", "Lös sida");
        var el9 = dom.createElement("i");
        dom.setAttribute(el9, "class", "fas fa-scroll");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n                  ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("button");
        dom.setAttribute(el8, "id", "ColorTarget");
        dom.setAttribute(el8, "data-toggle", "tooltip");
        dom.setAttribute(el8, "data-placement", "top");
        dom.setAttribute(el8, "title", "Färgkarta");
        var el9 = dom.createElement("i");
        dom.setAttribute(el9, "class", "fas fa-ruler-horizontal");
        dom.appendChild(el8, el9);
        var el9 = dom.createTextNode(" ");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n              ");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("hr");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "row");
        var el6 = dom.createTextNode("\n            ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6, "class", "col-xs-12");
        var el7 = dom.createTextNode("\n              ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("div");
        dom.setAttribute(el7, "class", " toolbar-logical");
        var el8 = dom.createTextNode("\n                  ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("button");
        dom.setAttribute(el8, "id", "OriginalCover");
        dom.setAttribute(el8, "data-toggle", "tooltip");
        dom.setAttribute(el8, "data-placement", "top");
        dom.setAttribute(el8, "title", "Originalomslag");
        var el9 = dom.createElement("i");
        dom.setAttribute(el9, "class", "fas fa-atlas");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n                  ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("button");
        dom.setAttribute(el8, "id", "TitlePage");
        dom.setAttribute(el8, "data-toggle", "tooltip");
        dom.setAttribute(el8, "data-placement", "top");
        dom.setAttribute(el8, "title", "Titelsida");
        var el9 = dom.createElement("i");
        dom.setAttribute(el9, "class", "fas fa-file-invoice");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n                  ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("button");
        dom.setAttribute(el8, "id", "TableOfContents");
        dom.setAttribute(el8, "data-toggle", "tooltip");
        dom.setAttribute(el8, "data-placement", "top");
        dom.setAttribute(el8, "title", "Innehållsförteckning");
        var el9 = dom.createTextNode(" ");
        dom.appendChild(el8, el9);
        var el9 = dom.createElement("i");
        dom.setAttribute(el9, "class", "fas fa-list");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n                  ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("button");
        dom.setAttribute(el8, "id", "Illustration");
        dom.setAttribute(el8, "data-toggle", "tooltip");
        dom.setAttribute(el8, "data-placement", "top");
        dom.setAttribute(el8, "title", "Illustration");
        var el9 = dom.createTextNode(" ");
        dom.appendChild(el8, el9);
        var el9 = dom.createElement("i");
        dom.setAttribute(el9, "class", "fas fa-pencil-alt");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n                  ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("button");
        dom.setAttribute(el8, "id", "PhotographicIllustration");
        dom.setAttribute(el8, "data-toggle", "tooltip");
        dom.setAttribute(el8, "data-placement", "top");
        dom.setAttribute(el8, "title", "Fotografi");
        var el9 = dom.createElement("i");
        dom.setAttribute(el9, "class", "fas fa-camera");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n                  ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("button");
        dom.setAttribute(el8, "id", "Index");
        dom.setAttribute(el8, "data-toggle", "tooltip");
        dom.setAttribute(el8, "data-placement", "top");
        dom.setAttribute(el8, "title", "Index");
        var el9 = dom.createElement("i");
        dom.setAttribute(el9, "class", "fas fa-sort-alpha-down");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n                  ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("button");
        dom.setAttribute(el8, "id", "EmptyPage");
        dom.setAttribute(el8, "data-toggle", "tooltip");
        dom.setAttribute(el8, "data-placement", "top");
        dom.setAttribute(el8, "title", "Tom sida");
        var el9 = dom.createElement("i");
        dom.setAttribute(el9, "class", "far fa-file");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n              ");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      \n      ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element1 = dom.childAt(fragment, [1, 1]);
        var element2 = dom.childAt(element1, [3]);
        var element3 = dom.childAt(element2, [3]);
        var element4 = dom.childAt(element3, [1, 1, 1]);
        var element5 = dom.childAt(element4, [1]);
        var element6 = dom.childAt(element4, [3]);
        var element7 = dom.childAt(element4, [5]);
        var element8 = dom.childAt(element4, [7]);
        var element9 = dom.childAt(element4, [9]);
        var element10 = dom.childAt(element4, [11]);
        var element11 = dom.childAt(element4, [13]);
        var element12 = dom.childAt(element3, [5, 1, 1]);
        var element13 = dom.childAt(element12, [1]);
        var element14 = dom.childAt(element12, [3]);
        var element15 = dom.childAt(element12, [5]);
        var element16 = dom.childAt(element12, [7]);
        var element17 = dom.childAt(element12, [9]);
        var element18 = dom.childAt(element12, [11]);
        var element19 = dom.childAt(element12, [13]);
        var morphs = new Array(20);
        morphs[0] = dom.createAttrMorph(element1, 'class');
        morphs[1] = dom.createAttrMorph(element1, 'onclick');
        morphs[2] = dom.createMorphAt(dom.childAt(element1, [1, 0]), 0, 0);
        morphs[3] = dom.createMorphAt(dom.childAt(element2, [1, 1]), 1, 1);
        morphs[4] = dom.createAttrMorph(element4, 'onclick');
        morphs[5] = dom.createAttrMorph(element5, 'class');
        morphs[6] = dom.createAttrMorph(element6, 'class');
        morphs[7] = dom.createAttrMorph(element7, 'class');
        morphs[8] = dom.createAttrMorph(element8, 'class');
        morphs[9] = dom.createAttrMorph(element9, 'class');
        morphs[10] = dom.createAttrMorph(element10, 'class');
        morphs[11] = dom.createAttrMorph(element11, 'class');
        morphs[12] = dom.createAttrMorph(element12, 'onclick');
        morphs[13] = dom.createAttrMorph(element13, 'class');
        morphs[14] = dom.createAttrMorph(element14, 'class');
        morphs[15] = dom.createAttrMorph(element15, 'class');
        morphs[16] = dom.createAttrMorph(element16, 'class');
        morphs[17] = dom.createAttrMorph(element17, 'class');
        morphs[18] = dom.createAttrMorph(element18, 'class');
        morphs[19] = dom.createAttrMorph(element19, 'class');
        return morphs;
      },
      statements: [["attribute", "class", ["concat", ["dscribe-wrapper ", ["subexpr", "if", [["get", "image.selected", ["loc", [null, [2, 37], [2, 51]]], 0, 0, 0, 0], "selected"], [], ["loc", [null, [2, 32], [2, 64]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["attribute", "onclick", ["subexpr", "action", ["clickToggleSelect"], ["allowedKeys", "ctrl"], ["loc", [null, [null, null], [2, 123]]], 0, 0], 0, 0, 0, 0], ["content", "image.num", ["loc", [null, [3, 38], [3, 51]]], 0, 0, 0, 0], ["block", "if", [["get", "small", ["loc", [null, [8, 18], [8, 23]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [8, 12], [11, 19]]]], ["attribute", "onclick", ["subexpr", "action", ["catchPhysical"], [], ["loc", [null, [null, null], [17, 78]]], 0, 0], 0, 0, 0, 0], ["attribute", "class", ["concat", ["btn btn-default btn-sm ", ["get", "image.page_type", ["loc", [null, [18, 131], [18, 146]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["attribute", "class", ["concat", ["btn btn-default btn-sm ", ["get", "image.page_type", ["loc", [null, [19, 135], [19, 150]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["attribute", "class", ["concat", ["btn btn-default btn-sm ", ["get", "image.page_type", ["loc", [null, [20, 134], [20, 149]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["attribute", "class", ["concat", ["btn btn-default btn-sm ", ["get", "image.page_type", ["loc", [null, [21, 133], [21, 148]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["attribute", "class", ["concat", ["btn btn-default btn-sm ", ["get", "image.page_type", ["loc", [null, [22, 128], [22, 143]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["attribute", "class", ["concat", ["btn btn-default btn-sm ", ["get", "image.page_type", ["loc", [null, [23, 133], [23, 148]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["attribute", "class", ["concat", ["btn btn-default btn-sm ", ["get", "image.page_type", ["loc", [null, [24, 136], [24, 151]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["attribute", "onclick", ["subexpr", "action", ["catchLogical"], [], ["loc", [null, [null, null], [31, 77]]], 0, 0], 0, 0, 0, 0], ["attribute", "class", ["concat", ["btn btn-default btn-sm ", ["get", "image.page_content", ["loc", [null, [32, 143], [32, 161]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["attribute", "class", ["concat", ["btn btn-default btn-sm ", ["get", "image.page_content", ["loc", [null, [33, 134], [33, 152]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["attribute", "class", ["concat", ["btn btn-default btn-sm ", ["get", "image.page_content", ["loc", [null, [34, 151], [34, 169]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["attribute", "class", ["concat", ["btn btn-default btn-sm ", ["get", "image.page_content", ["loc", [null, [35, 140], [35, 158]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["attribute", "class", ["concat", ["btn btn-default btn-sm ", ["get", "image.page_content", ["loc", [null, [36, 149], [36, 167]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["attribute", "class", ["concat", ["btn btn-default btn-sm ", ["get", "image.page_content", ["loc", [null, [37, 126], [37, 144]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["attribute", "class", ["concat", ["btn btn-default btn-sm ", ["get", "image.page_content", ["loc", [null, [38, 133], [38, 151]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("d-flow-ember/templates/components/flow-step", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 5,
              "column": 2
            },
            "end": {
              "line": 5,
              "column": 84
            }
          },
          "moduleName": "d-flow-ember/templates/components/flow-step.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("strong");
          var el2 = dom.createTextNode("Nästa steg:");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("br");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 2, 2, contextualElement);
          return morphs;
        },
        statements: [["content", "flowStep.goto_true", ["loc", [null, [5, 57], [5, 79]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 6,
              "column": 4
            },
            "end": {
              "line": 6,
              "column": 91
            }
          },
          "moduleName": "d-flow-ember/templates/components/flow-step.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("strong");
          var el2 = dom.createTextNode("Nästa steg (false):");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 2, 2, contextualElement);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["content", "flowStep.goto_false", ["loc", [null, [6, 68], [6, 91]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 11,
              "column": 2
            },
            "end": {
              "line": 13,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/components/flow-step.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("strong");
          var el2 = dom.createTextNode("Avslutad:");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 3, 3, contextualElement);
          return morphs;
        },
        statements: [["content", "finishedAt", ["loc", [null, [12, 31], [12, 45]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 15,
                  "column": 6
                },
                "end": {
                  "line": 17,
                  "column": 6
                }
              },
              "moduleName": "d-flow-ember/templates/components/flow-step.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("        ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("button");
              dom.setAttribute(el1, "class", "btn btn-primary");
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var element0 = dom.childAt(fragment, [1]);
              var morphs = new Array(3);
              morphs[0] = dom.createAttrMorph(element0, 'disabled');
              morphs[1] = dom.createElementMorph(element0);
              morphs[2] = dom.createMorphAt(element0, 0, 0);
              return morphs;
            },
            statements: [["attribute", "disabled", ["get", "performingAction", ["loc", [null, [16, 51], [16, 67]]], 0, 0, 0, 0], 0, 0, 0, 0], ["element", "action", ["flowStepSuccess", ["get", "flowStep", ["loc", [null, [16, 97], [16, 105]]], 0, 0, 0, 0]], [], ["loc", [null, [16, 70], [16, 107]]], 0, 0], ["inline", "t", ["flowStep.manual_finish"], [], ["loc", [null, [16, 108], [16, 138]]], 0, 0]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 14,
                "column": 4
              },
              "end": {
                "line": 18,
                "column": 4
              }
            },
            "moduleName": "d-flow-ember/templates/components/flow-step.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "unless", [["get", "viewMode", ["loc", [null, [15, 16], [15, 24]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [15, 6], [17, 17]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 13,
              "column": 2
            },
            "end": {
              "line": 19,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/components/flow-step.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "if", [["get", "enteredAt", ["loc", [null, [14, 10], [14, 19]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [14, 4], [18, 11]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child4 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 22,
              "column": 2
            },
            "end": {
              "line": 24,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/components/flow-step.hbs"
        },
        isEmpty: false,
        arity: 2,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("strong");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(": ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("br");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 0, 0);
          morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
          return morphs;
        },
        statements: [["content", "key", ["loc", [null, [23, 12], [23, 19]]], 0, 0, 0, 0], ["content", "value", ["loc", [null, [23, 30], [23, 39]]], 0, 0, 0, 0]],
        locals: ["key", "value"],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 28,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/components/flow-step.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("td");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("strong");
        var el3 = dom.createTextNode("ID:");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("br");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("strong");
        var el3 = dom.createTextNode("Namn:");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("br");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("strong");
        var el3 = dom.createTextNode("Typ:");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("br");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("td");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("strong");
        var el3 = dom.createTextNode("Aktiverad:");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("br");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("strong");
        var el3 = dom.createTextNode("Startad:");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("br");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("td");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("td");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("td");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element1 = dom.childAt(fragment, [0]);
        var element2 = dom.childAt(fragment, [2]);
        var morphs = new Array(11);
        morphs[0] = dom.createMorphAt(element1, 3, 3);
        morphs[1] = dom.createMorphAt(element1, 8, 8);
        morphs[2] = dom.createMorphAt(element1, 13, 13);
        morphs[3] = dom.createMorphAt(element1, 16, 16);
        morphs[4] = dom.createMorphAt(element1, 18, 18);
        morphs[5] = dom.createMorphAt(element2, 3, 3);
        morphs[6] = dom.createMorphAt(element2, 8, 8);
        morphs[7] = dom.createMorphAt(element2, 11, 11);
        morphs[8] = dom.createMorphAt(dom.childAt(fragment, [4]), 1, 1);
        morphs[9] = dom.createMorphAt(dom.childAt(fragment, [6]), 0, 0);
        morphs[10] = dom.createMorphAt(dom.childAt(fragment, [8]), 0, 0);
        return morphs;
      },
      statements: [["content", "flowStep.step", ["loc", [null, [2, 23], [2, 40]]], 0, 0, 0, 0], ["content", "flowStep.description", ["loc", [null, [3, 25], [3, 49]]], 0, 0, 0, 0], ["content", "flowStep.process", ["loc", [null, [4, 24], [4, 44]]], 0, 0, 0, 0], ["block", "if", [["get", "flowStep.goto_true", ["loc", [null, [5, 8], [5, 26]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [5, 2], [5, 91]]]], ["block", "if", [["get", "flowStep.goto_false", ["loc", [null, [6, 10], [6, 29]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [6, 4], [6, 98]]]], ["content", "enteredAt", ["loc", [null, [9, 30], [9, 43]]], 0, 0, 0, 0], ["content", "startedAt", ["loc", [null, [10, 28], [10, 41]]], 0, 0, 0, 0], ["block", "if", [["get", "finishedAt", ["loc", [null, [11, 8], [11, 18]]], 0, 0, 0, 0]], [], 2, 3, ["loc", [null, [11, 2], [19, 9]]]], ["block", "each-in", [["get", "flowStep.params", ["loc", [null, [22, 13], [22, 28]]], 0, 0, 0, 0]], [], 4, null, ["loc", [null, [22, 2], [24, 14]]]], ["content", "flowStep.condition", ["loc", [null, [26, 4], [26, 26]]], 0, 0, 0, 0], ["content", "flowStep.status", ["loc", [null, [27, 4], [27, 23]]], 0, 0, 0, 0]],
      locals: [],
      templates: [child0, child1, child2, child3, child4]
    };
  })());
});
define("d-flow-ember/templates/components/flow-table", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 12,
              "column": 4
            },
            "end": {
              "line": 14,
              "column": 4
            }
          },
          "moduleName": "d-flow-ember/templates/components/flow-table.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "flow-step", [], ["flowStep", ["subexpr", "@mut", [["get", "flowStep", ["loc", [null, [13, 25], [13, 33]]], 0, 0, 0, 0]], [], [], 0, 0], "viewMode", ["subexpr", "@mut", [["get", "viewMode", ["loc", [null, [13, 43], [13, 51]]], 0, 0, 0, 0]], [], [], 0, 0]], ["loc", [null, [13, 4], [13, 53]]], 0, 0]],
        locals: ["flowStep"],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 17,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/components/flow-table.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("table");
        dom.setAttribute(el1, "class", "table");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("thead");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("tr");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Flödessteg");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Tidsstämplar");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Parametrar");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Villkor");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Status");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("tbody");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0, 3]), 1, 1);
        return morphs;
      },
      statements: [["block", "each", [["get", "flowStepsSorted", ["loc", [null, [12, 12], [12, 27]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [12, 4], [14, 13]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("d-flow-ember/templates/components/focus-input", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/components/focus-input.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["content", "yield", ["loc", [null, [1, 0], [1, 9]]], 0, 0, 0, 0]],
      locals: [],
      templates: []
    };
  })());
});
define("d-flow-ember/templates/components/icon-link", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 8
          }
        },
        "moduleName": "d-flow-ember/templates/components/icon-link.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["content", "text", ["loc", [null, [1, 0], [1, 8]]], 0, 0, 0, 0]],
      locals: [],
      templates: []
    };
  })());
});
define("d-flow-ember/templates/components/job-activity", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 4,
            "column": 29
          }
        },
        "moduleName": "d-flow-ember/templates/components/job-activity.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("td");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("td");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("td");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("td");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(4);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0]), 0, 0);
        morphs[1] = dom.createMorphAt(dom.childAt(fragment, [2]), 0, 0);
        morphs[2] = dom.createMorphAt(dom.childAt(fragment, [4]), 0, 0);
        morphs[3] = dom.createMorphAt(dom.childAt(fragment, [6]), 0, 0);
        return morphs;
      },
      statements: [["content", "displayedDate", ["loc", [null, [1, 4], [1, 21]]], 0, 0, 0, 0], ["content", "displayedEvent", ["loc", [null, [2, 4], [2, 22]]], 0, 0, 0, 0], ["content", "activity.username", ["loc", [null, [3, 4], [3, 25]]], 0, 0, 0, 0], ["content", "displayedMessage", ["loc", [null, [4, 4], [4, 24]]], 0, 0, 0, 0]],
      locals: [],
      templates: []
    };
  })());
});
define("d-flow-ember/templates/components/job-form", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 3,
              "column": 29
            },
            "end": {
              "line": 3,
              "column": 58
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-form.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["inline", "t", ["jobs.new"], [], ["loc", [null, [3, 42], [3, 58]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 3,
              "column": 58
            },
            "end": {
              "line": 3,
              "column": 83
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-form.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["inline", "t", ["jobs.edit"], [], ["loc", [null, [3, 66], [3, 83]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 10,
                  "column": 28
                },
                "end": {
                  "line": 10,
                  "column": 69
                }
              },
              "moduleName": "d-flow-ember/templates/components/job-form.hbs"
            },
            isEmpty: false,
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createElement("li");
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0]), 0, 0);
              return morphs;
            },
            statements: [["content", "msg", ["loc", [null, [10, 57], [10, 64]]], 0, 0, 0, 0]],
            locals: ["msg"],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 9,
                "column": 12
              },
              "end": {
                "line": 11,
                "column": 12
              }
            },
            "moduleName": "d-flow-ember/templates/components/job-form.hbs"
          },
          isEmpty: false,
          arity: 2,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode(" ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("ul");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(2);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            morphs[1] = dom.createMorphAt(dom.childAt(fragment, [3]), 0, 0);
            return morphs;
          },
          statements: [["content", "field", ["loc", [null, [10, 14], [10, 23]]], 0, 0, 0, 0], ["block", "each", [["get", "errors", ["loc", [null, [10, 36], [10, 42]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [10, 28], [10, 78]]]]],
          locals: ["field", "errors"],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 7,
              "column": 8
            },
            "end": {
              "line": 13,
              "column": 8
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-form.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "alert alert-danger");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("          ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["block", "each-in", [["get", "error.errors", ["loc", [null, [9, 23], [9, 35]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [9, 12], [11, 24]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 14,
              "column": 8
            },
            "end": {
              "line": 21,
              "column": 8
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-form.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "alert alert-info");
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("strong");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode(":");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(" ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("br");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("strong");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode(":");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(" ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("br");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("strong");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode(":");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(" ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("br");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("strong");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode(":");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(" ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element12 = dom.childAt(fragment, [1]);
          var morphs = new Array(8);
          morphs[0] = dom.createMorphAt(dom.childAt(element12, [1]), 0, 0);
          morphs[1] = dom.createMorphAt(element12, 3, 3);
          morphs[2] = dom.createMorphAt(dom.childAt(element12, [6]), 0, 0);
          morphs[3] = dom.createMorphAt(element12, 8, 8);
          morphs[4] = dom.createMorphAt(dom.childAt(element12, [11]), 0, 0);
          morphs[5] = dom.createMorphAt(element12, 13, 13);
          morphs[6] = dom.createMorphAt(dom.childAt(element12, [16]), 0, 0);
          morphs[7] = dom.createMorphAt(element12, 18, 18);
          return morphs;
        },
        statements: [["inline", "t", ["jobs.source"], [], ["loc", [null, [16, 20], [16, 39]]], 0, 0], ["content", "model.source_label", ["loc", [null, [16, 50], [16, 72]]], 0, 0, 0, 0], ["inline", "t", ["jobs.catalog_id"], [], ["loc", [null, [17, 20], [17, 43]]], 0, 0], ["content", "model.catalog_id", ["loc", [null, [17, 54], [17, 74]]], 0, 0, 0, 0], ["inline", "t", ["jobs.title"], [], ["loc", [null, [18, 20], [18, 38]]], 0, 0], ["content", "model.title", ["loc", [null, [18, 49], [18, 64]]], 0, 0, 0, 0], ["inline", "t", ["jobs.author"], [], ["loc", [null, [19, 20], [19, 39]]], 0, 0], ["content", "model.author", ["loc", [null, [19, 50], [19, 66]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child4 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 47,
                  "column": 16
                },
                "end": {
                  "line": 47,
                  "column": 64
                }
              },
              "moduleName": "d-flow-ember/templates/components/job-form.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["content", "option.label", ["loc", [null, [47, 48], [47, 64]]], 0, 0, 0, 0]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 46,
                "column": 14
              },
              "end": {
                "line": 48,
                "column": 14
              }
            },
            "moduleName": "d-flow-ember/templates/components/job-form.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("                ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["block", "x-option", [], ["value", ["subexpr", "@mut", [["get", "option.value", ["loc", [null, [47, 34], [47, 46]]], 0, 0, 0, 0]], [], [], 0, 0]], 0, null, ["loc", [null, [47, 16], [47, 77]]]]],
          locals: ["option"],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 45,
              "column": 12
            },
            "end": {
              "line": 49,
              "column": 12
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-form.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "each", [["get", "copyrightSelection", ["loc", [null, [46, 22], [46, 40]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [46, 14], [48, 23]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child5 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 57,
                "column": 14
              },
              "end": {
                "line": 57,
                "column": 70
              }
            },
            "moduleName": "d-flow-ember/templates/components/job-form.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["inline", "t", ["jobs.priority_values.normal"], [], ["loc", [null, [57, 35], [57, 70]]], 0, 0]],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 58,
                "column": 14
              },
              "end": {
                "line": 58,
                "column": 68
              }
            },
            "moduleName": "d-flow-ember/templates/components/job-form.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["inline", "t", ["jobs.priority_values.high"], [], ["loc", [null, [58, 35], [58, 68]]], 0, 0]],
          locals: [],
          templates: []
        };
      })();
      var child2 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 59,
                "column": 14
              },
              "end": {
                "line": 59,
                "column": 67
              }
            },
            "moduleName": "d-flow-ember/templates/components/job-form.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["inline", "t", ["jobs.priority_values.low"], [], ["loc", [null, [59, 35], [59, 67]]], 0, 0]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 56,
              "column": 12
            },
            "end": {
              "line": 60,
              "column": 12
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-form.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("              ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n              ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n              ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
          morphs[2] = dom.createMorphAt(fragment, 5, 5, contextualElement);
          return morphs;
        },
        statements: [["block", "x-option", [], ["value", 2], 0, null, ["loc", [null, [57, 14], [57, 83]]]], ["block", "x-option", [], ["value", 1], 1, null, ["loc", [null, [58, 14], [58, 81]]]], ["block", "x-option", [], ["value", 3], 2, null, ["loc", [null, [59, 14], [59, 80]]]]],
        locals: [],
        templates: [child0, child1, child2]
      };
    })();
    var child6 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 64,
              "column": 8
            },
            "end": {
              "line": 71,
              "column": 8
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-form.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          dom.setAttribute(el2, "class", "col-xs-2 control-label");
          var el3 = dom.createTextNode("Katalog-id");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "col-xs-4");
          var el3 = dom.createTextNode("\n            ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n          ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element11 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createAttrMorph(element11, 'class');
          morphs[1] = dom.createMorphAt(dom.childAt(element11, [3]), 1, 1);
          return morphs;
        },
        statements: [["attribute", "class", ["concat", ["form-group ", ["subexpr", "if", [["get", "error.errors.treenode_id", ["loc", [null, [65, 36], [65, 60]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [65, 31], [65, 74]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "model.treenode_id", ["loc", [null, [68, 26], [68, 43]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control", "type", "number"], ["loc", [null, [68, 12], [68, 80]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child7 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 78,
                  "column": 16
                },
                "end": {
                  "line": 78,
                  "column": 64
                }
              },
              "moduleName": "d-flow-ember/templates/components/job-form.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["content", "option.label", ["loc", [null, [78, 48], [78, 64]]], 0, 0, 0, 0]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 77,
                "column": 14
              },
              "end": {
                "line": 79,
                "column": 14
              }
            },
            "moduleName": "d-flow-ember/templates/components/job-form.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("                ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["block", "x-option", [], ["value", ["subexpr", "@mut", [["get", "option.value", ["loc", [null, [78, 34], [78, 46]]], 0, 0, 0, 0]], [], [], 0, 0]], 0, null, ["loc", [null, [78, 16], [78, 77]]]]],
          locals: ["option"],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 76,
              "column": 12
            },
            "end": {
              "line": 80,
              "column": 12
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-form.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "each", [["get", "flowSelection", ["loc", [null, [77, 22], [77, 35]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [77, 14], [79, 23]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child8 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 86,
              "column": 8
            },
            "end": {
              "line": 88,
              "column": 8
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-form.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "parameter-input", [], ["parameter", ["subexpr", "@mut", [["get", "parameter", ["loc", [null, [87, 38], [87, 47]]], 0, 0, 0, 0]], [], [], 0, 0], "values", ["subexpr", "@mut", [["get", "model.flow_parameters", ["loc", [null, [87, 55], [87, 76]]], 0, 0, 0, 0]], [], [], 0, 0]], ["loc", [null, [87, 10], [87, 78]]], 0, 0]],
        locals: ["parameter"],
        templates: []
      };
    })();
    var child9 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 88,
              "column": 8
            },
            "end": {
              "line": 90,
              "column": 8
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-form.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            Inga flödesparametrar är definierade.\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child10 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 92,
              "column": 8
            },
            "end": {
              "line": 153,
              "column": 8
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-form.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "col-xs-12");
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("h4");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "row");
          var el3 = dom.createTextNode("\n\n              ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("label");
          dom.setAttribute(el3, "class", "col-xs-6 col-sm-3");
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n                ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n              ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n\n              ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("label");
          dom.setAttribute(el3, "class", "col-xs-6 col-sm-3");
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n                ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n              ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n            ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "row");
          var el3 = dom.createTextNode("\n              ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("label");
          dom.setAttribute(el3, "class", "col-xs-6 col-sm-3");
          var el4 = dom.createTextNode("\n                ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n              ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n\n              ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("label");
          dom.setAttribute(el3, "class", "col-xs-6 col-sm-3");
          var el4 = dom.createTextNode("\n                ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n              ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n            ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "row");
          var el3 = dom.createTextNode("\n              ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("label");
          dom.setAttribute(el3, "class", "col-xs-6 col-sm-3");
          var el4 = dom.createTextNode("\n                ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n              ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n\n              ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("label");
          dom.setAttribute(el3, "class", "col-xs-6 col-sm-3");
          var el4 = dom.createTextNode("\n                ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n              ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n            ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("h4");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "row");
          var el3 = dom.createTextNode("\n              ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("label");
          dom.setAttribute(el3, "class", "col-xs-6 col-sm-3");
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n                ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n              ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n\n              ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("label");
          dom.setAttribute(el3, "class", "col-xs-6 col-sm-3");
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n                ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n              ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n            ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "row");
          var el3 = dom.createTextNode("\n              ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("label");
          dom.setAttribute(el3, "class", "col-xs-6 col-sm-3");
          var el4 = dom.createTextNode("\n                ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n              ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n\n              ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("label");
          dom.setAttribute(el3, "class", "col-xs-6 col-sm-3");
          var el4 = dom.createTextNode("\n                ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n              ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n            ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "row");
          var el3 = dom.createTextNode("\n              ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("label");
          dom.setAttribute(el3, "class", "col-xs-6 col-sm-3");
          var el4 = dom.createTextNode("\n                ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n              ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n\n              ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("label");
          dom.setAttribute(el3, "class", "col-xs-6 col-sm-3");
          var el4 = dom.createTextNode("\n                ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n              ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n            ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var element1 = dom.childAt(element0, [3]);
          var element2 = dom.childAt(element1, [1]);
          var element3 = dom.childAt(element1, [3]);
          var element4 = dom.childAt(element0, [5]);
          var element5 = dom.childAt(element0, [7]);
          var element6 = dom.childAt(element0, [11]);
          var element7 = dom.childAt(element6, [1]);
          var element8 = dom.childAt(element6, [3]);
          var element9 = dom.childAt(element0, [13]);
          var element10 = dom.childAt(element0, [15]);
          var morphs = new Array(18);
          morphs[0] = dom.createMorphAt(dom.childAt(element0, [1]), 0, 0);
          morphs[1] = dom.createMorphAt(element2, 0, 0);
          morphs[2] = dom.createMorphAt(element2, 2, 2);
          morphs[3] = dom.createMorphAt(element3, 0, 0);
          morphs[4] = dom.createMorphAt(element3, 2, 2);
          morphs[5] = dom.createMorphAt(dom.childAt(element4, [1]), 1, 1);
          morphs[6] = dom.createMorphAt(dom.childAt(element4, [3]), 1, 1);
          morphs[7] = dom.createMorphAt(dom.childAt(element5, [1]), 1, 1);
          morphs[8] = dom.createMorphAt(dom.childAt(element5, [3]), 1, 1);
          morphs[9] = dom.createMorphAt(dom.childAt(element0, [9]), 0, 0);
          morphs[10] = dom.createMorphAt(element7, 0, 0);
          morphs[11] = dom.createMorphAt(element7, 2, 2);
          morphs[12] = dom.createMorphAt(element8, 0, 0);
          morphs[13] = dom.createMorphAt(element8, 2, 2);
          morphs[14] = dom.createMorphAt(dom.childAt(element9, [1]), 1, 1);
          morphs[15] = dom.createMorphAt(dom.childAt(element9, [3]), 1, 1);
          morphs[16] = dom.createMorphAt(dom.childAt(element10, [1]), 1, 1);
          morphs[17] = dom.createMorphAt(dom.childAt(element10, [3]), 1, 1);
          return morphs;
        },
        statements: [["inline", "t", ["jobs.ordinality"], [], ["loc", [null, [94, 16], [94, 39]]], 0, 0], ["inline", "t", ["jobs.key"], [], ["loc", [null, [97, 47], [97, 63]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.metadata.ordinal_1_key", ["loc", [null, [98, 81], [98, 109]]], 0, 0, 0, 0]], [], [], 0, 0], "placeHolderTranslation", "jobs.ordOneKeyPH", "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [98, 16], [98, 153]]], 0, 0], ["inline", "t", ["jobs.value"], [], ["loc", [null, [101, 47], [101, 65]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.metadata.ordinal_1_value", ["loc", [null, [102, 81], [102, 111]]], 0, 0, 0, 0]], [], [], 0, 0], "placeHolderTranslation", "jobs.ordOneValuePH", "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [102, 16], [102, 157]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.metadata.ordinal_2_key", ["loc", [null, [107, 81], [107, 109]]], 0, 0, 0, 0]], [], [], 0, 0], "placeHolderTranslation", "jobs.ordTwoKeyPH", "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [107, 16], [107, 153]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.metadata.ordinal_2_value", ["loc", [null, [111, 81], [111, 111]]], 0, 0, 0, 0]], [], [], 0, 0], "placeHolderTranslation", "jobs.ordTwoValuePH", "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [111, 16], [111, 157]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.metadata.ordinal_3_key", ["loc", [null, [116, 81], [116, 109]]], 0, 0, 0, 0]], [], [], 0, 0], "placeHolderTranslation", "jobs.ordThreeKeyPH", "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [116, 16], [116, 155]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.metadata.ordinal_3_value", ["loc", [null, [120, 81], [120, 111]]], 0, 0, 0, 0]], [], [], 0, 0], "placeHolderTranslation", "jobs.ordThreeValuePH", "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [120, 16], [120, 159]]], 0, 0], ["inline", "t", ["jobs.chronology"], [], ["loc", [null, [124, 16], [124, 39]]], 0, 0], ["inline", "t", ["jobs.key"], [], ["loc", [null, [126, 47], [126, 63]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.metadata.chron_1_key", ["loc", [null, [127, 81], [127, 107]]], 0, 0, 0, 0]], [], [], 0, 0], "placeHolderTranslation", "jobs.chronOneKeyPH", "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [127, 16], [127, 153]]], 0, 0], ["inline", "t", ["jobs.value"], [], ["loc", [null, [130, 47], [130, 65]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.metadata.chron_1_value", ["loc", [null, [131, 81], [131, 109]]], 0, 0, 0, 0]], [], [], 0, 0], "placeHolderTranslation", "jobs.chronOneValuePH", "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [131, 16], [131, 157]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.metadata.chron_2_key", ["loc", [null, [136, 81], [136, 107]]], 0, 0, 0, 0]], [], [], 0, 0], "placeHolderTranslation", "jobs.chronTwoKeyPH", "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [136, 16], [136, 153]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.metadata.chron_2_value", ["loc", [null, [140, 81], [140, 109]]], 0, 0, 0, 0]], [], [], 0, 0], "placeHolderTranslation", "jobs.chronTwoValuePH", "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [140, 16], [140, 157]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.metadata.chron_3_key", ["loc", [null, [145, 81], [145, 107]]], 0, 0, 0, 0]], [], [], 0, 0], "placeHolderTranslation", "jobs.chronThreeKeyPH", "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [145, 16], [145, 155]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.metadata.chron_3_value", ["loc", [null, [149, 81], [149, 109]]], 0, 0, 0, 0]], [], [], 0, 0], "placeHolderTranslation", "jobs.chronThreeValuePH", "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [149, 16], [149, 159]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child11 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 158,
              "column": 14
            },
            "end": {
              "line": 160,
              "column": 14
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-form.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["jobs.saving"], [], ["loc", [null, [159, 16], [159, 35]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child12 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 160,
              "column": 14
            },
            "end": {
              "line": 162,
              "column": 14
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-form.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["jobs.save"], [], ["loc", [null, [161, 16], [161, 33]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 170,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/components/job-form.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "panel panel-default");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-heading");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "panel-title");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-body");
        var el3 = dom.createTextNode("\n      ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "form-horizontal");
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("        ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "form-group");
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("label");
        dom.setAttribute(el5, "class", "col-xs-2 control-label");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "col-xs-10");
        var el6 = dom.createTextNode("\n            ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "form-group");
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("label");
        dom.setAttribute(el5, "class", "col-xs-2 control-label");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "col-xs-10");
        var el6 = dom.createTextNode("\n            ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n\n        ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "form-group");
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("label");
        dom.setAttribute(el5, "class", "col-xs-2 control-label");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "col-xs-10");
        var el6 = dom.createTextNode("\n            ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" \n\n        ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("label");
        dom.setAttribute(el5, "class", "col-xs-2 control-label");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "col-xs-4");
        var el6 = dom.createTextNode("\n");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("          ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n\n        ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("label");
        dom.setAttribute(el5, "class", "col-xs-2 control-label");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "col-xs-4");
        var el6 = dom.createTextNode("\n");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("          ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("label");
        dom.setAttribute(el5, "class", "col-xs-2 control-label");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "col-xs-4");
        var el6 = dom.createTextNode("\n");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("            ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("span");
        dom.setAttribute(el6, "class", "help-block");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode(" \n        ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("h4");
        var el5 = dom.createTextNode("Flödesparametrar för ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "row");
        dom.setAttribute(el4, "style", "margin-top:20px;");
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "col-xs-12");
        var el6 = dom.createTextNode("\n            ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("button");
        dom.setAttribute(el6, "class", "btn btn-primary");
        var el7 = dom.createTextNode("\n");
        dom.appendChild(el6, el7);
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("            ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n            ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("button");
        dom.setAttribute(el6, "class", "btn btn-default");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element13 = dom.childAt(fragment, [0]);
        var element14 = dom.childAt(element13, [3, 1]);
        var element15 = dom.childAt(element14, [4]);
        var element16 = dom.childAt(element14, [6]);
        var element17 = dom.childAt(element14, [8]);
        var element18 = dom.childAt(element14, [10]);
        var element19 = dom.childAt(element14, [12]);
        var element20 = dom.childAt(element14, [16]);
        var element21 = dom.childAt(element20, [3]);
        var element22 = dom.childAt(element14, [24, 1]);
        var element23 = dom.childAt(element22, [1]);
        var element24 = dom.childAt(element22, [3]);
        var morphs = new Array(28);
        morphs[0] = dom.createMorphAt(dom.childAt(element13, [1, 1]), 0, 0);
        morphs[1] = dom.createMorphAt(element14, 1, 1);
        morphs[2] = dom.createMorphAt(element14, 2, 2);
        morphs[3] = dom.createMorphAt(dom.childAt(element15, [1]), 0, 0);
        morphs[4] = dom.createMorphAt(dom.childAt(element15, [3]), 1, 1);
        morphs[5] = dom.createMorphAt(dom.childAt(element16, [1]), 0, 0);
        morphs[6] = dom.createMorphAt(dom.childAt(element16, [3]), 1, 1);
        morphs[7] = dom.createMorphAt(dom.childAt(element17, [1]), 0, 0);
        morphs[8] = dom.createMorphAt(dom.childAt(element17, [3]), 1, 1);
        morphs[9] = dom.createAttrMorph(element18, 'class');
        morphs[10] = dom.createMorphAt(dom.childAt(element18, [1]), 0, 0);
        morphs[11] = dom.createMorphAt(dom.childAt(element18, [3]), 1, 1);
        morphs[12] = dom.createAttrMorph(element19, 'class');
        morphs[13] = dom.createMorphAt(dom.childAt(element19, [1]), 0, 0);
        morphs[14] = dom.createMorphAt(dom.childAt(element19, [3]), 1, 1);
        morphs[15] = dom.createMorphAt(element14, 14, 14);
        morphs[16] = dom.createAttrMorph(element20, 'class');
        morphs[17] = dom.createMorphAt(dom.childAt(element20, [1]), 0, 0);
        morphs[18] = dom.createMorphAt(element21, 1, 1);
        morphs[19] = dom.createMorphAt(dom.childAt(element21, [3]), 0, 0);
        morphs[20] = dom.createMorphAt(dom.childAt(element14, [18]), 1, 1);
        morphs[21] = dom.createMorphAt(element14, 20, 20);
        morphs[22] = dom.createMorphAt(element14, 22, 22);
        morphs[23] = dom.createAttrMorph(element23, 'disabled');
        morphs[24] = dom.createElementMorph(element23);
        morphs[25] = dom.createMorphAt(element23, 1, 1);
        morphs[26] = dom.createElementMorph(element24);
        morphs[27] = dom.createMorphAt(element24, 0, 0);
        return morphs;
      },
      statements: [["block", "if", [["get", "isNew", ["loc", [null, [3, 35], [3, 40]]], 0, 0, 0, 0]], [], 0, 1, ["loc", [null, [3, 29], [3, 90]]]], ["block", "if", [["get", "error", ["loc", [null, [7, 14], [7, 19]]], 0, 0, 0, 0]], [], 2, null, ["loc", [null, [7, 8], [13, 15]]]], ["block", "if", [["get", "isNew", ["loc", [null, [14, 14], [14, 19]]], 0, 0, 0, 0]], [], 3, null, ["loc", [null, [14, 8], [21, 15]]]], ["inline", "t", ["jobs.name"], [], ["loc", [null, [23, 48], [23, 65]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.name", ["loc", [null, [25, 67], [25, 77]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " "], [], [], 0, 0]], ["loc", [null, [25, 12], [25, 79]]], 0, 0], ["inline", "t", ["jobs.comment"], [], ["loc", [null, [29, 48], [29, 68]]], 0, 0], ["inline", "textarea", [], ["cols", "80", "rows", "3", "value", ["subexpr", "@mut", [["get", "model.comment", ["loc", [null, [31, 77], [31, 90]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " "], [], [], 0, 0]], ["loc", [null, [31, 12], [31, 92]]], 0, 0], ["inline", "t", ["jobs.object_info"], [], ["loc", [null, [36, 48], [36, 72]]], 0, 0], ["inline", "textarea", [], ["cols", "80", "rows", "3", "value", ["subexpr", "@mut", [["get", "model.object_info", ["loc", [null, [38, 77], [38, 94]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " "], [], [], 0, 0]], ["loc", [null, [38, 12], [38, 96]]], 0, 0], ["attribute", "class", ["concat", ["form-group ", ["subexpr", "if", [["get", "error.errors.copyright", ["loc", [null, [42, 36], [42, 58]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [42, 31], [42, 72]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["jobs.copyright"], [], ["loc", [null, [43, 48], [43, 70]]], 0, 0], ["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "model.copyright", ["loc", [null, [45, 30], [45, 45]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 4, null, ["loc", [null, [45, 12], [49, 25]]]], ["attribute", "class", ["concat", ["form-group ", ["subexpr", "if", [["get", "error.errors.priority", ["loc", [null, [53, 36], [53, 57]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [53, 31], [53, 71]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["jobs.priority"], [], ["loc", [null, [54, 48], [54, 69]]], 0, 0], ["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "model.priority", ["loc", [null, [56, 30], [56, 44]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 5, null, ["loc", [null, [56, 12], [60, 25]]]], ["block", "if", [["get", "model.id", ["loc", [null, [64, 14], [64, 22]]], 0, 0, 0, 0]], [], 6, null, ["loc", [null, [64, 8], [71, 15]]]], ["attribute", "class", ["concat", ["form-group ", ["subexpr", "if", [["get", "error.errors.flow", ["loc", [null, [73, 36], [73, 53]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [73, 31], [73, 67]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["jobs.flow"], [], ["loc", [null, [74, 48], [74, 65]]], 0, 0], ["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "model.flow_id", ["loc", [null, [76, 30], [76, 43]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 7, null, ["loc", [null, [76, 12], [80, 25]]]], ["content", "currentFlow.description", ["loc", [null, [81, 37], [81, 64]]], 0, 0, 0, 0], ["content", "currentFlow.name", ["loc", [null, [84, 33], [84, 53]]], 0, 0, 0, 0], ["block", "each", [["get", "currentFlow.parameters.parameters", ["loc", [null, [86, 16], [86, 49]]], 0, 0, 0, 0]], [], 8, 9, ["loc", [null, [86, 8], [90, 17]]]], ["block", "if", [["get", "model.is_periodical", ["loc", [null, [92, 14], [92, 33]]], 0, 0, 0, 0]], [], 10, null, ["loc", [null, [92, 8], [153, 15]]]], ["attribute", "disabled", ["get", "performingCreate", ["loc", [null, [157, 55], [157, 71]]], 0, 0, 0, 0], 0, 0, 0, 0], ["element", "action", ["create", ["get", "model", ["loc", [null, [157, 92], [157, 97]]], 0, 0, 0, 0]], [], ["loc", [null, [157, 74], [157, 99]]], 0, 0], ["block", "if", [["get", "performingCreate", ["loc", [null, [158, 20], [158, 36]]], 0, 0, 0, 0]], [], 11, 12, ["loc", [null, [158, 14], [162, 21]]]], ["element", "action", ["abort"], [], ["loc", [null, [164, 44], [164, 62]]], 0, 0], ["inline", "t", ["jobs.cancel"], [], ["loc", [null, [164, 63], [164, 82]]], 0, 0]],
      locals: [],
      templates: [child0, child1, child2, child3, child4, child5, child6, child7, child8, child9, child10, child11, child12]
    };
  })());
});
define("d-flow-ember/templates/components/job-row", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 2,
              "column": 4
            },
            "end": {
              "line": 2,
              "column": 78
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-row.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("span");
          dom.setAttribute(el1, "class", "badge");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" ");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0]), 0, 0);
          return morphs;
        },
        statements: [["inline", "t", ["menu.quarantine"], [], ["loc", [null, [2, 47], [2, 70]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 2,
              "column": 85
            },
            "end": {
              "line": 2,
              "column": 127
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-row.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["content", "job.display", ["loc", [null, [2, 85], [2, 127]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 4,
                "column": 0
              },
              "end": {
                "line": 8,
                "column": 0
              }
            },
            "moduleName": "d-flow-ember/templates/components/job-row.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createElement("td");
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0]), 1, 1);
            return morphs;
          },
          statements: [["inline", "print-link", [], ["jobId", ["subexpr", "@mut", [["get", "job.id", ["loc", [null, [6, 19], [6, 25]]], 0, 0, 0, 0]], [], [], 0, 0], "type", "icon"], ["loc", [null, [6, 0], [6, 39]]], 0, 0]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 3,
              "column": 0
            },
            "end": {
              "line": 9,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-row.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "if", [["get", "showWorkOrder", ["loc", [null, [4, 6], [4, 19]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [4, 0], [8, 7]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child3 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 11,
                "column": 4
              },
              "end": {
                "line": 11,
                "column": 69
              }
            },
            "moduleName": "d-flow-ember/templates/components/job-row.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["content", "job.breadcrumb_string", ["loc", [null, [11, 44], [11, 69]]], 0, 0, 0, 0]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 10,
              "column": 0
            },
            "end": {
              "line": 12,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-row.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("td");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0]), 0, 0);
          return morphs;
        },
        statements: [["block", "link-to", ["node.show", ["get", "job.treenode_id", ["loc", [null, [11, 27], [11, 42]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [11, 4], [11, 81]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child4 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 13,
              "column": 26
            },
            "end": {
              "line": 13,
              "column": 99
            }
          },
          "moduleName": "d-flow-ember/templates/components/job-row.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("i");
          dom.setAttribute(el1, "class", "fa fa-spinner");
          dom.setAttribute(el1, "aria-hidden", "true");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 15,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/components/job-row.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("td");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("td");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("td");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("td");
        var el2 = dom.createElement("span");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [2]);
        var element1 = dom.childAt(fragment, [6]);
        var element2 = dom.childAt(fragment, [8, 0]);
        var morphs = new Array(9);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0]), 0, 0);
        morphs[1] = dom.createMorphAt(element0, 0, 0);
        morphs[2] = dom.createMorphAt(element0, 1, 1);
        morphs[3] = dom.createMorphAt(fragment, 4, 4, contextualElement);
        morphs[4] = dom.createMorphAt(fragment, 5, 5, contextualElement);
        morphs[5] = dom.createMorphAt(element1, 0, 0);
        morphs[6] = dom.createMorphAt(element1, 2, 2);
        morphs[7] = dom.createAttrMorph(element2, 'title');
        morphs[8] = dom.createMorphAt(element2, 0, 0);
        return morphs;
      },
      statements: [["content", "job.id", ["loc", [null, [1, 4], [1, 14]]], 0, 0, 0, 0], ["block", "if", [["get", "job.quarantined", ["loc", [null, [2, 10], [2, 25]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [2, 4], [2, 85]]]], ["block", "link-to", ["jobs.show", ["get", "job.id", ["loc", [null, [2, 119], [2, 125]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [2, 85], [2, 127]]]], ["block", "if", [["get", "session.data.authenticated.can_manage_jobs", ["loc", [null, [3, 6], [3, 48]]], 0, 0, 0, 0]], [], 2, null, ["loc", [null, [3, 0], [9, 7]]]], ["block", "if", [["get", "showTree", ["loc", [null, [10, 6], [10, 14]]], 0, 0, 0, 0]], [], 3, null, ["loc", [null, [10, 0], [12, 7]]]], ["content", "job.status_string", ["loc", [null, [13, 4], [13, 25]]], 0, 0, 0, 0], ["block", "if", [["get", "job.is_processing", ["loc", [null, [13, 32], [13, 49]]], 0, 0, 0, 0]], [], 4, null, ["loc", [null, [13, 26], [13, 106]]]], ["attribute", "title", ["concat", [["get", "job.flow_name", ["loc", [null, [14, 19], [14, 32]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["content", "job.flow_id", ["loc", [null, [14, 36], [14, 51]]], 0, 0, 0, 0]],
      locals: [],
      templates: [child0, child1, child2, child3, child4]
    };
  })());
});
define("d-flow-ember/templates/components/metadata-setter", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 20,
                "column": 18
              },
              "end": {
                "line": 20,
                "column": 65
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Höger / Vänster");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 21,
                "column": 18
              },
              "end": {
                "line": 21,
                "column": 65
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Vänster / Höger");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 19,
              "column": 16
            },
            "end": {
              "line": 22,
              "column": 16
            }
          },
          "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("                  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
          return morphs;
        },
        statements: [["block", "x-option", [], ["value", "right-left"], 0, null, ["loc", [null, [20, 18], [20, 78]]]], ["block", "x-option", [], ["value", "left-right"], 1, null, ["loc", [null, [21, 18], [21, 78]]]]],
        locals: [],
        templates: [child0, child1]
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 30,
                "column": 16
              },
              "end": {
                "line": 30,
                "column": 54
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Ej vald");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 31,
                "column": 16
              },
              "end": {
                "line": 31,
                "column": 53
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Omslag");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child2 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 32,
                "column": 16
              },
              "end": {
                "line": 32,
                "column": 57
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Vänstersida");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child3 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 33,
                "column": 16
              },
              "end": {
                "line": 33,
                "column": 56
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Högersida");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child4 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 34,
                "column": 16
              },
              "end": {
                "line": 34,
                "column": 55
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Uppslag");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child5 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 35,
                "column": 16
              },
              "end": {
                "line": 35,
                "column": 50
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Utvik");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child6 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 36,
                "column": 16
              },
              "end": {
                "line": 36,
                "column": 55
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Lös sida");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child7 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 37,
                "column": 16
              },
              "end": {
                "line": 37,
                "column": 58
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Färgkarta");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 29,
              "column": 14
            },
            "end": {
              "line": 38,
              "column": 14
            }
          },
          "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(8);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
          morphs[2] = dom.createMorphAt(fragment, 5, 5, contextualElement);
          morphs[3] = dom.createMorphAt(fragment, 7, 7, contextualElement);
          morphs[4] = dom.createMorphAt(fragment, 9, 9, contextualElement);
          morphs[5] = dom.createMorphAt(fragment, 11, 11, contextualElement);
          morphs[6] = dom.createMorphAt(fragment, 13, 13, contextualElement);
          morphs[7] = dom.createMorphAt(fragment, 15, 15, contextualElement);
          return morphs;
        },
        statements: [["block", "x-option", [], ["value", "undefined"], 0, null, ["loc", [null, [30, 16], [30, 67]]]], ["block", "x-option", [], ["value", "BookCover"], 1, null, ["loc", [null, [31, 16], [31, 66]]]], ["block", "x-option", [], ["value", "LeftPage"], 2, null, ["loc", [null, [32, 16], [32, 70]]]], ["block", "x-option", [], ["value", "RightPage"], 3, null, ["loc", [null, [33, 16], [33, 69]]]], ["block", "x-option", [], ["value", "DoublePage"], 4, null, ["loc", [null, [34, 16], [34, 68]]]], ["block", "x-option", [], ["value", "FoldOut"], 5, null, ["loc", [null, [35, 16], [35, 63]]]], ["block", "x-option", [], ["value", "LoosePage"], 6, null, ["loc", [null, [36, 16], [36, 68]]]], ["block", "x-option", [], ["value", "ColorTarget"], 7, null, ["loc", [null, [37, 16], [37, 71]]]]],
        locals: [],
        templates: [child0, child1, child2, child3, child4, child5, child6, child7]
      };
    })();
    var child2 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 47,
                "column": 16
              },
              "end": {
                "line": 47,
                "column": 54
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Ej vald");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 48,
                "column": 16
              },
              "end": {
                "line": 48,
                "column": 65
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Originalomslag");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child2 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 49,
                "column": 16
              },
              "end": {
                "line": 49,
                "column": 56
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Titelsida");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child3 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 50,
                "column": 16
              },
              "end": {
                "line": 50,
                "column": 73
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Innehållsförteckning");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child4 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 51,
                "column": 16
              },
              "end": {
                "line": 51,
                "column": 62
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Illustration");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child5 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 52,
                "column": 16
              },
              "end": {
                "line": 52,
                "column": 71
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Fotografi");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child6 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 53,
                "column": 16
              },
              "end": {
                "line": 53,
                "column": 48
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Index");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child7 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 54,
                "column": 16
              },
              "end": {
                "line": 54,
                "column": 55
              }
            },
            "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Tom sida");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 46,
              "column": 14
            },
            "end": {
              "line": 55,
              "column": 14
            }
          },
          "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(8);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
          morphs[2] = dom.createMorphAt(fragment, 5, 5, contextualElement);
          morphs[3] = dom.createMorphAt(fragment, 7, 7, contextualElement);
          morphs[4] = dom.createMorphAt(fragment, 9, 9, contextualElement);
          morphs[5] = dom.createMorphAt(fragment, 11, 11, contextualElement);
          morphs[6] = dom.createMorphAt(fragment, 13, 13, contextualElement);
          morphs[7] = dom.createMorphAt(fragment, 15, 15, contextualElement);
          return morphs;
        },
        statements: [["block", "x-option", [], ["value", "undefined"], 0, null, ["loc", [null, [47, 16], [47, 67]]]], ["block", "x-option", [], ["value", "OriginalCover"], 1, null, ["loc", [null, [48, 16], [48, 78]]]], ["block", "x-option", [], ["value", "TitlePage"], 2, null, ["loc", [null, [49, 16], [49, 69]]]], ["block", "x-option", [], ["value", "TableOfContents"], 3, null, ["loc", [null, [50, 16], [50, 86]]]], ["block", "x-option", [], ["value", "Illustration"], 4, null, ["loc", [null, [51, 16], [51, 75]]]], ["block", "x-option", [], ["value", "PhotographicIllustration"], 5, null, ["loc", [null, [52, 16], [52, 84]]]], ["block", "x-option", [], ["value", "Index"], 6, null, ["loc", [null, [53, 16], [53, 61]]]], ["block", "x-option", [], ["value", "EmptyPage"], 7, null, ["loc", [null, [54, 16], [54, 68]]]]],
        locals: [],
        templates: [child0, child1, child2, child3, child4, child5, child6, child7]
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 61,
              "column": 99
            },
            "end": {
              "line": 61,
              "column": 129
            }
          },
          "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("Select even");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child4 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 61,
              "column": 129
            },
            "end": {
              "line": 61,
              "column": 150
            }
          },
          "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("Deselect even");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child5 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 62,
              "column": 98
            },
            "end": {
              "line": 62,
              "column": 126
            }
          },
          "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("Select odd");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child6 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 62,
              "column": 126
            },
            "end": {
              "line": 62,
              "column": 146
            }
          },
          "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("Deselect odd");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child7 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 70,
              "column": 10
            },
            "end": {
              "line": 72,
              "column": 10
            }
          },
          "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "dscribe-wrapper", [], ["latestSelected", ["subexpr", "@mut", [["get", "latestSelected", ["loc", [null, [71, 45], [71, 59]]], 0, 0, 0, 0]], [], [], 0, 0], "images", ["subexpr", "@mut", [["get", "packageMetadata.images", ["loc", [null, [71, 67], [71, 89]]], 0, 0, 0, 0]], [], [], 0, 0], "image", ["subexpr", "@mut", [["get", "image", ["loc", [null, [71, 96], [71, 101]]], 0, 0, 0, 0]], [], [], 0, 0], "imagesFolderPath", ["subexpr", "@mut", [["get", "flowStep.parsed_params.images_folder_path", ["loc", [null, [71, 119], [71, 160]]], 0, 0, 0, 0]], [], [], 0, 0], "imagesSource", ["subexpr", "@mut", [["get", "flowStep.parsed_params.source", ["loc", [null, [71, 174], [71, 203]]], 0, 0, 0, 0]], [], [], 0, 0], "filetype", ["subexpr", "@mut", [["get", "flowStep.parsed_params.filetype", ["loc", [null, [71, 213], [71, 244]]], 0, 0, 0, 0]], [], [], 0, 0]], ["loc", [null, [71, 12], [71, 246]]], 0, 0]],
        locals: ["image"],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 82,
            "column": 6
          }
        },
        "moduleName": "d-flow-ember/templates/components/metadata-setter.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment(" Button trigger modal ");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("button");
        dom.setAttribute(el1, "type", "button");
        dom.setAttribute(el1, "class", "btn btn-primary");
        dom.setAttribute(el1, "data-toggle", "modal");
        dom.setAttribute(el1, "data-target", "#myModal");
        var el2 = dom.createTextNode("\n  Sätt metadata ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "fa fa-external-link");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment(" Modal ");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "modal fade");
        dom.setAttribute(el1, "id", "myModal");
        dom.setAttribute(el1, "tabindex", "-1");
        dom.setAttribute(el1, "role", "dialog");
        dom.setAttribute(el1, "aria-labelledby", "myModalLabel");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "modal-dialog");
        dom.setAttribute(el2, "role", "document");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "modal-content");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "modal-header");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "type", "button");
        dom.setAttribute(el5, "class", "close");
        dom.setAttribute(el5, "data-dismiss", "modal");
        dom.setAttribute(el5, "aria-label", "Close");
        var el6 = dom.createElement("span");
        dom.setAttribute(el6, "aria-hidden", "true");
        var el7 = dom.createTextNode("×");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("h4");
        dom.setAttribute(el5, "class", "modal-title");
        dom.setAttribute(el5, "id", "myModalLabel");
        var el6 = dom.createTextNode("Sätt metadata");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "modal-body container-fluid");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode(": ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "row control-bar");
        var el6 = dom.createTextNode("\n              ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6, "class", "col-xs-10 col-sm-2");
        var el7 = dom.createTextNode("\n                ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("label");
        dom.setAttribute(el7, "for", "sequenceInput");
        dom.setAttribute(el7, "class", "control-label");
        var el8 = dom.createTextNode("Sekvens");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n");
        dom.appendChild(el6, el7);
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("              ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n              ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6, "class", "col-xs-2 col-sm-1");
        var el7 = dom.createTextNode("\n                ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("button");
        var el8 = dom.createTextNode("Applicera");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n              ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n              ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6, "class", "col-xs-10 col-sm-2");
        var el7 = dom.createTextNode("\n              ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("label");
        dom.setAttribute(el7, "class", "control-label ");
        var el8 = dom.createTextNode("Fysisk");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n");
        dom.appendChild(el6, el7);
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("              ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n              ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6, "class", "col-xs-2 col-sm-1");
        var el7 = dom.createTextNode("\n                ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("button");
        var el8 = dom.createTextNode("Applicera");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n              ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n\n              ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6, "class", "col-xs-10 col-sm-2");
        var el7 = dom.createTextNode("\n              ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("label");
        dom.setAttribute(el7, "class", "control-label");
        var el8 = dom.createTextNode("Logisk");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n");
        dom.appendChild(el6, el7);
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("              ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n              ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6, "class", "col-xs-2 col-sm-1");
        var el7 = dom.createTextNode("\n                ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("button");
        var el8 = dom.createTextNode("Applicera");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n              ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n              ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6, "id", "select-controls");
        dom.setAttribute(el6, "class", "col-xs-12 col-sm-3");
        var el7 = dom.createTextNode("\n                ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("button");
        dom.setAttribute(el7, "class", "btn btn-default pull-right hidden");
        var el8 = dom.createComment("");
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode(" (2, 4, 6..)");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n                ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("button");
        dom.setAttribute(el7, "class", "btn btn-default pull-right hidden");
        var el8 = dom.createComment("");
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode(" (1, 3, 5...)");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n                ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("button");
        dom.setAttribute(el7, "class", "btn btn-default pull-right");
        var el8 = dom.createTextNode("Markera alla ");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n                ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("button");
        dom.setAttribute(el7, "class", "btn btn-default pull-right");
        var el8 = dom.createTextNode("Avmarkera alla ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("span");
        dom.setAttribute(el8, "class", "label label-success");
        var el9 = dom.createComment("");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n\n              ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "id", "pages");
        dom.setAttribute(el5, "class", "row");
        var el6 = dom.createTextNode("\n");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "modal-footer");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "type", "button");
        dom.setAttribute(el5, "class", "btn btn-default");
        dom.setAttribute(el5, "data-dismiss", "modal");
        var el6 = dom.createTextNode("Stäng");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "class", "btn btn-primary");
        var el6 = dom.createTextNode("Spara metadata");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [6, 1, 1]);
        var element1 = dom.childAt(element0, [3]);
        var element2 = dom.childAt(element1, [5]);
        var element3 = dom.childAt(element2, [3, 1]);
        var element4 = dom.childAt(element2, [7, 1]);
        var element5 = dom.childAt(element2, [11, 1]);
        var element6 = dom.childAt(element2, [13]);
        var element7 = dom.childAt(element6, [1]);
        var element8 = dom.childAt(element6, [3]);
        var element9 = dom.childAt(element6, [5]);
        var element10 = dom.childAt(element6, [7]);
        var element11 = dom.childAt(element0, [5, 3]);
        var morphs = new Array(21);
        morphs[0] = dom.createMorphAt(element1, 1, 1);
        morphs[1] = dom.createMorphAt(element1, 3, 3);
        morphs[2] = dom.createMorphAt(dom.childAt(element2, [1]), 3, 3);
        morphs[3] = dom.createAttrMorph(element3, 'class');
        morphs[4] = dom.createElementMorph(element3);
        morphs[5] = dom.createMorphAt(dom.childAt(element2, [5]), 3, 3);
        morphs[6] = dom.createAttrMorph(element4, 'class');
        morphs[7] = dom.createElementMorph(element4);
        morphs[8] = dom.createMorphAt(dom.childAt(element2, [9]), 3, 3);
        morphs[9] = dom.createAttrMorph(element5, 'class');
        morphs[10] = dom.createElementMorph(element5);
        morphs[11] = dom.createElementMorph(element7);
        morphs[12] = dom.createMorphAt(element7, 0, 0);
        morphs[13] = dom.createElementMorph(element8);
        morphs[14] = dom.createMorphAt(element8, 0, 0);
        morphs[15] = dom.createElementMorph(element9);
        morphs[16] = dom.createElementMorph(element10);
        morphs[17] = dom.createMorphAt(dom.childAt(element10, [1]), 0, 0);
        morphs[18] = dom.createMorphAt(dom.childAt(element1, [7]), 1, 1);
        morphs[19] = dom.createAttrMorph(element11, 'disabled');
        morphs[20] = dom.createElementMorph(element11);
        return morphs;
      },
      statements: [["inline", "t", ["jobs.number_of_images"], [], ["loc", [null, [15, 8], [15, 37]]], 0, 0], ["content", "packageMetadata.image_count", ["loc", [null, [15, 39], [15, 70]]], 0, 0, 0, 0], ["block", "x-select", [], ["id", "sequenceInput", "value", ["subexpr", "@mut", [["get", "sequence", ["loc", [null, [19, 53], [19, 61]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 0, null, ["loc", [null, [19, 16], [22, 29]]]], ["attribute", "class", ["concat", ["btn btn-default ", ["subexpr", "unless", [["get", "hasSelected", ["loc", [null, [25, 91], [25, 102]]], 0, 0, 0, 0], "disabled"], [], ["loc", [null, [25, 82], [25, 115]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["element", "action", ["applyMetadataSequence"], [], ["loc", [null, [25, 24], [25, 58]]], 0, 0], ["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "page_type", ["loc", [null, [29, 32], [29, 41]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 1, null, ["loc", [null, [29, 14], [38, 27]]]], ["attribute", "class", ["concat", ["btn btn-default ", ["subexpr", "unless", [["get", "hasSelected", ["loc", [null, [41, 91], [41, 102]]], 0, 0, 0, 0], "disabled"], [], ["loc", [null, [41, 82], [41, 115]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["element", "action", ["applyMetadataPhysical"], [], ["loc", [null, [41, 24], [41, 58]]], 0, 0], ["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "page_content", ["loc", [null, [46, 32], [46, 44]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 2, null, ["loc", [null, [46, 14], [55, 27]]]], ["attribute", "class", ["concat", ["btn btn-default ", ["subexpr", "unless", [["get", "hasSelected", ["loc", [null, [58, 90], [58, 101]]], 0, 0, 0, 0], "disabled"], [], ["loc", [null, [58, 81], [58, 114]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["element", "action", ["applyMetadataLogical"], [], ["loc", [null, [58, 24], [58, 57]]], 0, 0], ["element", "action", ["toggleSelectionEven"], [], ["loc", [null, [61, 66], [61, 98]]], 0, 0], ["block", "if", [["get", "select_even", ["loc", [null, [61, 105], [61, 116]]], 0, 0, 0, 0]], [], 3, 4, ["loc", [null, [61, 99], [61, 157]]]], ["element", "action", ["toggleSelectionOdd"], [], ["loc", [null, [62, 66], [62, 97]]], 0, 0], ["block", "if", [["get", "select_odd", ["loc", [null, [62, 104], [62, 114]]], 0, 0, 0, 0]], [], 5, 6, ["loc", [null, [62, 98], [62, 153]]]], ["element", "action", ["selectAll"], [], ["loc", [null, [63, 59], [63, 81]]], 0, 0], ["element", "action", ["deselectAll"], [], ["loc", [null, [64, 59], [64, 83]]], 0, 0], ["content", "hasSelected", ["loc", [null, [64, 133], [64, 148]]], 0, 0, 0, 0], ["block", "each", [["get", "packageMetadata.images", ["loc", [null, [70, 18], [70, 40]]], 0, 0, 0, 0]], [], 7, null, ["loc", [null, [70, 10], [72, 19]]]], ["attribute", "disabled", ["get", "performingManualAction", ["loc", [null, [78, 51], [78, 73]]], 0, 0, 0, 0], 0, 0, 0, 0], ["element", "action", ["saveMetaData", ["get", "flowStep", ["loc", [null, [78, 100], [78, 108]]], 0, 0, 0, 0]], [], ["loc", [null, [78, 76], [78, 110]]], 0, 0]],
      locals: [],
      templates: [child0, child1, child2, child3, child4, child5, child6, child7]
    };
  })());
});
define("d-flow-ember/templates/components/pagination-pager-data", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 3,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/components/pagination-pager-data.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          return morphs;
        },
        statements: [["inline", "t", ["paginator.noHits"], [], ["loc", [null, [2, 0], [2, 24]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 4,
                "column": 85
              },
              "end": {
                "line": 4,
                "column": 126
              }
            },
            "moduleName": "d-flow-ember/templates/components/pagination-pager-data.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["inline", "t", ["paginator.hit"], [], ["loc", [null, [4, 105], [4, 126]]], 0, 0]],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 4,
                "column": 126
              },
              "end": {
                "line": 4,
                "column": 156
              }
            },
            "moduleName": "d-flow-ember/templates/components/pagination-pager-data.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["inline", "t", ["paginator.hits"], [], ["loc", [null, [4, 134], [4, 156]]], 0, 0]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 3,
              "column": 0
            },
            "end": {
              "line": 7,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/components/pagination-pager-data.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" - ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n, ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(10);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          morphs[1] = dom.createMorphAt(fragment, 2, 2, contextualElement);
          morphs[2] = dom.createMorphAt(fragment, 4, 4, contextualElement);
          morphs[3] = dom.createMorphAt(fragment, 6, 6, contextualElement);
          morphs[4] = dom.createMorphAt(fragment, 8, 8, contextualElement);
          morphs[5] = dom.createMorphAt(fragment, 10, 10, contextualElement);
          morphs[6] = dom.createMorphAt(fragment, 12, 12, contextualElement);
          morphs[7] = dom.createMorphAt(fragment, 14, 14, contextualElement);
          morphs[8] = dom.createMorphAt(fragment, 16, 16, contextualElement);
          morphs[9] = dom.createMorphAt(fragment, 18, 18, contextualElement);
          dom.insertBoundary(fragment, 0);
          return morphs;
        },
        statements: [["inline", "t", ["paginator.showing"], [], ["loc", [null, [4, 0], [4, 25]]], 0, 0], ["content", "pageStart", ["loc", [null, [4, 26], [4, 39]]], 0, 0, 0, 0], ["content", "pageEnd", ["loc", [null, [4, 42], [4, 53]]], 0, 0, 0, 0], ["inline", "t", ["paginator.of"], [], ["loc", [null, [4, 54], [4, 74]]], 0, 0], ["content", "total", ["loc", [null, [4, 75], [4, 84]]], 0, 0, 0, 0], ["block", "if", [["get", "singleResult", ["loc", [null, [4, 91], [4, 103]]], 0, 0, 0, 0]], [], 0, 1, ["loc", [null, [4, 85], [4, 163]]]], ["inline", "t", ["paginator.page"], [], ["loc", [null, [5, 2], [5, 25]]], 0, 0], ["content", "pagination.page", ["loc", [null, [5, 26], [5, 45]]], 0, 0, 0, 0], ["inline", "t", ["paginator.of"], [], ["loc", [null, [5, 46], [5, 66]]], 0, 0], ["content", "pagination.pages", ["loc", [null, [5, 67], [5, 87]]], 0, 0, 0, 0]],
        locals: [],
        templates: [child0, child1]
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 8,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/components/pagination-pager-data.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "if", [["get", "noResult", ["loc", [null, [1, 6], [1, 14]]], 0, 0, 0, 0]], [], 0, 1, ["loc", [null, [1, 0], [7, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("d-flow-ember/templates/components/pagination-pager", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 4,
                "column": 6
              },
              "end": {
                "line": 6,
                "column": 6
              }
            },
            "moduleName": "d-flow-ember/templates/components/pagination-pager.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("span");
            var el2 = dom.createTextNode("Previous");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 2,
              "column": 2
            },
            "end": {
              "line": 8,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/components/pagination-pager.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["block", "link-to", [["subexpr", "query-params", [], ["page", ["get", "pagination.previous", ["loc", [null, [4, 36], [4, 55]]], 0, 0, 0, 0]], ["loc", [null, [4, 17], [4, 56]]], 0, 0]], ["class", ""], 0, null, ["loc", [null, [4, 6], [6, 18]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 8,
              "column": 2
            },
            "end": {
              "line": 12,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/components/pagination-pager.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          dom.setAttribute(el1, "class", "disabled");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("a");
          dom.setAttribute(el2, "href", "javascript:void(0)");
          var el3 = dom.createElement("span");
          var el4 = dom.createTextNode("Previous");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 14,
                "column": 4
              },
              "end": {
                "line": 16,
                "column": 4
              }
            },
            "moduleName": "d-flow-ember/templates/components/pagination-pager.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("li");
            dom.setAttribute(el1, "class", "disabled spacer");
            var el2 = dom.createElement("span");
            var el3 = dom.createTextNode("...");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 18,
                  "column": 8
                },
                "end": {
                  "line": 18,
                  "column": 87
                }
              },
              "moduleName": "d-flow-ember/templates/components/pagination-pager.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["content", "page.page", ["loc", [null, [18, 74], [18, 87]]], 0, 0, 0, 0]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 16,
                "column": 4
              },
              "end": {
                "line": 20,
                "column": 4
              }
            },
            "moduleName": "d-flow-ember/templates/components/pagination-pager.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("li");
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n      ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element0 = dom.childAt(fragment, [1]);
            var morphs = new Array(2);
            morphs[0] = dom.createAttrMorph(element0, 'class');
            morphs[1] = dom.createMorphAt(element0, 1, 1);
            return morphs;
          },
          statements: [["attribute", "class", ["concat", [["subexpr", "if", [["get", "page.active", ["loc", [null, [17, 22], [17, 33]]], 0, 0, 0, 0], "active"], [], ["loc", [null, [17, 17], [17, 44]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["block", "link-to", [["subexpr", "query-params", [], ["page", ["get", "page.page", ["loc", [null, [18, 38], [18, 47]]], 0, 0, 0, 0]], ["loc", [null, [18, 19], [18, 48]]], 0, 0]], ["class", "btn btn-default"], 0, null, ["loc", [null, [18, 8], [18, 99]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 13,
              "column": 2
            },
            "end": {
              "line": 21,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/components/pagination-pager.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "if", [["get", "page.spacer", ["loc", [null, [14, 10], [14, 21]]], 0, 0, 0, 0]], [], 0, 1, ["loc", [null, [14, 4], [20, 11]]]]],
        locals: ["page"],
        templates: [child0, child1]
      };
    })();
    var child3 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 24,
                "column": 6
              },
              "end": {
                "line": 26,
                "column": 6
              }
            },
            "moduleName": "d-flow-ember/templates/components/pagination-pager.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("span");
            var el2 = dom.createTextNode("Next");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 22,
              "column": 2
            },
            "end": {
              "line": 28,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/components/pagination-pager.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["block", "link-to", [["subexpr", "query-params", [], ["page", ["get", "pagination.next", ["loc", [null, [24, 36], [24, 51]]], 0, 0, 0, 0]], ["loc", [null, [24, 17], [24, 52]]], 0, 0]], ["class", "btn btn-primary"], 0, null, ["loc", [null, [24, 6], [26, 18]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child4 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 28,
              "column": 2
            },
            "end": {
              "line": 32,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/components/pagination-pager.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          dom.setAttribute(el1, "class", "disabled");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("a");
          dom.setAttribute(el2, "href", "javascript:void(0)");
          var el3 = dom.createElement("span");
          var el4 = dom.createTextNode("Next");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 34,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/components/pagination-pager.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("ul");
        dom.setAttribute(el1, "class", "col-xs-12 pagination");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element1 = dom.childAt(fragment, [0]);
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(element1, 1, 1);
        morphs[1] = dom.createMorphAt(element1, 2, 2);
        morphs[2] = dom.createMorphAt(element1, 3, 3);
        return morphs;
      },
      statements: [["block", "if", [["get", "pagination.previous", ["loc", [null, [2, 8], [2, 27]]], 0, 0, 0, 0]], [], 0, 1, ["loc", [null, [2, 2], [12, 9]]]], ["block", "each", [["get", "pageArray", ["loc", [null, [13, 10], [13, 19]]], 0, 0, 0, 0]], [], 2, null, ["loc", [null, [13, 2], [21, 11]]]], ["block", "if", [["get", "pagination.next", ["loc", [null, [22, 8], [22, 23]]], 0, 0, 0, 0]], [], 3, 4, ["loc", [null, [22, 2], [32, 9]]]]],
      locals: [],
      templates: [child0, child1, child2, child3, child4]
    };
  })());
});
define("d-flow-ember/templates/components/parameter-input", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "revision": "Ember@2.7.3",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 7,
                    "column": 8
                  },
                  "end": {
                    "line": 7,
                    "column": 31
                  }
                },
                "moduleName": "d-flow-ember/templates/components/parameter-input.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("-- Välj --");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes() {
                return [];
              },
              statements: [],
              locals: [],
              templates: []
            };
          })();
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 6,
                  "column": 6
                },
                "end": {
                  "line": 8,
                  "column": 6
                }
              },
              "moduleName": "d-flow-ember/templates/components/parameter-input.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("        ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
              return morphs;
            },
            statements: [["block", "x-option", [], [], 0, null, ["loc", [null, [7, 8], [7, 44]]]]],
            locals: [],
            templates: [child0]
          };
        })();
        var child1 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "revision": "Ember@2.7.3",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 10,
                    "column": 6
                  },
                  "end": {
                    "line": 10,
                    "column": 54
                  }
                },
                "moduleName": "d-flow-ember/templates/components/parameter-input.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(1);
                morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
                dom.insertBoundary(fragment, 0);
                dom.insertBoundary(fragment, null);
                return morphs;
              },
              statements: [["content", "option.label", ["loc", [null, [10, 38], [10, 54]]], 0, 0, 0, 0]],
              locals: [],
              templates: []
            };
          })();
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 9,
                  "column": 6
                },
                "end": {
                  "line": 11,
                  "column": 4
                }
              },
              "moduleName": "d-flow-ember/templates/components/parameter-input.hbs"
            },
            isEmpty: false,
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("      ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
              return morphs;
            },
            statements: [["block", "x-option", [], ["value", ["subexpr", "@mut", [["get", "option.value", ["loc", [null, [10, 24], [10, 36]]], 0, 0, 0, 0]], [], [], 0, 0]], 0, null, ["loc", [null, [10, 6], [10, 67]]]]],
            locals: ["option"],
            templates: [child0]
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 5,
                "column": 4
              },
              "end": {
                "line": 12,
                "column": 2
              }
            },
            "moduleName": "d-flow-ember/templates/components/parameter-input.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(2);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            morphs[1] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "if", [["get", "prompt", ["loc", [null, [6, 12], [6, 18]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [6, 6], [8, 13]]]], ["block", "each", [["get", "optionList", ["loc", [null, [9, 14], [9, 24]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [9, 6], [11, 13]]]]],
          locals: [],
          templates: [child0, child1]
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 15,
                "column": 2
              },
              "end": {
                "line": 19,
                "column": 2
              }
            },
            "moduleName": "d-flow-ember/templates/components/parameter-input.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("  ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "col-xs-5 form-choice");
            var el2 = dom.createTextNode("\n    Valt alternativ: ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n  ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
            return morphs;
          },
          statements: [["content", "value", ["loc", [null, [17, 21], [17, 30]]], 0, 0, 0, 0]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 3,
              "column": 0
            },
            "end": {
              "line": 20,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/components/parameter-input.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "col-xs-5");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("span");
          dom.setAttribute(el2, "class", "help-block");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element1 = dom.childAt(fragment, [1]);
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(element1, 1, 1);
          morphs[1] = dom.createMorphAt(dom.childAt(element1, [3]), 0, 0);
          morphs[2] = dom.createMorphAt(fragment, 3, 3, contextualElement);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "value", ["loc", [null, [5, 22], [5, 27]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 0, null, ["loc", [null, [5, 4], [12, 15]]]], ["content", "parameter.info", ["loc", [null, [13, 27], [13, 45]]], 0, 0, 0, 0], ["block", "if", [["get", "value", ["loc", [null, [15, 8], [15, 13]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [15, 2], [19, 9]]]]],
        locals: [],
        templates: [child0, child1]
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 21,
              "column": 0
            },
            "end": {
              "line": 26,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/components/parameter-input.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "col-xs-5");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("span");
          dom.setAttribute(el2, "class", "help-block");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(element0, 1, 1);
          morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]), 0, 0);
          return morphs;
        },
        statements: [["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "value", ["loc", [null, [23, 30], [23, 35]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], ["loc", [null, [23, 4], [23, 58]]], 0, 0], ["content", "parameter.info", ["loc", [null, [24, 29], [24, 47]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 28,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/components/parameter-input.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "form-group");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("label");
        dom.setAttribute(el2, "class", "col-xs-2 control-label");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element2 = dom.childAt(fragment, [0]);
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(dom.childAt(element2, [1]), 0, 0);
        morphs[1] = dom.createMorphAt(element2, 3, 3);
        morphs[2] = dom.createMorphAt(element2, 4, 4);
        return morphs;
      },
      statements: [["content", "parameter.name", ["loc", [null, [2, 38], [2, 56]]], 0, 0, 0, 0], ["block", "if", [["get", "isRadio", ["loc", [null, [3, 6], [3, 13]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [3, 0], [20, 7]]]], ["block", "if", [["get", "isText", ["loc", [null, [21, 6], [21, 12]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [21, 0], [26, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("d-flow-ember/templates/components/print-link", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 3,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/components/print-link.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("i");
          dom.setAttribute(el1, "class", "fa fa-print");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 3,
              "column": 0
            },
            "end": {
              "line": 5,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/components/print-link.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("i");
          dom.setAttribute(el1, "class", "fa fa-2x fa-print");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 5,
            "column": 7
          }
        },
        "moduleName": "d-flow-ember/templates/components/print-link.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "if", [["get", "isIcon", ["loc", [null, [1, 6], [1, 12]]], 0, 0, 0, 0]], [], 0, 1, ["loc", [null, [1, 0], [5, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("d-flow-ember/templates/components/state-groups", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 299
          }
        },
        "moduleName": "d-flow-ember/templates/components/state-groups.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("p");
        dom.setAttribute(el1, "class", "navbar-text");
        var el2 = dom.createElement("span");
        dom.setAttribute(el2, "class", "navbar-btn label label-default");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode(": ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("span");
        dom.setAttribute(el2, "class", "navbar-btn label label-warning");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode(": ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("span");
        dom.setAttribute(el2, "class", "navbar-btn label label-success");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode(": ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(element0, [0]);
        var element2 = dom.childAt(element0, [1]);
        var element3 = dom.childAt(element0, [2]);
        var morphs = new Array(6);
        morphs[0] = dom.createMorphAt(element1, 0, 0);
        morphs[1] = dom.createMorphAt(element1, 2, 2);
        morphs[2] = dom.createMorphAt(element2, 0, 0);
        morphs[3] = dom.createMorphAt(element2, 2, 2);
        morphs[4] = dom.createMorphAt(element3, 0, 0);
        morphs[5] = dom.createMorphAt(element3, 2, 2);
        return morphs;
      },
      statements: [["inline", "t", ["jobs.states.start"], [], ["loc", [null, [1, 68], [1, 93]]], 0, 0], ["content", "start", ["loc", [null, [1, 95], [1, 104]]], 0, 0, 0, 0], ["inline", "t", ["jobs.states.inProgress"], [], ["loc", [null, [1, 156], [1, 186]]], 0, 0], ["content", "inProgress", ["loc", [null, [1, 188], [1, 202]]], 0, 0, 0, 0], ["inline", "t", ["jobs.states.done"], [], ["loc", [null, [1, 254], [1, 278]]], 0, 0], ["content", "done", ["loc", [null, [1, 280], [1, 288]]], 0, 0, 0, 0]],
      locals: [],
      templates: []
    };
  })());
});
define("d-flow-ember/templates/components/step-row", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 4
            },
            "end": {
              "line": 1,
              "column": 55
            }
          },
          "moduleName": "d-flow-ember/templates/components/step-row.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["content", "step.job_id", ["loc", [null, [1, 40], [1, 55]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 5,
              "column": 2
            },
            "end": {
              "line": 7,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/components/step-row.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("br");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 2, 2, contextualElement);
          return morphs;
        },
        statements: [["content", "sinceEntered", ["loc", [null, [6, 7], [6, 23]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 10,
              "column": 2
            },
            "end": {
              "line": 12,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/components/step-row.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("br");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 2, 2, contextualElement);
          return morphs;
        },
        statements: [["content", "sinceStarted", ["loc", [null, [11, 7], [11, 23]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 15,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/components/step-row.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("td");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("td");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("td");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("td");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("td");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("td");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [6]);
        var element1 = dom.childAt(fragment, [8]);
        var morphs = new Array(8);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0]), 0, 0);
        morphs[1] = dom.createMorphAt(dom.childAt(fragment, [2]), 0, 0);
        morphs[2] = dom.createMorphAt(dom.childAt(fragment, [4]), 0, 0);
        morphs[3] = dom.createMorphAt(element0, 0, 0);
        morphs[4] = dom.createMorphAt(element0, 2, 2);
        morphs[5] = dom.createMorphAt(element1, 0, 0);
        morphs[6] = dom.createMorphAt(element1, 2, 2);
        morphs[7] = dom.createMorphAt(dom.childAt(fragment, [10]), 0, 0);
        return morphs;
      },
      statements: [["block", "link-to", ["jobs.show", ["get", "step.job_id", ["loc", [null, [1, 27], [1, 38]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [1, 4], [1, 67]]]], ["content", "step.id", ["loc", [null, [2, 4], [2, 15]]], 0, 0, 0, 0], ["content", "step.description", ["loc", [null, [3, 4], [3, 24]]], 0, 0, 0, 0], ["content", "enteredAt", ["loc", [null, [4, 4], [4, 17]]], 0, 0, 0, 0], ["block", "if", [["get", "step.entered_at", ["loc", [null, [5, 8], [5, 23]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [5, 2], [7, 9]]]], ["content", "startedAt", ["loc", [null, [9, 4], [9, 17]]], 0, 0, 0, 0], ["block", "if", [["get", "step.started_at", ["loc", [null, [10, 8], [10, 23]]], 0, 0, 0, 0]], [], 2, null, ["loc", [null, [10, 2], [12, 9]]]], ["content", "step.status", ["loc", [null, [14, 4], [14, 19]]], 0, 0, 0, 0]],
      locals: [],
      templates: [child0, child1, child2]
    };
  })());
});
define("d-flow-ember/templates/components/tree-item", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 3,
                "column": 2
              },
              "end": {
                "line": 5,
                "column": 2
              }
            },
            "moduleName": "d-flow-ember/templates/components/tree-item.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("  ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("i");
            dom.setAttribute(el1, "class", "fa fa-folder-open-o");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 5,
                "column": 2
              },
              "end": {
                "line": 7,
                "column": 2
              }
            },
            "moduleName": "d-flow-ember/templates/components/tree-item.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("  ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("i");
            dom.setAttribute(el1, "class", "fa fa-folder-o");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 11,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/components/tree-item.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          dom.setAttribute(el1, "href", "");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(" \n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  \n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element2 = dom.childAt(fragment, [1]);
          var morphs = new Array(4);
          morphs[0] = dom.createAttrMorph(element2, 'class');
          morphs[1] = dom.createElementMorph(element2);
          morphs[2] = dom.createMorphAt(element2, 1, 1);
          morphs[3] = dom.createMorphAt(element2, 3, 3);
          return morphs;
        },
        statements: [["attribute", "class", ["concat", ["toggle-icon ", ["subexpr", "unless", [["get", "children.length", ["loc", [null, [2, 41], [2, 56]]], 0, 0, 0, 0], "leaf"], [], ["loc", [null, [2, 32], [2, 65]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["element", "action", ["toggle"], [], ["loc", [null, [2, 67], [2, 86]]], 0, 0], ["block", "if", [["get", "isExpanded", ["loc", [null, [3, 8], [3, 18]]], 0, 0, 0, 0]], [], 0, 1, ["loc", [null, [3, 2], [7, 9]]]], ["content", "item.name", ["loc", [null, [8, 2], [8, 15]]], 0, 0, 0, 0]],
        locals: [],
        templates: [child0, child1]
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 11,
              "column": 0
            },
            "end": {
              "line": 13,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/components/tree-item.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          dom.setAttribute(el1, "style", "color:black;");
          dom.setAttribute(el1, "target", "_blank");
          var el2 = dom.createElement("i");
          var el3 = dom.createTextNode(" ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(" ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("strong");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("span");
          dom.setAttribute(el1, "style", "margin-left:20px;");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var element1 = dom.childAt(element0, [0]);
          var morphs = new Array(4);
          morphs[0] = dom.createAttrMorph(element0, 'href');
          morphs[1] = dom.createAttrMorph(element1, 'class');
          morphs[2] = dom.createMorphAt(dom.childAt(element0, [2]), 0, 0);
          morphs[3] = dom.createMorphAt(dom.childAt(fragment, [3]), 0, 0);
          return morphs;
        },
        statements: [["attribute", "href", ["concat", [["get", "fileUrl", ["loc", [null, [12, 34], [12, 41]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["attribute", "class", ["concat", ["fa ", ["get", "icon", ["loc", [null, [12, 76], [12, 80]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["content", "item.name", ["loc", [null, [12, 98], [12, 111]]], 0, 0, 0, 0], ["content", "byteString", ["loc", [null, [12, 157], [12, 171]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 17,
                "column": 2
              },
              "end": {
                "line": 19,
                "column": 2
              }
            },
            "moduleName": "d-flow-ember/templates/components/tree-item.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["inline", "tree-item", [], ["item", ["subexpr", "@mut", [["get", "child", ["loc", [null, [18, 21], [18, 26]]], 0, 0, 0, 0]], [], [], 0, 0], "parentPath", ["subexpr", "@mut", [["get", "path", ["loc", [null, [18, 38], [18, 42]]], 0, 0, 0, 0]], [], [], 0, 0], "jobId", ["subexpr", "@mut", [["get", "jobId", ["loc", [null, [18, 49], [18, 54]]], 0, 0, 0, 0]], [], [], 0, 0]], ["loc", [null, [18, 4], [18, 56]]], 0, 0]],
          locals: ["child"],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 15,
              "column": 0
            },
            "end": {
              "line": 21,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/components/tree-item.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "style", "padding-left:10px");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["block", "each", [["get", "item.children", ["loc", [null, [17, 10], [17, 23]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [17, 2], [19, 11]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 22,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/components/tree-item.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(2);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        morphs[1] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "if", [["get", "item.children", ["loc", [null, [1, 6], [1, 19]]], 0, 0, 0, 0]], [], 0, 1, ["loc", [null, [1, 0], [13, 7]]]], ["block", "if", [["get", "isExpanded", ["loc", [null, [15, 6], [15, 16]]], 0, 0, 0, 0]], [], 2, null, ["loc", [null, [15, 0], [21, 7]]]]],
      locals: [],
      templates: [child0, child1, child2]
    };
  })());
});
define('d-flow-ember/templates/components/x-select', ['exports', 'emberx-select/templates/components/x-select'], function (exports, _emberxSelectTemplatesComponentsXSelect) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberxSelectTemplatesComponentsXSelect['default'];
    }
  });
});
define("d-flow-ember/templates/components/xml-link", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/components/xml-link.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["inline", "t", ["jobs.xml"], [], ["loc", [null, [1, 0], [1, 16]]], 0, 0]],
      locals: [],
      templates: []
    };
  })());
});
define("d-flow-ember/templates/flows", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/flows.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["content", "outlet", ["loc", [null, [1, 0], [1, 10]]], 0, 0, 0, 0]],
      locals: [],
      templates: []
    };
  })());
});
define("d-flow-ember/templates/flows/index", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 10,
                "column": 10
              },
              "end": {
                "line": 10,
                "column": 56
              }
            },
            "moduleName": "d-flow-ember/templates/flows/index.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["content", "flow.name", ["loc", [null, [10, 43], [10, 56]]], 0, 0, 0, 0]],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 12,
                "column": 30
              },
              "end": {
                "line": 12,
                "column": 61
              }
            },
            "moduleName": "d-flow-ember/templates/flows/index.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Dolt");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 7,
              "column": 2
            },
            "end": {
              "line": 14,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/flows/index.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("tr");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("td");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("td");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("td");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("td");
          dom.setAttribute(el2, "class", "flow-hidden");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(4);
          morphs[0] = dom.createMorphAt(dom.childAt(element0, [1]), 0, 0);
          morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]), 0, 0);
          morphs[2] = dom.createMorphAt(dom.childAt(element0, [5]), 0, 0);
          morphs[3] = dom.createMorphAt(dom.childAt(element0, [7]), 0, 0);
          return morphs;
        },
        statements: [["content", "flow.id", ["loc", [null, [9, 10], [9, 21]]], 0, 0, 0, 0], ["block", "link-to", ["flows.show", ["get", "flow.id", ["loc", [null, [10, 34], [10, 41]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [10, 10], [10, 68]]]], ["content", "flow.description", ["loc", [null, [11, 10], [11, 30]]], 0, 0, 0, 0], ["block", "unless", [["get", "flow.selectable", ["loc", [null, [12, 40], [12, 55]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [12, 30], [12, 72]]]]],
        locals: ["flow"],
        templates: [child0, child1]
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 19,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/flows/index.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        var el2 = dom.createTextNode("Flöden");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("table");
        dom.setAttribute(el1, "class", "table");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("thead");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("tr");
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("ID");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Namn");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Beskrivning");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("tbody");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("button");
        dom.setAttribute(el1, "class", "btn btn-primary");
        var el2 = dom.createTextNode("Skapa nytt flöde");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element1 = dom.childAt(fragment, [4]);
        var morphs = new Array(2);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [2, 3]), 1, 1);
        morphs[1] = dom.createElementMorph(element1);
        return morphs;
      },
      statements: [["block", "each", [["get", "model", ["loc", [null, [7, 10], [7, 15]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [7, 2], [14, 11]]]], ["element", "action", ["create"], [], ["loc", [null, [18, 8], [18, 27]]], 0, 0]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("d-flow-ember/templates/flows/new", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/flows/new.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["content", "outlet", ["loc", [null, [1, 0], [1, 10]]], 0, 0, 0, 0]],
      locals: [],
      templates: []
    };
  })());
});
define("d-flow-ember/templates/flows/show", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/flows/show.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["content", "outlet", ["loc", [null, [1, 0], [1, 10]]], 0, 0, 0, 0]],
      locals: [],
      templates: []
    };
  })());
});
define("d-flow-ember/templates/flows/show/edit", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 1,
              "column": 81
            }
          },
          "moduleName": "d-flow-ember/templates/flows/show/edit.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode(" Tillbaka till visningssidan för flödet (utan att spara)");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 20,
                "column": 8
              },
              "end": {
                "line": 20,
                "column": 69
              }
            },
            "moduleName": "d-flow-ember/templates/flows/show/edit.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Detta flöde ska vara valbart i listor");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 21,
                "column": 8
              },
              "end": {
                "line": 21,
                "column": 75
              }
            },
            "moduleName": "d-flow-ember/templates/flows/show/edit.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Detta flöde ska inte vara valbart i listor");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 19,
              "column": 6
            },
            "end": {
              "line": 22,
              "column": 6
            }
          },
          "moduleName": "d-flow-ember/templates/flows/show/edit.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
          return morphs;
        },
        statements: [["block", "x-option", [], ["value", true], 0, null, ["loc", [null, [20, 8], [20, 82]]]], ["block", "x-option", [], ["value", false], 1, null, ["loc", [null, [21, 8], [21, 88]]]]],
        locals: [],
        templates: [child0, child1]
      };
    })();
    var child2 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 34,
                "column": 6
              },
              "end": {
                "line": 36,
                "column": 6
              }
            },
            "moduleName": "d-flow-ember/templates/flows/show/edit.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("br");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["content", "error", ["loc", [null, [35, 8], [35, 17]]], 0, 0, 0, 0]],
          locals: ["error"],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 32,
              "column": 2
            },
            "end": {
              "line": 38,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/flows/show/edit.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "col-sm-offset-2 alert alert-danger");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["block", "each", [["get", "errors.parameters", ["loc", [null, [34, 14], [34, 31]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [34, 6], [36, 15]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child3 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 47,
                "column": 6
              },
              "end": {
                "line": 49,
                "column": 6
              }
            },
            "moduleName": "d-flow-ember/templates/flows/show/edit.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("br");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["content", "error", ["loc", [null, [48, 8], [48, 17]]], 0, 0, 0, 0]],
          locals: ["error"],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 45,
              "column": 2
            },
            "end": {
              "line": 51,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/flows/show/edit.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "col-sm-offset-2 alert alert-danger");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["block", "each", [["get", "errors.folder_paths", ["loc", [null, [47, 14], [47, 33]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [47, 6], [49, 15]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child4 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 60,
                "column": 6
              },
              "end": {
                "line": 62,
                "column": 6
              }
            },
            "moduleName": "d-flow-ember/templates/flows/show/edit.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("br");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["content", "error", ["loc", [null, [61, 8], [61, 17]]], 0, 0, 0, 0]],
          locals: ["error"],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 58,
              "column": 2
            },
            "end": {
              "line": 64,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/flows/show/edit.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "col-sm-offset-2 alert alert-danger");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["block", "each", [["get", "errors.steps", ["loc", [null, [60, 14], [60, 26]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [60, 6], [62, 15]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 71,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/flows/show/edit.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("hr");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "form-horizontal");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "form-group");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        dom.setAttribute(el3, "class", "control-label col-sm-2");
        var el4 = dom.createTextNode("Namn");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "col-sm-10");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "form-group");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        dom.setAttribute(el3, "class", "control-label col-sm-2");
        var el4 = dom.createTextNode("Beskrivning");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "col-sm-10");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "form-group");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        dom.setAttribute(el3, "class", "control-label col-sm-2");
        var el4 = dom.createTextNode("Synlighet");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "col-sm-10");
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "form-group");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        dom.setAttribute(el3, "class", "control-label col-sm-2");
        var el4 = dom.createTextNode("Parameterar");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "col-sm-10");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "form-group");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        dom.setAttribute(el3, "class", "control-label col-sm-2");
        var el4 = dom.createTextNode("Jobb-kataloger");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "col-sm-10");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "form-group");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        dom.setAttribute(el3, "class", "control-label col-sm-2");
        var el4 = dom.createTextNode("Flödessteg");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "col-sm-10");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "form-group");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "col-sm-offset-2");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("button");
        dom.setAttribute(el4, "class", "btn btn-primary");
        var el5 = dom.createTextNode("Spara");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [4]);
        var element1 = dom.childAt(element0, [19, 1]);
        var element2 = dom.childAt(element1, [1]);
        var morphs = new Array(12);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [1, 3]), 1, 1);
        morphs[2] = dom.createMorphAt(dom.childAt(element0, [3, 3]), 1, 1);
        morphs[3] = dom.createMorphAt(dom.childAt(element0, [5, 3]), 1, 1);
        morphs[4] = dom.createMorphAt(dom.childAt(element0, [7, 3]), 1, 1);
        morphs[5] = dom.createMorphAt(element0, 9, 9);
        morphs[6] = dom.createMorphAt(dom.childAt(element0, [11, 3]), 1, 1);
        morphs[7] = dom.createMorphAt(element0, 13, 13);
        morphs[8] = dom.createMorphAt(dom.childAt(element0, [15, 3]), 1, 1);
        morphs[9] = dom.createMorphAt(element0, 17, 17);
        morphs[10] = dom.createElementMorph(element2);
        morphs[11] = dom.createMorphAt(element1, 3, 3);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["block", "link-to", ["flows.show"], [], 0, null, ["loc", [null, [1, 0], [1, 93]]]], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "model.name", ["loc", [null, [7, 20], [7, 30]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], ["loc", [null, [7, 6], [7, 53]]], 0, 0], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "model.description", ["loc", [null, [13, 20], [13, 37]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], ["loc", [null, [13, 6], [13, 60]]], 0, 0], ["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "model.selectable", ["loc", [null, [19, 24], [19, 40]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 1, null, ["loc", [null, [19, 6], [22, 19]]]], ["inline", "json-editor", [], ["json", ["subexpr", "@mut", [["get", "model.parameters", ["loc", [null, [29, 25], [29, 41]]], 0, 0, 0, 0]], [], [], 0, 0], "modes", ["subexpr", "@mut", [["get", "modes", ["loc", [null, [29, 48], [29, 53]]], 0, 0, 0, 0]], [], [], 0, 0], "mode", ["subexpr", "@mut", [["get", "parameters_mode", ["loc", [null, [29, 59], [29, 74]]], 0, 0, 0, 0]], [], [], 0, 0], "name", "parameters", "id", "jsoneditor3"], ["loc", [null, [29, 6], [29, 111]]], 0, 0], ["block", "if", [["get", "errors.parameters", ["loc", [null, [32, 8], [32, 25]]], 0, 0, 0, 0]], [], 2, null, ["loc", [null, [32, 2], [38, 9]]]], ["inline", "json-editor", [], ["json", ["subexpr", "@mut", [["get", "model.folder_paths", ["loc", [null, [42, 25], [42, 43]]], 0, 0, 0, 0]], [], [], 0, 0], "modes", ["subexpr", "@mut", [["get", "modes", ["loc", [null, [42, 50], [42, 55]]], 0, 0, 0, 0]], [], [], 0, 0], "mode", ["subexpr", "@mut", [["get", "folder_paths_mode", ["loc", [null, [42, 61], [42, 78]]], 0, 0, 0, 0]], [], [], 0, 0], "name", "folder_paths", "id", "jsoneditor2"], ["loc", [null, [42, 6], [42, 117]]], 0, 0], ["block", "if", [["get", "errors.folder_paths", ["loc", [null, [45, 8], [45, 27]]], 0, 0, 0, 0]], [], 3, null, ["loc", [null, [45, 2], [51, 9]]]], ["inline", "json-editor", [], ["json", ["subexpr", "@mut", [["get", "model.flow_steps", ["loc", [null, [55, 25], [55, 41]]], 0, 0, 0, 0]], [], [], 0, 0], "modes", ["subexpr", "@mut", [["get", "modes", ["loc", [null, [55, 48], [55, 53]]], 0, 0, 0, 0]], [], [], 0, 0], "mode", ["subexpr", "@mut", [["get", "steps_mode", ["loc", [null, [55, 59], [55, 69]]], 0, 0, 0, 0]], [], [], 0, 0], "name", "steps", "id", "jsoneditor1"], ["loc", [null, [55, 6], [55, 101]]], 0, 0], ["block", "if", [["get", "errors.steps", ["loc", [null, [58, 8], [58, 20]]], 0, 0, 0, 0]], [], 4, null, ["loc", [null, [58, 2], [64, 9]]]], ["element", "action", ["save", ["get", "model", ["loc", [null, [67, 30], [67, 35]]], 0, 0, 0, 0]], [], ["loc", [null, [67, 14], [67, 37]]], 0, 0], ["content", "savingMessage", ["loc", [null, [67, 77], [67, 94]]], 0, 0, 0, 0]],
      locals: [],
      templates: [child0, child1, child2, child3, child4]
    };
  })());
});
define("d-flow-ember/templates/flows/show/index", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 2,
              "column": 0
            },
            "end": {
              "line": 2,
              "column": 41
            }
          },
          "moduleName": "d-flow-ember/templates/flows/show/index.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode(" Tillbaka till Flöden");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 5,
              "column": 0
            },
            "end": {
              "line": 5,
              "column": 38
            }
          },
          "moduleName": "d-flow-ember/templates/flows/show/index.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("Redigera");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 8,
              "column": 2
            },
            "end": {
              "line": 10,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/flows/show/index.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("p");
          var el2 = dom.createTextNode("Detta flöde är valbart i listor");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 10,
              "column": 2
            },
            "end": {
              "line": 12,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/flows/show/index.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("p");
          var el2 = dom.createTextNode("Detta flöde är inte valbart i listor");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 29,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/flows/show/index.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("hr");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h2");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode(" \n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n  ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("  ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h3");
        var el2 = dom.createTextNode("Parameterar");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n  ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("pre");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n  ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h3");
        var el2 = dom.createTextNode("Jobbkataloger");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n  ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("pre");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n  ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h3");
        var el2 = dom.createTextNode("Flödessteg");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n  ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("pre");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("hr");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("button");
        dom.setAttribute(el1, "class", "btn btn-danger");
        var el2 = dom.createTextNode("Radera flöde");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [27]);
        var morphs = new Array(9);
        morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
        morphs[1] = dom.createMorphAt(dom.childAt(fragment, [5]), 0, 0);
        morphs[2] = dom.createMorphAt(fragment, 7, 7, contextualElement);
        morphs[3] = dom.createMorphAt(dom.childAt(fragment, [9]), 0, 0);
        morphs[4] = dom.createMorphAt(fragment, 11, 11, contextualElement);
        morphs[5] = dom.createMorphAt(dom.childAt(fragment, [15]), 1, 1);
        morphs[6] = dom.createMorphAt(dom.childAt(fragment, [19]), 1, 1);
        morphs[7] = dom.createMorphAt(dom.childAt(fragment, [23]), 1, 1);
        morphs[8] = dom.createElementMorph(element0);
        return morphs;
      },
      statements: [["block", "link-to", ["flows"], [], 0, null, ["loc", [null, [2, 0], [2, 53]]]], ["content", "model.name", ["loc", [null, [4, 4], [4, 18]]], 0, 0, 0, 0], ["block", "link-to", ["flows.show.edit"], [], 1, null, ["loc", [null, [5, 0], [5, 50]]]], ["content", "model.description", ["loc", [null, [7, 5], [7, 26]]], 0, 0, 0, 0], ["block", "if", [["get", "model.selectable", ["loc", [null, [8, 8], [8, 24]]], 0, 0, 0, 0]], [], 2, 3, ["loc", [null, [8, 2], [12, 9]]]], ["content", "parameters_json", ["loc", [null, [15, 2], [15, 21]]], 0, 0, 0, 0], ["content", "folder_paths_json", ["loc", [null, [20, 2], [20, 23]]], 0, 0, 0, 0], ["content", "flow_steps_json", ["loc", [null, [25, 2], [25, 21]]], 0, 0, 0, 0], ["element", "action", ["delete", ["get", "model", ["loc", [null, [28, 26], [28, 31]]], 0, 0, 0, 0]], [], ["loc", [null, [28, 8], [28, 33]]], 0, 0]],
      locals: [],
      templates: [child0, child1, child2, child3]
    };
  })());
});
define("d-flow-ember/templates/jobs", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 10
          }
        },
        "moduleName": "d-flow-ember/templates/jobs.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["content", "outlet", ["loc", [null, [1, 0], [1, 10]]], 0, 0, 0, 0]],
      locals: [],
      templates: []
    };
  })());
});
define("d-flow-ember/templates/jobs/-modals", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 15,
                  "column": 14
                },
                "end": {
                  "line": 15,
                  "column": 62
                }
              },
              "moduleName": "d-flow-ember/templates/jobs/-modals.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["content", "option.label", ["loc", [null, [15, 46], [15, 62]]], 0, 0, 0, 0]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 14,
                "column": 12
              },
              "end": {
                "line": 16,
                "column": 14
              }
            },
            "moduleName": "d-flow-ember/templates/jobs/-modals.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["block", "x-option", [], ["value", ["subexpr", "@mut", [["get", "option.value", ["loc", [null, [15, 32], [15, 44]]], 0, 0, 0, 0]], [], [], 0, 0]], 0, null, ["loc", [null, [15, 14], [15, 75]]]]],
          locals: ["option"],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 13,
              "column": 10
            },
            "end": {
              "line": 17,
              "column": 12
            }
          },
          "moduleName": "d-flow-ember/templates/jobs/-modals.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "each", [["get", "flowStepItems", ["loc", [null, [14, 20], [14, 33]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [14, 12], [16, 23]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 47,
                  "column": 14
                },
                "end": {
                  "line": 47,
                  "column": 62
                }
              },
              "moduleName": "d-flow-ember/templates/jobs/-modals.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["content", "option.label", ["loc", [null, [47, 46], [47, 62]]], 0, 0, 0, 0]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 46,
                "column": 12
              },
              "end": {
                "line": 48,
                "column": 14
              }
            },
            "moduleName": "d-flow-ember/templates/jobs/-modals.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["block", "x-option", [], ["value", ["subexpr", "@mut", [["get", "option.value", ["loc", [null, [47, 32], [47, 44]]], 0, 0, 0, 0]], [], [], 0, 0]], 0, null, ["loc", [null, [47, 14], [47, 75]]]]],
          locals: ["option"],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 45,
              "column": 10
            },
            "end": {
              "line": 49,
              "column": 12
            }
          },
          "moduleName": "d-flow-ember/templates/jobs/-modals.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "each", [["get", "flowStepItems", ["loc", [null, [46, 20], [46, 33]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [46, 12], [48, 23]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 114,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/jobs/-modals.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment(" Flow Step Modal ");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "modal fade");
        dom.setAttribute(el1, "id", "flowStepModal");
        dom.setAttribute(el1, "tabindex", "-1");
        dom.setAttribute(el1, "role", "dialog");
        dom.setAttribute(el1, "aria-labelledby", "myModalLabel");
        dom.setAttribute(el1, "aria-hidden", "true");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "modal-dialog");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "modal-content");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "modal-header");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "type", "button");
        dom.setAttribute(el5, "class", "close");
        dom.setAttribute(el5, "data-dismiss", "modal");
        dom.setAttribute(el5, "aria-label", "Close");
        var el6 = dom.createElement("span");
        dom.setAttribute(el6, "aria-hidden", "true");
        var el7 = dom.createTextNode("×");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("h4");
        dom.setAttribute(el5, "class", "modal-title");
        dom.setAttribute(el5, "id", "myModalLabelFlowStep");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "modal-body");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "input-group");
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("span");
        dom.setAttribute(el6, "class", "input-group-addon");
        dom.setAttribute(el6, "id", "status-text");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "checkbox");
        var el6 = dom.createTextNode("\n            ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("label");
        var el7 = dom.createTextNode("\n              ");
        dom.appendChild(el6, el7);
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n              Återskapa flöde från konfiguration\n            ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "modal-footer");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "class", "btn btn-primary navbar-btn");
        dom.setAttribute(el5, "data-dismiss", "modal");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment(" UnQuarantine Modal ");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "modal fade");
        dom.setAttribute(el1, "id", "unQuarantineModal");
        dom.setAttribute(el1, "tabindex", "-1");
        dom.setAttribute(el1, "role", "dialog");
        dom.setAttribute(el1, "aria-labelledby", "myModalLabel");
        dom.setAttribute(el1, "aria-hidden", "true");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "modal-dialog");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "modal-content");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "modal-header");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "type", "button");
        dom.setAttribute(el5, "class", "close");
        dom.setAttribute(el5, "data-dismiss", "modal");
        dom.setAttribute(el5, "aria-label", "Close");
        var el6 = dom.createElement("span");
        dom.setAttribute(el6, "aria-hidden", "true");
        var el7 = dom.createTextNode("×");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("h4");
        dom.setAttribute(el5, "class", "modal-title");
        dom.setAttribute(el5, "id", "myModalLabel");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "modal-body");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "input-group");
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("span");
        dom.setAttribute(el6, "class", "input-group-addon");
        dom.setAttribute(el6, "id", "status-text");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "checkbox");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("label");
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n            Återskapa flöde från konfiguration\n          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "modal-footer");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "class", "btn btn-primary navbar-btn");
        dom.setAttribute(el5, "data-dismiss", "modal");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment(" Quarantine Modal ");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "modal fade");
        dom.setAttribute(el1, "id", "quarantineModal");
        dom.setAttribute(el1, "tabindex", "-1");
        dom.setAttribute(el1, "role", "dialog");
        dom.setAttribute(el1, "aria-labelledby", "myModalLabel");
        dom.setAttribute(el1, "aria-hidden", "true");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "modal-dialog");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "modal-content");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "modal-header");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "type", "button");
        dom.setAttribute(el5, "class", "close");
        dom.setAttribute(el5, "data-dismiss", "modal");
        dom.setAttribute(el5, "aria-label", "Close");
        var el6 = dom.createElement("span");
        dom.setAttribute(el6, "aria-hidden", "true");
        var el7 = dom.createTextNode("×");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("h4");
        dom.setAttribute(el5, "class", "modal-title");
        dom.setAttribute(el5, "id", "myModalLabel2");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "modal-body");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "input-group");
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("span");
        dom.setAttribute(el6, "class", "input-group-addon");
        dom.setAttribute(el6, "id", "message-text");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "modal-footer");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "class", "btn btn-primary navbar-btn");
        dom.setAttribute(el5, "data-dismiss", "modal");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment(" Restart Modal ");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "modal fade");
        dom.setAttribute(el1, "id", "restartModal");
        dom.setAttribute(el1, "tabindex", "-1");
        dom.setAttribute(el1, "role", "dialog");
        dom.setAttribute(el1, "aria-labelledby", "myModalLabel");
        dom.setAttribute(el1, "aria-hidden", "true");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "modal-dialog");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "modal-content");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "modal-header");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "type", "button");
        dom.setAttribute(el5, "class", "close");
        dom.setAttribute(el5, "data-dismiss", "modal");
        dom.setAttribute(el5, "aria-label", "Close");
        var el6 = dom.createElement("span");
        dom.setAttribute(el6, "aria-hidden", "true");
        var el7 = dom.createTextNode("×");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("h4");
        dom.setAttribute(el5, "class", "modal-title");
        dom.setAttribute(el5, "id", "myModalLabel3");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "modal-body");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "input-group");
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("span");
        dom.setAttribute(el6, "class", "input-group-addon");
        dom.setAttribute(el6, "id", "restart-message-text");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n          ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "checkbox");
        var el6 = dom.createTextNode("\n            ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("label");
        var el7 = dom.createTextNode("\n              ");
        dom.appendChild(el6, el7);
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n              Återskapa flöde från konfiguration\n            ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "modal-footer");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "class", "btn btn-primary navbar-btn");
        dom.setAttribute(el5, "data-dismiss", "modal");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [2, 1, 1]);
        var element1 = dom.childAt(element0, [3]);
        var element2 = dom.childAt(element1, [1]);
        var element3 = dom.childAt(element0, [5, 1]);
        var element4 = dom.childAt(fragment, [6, 1, 1]);
        var element5 = dom.childAt(element4, [3]);
        var element6 = dom.childAt(element5, [1]);
        var element7 = dom.childAt(element4, [5, 1]);
        var element8 = dom.childAt(fragment, [10, 1, 1]);
        var element9 = dom.childAt(element8, [3, 1]);
        var element10 = dom.childAt(element8, [5, 1]);
        var element11 = dom.childAt(fragment, [14, 1, 1]);
        var element12 = dom.childAt(element11, [3]);
        var element13 = dom.childAt(element12, [1]);
        var element14 = dom.childAt(element11, [5, 1]);
        var morphs = new Array(23);
        morphs[0] = dom.createMorphAt(dom.childAt(element0, [1, 3]), 0, 0);
        morphs[1] = dom.createMorphAt(dom.childAt(element2, [1]), 0, 0);
        morphs[2] = dom.createMorphAt(element2, 3, 3);
        morphs[3] = dom.createMorphAt(dom.childAt(element1, [3, 1]), 1, 1);
        morphs[4] = dom.createElementMorph(element3);
        morphs[5] = dom.createMorphAt(element3, 0, 0);
        morphs[6] = dom.createMorphAt(dom.childAt(element4, [1, 3]), 0, 0);
        morphs[7] = dom.createMorphAt(dom.childAt(element6, [1]), 0, 0);
        morphs[8] = dom.createMorphAt(element6, 3, 3);
        morphs[9] = dom.createMorphAt(dom.childAt(element5, [3, 1]), 1, 1);
        morphs[10] = dom.createElementMorph(element7);
        morphs[11] = dom.createMorphAt(element7, 0, 0);
        morphs[12] = dom.createMorphAt(dom.childAt(element8, [1, 3]), 0, 0);
        morphs[13] = dom.createMorphAt(dom.childAt(element9, [1]), 0, 0);
        morphs[14] = dom.createMorphAt(element9, 3, 3);
        morphs[15] = dom.createElementMorph(element10);
        morphs[16] = dom.createMorphAt(element10, 0, 0);
        morphs[17] = dom.createMorphAt(dom.childAt(element11, [1, 3]), 0, 0);
        morphs[18] = dom.createMorphAt(dom.childAt(element13, [1]), 0, 0);
        morphs[19] = dom.createMorphAt(element13, 3, 3);
        morphs[20] = dom.createMorphAt(dom.childAt(element12, [3, 1]), 1, 1);
        morphs[21] = dom.createElementMorph(element14);
        morphs[22] = dom.createMorphAt(element14, 0, 0);
        return morphs;
      },
      statements: [["inline", "t", ["flowStep.set_new_flow_step"], [], ["loc", [null, [7, 58], [7, 92]]], 0, 0], ["inline", "t", ["jobs.status"], [], ["loc", [null, [11, 57], [11, 76]]], 0, 0], ["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "newFlowStep", ["loc", [null, [13, 28], [13, 39]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 0, null, ["loc", [null, [13, 10], [17, 25]]]], ["inline", "input", [], ["type", "checkbox", "name", "recreateFlow", "checked", ["subexpr", "@mut", [["get", "recreateFlow", ["loc", [null, [21, 66], [21, 78]]], 0, 0, 0, 0]], [], [], 0, 0]], ["loc", [null, [21, 14], [21, 80]]], 0, 0], ["element", "action", ["setFlowStep", ["get", "model", ["loc", [null, [27, 95], [27, 100]]], 0, 0, 0, 0], ["get", "recreateFlow", ["loc", [null, [27, 101], [27, 113]]], 0, 0, 0, 0]], [], ["loc", [null, [27, 72], [27, 115]]], 0, 0], ["inline", "t", ["flowStep.set_new_flow_step"], [], ["loc", [null, [27, 116], [27, 150]]], 0, 0], ["inline", "t", ["jobs.unQuarantine"], [], ["loc", [null, [39, 50], [39, 75]]], 0, 0], ["inline", "t", ["jobs.status"], [], ["loc", [null, [43, 57], [43, 76]]], 0, 0], ["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "newFlowStep", ["loc", [null, [45, 28], [45, 39]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 1, null, ["loc", [null, [45, 10], [49, 25]]]], ["inline", "input", [], ["type", "checkbox", "name", "recreateFlow", "checked", ["subexpr", "@mut", [["get", "recreateFlow", ["loc", [null, [53, 64], [53, 76]]], 0, 0, 0, 0]], [], [], 0, 0]], ["loc", [null, [53, 12], [53, 78]]], 0, 0], ["element", "action", ["unQuarantineJob", ["get", "model", ["loc", [null, [59, 99], [59, 104]]], 0, 0, 0, 0]], [], ["loc", [null, [59, 72], [59, 106]]], 0, 0], ["inline", "t", ["jobs.unQuarantine"], [], ["loc", [null, [59, 107], [59, 132]]], 0, 0], ["inline", "t", ["jobs.quarantine"], [], ["loc", [null, [71, 51], [71, 74]]], 0, 0], ["inline", "t", ["jobs.message"], [], ["loc", [null, [75, 58], [75, 78]]], 0, 0], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "message", ["loc", [null, [77, 22], [77, 29]]], 0, 0, 0, 0]], [], [], 0, 0], "classNames", "form-control"], ["loc", [null, [77, 8], [77, 57]]], 0, 0], ["element", "action", ["quarantineJob", ["get", "model", ["loc", [null, [81, 97], [81, 102]]], 0, 0, 0, 0], ["get", "message", ["loc", [null, [81, 103], [81, 110]]], 0, 0, 0, 0]], [], ["loc", [null, [81, 72], [81, 112]]], 0, 0], ["inline", "t", ["jobs.quarantine"], [], ["loc", [null, [81, 113], [81, 136]]], 0, 0], ["inline", "t", ["jobs.restart"], [], ["loc", [null, [93, 51], [93, 71]]], 0, 0], ["inline", "t", ["jobs.message"], [], ["loc", [null, [97, 66], [97, 86]]], 0, 0], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "message", ["loc", [null, [99, 22], [99, 29]]], 0, 0, 0, 0]], [], [], 0, 0], "classNames", "form-control"], ["loc", [null, [99, 8], [99, 57]]], 0, 0], ["inline", "input", [], ["type", "checkbox", "name", "recreateFlow", "checked", ["subexpr", "@mut", [["get", "recreateFlow", ["loc", [null, [103, 66], [103, 78]]], 0, 0, 0, 0]], [], [], 0, 0]], ["loc", [null, [103, 14], [103, 80]]], 0, 0], ["element", "action", ["restartJob", ["get", "model", ["loc", [null, [109, 94], [109, 99]]], 0, 0, 0, 0], ["get", "message", ["loc", [null, [109, 100], [109, 107]]], 0, 0, 0, 0], ["get", "recreateFlow", ["loc", [null, [109, 108], [109, 120]]], 0, 0, 0, 0]], [], ["loc", [null, [109, 72], [109, 122]]], 0, 0], ["inline", "t", ["jobs.restart"], [], ["loc", [null, [109, 123], [109, 143]]], 0, 0]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("d-flow-ember/templates/jobs/index", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 22,
                "column": 12
              },
              "end": {
                "line": 22,
                "column": 28
              }
            },
            "moduleName": "d-flow-ember/templates/jobs/index.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("---");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 24,
                  "column": 14
                },
                "end": {
                  "line": 24,
                  "column": 62
                }
              },
              "moduleName": "d-flow-ember/templates/jobs/index.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["content", "option.label", ["loc", [null, [24, 46], [24, 62]]], 0, 0, 0, 0]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 23,
                "column": 12
              },
              "end": {
                "line": 25,
                "column": 14
              }
            },
            "moduleName": "d-flow-ember/templates/jobs/index.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["block", "x-option", [], ["value", ["subexpr", "@mut", [["get", "option.value", ["loc", [null, [24, 32], [24, 44]]], 0, 0, 0, 0]], [], [], 0, 0]], 0, null, ["loc", [null, [24, 14], [24, 75]]]]],
          locals: ["option"],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 21,
              "column": 10
            },
            "end": {
              "line": 26,
              "column": 12
            }
          },
          "moduleName": "d-flow-ember/templates/jobs/index.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "x-option", [], [], 0, null, ["loc", [null, [22, 12], [22, 41]]]], ["block", "each", [["get", "stateSelection", ["loc", [null, [23, 20], [23, 34]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [23, 12], [25, 23]]]]],
        locals: [],
        templates: [child0, child1]
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 45,
              "column": 8
            },
            "end": {
              "line": 47,
              "column": 8
            }
          },
          "moduleName": "d-flow-ember/templates/jobs/index.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "job-row", [], ["job", ["subexpr", "@mut", [["get", "job", ["loc", [null, [46, 24], [46, 27]]], 0, 0, 0, 0]], [], [], 0, 0], "showWorkOrder", false], ["loc", [null, [46, 10], [46, 49]]], 0, 0]],
        locals: ["job"],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 53,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/jobs/index.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "panel panel-default");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-heading");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "panel-title");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-body");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "row");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "col-md-6 col-xs-12");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "input-group");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("span");
        dom.setAttribute(el6, "class", "input-group-btn");
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("button");
        dom.setAttribute(el7, "class", "btn btn-default");
        dom.setAttribute(el7, "type", "button");
        var el8 = dom.createComment("");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "col-md-6 col-xs-12");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "input-group");
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("span");
        dom.setAttribute(el6, "class", "input-group-addon");
        dom.setAttribute(el6, "id", "status-text");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  \n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-body");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("table");
        dom.setAttribute(el3, "class", "table table-hover");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("thead");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("tr");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("tbody");
        var el5 = dom.createTextNode("\n");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(element0, [3]);
        var element2 = dom.childAt(element1, [1]);
        var element3 = dom.childAt(element2, [1, 1]);
        var element4 = dom.childAt(element3, [3, 1]);
        var element5 = dom.childAt(element2, [3, 1]);
        var element6 = dom.childAt(element0, [5]);
        var element7 = dom.childAt(element6, [1]);
        var element8 = dom.childAt(element7, [1, 1]);
        var morphs = new Array(14);
        morphs[0] = dom.createMorphAt(dom.childAt(element0, [1, 1]), 0, 0);
        morphs[1] = dom.createMorphAt(element3, 1, 1);
        morphs[2] = dom.createElementMorph(element4);
        morphs[3] = dom.createMorphAt(element4, 0, 0);
        morphs[4] = dom.createMorphAt(dom.childAt(element5, [1]), 0, 0);
        morphs[5] = dom.createMorphAt(element5, 3, 3);
        morphs[6] = dom.createMorphAt(element1, 3, 3);
        morphs[7] = dom.createMorphAt(dom.childAt(element8, [1]), 0, 0);
        morphs[8] = dom.createMorphAt(dom.childAt(element8, [3]), 0, 0);
        morphs[9] = dom.createMorphAt(dom.childAt(element8, [5]), 0, 0);
        morphs[10] = dom.createMorphAt(dom.childAt(element8, [7]), 0, 0);
        morphs[11] = dom.createMorphAt(dom.childAt(element8, [9]), 0, 0);
        morphs[12] = dom.createMorphAt(dom.childAt(element7, [3]), 1, 1);
        morphs[13] = dom.createMorphAt(element6, 3, 3);
        return morphs;
      },
      statements: [["inline", "t", ["jobs.header"], [], ["loc", [null, [3, 29], [3, 48]]], 0, 0], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "query", ["loc", [null, [9, 24], [9, 29]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control", "enter", "searchJobs", "placeholder", ["subexpr", "t", ["jobs.search"], [], ["loc", [null, [11, 22], [11, 39]]], 0, 0]], ["loc", [null, [9, 10], [11, 41]]], 0, 0], ["element", "action", ["searchJobs", ["get", "query", ["loc", [null, [13, 80], [13, 85]]], 0, 0, 0, 0]], [], ["loc", [null, [13, 58], [13, 87]]], 0, 0], ["inline", "t", ["jobs.search"], [], ["loc", [null, [13, 88], [13, 107]]], 0, 0], ["inline", "t", ["jobs.status"], [], ["loc", [null, [20, 57], [20, 76]]], 0, 0], ["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "state", ["loc", [null, [21, 28], [21, 33]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 0, null, ["loc", [null, [21, 10], [26, 25]]]], ["inline", "pagination-pager-data", [], ["pagination", ["subexpr", "@mut", [["get", "model.meta.pagination", ["loc", [null, [30, 39], [30, 60]]], 0, 0, 0, 0]], [], [], 0, 0], "total", ["subexpr", "@mut", [["get", "model.meta.query.total", ["loc", [null, [30, 67], [30, 89]]], 0, 0, 0, 0]], [], [], 0, 0]], ["loc", [null, [30, 4], [30, 91]]], 0, 0], ["inline", "t", ["jobs.id"], [], ["loc", [null, [37, 14], [37, 29]]], 0, 0], ["inline", "t", ["jobs.name"], [], ["loc", [null, [38, 14], [38, 31]]], 0, 0], ["inline", "t", ["jobs.breadcrumb"], [], ["loc", [null, [39, 14], [39, 37]]], 0, 0], ["inline", "t", ["jobs.flowStep"], [], ["loc", [null, [40, 14], [40, 35]]], 0, 0], ["inline", "t", ["jobs.flow"], [], ["loc", [null, [41, 14], [41, 31]]], 0, 0], ["block", "each", [["get", "model", ["loc", [null, [45, 16], [45, 21]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [45, 8], [47, 17]]]], ["inline", "pagination-pager", [], ["pagination", ["subexpr", "@mut", [["get", "model.meta.pagination", ["loc", [null, [50, 34], [50, 55]]], 0, 0, 0, 0]], [], [], 0, 0]], ["loc", [null, [50, 4], [50, 57]]], 0, 0]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("d-flow-ember/templates/jobs/queue", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 3,
              "column": 0
            },
            "end": {
              "line": 8,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/jobs/queue.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "col-xs-12 alert alert-warning");
          var el2 = dom.createTextNode("\n    Köhanteraren är begränsad till ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(" samtidiga WAITFOR-processer.");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("br");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    Övriga processer kommer ej bearbetas förrän WAITFOR hamnat under gränsen igen.\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["content", "model.meta.queue_manager_limit_count", ["loc", [null, [5, 35], [5, 75]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 21,
              "column": 6
            },
            "end": {
              "line": 23,
              "column": 6
            }
          },
          "moduleName": "d-flow-ember/templates/jobs/queue.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "step-row", [], ["step", ["subexpr", "@mut", [["get", "step", ["loc", [null, [22, 24], [22, 28]]], 0, 0, 0, 0]], [], [], 0, 0]], ["loc", [null, [22, 8], [22, 30]]], 0, 0]],
        locals: ["step"],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 27,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/jobs/queue.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("button");
        dom.setAttribute(el1, "class", "btn btn-default");
        var el2 = dom.createTextNode("Uppdatera");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("hr");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("  ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("table");
        dom.setAttribute(el1, "class", "table");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("thead");
        var el3 = dom.createTextNode("\n      ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("tr");
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Jobb ID");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Process");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Info");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Aktiverad");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Startad");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Status");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("tbody");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(fragment, [6]);
        var morphs = new Array(4);
        morphs[0] = dom.createElementMorph(element0);
        morphs[1] = dom.createMorphAt(fragment, 4, 4, contextualElement);
        morphs[2] = dom.createMorphAt(dom.childAt(element1, [3]), 1, 1);
        morphs[3] = dom.createMorphAt(element1, 5, 5);
        return morphs;
      },
      statements: [["element", "action", ["refreshModel"], [], ["loc", [null, [1, 31], [1, 56]]], 0, 0], ["block", "if", [["get", "model.meta.queue_manager_limited", ["loc", [null, [3, 6], [3, 38]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [3, 0], [8, 7]]]], ["block", "each", [["get", "model", ["loc", [null, [21, 14], [21, 19]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [21, 6], [23, 15]]]], ["content", "step.id", ["loc", [null, [25, 2], [25, 13]]], 0, 0, 0, 0]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("d-flow-ember/templates/jobs/show",["exports"],function(exports){exports["default"] = Ember.HTMLBars.template((function(){var child0=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":3,"column":6},"end":{"line":3,"column":55}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createComment("");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);dom.insertBoundary(fragment,0);dom.insertBoundary(fragment,null);return morphs;},statements:[["inline","t",["nodes.root"],[],["loc",[null,[3,37],[3,55]]],0,0]],locals:[],templates:[]};})();var child1=(function(){var child0=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":6,"column":6},"end":{"line":6,"column":51}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createComment("");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);dom.insertBoundary(fragment,0);dom.insertBoundary(fragment,null);return morphs;},statements:[["content","parent.name",["loc",[null,[6,6],[6,51]]],0,0,0,0]],locals:[],templates:[]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":5,"column":2},"end":{"line":7,"column":2}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("  ");dom.appendChild(el0,el1);var el1=dom.createElement("li");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1]),0,0);return morphs;},statements:[["block","link-to",["node.show",["get","parent.id",["loc",[null,[6,40],[6,49]]],0,0,0,0]],[],0,null,["loc",[null,[6,6],[6,51]]]]],locals:[],templates:[child0]};})();var child1=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":7,"column":2},"end":{"line":9,"column":2}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("  ");dom.appendChild(el0,el1);var el1=dom.createElement("li");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1]),0,0);return morphs;},statements:[["content","parent.name",["loc",[null,[8,6],[8,21]]],0,0,0,0]],locals:[],templates:[]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":4,"column":2},"end":{"line":10,"column":2}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:1,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createComment("");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);dom.insertBoundary(fragment,0);dom.insertBoundary(fragment,null);return morphs;},statements:[["block","if",[["get","parent.id",["loc",[null,[5,8],[5,17]]],0,0,0,0]],[],0,1,["loc",[null,[5,2],[9,9]]]]],locals:["parent"],templates:[child0,child1]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":1,"column":0},"end":{"line":12,"column":0}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createElement("ul");dom.setAttribute(el1,"class","breadcrumb");var el2=dom.createTextNode("\n  ");dom.appendChild(el1,el2);var el2=dom.createElement("li");var el3=dom.createComment("");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n");dom.appendChild(el1,el2);var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element28=dom.childAt(fragment,[0]);var morphs=new Array(2);morphs[0] = dom.createMorphAt(dom.childAt(element28,[1]),0,0);morphs[1] = dom.createMorphAt(element28,3,3);return morphs;},statements:[["block","link-to",["node.show","root"],[],0,null,["loc",[null,[3,6],[3,67]]]],["block","each",[["get","model.breadcrumb",["loc",[null,[4,10],[4,26]]],0,0,0,0]],[],1,null,["loc",[null,[4,2],[10,11]]]]],locals:[],templates:[child0,child1]};})();var child1=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":16,"column":0},"end":{"line":20,"column":0}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createElement("div");dom.setAttribute(el1,"class","alert alert-danger");var el2=dom.createTextNode("\n  ");dom.appendChild(el1,el2);var el2=dom.createComment("");dom.appendChild(el1,el2);var el2=dom.createTextNode("\n");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[0]),1,1);return morphs;},statements:[["content","model.error.msg",["loc",[null,[18,2],[18,21]]],0,0,0,0]],locals:[],templates:[]};})();var child2=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":24,"column":84},"end":{"line":24,"column":174}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode(" ");dom.appendChild(el0,el1);var el1=dom.createElement("span");dom.setAttribute(el1,"class","label label-danger");var el2=dom.createTextNode(" ");dom.appendChild(el1,el2);var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1]),1,1);return morphs;},statements:[["inline","t",["menu.quarantine"],[],["loc",[null,[24,144],[24,167]]],0,0]],locals:[],templates:[]};})();var child3=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":27,"column":8},"end":{"line":27,"column":141}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createComment("");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);dom.insertBoundary(fragment,0);dom.insertBoundary(fragment,null);return morphs;},statements:[["inline","icon-link",[],["titleKey","jobs.edit","classNames","fa fa-2x fa-pencil-square-o"],["loc",[null,[27,66],[27,141]]],0,0]],locals:[],templates:[]};})();var child1=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":35,"column":8},"end":{"line":40,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("        ");dom.appendChild(el0,el1);var el1=dom.createComment(" Button trigger modal ");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n        ");dom.appendChild(el0,el1);var el1=dom.createElement("a");dom.setAttribute(el1,"type","button");dom.setAttribute(el1,"class","btn");dom.setAttribute(el1,"data-toggle","modal");dom.setAttribute(el1,"data-target","#unQuarantineModal");var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createComment("");dom.appendChild(el1,el2);var el2=dom.createTextNode("\n        ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[3]),1,1);return morphs;},statements:[["inline","icon-link",[],["titleKey","jobs.unQuarantine","classNames","fa fa-2x fa-exclamation-triangle"],["loc",[null,[38,10],[38,98]]],0,0]],locals:[],templates:[]};})();var child2=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":40,"column":8},"end":{"line":45,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("        ");dom.appendChild(el0,el1);var el1=dom.createComment(" Button trigger modal ");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n        ");dom.appendChild(el0,el1);var el1=dom.createElement("a");dom.setAttribute(el1,"type","button");dom.setAttribute(el1,"class","btn");dom.setAttribute(el1,"data-toggle","modal");dom.setAttribute(el1,"data-target","#quarantineModal");var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createComment("");dom.appendChild(el1,el2);var el2=dom.createTextNode("\n        ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[3]),1,1);return morphs;},statements:[["inline","icon-link",[],["titleKey","jobs.quarantine","classNames","fa fa-2x fa-exclamation-triangle"],["loc",[null,[43,10],[43,96]]],0,0]],locals:[],templates:[]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":26,"column":6},"end":{"line":46,"column":6}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("        ");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n        ");dom.appendChild(el0,el1);var el1=dom.createElement("a");dom.setAttribute(el1,"class","btn");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n        ");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n\n        ");dom.appendChild(el0,el1);var el1=dom.createElement("a");dom.setAttribute(el1,"type","button");dom.setAttribute(el1,"class","btn");dom.setAttribute(el1,"data-toggle","modal");dom.setAttribute(el1,"data-target","#restartModal");var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createComment("");dom.appendChild(el1,el2);var el2=dom.createTextNode("\n        ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n\n");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element27=dom.childAt(fragment,[3]);var morphs=new Array(6);morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);morphs[1] = dom.createElementMorph(element27);morphs[2] = dom.createMorphAt(element27,0,0);morphs[3] = dom.createMorphAt(fragment,5,5,contextualElement);morphs[4] = dom.createMorphAt(dom.childAt(fragment,[7]),1,1);morphs[5] = dom.createMorphAt(fragment,9,9,contextualElement);dom.insertBoundary(fragment,null);return morphs;},statements:[["block","link-to",["jobs.show.edit",["get","model",["loc",[null,[27,36],[27,41]]],0,0,0,0]],["class","btn navbar-btn"],0,null,["loc",[null,[27,8],[27,153]]]],["element","action",["deleteJob",["get","model.id",["loc",[null,[28,44],[28,52]]],0,0,0,0]],[],["loc",[null,[28,23],[28,54]]],0,0],["inline","icon-link",[],["titleKey","jobs.delete","classNames","fa fa-2x fa-trash"],["loc",[null,[28,55],[28,122]]],0,0],["inline","print-link",[],["jobId",["subexpr","@mut",[["get","model.id",["loc",[null,[29,27],[29,35]]],0,0,0,0]],[],[],0,0],"type","button","titleKey","jobs.print"],["loc",[null,[29,8],[29,73]]],0,0],["inline","icon-link",[],["titleKey","jobs.restart","classNames","fa fa-2x fa-recycle"],["loc",[null,[32,10],[32,80]]],0,0],["block","if",[["get","model.quarantined",["loc",[null,[35,14],[35,31]]],0,0,0,0]],[],1,2,["loc",[null,[35,8],[45,15]]]]],locals:[],templates:[child0,child1,child2]};})();var child4=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":55,"column":10},"end":{"line":57,"column":10}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("          ");dom.appendChild(el0,el1);var el1=dom.createElement("br");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(fragment,2,2,contextualElement);return morphs;},statements:[["content","model.flow_step.status",["loc",[null,[56,15],[56,41]]],0,0,0,0]],locals:[],templates:[]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":53,"column":10},"end":{"line":59,"column":10}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createElement("strong");var el2=dom.createComment("");dom.appendChild(el1,el2);var el2=dom.createTextNode(":");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode(" ");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createElement("br");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n          ");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("          ");dom.appendChild(el0,el1);var el1=dom.createElement("a");dom.setAttribute(el1,"class","job-refresh");var el2=dom.createElement("i");dom.setAttribute(el2,"class","fa fa-refresh");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n          ");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element26=dom.childAt(fragment,[9]);var morphs=new Array(5);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[0]),0,0);morphs[1] = dom.createMorphAt(fragment,2,2,contextualElement);morphs[2] = dom.createMorphAt(fragment,5,5,contextualElement);morphs[3] = dom.createMorphAt(fragment,7,7,contextualElement);morphs[4] = dom.createElementMorph(element26);return morphs;},statements:[["inline","t",["jobs.flowStep"],[],["loc",[null,[53,42],[53,63]]],0,0],["content","model.status_string",["loc",[null,[53,74],[53,97]]],0,0,0,0],["content","model.sinceStarted",["loc",[null,[54,10],[54,32]]],0,0,0,0],["block","if",[["get","model.flow_step.status",["loc",[null,[55,16],[55,38]]],0,0,0,0]],[],0,null,["loc",[null,[55,10],[57,17]]]],["element","action",["refreshModel"],[],["loc",[null,[58,33],[58,58]]],0,0]],locals:[],templates:[child0]};})();var child5=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":59,"column":10},"end":{"line":60,"column":10}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createElement("strong");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[0]),0,0);return morphs;},statements:[["inline","t",["jobs.states.FINISH"],[],["loc",[null,[59,26],[59,52]]],0,0]],locals:[],templates:[]};})();var child6=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":65,"column":8},"end":{"line":70,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("        ");dom.appendChild(el0,el1);var el1=dom.createComment(" Button trigger modal ");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n        ");dom.appendChild(el0,el1);var el1=dom.createElement("a");dom.setAttribute(el1,"type","button");dom.setAttribute(el1,"class","btn btn-default btn-lg");dom.setAttribute(el1,"data-toggle","modal");dom.setAttribute(el1,"data-target","#unQuarantineModal");var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createElement("i");dom.setAttribute(el2,"class","fa fa-lg fa-exclamation-triangle");dom.appendChild(el1,el2);var el2=dom.createTextNode(" ");dom.appendChild(el1,el2);var el2=dom.createComment("");dom.appendChild(el1,el2);var el2=dom.createTextNode("\n        ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[3]),3,3);return morphs;},statements:[["inline","t",["jobs.unQuarantine"],[],["loc",[null,[68,59],[68,84]]],0,0]],locals:[],templates:[]};})();var child1=(function(){var child0=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":72,"column":12},"end":{"line":76,"column":12}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("              ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","metadata-setter-wrapper");var el2=dom.createTextNode("\n                    ");dom.appendChild(el1,el2);var el2=dom.createComment("");dom.appendChild(el1,el2);var el2=dom.createTextNode("\n              ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1]),1,1);return morphs;},statements:[["inline","metadata-setter",[],["performingManualAction",["subexpr","@mut",[["get","performingManualAction",["loc",[null,[74,61],[74,83]]],0,0,0,0]],[],[],0,0],"packageMetadata",["subexpr","@mut",[["get","model.package_metadata",["loc",[null,[74,100],[74,122]]],0,0,0,0]],[],[],0,0],"flowStep",["subexpr","@mut",[["get","model.flow_step",["loc",[null,[74,132],[74,147]]],0,0,0,0]],[],[],0,0],"flowStepSuccess",["subexpr","action",["flowStepSuccess"],[],["loc",[null,[74,164],[74,190]]],0,0]],["loc",[null,[74,20],[74,192]]],0,0]],locals:[],templates:[]};})();var child1=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":76,"column":12},"end":{"line":78,"column":12}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("              ");dom.appendChild(el0,el1);var el1=dom.createElement("button");dom.setAttribute(el1,"class","btn btn-primary");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element25=dom.childAt(fragment,[1]);var morphs=new Array(3);morphs[0] = dom.createAttrMorph(element25,'disabled');morphs[1] = dom.createElementMorph(element25);morphs[2] = dom.createMorphAt(element25,0,0);return morphs;},statements:[["attribute","disabled",["get","performingManualAction",["loc",[null,[77,57],[77,79]]],0,0,0,0],0,0,0,0],["element","action",["flowStepSuccessDoStuff",["get","model",["loc",[null,[77,116],[77,121]]],0,0,0,0],["get","model.flow_step",["loc",[null,[77,122],[77,137]]],0,0,0,0]],[],["loc",[null,[77,82],[77,139]]],0,0],["content","model.flow_step.parsed_params.msg",["loc",[null,[77,140],[77,177]]],0,0,0,0]],locals:[],templates:[]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":71,"column":10},"end":{"line":80,"column":10}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);dom.insertBoundary(fragment,0);return morphs;},statements:[["block","if",[["get","showMetadata",["loc",[null,[72,18],[72,30]]],0,0,0,0]],[],0,1,["loc",[null,[72,12],[78,19]]]]],locals:[],templates:[child0,child1]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":70,"column":8},"end":{"line":81,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createComment("");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);dom.insertBoundary(fragment,0);dom.insertBoundary(fragment,null);return morphs;},statements:[["block","if",[["get","model.waitingForManualAction",["loc",[null,[71,16],[71,44]]],0,0,0,0]],[],0,null,["loc",[null,[71,10],[80,17]]]]],locals:[],templates:[child0]};})();var child2=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":82,"column":8},"end":{"line":84,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("        ");dom.appendChild(el0,el1);var el1=dom.createElement("a");dom.setAttribute(el1,"class","btn btn-default btn-lg pull-right");dom.setAttribute(el1,"target","_blank");var el2=dom.createElement("i");dom.setAttribute(el2,"class","fa fa-file-pdf-o");dom.setAttribute(el2,"style","color:red");dom.appendChild(el1,el2);var el2=dom.createTextNode(" ");dom.appendChild(el1,el2);var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element24=dom.childAt(fragment,[1]);var morphs=new Array(2);morphs[0] = dom.createAttrMorph(element24,'href');morphs[1] = dom.createMorphAt(element24,2,2);return morphs;},statements:[["attribute","href",["concat",[["get","pdfUrl",["loc",[null,[83,61],[83,67]]],0,0,0,0]],0,0,0,0,0],0,0,0,0],["inline","t",["jobs.pdfLink"],[],["loc",[null,[83,138],[83,158]]],0,0]],locals:[],templates:[]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":64,"column":8},"end":{"line":85,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(2);morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);morphs[1] = dom.createMorphAt(fragment,1,1,contextualElement);dom.insertBoundary(fragment,0);dom.insertBoundary(fragment,null);return morphs;},statements:[["block","if",[["get","model.quarantined",["loc",[null,[65,14],[65,31]]],0,0,0,0]],[],0,1,["loc",[null,[65,8],[81,15]]]],["block","if",[["get","model.flow_step.parsed_params.pdf_file_path",["loc",[null,[82,14],[82,57]]],0,0,0,0]],[],2,null,["loc",[null,[82,8],[84,15]]]]],locals:[],templates:[child0,child1,child2]};})();var child7=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":96,"column":12},"end":{"line":98,"column":12}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("            ");dom.appendChild(el0,el1);var el1=dom.createElement("a");dom.setAttribute(el1,"target","_blank");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element23=dom.childAt(fragment,[1]);var morphs=new Array(2);morphs[0] = dom.createAttrMorph(element23,'href');morphs[1] = dom.createMorphAt(element23,0,0);return morphs;},statements:[["attribute","href",["concat",[["get","model.source_link",["loc",[null,[97,23],[97,40]]],0,0,0,0]],0,0,0,0,0],0,0,0,0],["content","model.catalog_id",["loc",[null,[97,60],[97,80]]],0,0,0,0]],locals:[],templates:[]};})();var child8=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":98,"column":12},"end":{"line":100,"column":12}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("            ");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);return morphs;},statements:[["content","model.catalog_id",["loc",[null,[99,12],[99,32]]],0,0,0,0]],locals:[],templates:[]};})();var child9=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":105,"column":8},"end":{"line":114,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("        ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","row");var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createElement("div");dom.setAttribute(el2,"class","col-xs-3");var el3=dom.createTextNode("\n            ");dom.appendChild(el2,el3);var el3=dom.createElement("strong");var el4=dom.createComment("");dom.appendChild(el3,el4);dom.appendChild(el2,el3);var el3=dom.createTextNode("\n          ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createElement("div");dom.setAttribute(el2,"class","col-xs-9");var el3=dom.createTextNode("\n            ");dom.appendChild(el2,el3);var el3=dom.createComment("");dom.appendChild(el2,el3);var el3=dom.createTextNode("\n          ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n        ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element22=dom.childAt(fragment,[1]);var morphs=new Array(2);morphs[0] = dom.createMorphAt(dom.childAt(element22,[1,1]),0,0);morphs[1] = dom.createMorphAt(dom.childAt(element22,[3]),1,1);return morphs;},statements:[["inline","t",["jobs.title"],[],["loc",[null,[108,20],[108,38]]],0,0],["content","model.title",["loc",[null,[111,12],[111,27]]],0,0,0,0]],locals:[],templates:[]};})();var child10=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":116,"column":8},"end":{"line":125,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("        ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","row");var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createElement("div");dom.setAttribute(el2,"class","col-xs-3");var el3=dom.createTextNode("\n            ");dom.appendChild(el2,el3);var el3=dom.createElement("strong");var el4=dom.createComment("");dom.appendChild(el3,el4);dom.appendChild(el2,el3);var el3=dom.createTextNode("\n          ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createElement("div");dom.setAttribute(el2,"class","col-xs-9");var el3=dom.createTextNode("\n            ");dom.appendChild(el2,el3);var el3=dom.createComment("");dom.appendChild(el2,el3);var el3=dom.createTextNode("\n          ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n        ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element21=dom.childAt(fragment,[1]);var morphs=new Array(2);morphs[0] = dom.createMorphAt(dom.childAt(element21,[1,1]),0,0);morphs[1] = dom.createMorphAt(dom.childAt(element21,[3]),1,1);return morphs;},statements:[["inline","t",["jobs.author"],[],["loc",[null,[119,20],[119,39]]],0,0],["content","model.author",["loc",[null,[122,12],[122,28]]],0,0,0,0]],locals:[],templates:[]};})();var child11=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":127,"column":8},"end":{"line":136,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("        ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","row");var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createElement("div");dom.setAttribute(el2,"class","col-xs-3");var el3=dom.createTextNode("\n            ");dom.appendChild(el2,el3);var el3=dom.createElement("strong");var el4=dom.createComment("");dom.appendChild(el3,el4);dom.appendChild(el2,el3);var el3=dom.createTextNode("\n          ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createElement("div");dom.setAttribute(el2,"class","col-xs-9");var el3=dom.createTextNode("\n            ");dom.appendChild(el2,el3);var el3=dom.createComment("");dom.appendChild(el2,el3);var el3=dom.createTextNode("\n          ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n        ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element20=dom.childAt(fragment,[1]);var morphs=new Array(2);morphs[0] = dom.createMorphAt(dom.childAt(element20,[1,1]),0,0);morphs[1] = dom.createMorphAt(dom.childAt(element20,[3]),1,1);return morphs;},statements:[["inline","t",["jobs.type_of_record.label"],[],["loc",[null,[130,20],[130,53]]],0,0],["content","model.type_of_record_string",["loc",[null,[133,12],[133,43]]],0,0,0,0]],locals:[],templates:[]};})();var child12=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":138,"column":8},"end":{"line":147,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("        ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","row");var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createElement("div");dom.setAttribute(el2,"class","col-xs-3");var el3=dom.createTextNode("\n            ");dom.appendChild(el2,el3);var el3=dom.createComment("");dom.appendChild(el2,el3);var el3=dom.createTextNode("\n          ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createElement("div");dom.setAttribute(el2,"class","col-xs-9");var el3=dom.createTextNode("\n            ");dom.appendChild(el2,el3);var el3=dom.createComment("");dom.appendChild(el2,el3);var el3=dom.createTextNode("\n          ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n        ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element19=dom.childAt(fragment,[1]);var morphs=new Array(2);morphs[0] = dom.createMorphAt(dom.childAt(element19,[1]),1,1);morphs[1] = dom.createMorphAt(dom.childAt(element19,[3]),1,1);return morphs;},statements:[["inline","t",["jobs.chronology"],[],["loc",[null,[141,12],[141,35]]],0,0],["content","model.chronology_string",["loc",[null,[144,12],[144,39]]],0,0,0,0]],locals:[],templates:[]};})();var child13=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":149,"column":8},"end":{"line":158,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("        ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","row");var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createElement("div");dom.setAttribute(el2,"class","col-xs-3");var el3=dom.createTextNode("\n            ");dom.appendChild(el2,el3);var el3=dom.createComment("");dom.appendChild(el2,el3);var el3=dom.createTextNode("\n          ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createElement("div");dom.setAttribute(el2,"class","col-xs-9");var el3=dom.createTextNode("\n            ");dom.appendChild(el2,el3);var el3=dom.createComment("");dom.appendChild(el2,el3);var el3=dom.createTextNode("\n          ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n        ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element18=dom.childAt(fragment,[1]);var morphs=new Array(2);morphs[0] = dom.createMorphAt(dom.childAt(element18,[1]),1,1);morphs[1] = dom.createMorphAt(dom.childAt(element18,[3]),1,1);return morphs;},statements:[["inline","t",["jobs.ordinality"],[],["loc",[null,[152,12],[152,35]]],0,0],["content","model.ordinality_string",["loc",[null,[155,12],[155,39]]],0,0,0,0]],locals:[],templates:[]};})();var child14=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":165,"column":12},"end":{"line":167,"column":12}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("            ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","label label-danger active btn-xs");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1]),0,0);return morphs;},statements:[["content","model.copyright_string",["loc",[null,[166,58],[166,84]]],0,0,0,0]],locals:[],templates:[]};})();var child15=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":167,"column":12},"end":{"line":169,"column":12}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("            ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","label label-success active btn-xs");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1]),0,0);return morphs;},statements:[["content","model.copyright_string",["loc",[null,[168,59],[168,85]]],0,0,0,0]],locals:[],templates:[]};})();var child16=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":180,"column":12},"end":{"line":182,"column":12}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("            ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","label label-default active btn-xs");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1]),0,0);return morphs;},statements:[["inline","t",["jobs.priority_values.normal"],[],["loc",[null,[181,59],[181,94]]],0,0]],locals:[],templates:[]};})();var child1=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":183,"column":12},"end":{"line":185,"column":12}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("            ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","label label-danger active btn-xs");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1]),0,0);return morphs;},statements:[["inline","t",["jobs.priority_values.high"],[],["loc",[null,[184,58],[184,91]]],0,0]],locals:[],templates:[]};})();var child1=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":186,"column":12},"end":{"line":188,"column":12}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("            ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","label label-success active btn-xs");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1]),0,0);return morphs;},statements:[["inline","t",["jobs.priority_values.low"],[],["loc",[null,[187,59],[187,91]]],0,0]],locals:[],templates:[]};})();var child1=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":188,"column":12},"end":{"line":190,"column":12}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("            ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","label label-default active btn-xs");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1]),0,0);return morphs;},statements:[["inline","t",["jobs.priority_values.none"],[],["loc",[null,[189,59],[189,92]]],0,0]],locals:[],templates:[]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":185,"column":12},"end":{"line":191,"column":12}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createComment("");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);dom.insertBoundary(fragment,0);dom.insertBoundary(fragment,null);return morphs;},statements:[["block","if",[["get","isPriorityLow",["loc",[null,[186,18],[186,31]]],0,0,0,0]],[],0,1,["loc",[null,[186,12],[190,19]]]]],locals:[],templates:[child0,child1]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":182,"column":12},"end":{"line":192,"column":12}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createComment("");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);dom.insertBoundary(fragment,0);dom.insertBoundary(fragment,null);return morphs;},statements:[["block","if",[["get","isPriorityHigh",["loc",[null,[183,18],[183,32]]],0,0,0,0]],[],0,1,["loc",[null,[183,12],[191,19]]]]],locals:[],templates:[child0,child1]};})();var child2=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":200,"column":10},"end":{"line":207,"column":10}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:2,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("          ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","col-xs-4");var el2=dom.createTextNode("\n            ");dom.appendChild(el1,el2);var el2=dom.createElement("strong");var el3=dom.createComment("");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n          ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","col-xs-8");var el2=dom.createTextNode("\n            [ ");dom.appendChild(el1,el2);var el2=dom.createComment("");dom.appendChild(el1,el2);var el2=dom.createTextNode(" ]\n          ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(2);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1,1]),0,0);morphs[1] = dom.createMorphAt(dom.childAt(fragment,[3]),1,1);return morphs;},statements:[["content","key",["loc",[null,[202,20],[202,27]]],0,0,0,0],["content","value",["loc",[null,[205,14],[205,23]]],0,0,0,0]],locals:["key","value"],templates:[]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":195,"column":8},"end":{"line":209,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("        ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","row");var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createElement("div");dom.setAttribute(el2,"class","col-xs-12");var el3=dom.createTextNode("\n            ");dom.appendChild(el2,el3);var el3=dom.createElement("h4");var el4=dom.createTextNode("Flödesparametrar för ");dom.appendChild(el3,el4);var el4=dom.createComment("");dom.appendChild(el3,el4);dom.appendChild(el2,el3);var el3=dom.createTextNode("\n          ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n");dom.appendChild(el1,el2);var el2=dom.createComment("");dom.appendChild(el1,el2);var el2=dom.createTextNode("        ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element15=dom.childAt(fragment,[1]);var morphs=new Array(2);morphs[0] = dom.createMorphAt(dom.childAt(element15,[1,1]),1,1);morphs[1] = dom.createMorphAt(element15,3,3);return morphs;},statements:[["content","currentFlow.name",["loc",[null,[198,37],[198,57]]],0,0,0,0],["block","each-in",[["get","model.flow_parameters",["loc",[null,[200,21],[200,42]]],0,0,0,0]],[],0,null,["loc",[null,[200,10],[207,22]]]]],locals:[],templates:[child0]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":173,"column":8},"end":{"line":210,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("        ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","row");var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createElement("div");dom.setAttribute(el2,"class","col-xs-3");var el3=dom.createTextNode("\n            ");dom.appendChild(el2,el3);var el3=dom.createElement("strong");var el4=dom.createComment("");dom.appendChild(el3,el4);dom.appendChild(el2,el3);var el3=dom.createTextNode("\n          ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createElement("div");dom.setAttribute(el2,"class","col-xs-9");var el3=dom.createTextNode("\n            ");dom.appendChild(el2,el3);var el3=dom.createComment("");dom.appendChild(el2,el3);var el3=dom.createTextNode("\n");dom.appendChild(el2,el3);var el3=dom.createComment("");dom.appendChild(el2,el3);var el3=dom.createTextNode("          ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n        ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element16=dom.childAt(fragment,[1]);var element17=dom.childAt(element16,[3]);var morphs=new Array(4);morphs[0] = dom.createMorphAt(dom.childAt(element16,[1,1]),0,0);morphs[1] = dom.createMorphAt(element17,1,1);morphs[2] = dom.createMorphAt(element17,3,3);morphs[3] = dom.createMorphAt(fragment,3,3,contextualElement);dom.insertBoundary(fragment,null);return morphs;},statements:[["inline","t",["jobs.priority"],[],["loc",[null,[176,20],[176,41]]],0,0],["content","prioritySelection.label",["loc",[null,[179,12],[179,39]]],0,0,0,0],["block","if",[["get","isPriorityNormal",["loc",[null,[180,18],[180,34]]],0,0,0,0]],[],0,1,["loc",[null,[180,12],[192,19]]]],["block","unless",[["get","setFlowParams",["loc",[null,[195,18],[195,31]]],0,0,0,0]],[],2,null,["loc",[null,[195,8],[209,19]]]]],locals:[],templates:[child0,child1,child2]};})();var child17=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":215,"column":8},"end":{"line":218,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("        ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","clearfix");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n        ");dom.appendChild(el0,el1);var el1=dom.createElement("strong");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode(" ");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(2);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[3]),0,0);morphs[1] = dom.createMorphAt(fragment,5,5,contextualElement);return morphs;},statements:[["inline","t",["jobs.object_info"],[],["loc",[null,[217,16],[217,40]]],0,0],["inline","markdown-text",[["get","model.object_info",["loc",[null,[217,66],[217,83]]],0,0,0,0]],[],["loc",[null,[217,50],[217,85]]],0,0]],locals:[],templates:[]};})();var child1=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":219,"column":8},"end":{"line":222,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("        ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","clearfix");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n        ");dom.appendChild(el0,el1);var el1=dom.createElement("strong");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode(" ");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(2);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[3]),0,0);morphs[1] = dom.createMorphAt(fragment,5,5,contextualElement);return morphs;},statements:[["inline","t",["jobs.comment"],[],["loc",[null,[221,16],[221,36]]],0,0],["inline","markdown-text",[["get","model.comment",["loc",[null,[221,62],[221,75]]],0,0,0,0]],[],["loc",[null,[221,46],[221,77]]],0,0]],locals:[],templates:[]};})();var child2=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":228,"column":8},"end":{"line":232,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:1,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("        ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","row");var el2=dom.createTextNode("\n          ");dom.appendChild(el1,el2);var el2=dom.createComment("");dom.appendChild(el1,el2);var el2=dom.createTextNode("\n        ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1]),1,1);return morphs;},statements:[["inline","parameter-input",[],["parameter",["subexpr","@mut",[["get","parameter",["loc",[null,[230,38],[230,47]]],0,0,0,0]],[],[],0,0],"values",["subexpr","@mut",[["get","model.flow_parameters",["loc",[null,[230,55],[230,76]]],0,0,0,0]],[],[],0,0]],["loc",[null,[230,10],[230,78]]],0,0]],locals:["parameter"],templates:[]};})();var child1=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":232,"column":8},"end":{"line":234,"column":8}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("        Inga flödesparametrar är definierade.\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(){return [];},statements:[],locals:[],templates:[]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":224,"column":6},"end":{"line":236,"column":6}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("      ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","col-xs-12");var el2=dom.createTextNode("\n        ");dom.appendChild(el1,el2);var el2=dom.createElement("h4");var el3=dom.createTextNode("Flödesparametrar för ");dom.appendChild(el2,el3);var el3=dom.createComment("");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n\n");dom.appendChild(el1,el2);var el2=dom.createComment("");dom.appendChild(el1,el2);var el2=dom.createTextNode("      ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element13=dom.childAt(fragment,[1]);var morphs=new Array(2);morphs[0] = dom.createMorphAt(dom.childAt(element13,[1]),1,1);morphs[1] = dom.createMorphAt(element13,3,3);return morphs;},statements:[["content","currentFlow.name",["loc",[null,[226,33],[226,53]]],0,0,0,0],["block","each",[["get","currentFlow.parameters.parameters",["loc",[null,[228,16],[228,49]]],0,0,0,0]],[],0,1,["loc",[null,[228,8],[234,17]]]]],locals:[],templates:[child0,child1]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":213,"column":6},"end":{"line":237,"column":6}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("      ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","col-xs-6");var el2=dom.createTextNode("\n");dom.appendChild(el1,el2);var el2=dom.createComment("");dom.appendChild(el1,el2);var el2=dom.createComment("");dom.appendChild(el1,el2);var el2=dom.createTextNode("      ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element14=dom.childAt(fragment,[1]);var morphs=new Array(3);morphs[0] = dom.createMorphAt(element14,1,1);morphs[1] = dom.createMorphAt(element14,2,2);morphs[2] = dom.createMorphAt(fragment,3,3,contextualElement);dom.insertBoundary(fragment,null);return morphs;},statements:[["block","if",[["get","model.object_info",["loc",[null,[215,14],[215,31]]],0,0,0,0]],[],0,null,["loc",[null,[215,8],[218,15]]]],["block","if",[["get","model.comment",["loc",[null,[219,14],[219,27]]],0,0,0,0]],[],1,null,["loc",[null,[219,8],[222,15]]]],["block","if",[["get","setFlowParams",["loc",[null,[224,12],[224,25]]],0,0,0,0]],[],2,null,["loc",[null,[224,6],[236,13]]]]],locals:[],templates:[child0,child1,child2]};})();var child18=(function(){var child0=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":258,"column":18},"end":{"line":260,"column":18}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:1,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("                  ");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);return morphs;},statements:[["inline","job-activity",[],["activity",["subexpr","@mut",[["get","activity",["loc",[null,[259,42],[259,50]]],0,0,0,0]],[],[],0,0]],["loc",[null,[259,18],[259,52]]],0,0]],locals:["activity"],templates:[]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":254,"column":14},"end":{"line":263,"column":14}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("              ");dom.appendChild(el0,el1);var el1=dom.createElement("table");dom.setAttribute(el1,"class","table");var el2=dom.createTextNode("\n                ");dom.appendChild(el1,el2);var el2=dom.createElement("tr");dom.appendChild(el1,el2);var el2=dom.createTextNode("\n                ");dom.appendChild(el1,el2);var el2=dom.createElement("tbody");var el3=dom.createTextNode("\n");dom.appendChild(el2,el3);var el3=dom.createComment("");dom.appendChild(el2,el3);var el3=dom.createTextNode("                ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n              ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1,3]),1,1);return morphs;},statements:[["block","each",[["get","model.activities",["loc",[null,[258,26],[258,42]]],0,0,0,0]],[],0,null,["loc",[null,[258,18],[260,27]]]]],locals:[],templates:[child0]};})();var child1=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":292,"column":20},"end":{"line":299,"column":20}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:1,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("                      ");dom.appendChild(el0,el1);var el1=dom.createElement("tr");var el2=dom.createTextNode("\n                        ");dom.appendChild(el1,el2);var el2=dom.createElement("td");var el3=dom.createComment("");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n                        ");dom.appendChild(el1,el2);var el2=dom.createElement("td");var el3=dom.createComment("");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n                        ");dom.appendChild(el1,el2);var el2=dom.createElement("td");var el3=dom.createComment("");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n                        ");dom.appendChild(el1,el2);var el2=dom.createElement("td");var el3=dom.createComment("");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n                      ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element1=dom.childAt(fragment,[1]);var morphs=new Array(4);morphs[0] = dom.createMorphAt(dom.childAt(element1,[1]),0,0);morphs[1] = dom.createMorphAt(dom.childAt(element1,[3]),0,0);morphs[2] = dom.createMorphAt(dom.childAt(element1,[5]),0,0);morphs[3] = dom.createMorphAt(dom.childAt(element1,[7]),0,0);return morphs;},statements:[["content","image.num",["loc",[null,[294,28],[294,41]]],0,0,0,0],["content","image.page_type",["loc",[null,[295,28],[295,47]]],0,0,0,0],["content","image.page_content",["loc",[null,[296,28],[296,50]]],0,0,0,0],["content","image.group_name",["loc",[null,[297,28],[297,48]]],0,0,0,0]],locals:["image"],templates:[]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":277,"column":14},"end":{"line":303,"column":14}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("              ");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n              ");dom.appendChild(el0,el1);var el1=dom.createElement("br");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n              ");dom.appendChild(el0,el1);var el1=dom.createElement("br");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n              ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","metadata-setter-wrapper");var el2=dom.createTextNode("\n                ");dom.appendChild(el1,el2);var el2=dom.createElement("table");dom.setAttribute(el2,"class","table table-hover table-condensed");var el3=dom.createTextNode("\n                  ");dom.appendChild(el2,el3);var el3=dom.createElement("thead");var el4=dom.createTextNode("\n                    ");dom.appendChild(el3,el4);var el4=dom.createElement("tr");var el5=dom.createTextNode("\n                      ");dom.appendChild(el4,el5);var el5=dom.createElement("th");var el6=dom.createTextNode("#");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n                      ");dom.appendChild(el4,el5);var el5=dom.createElement("th");var el6=dom.createTextNode("Page Type");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n                      ");dom.appendChild(el4,el5);var el5=dom.createElement("th");var el6=dom.createTextNode("Page Content");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n                      ");dom.appendChild(el4,el5);var el5=dom.createElement("th");var el6=dom.createTextNode("Group Name");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n                    ");dom.appendChild(el4,el5);dom.appendChild(el3,el4);var el4=dom.createTextNode("\n                  ");dom.appendChild(el3,el4);dom.appendChild(el2,el3);var el3=dom.createTextNode("\n                  ");dom.appendChild(el2,el3);var el3=dom.createElement("tbody");var el4=dom.createTextNode("\n");dom.appendChild(el3,el4);var el4=dom.createComment("");dom.appendChild(el3,el4);var el4=dom.createTextNode("                  ");dom.appendChild(el3,el4);dom.appendChild(el2,el3);var el3=dom.createTextNode("\n                ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n              ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(2);morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);morphs[1] = dom.createMorphAt(dom.childAt(fragment,[7,1,3]),1,1);return morphs;},statements:[["inline","xml-link",[],["jobId",["subexpr","@mut",[["get","model.id",["loc",[null,[278,31],[278,39]]],0,0,0,0]],[],[],0,0]],["loc",[null,[278,14],[278,41]]],0,0],["block","each",[["get","model.package_metadata.images",["loc",[null,[292,28],[292,57]]],0,0,0,0]],[],0,null,["loc",[null,[292,20],[299,29]]]]],locals:[],templates:[child0]};})();var child2=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":318,"column":16},"end":{"line":320,"column":16}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("                  ");dom.appendChild(el0,el1);var el1=dom.createElement("span");dom.setAttribute(el1,"class","file-list-info");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1]),0,0);return morphs;},statements:[["inline","t",["jobs.loadingFiles"],[],["loc",[null,[319,47],[319,72]]],0,0]],locals:[],templates:[]};})();var child1=(function(){var child0=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":322,"column":20},"end":{"line":324,"column":20}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:1,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("                      ");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);return morphs;},statements:[["inline","tree-item",[],["item",["subexpr","@mut",[["get","file",["loc",[null,[323,39],[323,43]]],0,0,0,0]],[],[],0,0],"jobId",["subexpr","@mut",[["get","model.id",["loc",[null,[323,50],[323,58]]],0,0,0,0]],[],[],0,0]],["loc",[null,[323,22],[323,60]]],0,0]],locals:["file"],templates:[]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":321,"column":18},"end":{"line":325,"column":18}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createComment("");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);dom.insertBoundary(fragment,0);dom.insertBoundary(fragment,null);return morphs;},statements:[["block","each",[["get","files",["loc",[null,[322,28],[322,33]]],0,0,0,0]],[],0,null,["loc",[null,[322,20],[324,29]]]]],locals:[],templates:[child0]};})();var child1=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":325,"column":18},"end":{"line":327,"column":18}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("                    ");dom.appendChild(el0,el1);var el1=dom.createElement("span");dom.setAttribute(el1,"class","file-list-info");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1]),0,0);return morphs;},statements:[["inline","t",["jobs.noFiles"],[],["loc",[null,[326,49],[326,69]]],0,0]],locals:[],templates:[]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":320,"column":16},"end":{"line":328,"column":16}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createComment("");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);dom.insertBoundary(fragment,0);dom.insertBoundary(fragment,null);return morphs;},statements:[["block","if",[["get","files",["loc",[null,[321,24],[321,29]]],0,0,0,0]],[],0,1,["loc",[null,[321,18],[327,25]]]]],locals:[],templates:[child0,child1]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":317,"column":14},"end":{"line":329,"column":14}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createComment("");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);dom.insertBoundary(fragment,0);dom.insertBoundary(fragment,null);return morphs;},statements:[["block","if",[["get","filesLoading",["loc",[null,[318,22],[318,34]]],0,0,0,0]],[],0,1,["loc",[null,[318,16],[328,23]]]]],locals:[],templates:[child0,child1]};})();var child3=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":343,"column":14},"end":{"line":346,"column":14}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("              ");dom.appendChild(el0,el1);var el1=dom.createElement("a");dom.setAttribute(el1,"type","button");dom.setAttribute(el1,"class","btn btn-default btn-lg");dom.setAttribute(el1,"data-toggle","modal");dom.setAttribute(el1,"data-target","#flowStepModal");var el2=dom.createComment("");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n              ");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(2);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1]),0,0);morphs[1] = dom.createMorphAt(fragment,3,3,contextualElement);return morphs;},statements:[["inline","t",["flowStep.set_new_flow_step"],[],["loc",[null,[344,111],[344,145]]],0,0],["inline","flow-table",[],["flowSteps",["subexpr","@mut",[["get","model.flow_steps",["loc",[null,[345,37],[345,53]]],0,0,0,0]],[],[],0,0]],["loc",[null,[345,14],[345,55]]],0,0]],locals:[],templates:[]};})();var child4=(function(){var child0=(function(){return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":362,"column":16},"end":{"line":368,"column":16}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:1,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("                ");dom.appendChild(el0,el1);var el1=dom.createElement("tr");var el2=dom.createTextNode("\n                  ");dom.appendChild(el1,el2);var el2=dom.createElement("td");var el3=dom.createComment("");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n                  ");dom.appendChild(el1,el2);var el2=dom.createElement("td");var el3=dom.createComment("");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n                  ");dom.appendChild(el1,el2);var el2=dom.createElement("td");var el3=dom.createComment("");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n                ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element0=dom.childAt(fragment,[1]);var morphs=new Array(3);morphs[0] = dom.createMorphAt(dom.childAt(element0,[1]),0,0);morphs[1] = dom.createMorphAt(dom.childAt(element0,[3]),0,0);morphs[2] = dom.createMorphAt(dom.childAt(element0,[5]),0,0);return morphs;},statements:[["content","publicationLog.publication_type",["loc",[null,[364,22],[364,57]]],0,0,0,0],["content","publicationLog.comment",["loc",[null,[365,22],[365,48]]],0,0,0,0],["content","publicationLog.created_at",["loc",[null,[366,22],[366,51]]],0,0,0,0]],locals:["publicationLog"],templates:[]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":360,"column":14},"end":{"line":370,"column":14}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("              ");dom.appendChild(el0,el1);var el1=dom.createElement("table");dom.setAttribute(el1,"class","table");var el2=dom.createTextNode("\n");dom.appendChild(el1,el2);var el2=dom.createComment("");dom.appendChild(el1,el2);var el2=dom.createTextNode("              ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var morphs=new Array(1);morphs[0] = dom.createMorphAt(dom.childAt(fragment,[1]),1,1);return morphs;},statements:[["block","each",[["get","model.publication_logs",["loc",[null,[362,24],[362,46]]],0,0,0,0]],[],0,null,["loc",[null,[362,16],[368,25]]]]],locals:[],templates:[child0]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":240,"column":4},"end":{"line":377,"column":4}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createTextNode("    ");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","row");var el2=dom.createTextNode("\n    ");dom.appendChild(el1,el2);var el2=dom.createElement("div");dom.setAttribute(el2,"class","col-xs-12");dom.setAttribute(el2,"style","margin-top:20px");var el3=dom.createTextNode("\n      ");dom.appendChild(el2,el3);var el3=dom.createElement("div");dom.setAttribute(el3,"class","panel-group");dom.setAttribute(el3,"id","accordion");dom.setAttribute(el3,"role","tablist");dom.setAttribute(el3,"aria-multiselectable","true");var el4=dom.createTextNode("\n        ");dom.appendChild(el3,el4);var el4=dom.createElement("div");dom.setAttribute(el4,"class","panel panel-default");var el5=dom.createTextNode("\n          ");dom.appendChild(el4,el5);var el5=dom.createElement("div");dom.setAttribute(el5,"class","panel-heading");dom.setAttribute(el5,"role","tab");dom.setAttribute(el5,"id","headingOne");var el6=dom.createTextNode("\n            ");dom.appendChild(el5,el6);var el6=dom.createElement("h4");dom.setAttribute(el6,"class","panel-title");var el7=dom.createTextNode("\n              ");dom.appendChild(el6,el7);var el7=dom.createElement("a");dom.setAttribute(el7,"data-toggle","collapse");dom.setAttribute(el7,"data-parent","#accordion");dom.setAttribute(el7,"href","#collapseOne");dom.setAttribute(el7,"aria-expanded","true");dom.setAttribute(el7,"aria-controls","collapseOne");var el8=dom.createTextNode("\n                ");dom.appendChild(el7,el8);var el8=dom.createComment("");dom.appendChild(el7,el8);var el8=dom.createTextNode("\n              ");dom.appendChild(el7,el8);dom.appendChild(el6,el7);var el7=dom.createTextNode("\n            ");dom.appendChild(el6,el7);dom.appendChild(el5,el6);var el6=dom.createTextNode("\n          ");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n          ");dom.appendChild(el4,el5);var el5=dom.createElement("div");dom.setAttribute(el5,"id","collapseOne");dom.setAttribute(el5,"class","panel-collapse collapse");dom.setAttribute(el5,"role","tabpanel");dom.setAttribute(el5,"aria-labelledby","headingOne");var el6=dom.createTextNode("\n            ");dom.appendChild(el5,el6);var el6=dom.createElement("div");dom.setAttribute(el6,"class","panel-body");var el7=dom.createTextNode("\n");dom.appendChild(el6,el7);var el7=dom.createComment("");dom.appendChild(el6,el7);var el7=dom.createTextNode("            ");dom.appendChild(el6,el7);dom.appendChild(el5,el6);var el6=dom.createTextNode("\n          ");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n        ");dom.appendChild(el4,el5);dom.appendChild(el3,el4);var el4=dom.createTextNode("\n        ");dom.appendChild(el3,el4);var el4=dom.createElement("div");dom.setAttribute(el4,"class","panel panel-default");var el5=dom.createTextNode("\n          ");dom.appendChild(el4,el5);var el5=dom.createElement("div");dom.setAttribute(el5,"class","panel-heading");dom.setAttribute(el5,"role","tab");dom.setAttribute(el5,"id","headingTwo");var el6=dom.createTextNode("\n            ");dom.appendChild(el5,el6);var el6=dom.createElement("h4");dom.setAttribute(el6,"class","panel-title");var el7=dom.createTextNode("\n              ");dom.appendChild(el6,el7);var el7=dom.createElement("a");dom.setAttribute(el7,"class","collapsed");dom.setAttribute(el7,"data-toggle","collapse");dom.setAttribute(el7,"data-parent","#accordion");dom.setAttribute(el7,"href","#collapseTwo");dom.setAttribute(el7,"aria-expanded","false");dom.setAttribute(el7,"aria-controls","collapseTwo");var el8=dom.createTextNode("\n                ");dom.appendChild(el7,el8);var el8=dom.createComment("");dom.appendChild(el7,el8);var el8=dom.createTextNode(" (");dom.appendChild(el7,el8);var el8=dom.createComment("");dom.appendChild(el7,el8);var el8=dom.createTextNode(")\n              ");dom.appendChild(el7,el8);dom.appendChild(el6,el7);var el7=dom.createTextNode("\n            ");dom.appendChild(el6,el7);dom.appendChild(el5,el6);var el6=dom.createTextNode("\n          ");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n         ");dom.appendChild(el4,el5);var el5=dom.createElement("div");dom.setAttribute(el5,"id","collapseTwo");dom.setAttribute(el5,"class","panel-collapse collapse");dom.setAttribute(el5,"role","tabpanel");dom.setAttribute(el5,"aria-labelledby","headingTwo");var el6=dom.createTextNode("\n            ");dom.appendChild(el5,el6);var el6=dom.createElement("div");dom.setAttribute(el6,"class","panel-body");var el7=dom.createTextNode("\n");dom.appendChild(el6,el7);var el7=dom.createComment("");dom.appendChild(el6,el7);var el7=dom.createTextNode("            ");dom.appendChild(el6,el7);dom.appendChild(el5,el6);var el6=dom.createTextNode("\n          ");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n        ");dom.appendChild(el4,el5);dom.appendChild(el3,el4);var el4=dom.createTextNode("\n        ");dom.appendChild(el3,el4);var el4=dom.createElement("div");dom.setAttribute(el4,"class","panel panel-default");var el5=dom.createTextNode("\n          ");dom.appendChild(el4,el5);var el5=dom.createElement("div");dom.setAttribute(el5,"class","panel-heading");dom.setAttribute(el5,"role","tab");dom.setAttribute(el5,"id","headingThree");var el6=dom.createTextNode("\n            ");dom.appendChild(el5,el6);var el6=dom.createElement("h4");dom.setAttribute(el6,"class","panel-title");var el7=dom.createTextNode("\n              ");dom.appendChild(el6,el7);var el7=dom.createElement("a");dom.setAttribute(el7,"class","collapsed");dom.setAttribute(el7,"data-toggle","collapse");dom.setAttribute(el7,"data-parent","#accordion");dom.setAttribute(el7,"href","#collapseThree");dom.setAttribute(el7,"aria-expanded","false");dom.setAttribute(el7,"aria-controls","collapseThree");var el8=dom.createTextNode("\n                ");dom.appendChild(el7,el8);var el8=dom.createComment("");dom.appendChild(el7,el8);var el8=dom.createTextNode("\n              ");dom.appendChild(el7,el8);dom.appendChild(el6,el7);var el7=dom.createTextNode("\n            ");dom.appendChild(el6,el7);dom.appendChild(el5,el6);var el6=dom.createTextNode("\n          ");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n          ");dom.appendChild(el4,el5);var el5=dom.createElement("div");dom.setAttribute(el5,"id","collapseThree");dom.setAttribute(el5,"class","panel-collapse collapse");dom.setAttribute(el5,"role","tabpanel");dom.setAttribute(el5,"aria-labelledby","headingThree");var el6=dom.createTextNode("\n            ");dom.appendChild(el5,el6);var el6=dom.createElement("div");dom.setAttribute(el6,"class","panel-body");var el7=dom.createTextNode("\n");dom.appendChild(el6,el7);var el7=dom.createComment("");dom.appendChild(el6,el7);var el7=dom.createTextNode("            ");dom.appendChild(el6,el7);dom.appendChild(el5,el6);var el6=dom.createTextNode("\n          ");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n        ");dom.appendChild(el4,el5);dom.appendChild(el3,el4);var el4=dom.createTextNode("\n        ");dom.appendChild(el3,el4);var el4=dom.createElement("div");dom.setAttribute(el4,"class","panel panel-default");var el5=dom.createTextNode("\n          ");dom.appendChild(el4,el5);var el5=dom.createElement("div");dom.setAttribute(el5,"class","panel-heading");dom.setAttribute(el5,"role","tab");dom.setAttribute(el5,"id","headingFour");var el6=dom.createTextNode("\n            ");dom.appendChild(el5,el6);var el6=dom.createElement("h4");dom.setAttribute(el6,"class","panel-title");var el7=dom.createTextNode("\n              ");dom.appendChild(el6,el7);var el7=dom.createElement("a");dom.setAttribute(el7,"class","collapsed");dom.setAttribute(el7,"data-toggle","collapse");dom.setAttribute(el7,"data-parent","#accordion");dom.setAttribute(el7,"href","#collapseFour");dom.setAttribute(el7,"aria-expanded","false");dom.setAttribute(el7,"aria-controls","collapseFour");var el8=dom.createTextNode("\n                ");dom.appendChild(el7,el8);var el8=dom.createComment("");dom.appendChild(el7,el8);var el8=dom.createTextNode(": ");dom.appendChild(el7,el8);var el8=dom.createComment("");dom.appendChild(el7,el8);var el8=dom.createTextNode("\n              ");dom.appendChild(el7,el8);dom.appendChild(el6,el7);var el7=dom.createTextNode("\n            ");dom.appendChild(el6,el7);dom.appendChild(el5,el6);var el6=dom.createTextNode("\n          ");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n          ");dom.appendChild(el4,el5);var el5=dom.createElement("div");dom.setAttribute(el5,"id","collapseFour");dom.setAttribute(el5,"class","panel-collapse collapse");dom.setAttribute(el5,"role","tabpanel");dom.setAttribute(el5,"aria-labelledby","headingFour");var el6=dom.createTextNode("\n            ");dom.appendChild(el5,el6);var el6=dom.createElement("div");dom.setAttribute(el6,"class","panel-body");var el7=dom.createTextNode("\n");dom.appendChild(el6,el7);var el7=dom.createComment("");dom.appendChild(el6,el7);var el7=dom.createTextNode("            ");dom.appendChild(el6,el7);dom.appendChild(el5,el6);var el6=dom.createTextNode("\n          ");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n        ");dom.appendChild(el4,el5);dom.appendChild(el3,el4);var el4=dom.createTextNode("\n        ");dom.appendChild(el3,el4);var el4=dom.createElement("div");dom.setAttribute(el4,"class","panel panel-default");var el5=dom.createTextNode("\n          ");dom.appendChild(el4,el5);var el5=dom.createElement("div");dom.setAttribute(el5,"class","panel-heading");dom.setAttribute(el5,"role","tab");dom.setAttribute(el5,"id","headingFive");var el6=dom.createTextNode("\n            ");dom.appendChild(el5,el6);var el6=dom.createElement("h4");dom.setAttribute(el6,"class","panel-title");var el7=dom.createTextNode("\n              ");dom.appendChild(el6,el7);var el7=dom.createElement("a");dom.setAttribute(el7,"data-toggle","collapse");dom.setAttribute(el7,"data-parent","#accordion");dom.setAttribute(el7,"href","#collapseFive");dom.setAttribute(el7,"aria-expanded","true");dom.setAttribute(el7,"aria-controls","collapseFive");var el8=dom.createTextNode("\n                ");dom.appendChild(el7,el8);var el8=dom.createComment("");dom.appendChild(el7,el8);var el8=dom.createTextNode("\n              ");dom.appendChild(el7,el8);dom.appendChild(el6,el7);var el7=dom.createTextNode("\n            ");dom.appendChild(el6,el7);dom.appendChild(el5,el6);var el6=dom.createTextNode("\n          ");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n          ");dom.appendChild(el4,el5);var el5=dom.createElement("div");dom.setAttribute(el5,"id","collapseFive");dom.setAttribute(el5,"class","panel-collapse collapse");dom.setAttribute(el5,"role","tabpanel");dom.setAttribute(el5,"aria-labelledby","headingFive");var el6=dom.createTextNode("\n            ");dom.appendChild(el5,el6);var el6=dom.createElement("div");dom.setAttribute(el6,"class","panel-body");var el7=dom.createTextNode("\n");dom.appendChild(el6,el7);var el7=dom.createComment("");dom.appendChild(el6,el7);var el7=dom.createTextNode("            ");dom.appendChild(el6,el7);dom.appendChild(el5,el6);var el6=dom.createTextNode("\n          ");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n        ");dom.appendChild(el4,el5);dom.appendChild(el3,el4);var el4=dom.createTextNode("\n      ");dom.appendChild(el3,el4);dom.appendChild(el2,el3);var el3=dom.createTextNode("\n    ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n    ");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element2=dom.childAt(fragment,[1,1,1]);var element3=dom.childAt(element2,[1]);var element4=dom.childAt(element3,[1,1,1]);var element5=dom.childAt(element2,[3]);var element6=dom.childAt(element5,[1,1,1]);var element7=dom.childAt(element2,[5]);var element8=dom.childAt(element7,[1,1,1]);var element9=dom.childAt(element2,[7]);var element10=dom.childAt(element9,[1,1,1]);var element11=dom.childAt(element2,[9]);var element12=dom.childAt(element11,[1,1,1]);var morphs=new Array(17);morphs[0] = dom.createElementMorph(element4);morphs[1] = dom.createMorphAt(element4,1,1);morphs[2] = dom.createMorphAt(dom.childAt(element3,[3,1]),1,1);morphs[3] = dom.createElementMorph(element6);morphs[4] = dom.createMorphAt(element6,1,1);morphs[5] = dom.createMorphAt(element6,3,3);morphs[6] = dom.createMorphAt(dom.childAt(element5,[3,1]),1,1);morphs[7] = dom.createElementMorph(element8);morphs[8] = dom.createMorphAt(element8,1,1);morphs[9] = dom.createMorphAt(dom.childAt(element7,[3,1]),1,1);morphs[10] = dom.createElementMorph(element10);morphs[11] = dom.createMorphAt(element10,1,1);morphs[12] = dom.createMorphAt(element10,3,3);morphs[13] = dom.createMorphAt(dom.childAt(element9,[3,1]),1,1);morphs[14] = dom.createElementMorph(element12);morphs[15] = dom.createMorphAt(element12,1,1);morphs[16] = dom.createMorphAt(dom.childAt(element11,[3,1]),1,1);return morphs;},statements:[["element","action",["setOpen","job_activity"],[],["loc",[null,[247,40],[247,75]]],0,0],["inline","t",["jobs.history"],[],["loc",[null,[248,16],[248,36]]],0,0],["block","if",[["get","jobActivityIsOpen",["loc",[null,[254,20],[254,37]]],0,0,0,0]],[],0,null,["loc",[null,[254,14],[263,21]]]],["element","action",["setOpen","metadata"],[],["loc",[null,[270,58],[270,89]]],0,0],["inline","t",["jobs.metadata"],[],["loc",[null,[271,16],[271,37]]],0,0],["content","numberOfPages",["loc",[null,[271,39],[271,56]]],0,0,0,0],["block","if",[["get","metadataIsOpen",["loc",[null,[277,20],[277,34]]],0,0,0,0]],[],1,null,["loc",[null,[277,14],[303,21]]]],["element","action",["setOpen","files"],[],["loc",[null,[310,58],[310,86]]],0,0],["inline","t",["jobs.files"],[],["loc",[null,[311,16],[311,34]]],0,0],["block","if",[["get","filesIsOpen",["loc",[null,[317,20],[317,31]]],0,0,0,0]],[],2,null,["loc",[null,[317,14],[329,21]]]],["element","action",["setOpen","flow"],[],["loc",[null,[336,58],[336,85]]],0,0],["inline","t",["jobs.flow"],[],["loc",[null,[337,16],[337,33]]],0,0],["content","model.flow.name",["loc",[null,[337,35],[337,54]]],0,0,0,0],["block","if",[["get","flowIsOpen",["loc",[null,[343,20],[343,30]]],0,0,0,0]],[],3,null,["loc",[null,[343,14],[346,21]]]],["element","action",["setOpen","pub_log"],[],["loc",[null,[353,40],[353,70]]],0,0],["inline","t",["jobs.publicationLog"],[],["loc",[null,[354,16],[354,43]]],0,0],["block","if",[["get","pubLogIsOpen",["loc",[null,[360,20],[360,32]]],0,0,0,0]],[],4,null,["loc",[null,[360,14],[370,21]]]]],locals:[],templates:[child0,child1,child2,child3,child4]};})();return {meta:{"revision":"Ember@2.7.3","loc":{"source":null,"start":{"line":1,"column":0},"end":{"line":383,"column":0}},"moduleName":"d-flow-ember/templates/jobs/show.hbs"},isEmpty:false,arity:0,cachedFragment:null,hasRendered:false,buildFragment:function buildFragment(dom){var el0=dom.createDocumentFragment();var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n\n");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);var el1=dom.createElement("div");dom.setAttribute(el1,"class","panel panel-default");var el2=dom.createTextNode("\n  ");dom.appendChild(el1,el2);var el2=dom.createElement("div");dom.setAttribute(el2,"class","panel-heading");dom.setAttribute(el2,"style","padding-top:8px;");var el3=dom.createTextNode("\n    ");dom.appendChild(el2,el3);var el3=dom.createElement("span");dom.setAttribute(el3,"class","panel-title");var el4=dom.createElement("strong");var el5=dom.createComment("");dom.appendChild(el4,el5);dom.appendChild(el3,el4);var el4=dom.createTextNode(" ");dom.appendChild(el3,el4);var el4=dom.createComment("");dom.appendChild(el3,el4);dom.appendChild(el2,el3);var el3=dom.createComment("");dom.appendChild(el2,el3);var el3=dom.createTextNode("\n    ");dom.appendChild(el2,el3);var el3=dom.createElement("span");dom.setAttribute(el3,"class","pull-right");dom.setAttribute(el3,"style","margin-top:0px;padding-top:0px;");var el4=dom.createTextNode("\n");dom.appendChild(el3,el4);var el4=dom.createComment("");dom.appendChild(el3,el4);var el4=dom.createTextNode("    ");dom.appendChild(el3,el4);dom.appendChild(el2,el3);var el3=dom.createTextNode("\n  ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n  ");dom.appendChild(el1,el2);var el2=dom.createElement("div");dom.setAttribute(el2,"class","panel-body");var el3=dom.createTextNode("\n    ");dom.appendChild(el2,el3);var el3=dom.createElement("div");dom.setAttribute(el3,"class","row");var el4=dom.createTextNode("\n      ");dom.appendChild(el3,el4);var el4=dom.createElement("div");dom.setAttribute(el4,"class","col-xs-6");var el5=dom.createTextNode("\n        ");dom.appendChild(el4,el5);var el5=dom.createElement("div");var el6=dom.createTextNode("\n          ");dom.appendChild(el5,el6);var el6=dom.createComment("");dom.appendChild(el5,el6);var el6=dom.createTextNode("        ");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n      ");dom.appendChild(el4,el5);dom.appendChild(el3,el4);var el4=dom.createTextNode("\n      ");dom.appendChild(el3,el4);var el4=dom.createElement("div");dom.setAttribute(el4,"class","col-xs-6");var el5=dom.createTextNode("\n");dom.appendChild(el4,el5);var el5=dom.createComment("");dom.appendChild(el4,el5);var el5=dom.createTextNode("      ");dom.appendChild(el4,el5);dom.appendChild(el3,el4);var el4=dom.createTextNode("\n    ");dom.appendChild(el3,el4);dom.appendChild(el2,el3);var el3=dom.createTextNode("\n    ");dom.appendChild(el2,el3);var el3=dom.createElement("div");dom.setAttribute(el3,"class","row");var el4=dom.createTextNode("\n      ");dom.appendChild(el3,el4);var el4=dom.createElement("div");dom.setAttribute(el4,"class","col-xs-6");var el5=dom.createTextNode("\n        ");dom.appendChild(el4,el5);var el5=dom.createElement("div");dom.setAttribute(el5,"class","row");var el6=dom.createTextNode("\n          ");dom.appendChild(el5,el6);var el6=dom.createElement("div");dom.setAttribute(el6,"class","col-xs-3");var el7=dom.createTextNode("\n            ");dom.appendChild(el6,el7);var el7=dom.createElement("strong");var el8=dom.createComment("");dom.appendChild(el7,el8);dom.appendChild(el6,el7);var el7=dom.createTextNode("\n          ");dom.appendChild(el6,el7);dom.appendChild(el5,el6);var el6=dom.createTextNode("\n          ");dom.appendChild(el5,el6);var el6=dom.createElement("div");dom.setAttribute(el6,"class","col-xs-9");var el7=dom.createTextNode("\n            ");dom.appendChild(el6,el7);var el7=dom.createComment("");dom.appendChild(el6,el7);var el7=dom.createTextNode(" (\n");dom.appendChild(el6,el7);var el7=dom.createComment("");dom.appendChild(el6,el7);var el7=dom.createTextNode("            )\n          ");dom.appendChild(el6,el7);dom.appendChild(el5,el6);var el6=dom.createTextNode("\n        ");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n\n");dom.appendChild(el4,el5);var el5=dom.createComment("");dom.appendChild(el4,el5);var el5=dom.createTextNode("\n");dom.appendChild(el4,el5);var el5=dom.createComment("");dom.appendChild(el4,el5);var el5=dom.createTextNode("\n");dom.appendChild(el4,el5);var el5=dom.createComment("");dom.appendChild(el4,el5);var el5=dom.createTextNode("\n");dom.appendChild(el4,el5);var el5=dom.createComment("");dom.appendChild(el4,el5);var el5=dom.createTextNode("\n");dom.appendChild(el4,el5);var el5=dom.createComment("");dom.appendChild(el4,el5);var el5=dom.createTextNode("\n        ");dom.appendChild(el4,el5);var el5=dom.createElement("div");dom.setAttribute(el5,"class","row");var el6=dom.createTextNode("\n          ");dom.appendChild(el5,el6);var el6=dom.createElement("div");dom.setAttribute(el6,"class","col-xs-3");var el7=dom.createTextNode("\n            ");dom.appendChild(el6,el7);var el7=dom.createElement("strong");var el8=dom.createComment("");dom.appendChild(el7,el8);dom.appendChild(el6,el7);var el7=dom.createTextNode("\n          ");dom.appendChild(el6,el7);dom.appendChild(el5,el6);var el6=dom.createTextNode("\n          ");dom.appendChild(el5,el6);var el6=dom.createElement("div");dom.setAttribute(el6,"class","col-xs-9");var el7=dom.createTextNode("\n");dom.appendChild(el6,el7);var el7=dom.createComment("");dom.appendChild(el6,el7);var el7=dom.createTextNode("          ");dom.appendChild(el6,el7);dom.appendChild(el5,el6);var el6=dom.createTextNode("\n        ");dom.appendChild(el5,el6);dom.appendChild(el4,el5);var el5=dom.createTextNode("\n\n");dom.appendChild(el4,el5);var el5=dom.createComment("");dom.appendChild(el4,el5);var el5=dom.createTextNode("      ");dom.appendChild(el4,el5);dom.appendChild(el3,el4);var el4=dom.createTextNode("\n\n");dom.appendChild(el3,el4);var el4=dom.createComment("");dom.appendChild(el3,el4);var el4=dom.createTextNode("    ");dom.appendChild(el3,el4);dom.appendChild(el2,el3);var el3=dom.createTextNode("\n\n");dom.appendChild(el2,el3);var el3=dom.createComment("");dom.appendChild(el2,el3);var el3=dom.createTextNode("\n  ");dom.appendChild(el2,el3);dom.appendChild(el1,el2);var el2=dom.createTextNode("\n");dom.appendChild(el1,el2);dom.appendChild(el0,el1);var el1=dom.createTextNode("\n\n");dom.appendChild(el0,el1);var el1=dom.createComment("");dom.appendChild(el0,el1);var el1=dom.createTextNode("\n");dom.appendChild(el0,el1);return el0;},buildRenderNodes:function buildRenderNodes(dom,fragment,contextualElement){var element29=dom.childAt(fragment,[6]);var element30=dom.childAt(element29,[1]);var element31=dom.childAt(element30,[1]);var element32=dom.childAt(element29,[3]);var element33=dom.childAt(element32,[1]);var element34=dom.childAt(element33,[1,1]);var element35=dom.childAt(element32,[3]);var element36=dom.childAt(element35,[1]);var element37=dom.childAt(element36,[1]);var element38=dom.childAt(element37,[3]);var element39=dom.childAt(element36,[13]);var morphs=new Array(24);morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);morphs[1] = dom.createMorphAt(fragment,2,2,contextualElement);morphs[2] = dom.createMorphAt(fragment,4,4,contextualElement);morphs[3] = dom.createMorphAt(dom.childAt(element31,[0]),0,0);morphs[4] = dom.createMorphAt(element31,2,2);morphs[5] = dom.createMorphAt(element30,2,2);morphs[6] = dom.createMorphAt(dom.childAt(element30,[4]),1,1);morphs[7] = dom.createAttrMorph(element34,'class');morphs[8] = dom.createMorphAt(element34,1,1);morphs[9] = dom.createMorphAt(dom.childAt(element33,[3]),1,1);morphs[10] = dom.createMorphAt(dom.childAt(element37,[1,1]),0,0);morphs[11] = dom.createMorphAt(element38,1,1);morphs[12] = dom.createMorphAt(element38,3,3);morphs[13] = dom.createMorphAt(element36,3,3);morphs[14] = dom.createMorphAt(element36,5,5);morphs[15] = dom.createMorphAt(element36,7,7);morphs[16] = dom.createMorphAt(element36,9,9);morphs[17] = dom.createMorphAt(element36,11,11);morphs[18] = dom.createMorphAt(dom.childAt(element39,[1,1]),0,0);morphs[19] = dom.createMorphAt(dom.childAt(element39,[3]),1,1);morphs[20] = dom.createMorphAt(element36,15,15);morphs[21] = dom.createMorphAt(element35,3,3);morphs[22] = dom.createMorphAt(element32,5,5);morphs[23] = dom.createMorphAt(fragment,8,8,contextualElement);dom.insertBoundary(fragment,0);return morphs;},statements:[["block","if",[["get","model.breadcrumb",["loc",[null,[1,6],[1,22]]],0,0,0,0]],[],0,null,["loc",[null,[1,0],[12,7]]]],["content","outlet",["loc",[null,[14,0],[14,10]]],0,0,0,0],["block","if",[["get","model.error",["loc",[null,[16,6],[16,17]]],0,0,0,0]],[],1,null,["loc",[null,[16,0],[20,7]]]],["content","model.id",["loc",[null,[24,38],[24,50]]],0,0,0,0],["content","model.display",["loc",[null,[24,60],[24,77]]],0,0,0,0],["block","if",[["get","model.quarantined",["loc",[null,[24,90],[24,107]]],0,0,0,0]],[],2,null,["loc",[null,[24,84],[24,181]]]],["block","if",[["get","session.data.authenticated.can_manage_jobs",["loc",[null,[26,12],[26,54]]],0,0,0,0]],[],3,null,["loc",[null,[26,6],[46,13]]]],["attribute","class",["concat",["alert ",["subexpr","if",[["get","model.isDone",["loc",[null,[52,31],[52,43]]],0,0,0,0],"alert-success"],[],["loc",[null,[52,26],[52,61]]],0,0]," ",["subexpr","if",[["get","model.isError",["loc",[null,[52,67],[52,80]]],0,0,0,0],"alert-danger"],[],["loc",[null,[52,62],[52,97]]],0,0]," ",["subexpr","if",[["get","model.isProcessing",["loc",[null,[52,103],[52,121]]],0,0,0,0],"alert-info"],[],["loc",[null,[52,98],[52,136]]],0,0]," ",["subexpr","if",[["get","model.isWaitingForAction",["loc",[null,[52,142],[52,166]]],0,0,0,0],"alert-warning"],[],["loc",[null,[52,137],[52,184]]],0,0]],0,0,0,0,0],0,0,0,0],["block","unless",[["get","model.isDone",["loc",[null,[53,20],[53,32]]],0,0,0,0]],[],4,5,["loc",[null,[53,10],[60,21]]]],["block","if",[["get","session.data.authenticated.can_manage_jobs",["loc",[null,[64,14],[64,56]]],0,0,0,0]],[],6,null,["loc",[null,[64,8],[85,15]]]],["inline","t",["jobs.source"],[],["loc",[null,[92,20],[92,39]]],0,0],["content","model.source_label",["loc",[null,[95,12],[95,34]]],0,0,0,0],["block","if",[["get","model.source_link",["loc",[null,[96,18],[96,35]]],0,0,0,0]],[],7,8,["loc",[null,[96,12],[100,19]]]],["block","if",[["get","model.title",["loc",[null,[105,14],[105,25]]],0,0,0,0]],[],9,null,["loc",[null,[105,8],[114,15]]]],["block","if",[["get","model.author",["loc",[null,[116,14],[116,26]]],0,0,0,0]],[],10,null,["loc",[null,[116,8],[125,15]]]],["block","if",[["get","model.hasTypeOfRecord",["loc",[null,[127,14],[127,35]]],0,0,0,0]],[],11,null,["loc",[null,[127,8],[136,15]]]],["block","if",[["get","model.chronology_string",["loc",[null,[138,14],[138,37]]],0,0,0,0]],[],12,null,["loc",[null,[138,8],[147,15]]]],["block","if",[["get","model.ordinality_string",["loc",[null,[149,14],[149,37]]],0,0,0,0]],[],13,null,["loc",[null,[149,8],[158,15]]]],["inline","t",["jobs.copyright"],[],["loc",[null,[162,20],[162,42]]],0,0],["block","if",[["get","model.copyright",["loc",[null,[165,18],[165,33]]],0,0,0,0]],[],14,15,["loc",[null,[165,12],[169,19]]]],["block","if",[["get","session.data.authenticated.can_manage_jobs",["loc",[null,[173,14],[173,56]]],0,0,0,0]],[],16,null,["loc",[null,[173,8],[210,15]]]],["block","if",[["get","session.data.authenticated.can_manage_jobs",["loc",[null,[213,12],[213,54]]],0,0,0,0]],[],17,null,["loc",[null,[213,6],[237,13]]]],["block","if",[["get","session.data.authenticated.can_manage_jobs",["loc",[null,[240,10],[240,52]]],0,0,0,0]],[],18,null,["loc",[null,[240,4],[377,11]]]],["inline","partial",["jobs/modals"],[],["loc",[null,[382,0],[382,25]]],0,0]],locals:[],templates:[child0,child1,child2,child3,child4,child5,child6,child7,child8,child9,child10,child11,child12,child13,child14,child15,child16,child17,child18]};})());});
define("d-flow-ember/templates/jobs/show/edit", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/jobs/show/edit.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["inline", "job-form", [], ["copyrightSelection", ["subexpr", "@mut", [["get", "copyrightSelection", ["loc", [null, [1, 30], [1, 48]]], 0, 0, 0, 0]], [], [], 0, 0], "flowSelection", ["subexpr", "@mut", [["get", "flowSelection", ["loc", [null, [1, 63], [1, 76]]], 0, 0, 0, 0]], [], [], 0, 0], "flows", ["subexpr", "@mut", [["get", "flows", ["loc", [null, [1, 83], [1, 88]]], 0, 0, 0, 0]], [], [], 0, 0], "model", ["subexpr", "@mut", [["get", "model", ["loc", [null, [1, 95], [1, 100]]], 0, 0, 0, 0]], [], [], 0, 0]], ["loc", [null, [1, 0], [1, 102]]], 0, 0]],
      locals: [],
      templates: []
    };
  })());
});
define("d-flow-ember/templates/login", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 8,
              "column": 8
            },
            "end": {
              "line": 12,
              "column": 8
            }
          },
          "moduleName": "d-flow-ember/templates/login.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "alert alert-danger col-xs-12");
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["content", "error.msg", ["loc", [null, [10, 12], [10, 25]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 23,
              "column": 10
            },
            "end": {
              "line": 23,
              "column": 105
            }
          },
          "moduleName": "d-flow-ember/templates/login.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("a");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [0]);
          var morphs = new Array(2);
          morphs[0] = dom.createAttrMorph(element0, 'href');
          morphs[1] = dom.createMorphAt(element0, 0, 0);
          return morphs;
        },
        statements: [["attribute", "href", ["concat", [["get", "application.casLoginUrl", ["loc", [null, [23, 52], [23, 75]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["login.casLogin"], [], ["loc", [null, [23, 79], [23, 101]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 29,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/login.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "container");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "col-xs-offset-1 col-xs-10 col-sm-offset-2 col-sm-8 col-md-offset-3 col-md-6 col-lg-offset-3 col-lg-6");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("form");
        dom.setAttribute(el3, "role", "form");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "row");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("h3");
        dom.setAttribute(el5, "class", "col-xs-12");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "row info-box-body");
        var el5 = dom.createTextNode("\n");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "form-group");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("label");
        dom.setAttribute(el6, "for", "identification");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "form-group");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("label");
        dom.setAttribute(el6, "for", "password");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "form-group");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("button");
        dom.setAttribute(el6, "class", "btn btn-primary");
        dom.setAttribute(el6, "type", "submit");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element1 = dom.childAt(fragment, [0, 1, 1]);
        var element2 = dom.childAt(element1, [3]);
        var element3 = dom.childAt(element2, [3]);
        var element4 = dom.childAt(element2, [5]);
        var element5 = dom.childAt(element2, [7]);
        var morphs = new Array(9);
        morphs[0] = dom.createElementMorph(element1);
        morphs[1] = dom.createMorphAt(dom.childAt(element1, [1, 1]), 0, 0);
        morphs[2] = dom.createMorphAt(element2, 1, 1);
        morphs[3] = dom.createMorphAt(dom.childAt(element3, [1]), 0, 0);
        morphs[4] = dom.createMorphAt(element3, 3, 3);
        morphs[5] = dom.createMorphAt(dom.childAt(element4, [1]), 0, 0);
        morphs[6] = dom.createMorphAt(element4, 3, 3);
        morphs[7] = dom.createMorphAt(dom.childAt(element5, [1]), 0, 0);
        morphs[8] = dom.createMorphAt(element5, 3, 3);
        return morphs;
      },
      statements: [["element", "action", ["authenticate"], ["on", "submit"], ["loc", [null, [3, 10], [3, 47]]], 0, 0], ["inline", "t", ["login.login"], [], ["loc", [null, [5, 30], [5, 49]]], 0, 0], ["block", "if", [["get", "error", ["loc", [null, [8, 14], [8, 19]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [8, 8], [12, 15]]]], ["inline", "t", ["login.username"], [], ["loc", [null, [14, 38], [14, 60]]], 0, 0], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "identification", ["loc", [null, [15, 24], [15, 38]]], 0, 0, 0, 0]], [], [], 0, 0], "placeholder", "Enter username", "class", ["subexpr", "concat", ["form-control", " "], [], [], 0, 0]], ["loc", [null, [15, 10], [15, 98]]], 0, 0], ["inline", "t", ["login.password"], [], ["loc", [null, [18, 32], [18, 54]]], 0, 0], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "password", ["loc", [null, [19, 24], [19, 32]]], 0, 0, 0, 0]], [], [], 0, 0], "placeholder", "Enter Password", "type", "password", "class", ["subexpr", "concat", ["form-control", " "], [], [], 0, 0]], ["loc", [null, [19, 10], [19, 108]]], 0, 0], ["inline", "t", ["login.login"], [], ["loc", [null, [22, 56], [22, 75]]], 0, 0], ["block", "if", [["get", "application.casLoginUrl", ["loc", [null, [23, 16], [23, 39]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [23, 10], [23, 112]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("d-flow-ember/templates/node", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 10
          }
        },
        "moduleName": "d-flow-ember/templates/node.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["content", "outlet", ["loc", [null, [1, 0], [1, 10]]], 0, 0, 0, 0]],
      locals: [],
      templates: []
    };
  })());
});
define("d-flow-ember/templates/node/show", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 3,
                "column": 6
              },
              "end": {
                "line": 3,
                "column": 55
              }
            },
            "moduleName": "d-flow-ember/templates/node/show.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["inline", "t", ["nodes.root"], [], ["loc", [null, [3, 37], [3, 55]]], 0, 0]],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        var child0 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "revision": "Ember@2.7.3",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 6,
                    "column": 6
                  },
                  "end": {
                    "line": 6,
                    "column": 51
                  }
                },
                "moduleName": "d-flow-ember/templates/node/show.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(1);
                morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
                dom.insertBoundary(fragment, 0);
                dom.insertBoundary(fragment, null);
                return morphs;
              },
              statements: [["content", "parent.name", ["loc", [null, [6, 6], [6, 51]]], 0, 0, 0, 0]],
              locals: [],
              templates: []
            };
          })();
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 5,
                  "column": 2
                },
                "end": {
                  "line": 7,
                  "column": 2
                }
              },
              "moduleName": "d-flow-ember/templates/node/show.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("  ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("li");
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 0, 0);
              return morphs;
            },
            statements: [["block", "link-to", ["node.show", ["get", "parent.id", ["loc", [null, [6, 40], [6, 49]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [6, 6], [6, 51]]]]],
            locals: [],
            templates: [child0]
          };
        })();
        var child1 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 7,
                  "column": 2
                },
                "end": {
                  "line": 9,
                  "column": 2
                }
              },
              "moduleName": "d-flow-ember/templates/node/show.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("  ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("li");
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 0, 0);
              return morphs;
            },
            statements: [["content", "parent.name", ["loc", [null, [8, 6], [8, 21]]], 0, 0, 0, 0]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 4,
                "column": 2
              },
              "end": {
                "line": 10,
                "column": 2
              }
            },
            "moduleName": "d-flow-ember/templates/node/show.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "if", [["get", "parent.id", ["loc", [null, [5, 8], [5, 17]]], 0, 0, 0, 0]], [], 0, 1, ["loc", [null, [5, 2], [9, 9]]]]],
          locals: ["parent"],
          templates: [child0, child1]
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 12,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/node/show.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("ul");
          dom.setAttribute(el1, "class", "breadcrumb");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("li");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element15 = dom.childAt(fragment, [0]);
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(dom.childAt(element15, [1]), 0, 0);
          morphs[1] = dom.createMorphAt(element15, 3, 3);
          return morphs;
        },
        statements: [["block", "link-to", ["node.show", "root"], [], 0, null, ["loc", [null, [3, 6], [3, 67]]]], ["block", "each", [["get", "model.breadcrumb", ["loc", [null, [4, 10], [4, 26]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [4, 2], [10, 11]]]]],
        locals: [],
        templates: [child0, child1]
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 16,
              "column": 4
            },
            "end": {
              "line": 18,
              "column": 4
            }
          },
          "moduleName": "d-flow-ember/templates/node/show.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          dom.setAttribute(el1, "href", "javascript:void(0)");
          dom.setAttribute(el1, "class", "navbar-brand");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 0, 0);
          return morphs;
        },
        statements: [["inline", "t", ["nodes.root"], [], ["loc", [null, [17, 54], [17, 72]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 18,
              "column": 4
            },
            "end": {
              "line": 21,
              "column": 4
            }
          },
          "moduleName": "d-flow-ember/templates/node/show.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          dom.setAttribute(el1, "href", "javascript:void(0)");
          dom.setAttribute(el1, "class", "navbar-brand");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(" (ID: ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(")");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element14 = dom.childAt(fragment, [1]);
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(element14, 0, 0);
          morphs[1] = dom.createMorphAt(element14, 2, 2);
          morphs[2] = dom.createMorphAt(fragment, 3, 3, contextualElement);
          return morphs;
        },
        statements: [["content", "model.name", ["loc", [null, [19, 54], [19, 68]]], 0, 0, 0, 0], ["content", "model.id", ["loc", [null, [19, 74], [19, 86]]], 0, 0, 0, 0], ["inline", "state-groups", [], ["stateGroups", ["subexpr", "@mut", [["get", "model.state_groups", ["loc", [null, [20, 31], [20, 49]]], 0, 0, 0, 0]], [], [], 0, 0]], ["loc", [null, [20, 4], [20, 51]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 26,
                  "column": 4
                },
                "end": {
                  "line": 26,
                  "column": 84
                }
              },
              "moduleName": "d-flow-ember/templates/node/show.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["inline", "t", ["nodes.new"], [], ["loc", [null, [26, 67], [26, 84]]], 0, 0]],
            locals: [],
            templates: []
          };
        })();
        var child1 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 27,
                  "column": 4
                },
                "end": {
                  "line": 27,
                  "column": 91
                }
              },
              "moduleName": "d-flow-ember/templates/node/show.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["inline", "t", ["jobs.new"], [], ["loc", [null, [27, 75], [27, 91]]], 0, 0]],
            locals: [],
            templates: []
          };
        })();
        var child2 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 28,
                  "column": 4
                },
                "end": {
                  "line": 28,
                  "column": 94
                }
              },
              "moduleName": "d-flow-ember/templates/node/show.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["inline", "t", ["jobs.import"], [], ["loc", [null, [28, 75], [28, 94]]], 0, 0]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 25,
                "column": 4
              },
              "end": {
                "line": 29,
                "column": 4
              }
            },
            "moduleName": "d-flow-ember/templates/node/show.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(3);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
            morphs[2] = dom.createMorphAt(fragment, 5, 5, contextualElement);
            return morphs;
          },
          statements: [["block", "link-to", ["node.show.new"], ["class", "btn btn-default navbar-btn"], 0, null, ["loc", [null, [26, 4], [26, 96]]]], ["block", "link-to", ["node.show.jobs.source"], ["class", "btn btn-default navbar-btn"], 1, null, ["loc", [null, [27, 4], [27, 103]]]], ["block", "link-to", ["node.show.jobs.import"], ["class", "btn btn-default navbar-btn"], 2, null, ["loc", [null, [28, 4], [28, 106]]]]],
          locals: [],
          templates: [child0, child1, child2]
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 24,
              "column": 4
            },
            "end": {
              "line": 30,
              "column": 4
            }
          },
          "moduleName": "d-flow-ember/templates/node/show.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "if", [["get", "session.data.authenticated.can_manage_tree", ["loc", [null, [25, 10], [25, 52]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [25, 4], [29, 11]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child4 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 33,
                  "column": 4
                },
                "end": {
                  "line": 33,
                  "column": 84
                }
              },
              "moduleName": "d-flow-ember/templates/node/show.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["inline", "t", ["nodes.new"], [], ["loc", [null, [33, 67], [33, 84]]], 0, 0]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 32,
                "column": 4
              },
              "end": {
                "line": 34,
                "column": 4
              }
            },
            "moduleName": "d-flow-ember/templates/node/show.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["block", "link-to", ["node.show.new"], ["class", "btn btn-default navbar-btn"], 0, null, ["loc", [null, [33, 4], [33, 96]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 31,
              "column": 4
            },
            "end": {
              "line": 35,
              "column": 4
            }
          },
          "moduleName": "d-flow-ember/templates/node/show.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "if", [["get", "session.data.authenticated.can_manage_tree_root", ["loc", [null, [32, 10], [32, 57]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [32, 4], [34, 11]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child5 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 60,
                  "column": 12
                },
                "end": {
                  "line": 60,
                  "column": 97
                }
              },
              "moduleName": "d-flow-ember/templates/node/show.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["content", "child.name", ["loc", [null, [60, 12], [60, 97]]], 0, 0, 0, 0]],
            locals: [],
            templates: []
          };
        })();
        var child1 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "revision": "Ember@2.7.3",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 62,
                    "column": 12
                  },
                  "end": {
                    "line": 64,
                    "column": 12
                  }
                },
                "moduleName": "d-flow-ember/templates/node/show.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("            ");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(1);
                morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
                return morphs;
              },
              statements: [["inline", "icon-link", [], ["classNames", "fa-wrench", "titleKey", "nodes.hasActionStates"], ["loc", [null, [63, 12], [63, 81]]], 0, 0]],
              locals: [],
              templates: []
            };
          })();
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 61,
                  "column": 12
                },
                "end": {
                  "line": 65,
                  "column": 12
                }
              },
              "moduleName": "d-flow-ember/templates/node/show.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["block", "if", [["get", "child.state_groups.ACTION", ["loc", [null, [62, 18], [62, 43]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [62, 12], [64, 19]]]]],
            locals: [],
            templates: [child0]
          };
        })();
        var child2 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "revision": "Ember@2.7.3",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 69,
                    "column": 12
                  },
                  "end": {
                    "line": 69,
                    "column": 94
                  }
                },
                "moduleName": "d-flow-ember/templates/node/show.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createElement("i");
                dom.setAttribute(el1, "class", "fa fa-pencil-square-o");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes() {
                return [];
              },
              statements: [],
              locals: [],
              templates: []
            };
          })();
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 68,
                  "column": 12
                },
                "end": {
                  "line": 70,
                  "column": 12
                }
              },
              "moduleName": "d-flow-ember/templates/node/show.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
              return morphs;
            },
            statements: [["block", "link-to", ["node.show.edit", "root", ["get", "child.id", ["loc", [null, [69, 47], [69, 55]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [69, 12], [69, 106]]]]],
            locals: [],
            templates: [child0]
          };
        })();
        var child3 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "revision": "Ember@2.7.3",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 71,
                    "column": 12
                  },
                  "end": {
                    "line": 71,
                    "column": 96
                  }
                },
                "moduleName": "d-flow-ember/templates/node/show.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createElement("i");
                dom.setAttribute(el1, "class", "fa fa-pencil-square-o");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes() {
                return [];
              },
              statements: [],
              locals: [],
              templates: []
            };
          })();
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 70,
                  "column": 12
                },
                "end": {
                  "line": 72,
                  "column": 12
                }
              },
              "moduleName": "d-flow-ember/templates/node/show.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
              return morphs;
            },
            statements: [["block", "link-to", ["node.show.edit", ["get", "model.id", ["loc", [null, [71, 40], [71, 48]]], 0, 0, 0, 0], ["get", "child.id", ["loc", [null, [71, 49], [71, 57]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [71, 12], [71, 108]]]]],
            locals: [],
            templates: [child0]
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 56,
                "column": 8
              },
              "end": {
                "line": 75,
                "column": 8
              }
            },
            "moduleName": "d-flow-ember/templates/node/show.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("tr");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("td");
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("td");
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("          ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("td");
            var el3 = dom.createTextNode("\n");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("          ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element9 = dom.childAt(fragment, [1]);
            var element10 = dom.childAt(element9, [3]);
            var morphs = new Array(4);
            morphs[0] = dom.createMorphAt(dom.childAt(element9, [1]), 0, 0);
            morphs[1] = dom.createMorphAt(element10, 1, 1);
            morphs[2] = dom.createMorphAt(element10, 3, 3);
            morphs[3] = dom.createMorphAt(dom.childAt(element9, [5]), 1, 1);
            return morphs;
          },
          statements: [["content", "child.id", ["loc", [null, [58, 14], [58, 26]]], 0, 0, 0, 0], ["block", "link-to", ["node.show", ["get", "child.id", ["loc", [null, [60, 45], [60, 53]]], 0, 0, 0, 0], ["subexpr", "query-params", [], ["state", null, "query", "", "page", 1], ["loc", [null, [60, 54], [60, 95]]], 0, 0]], [], 0, null, ["loc", [null, [60, 12], [60, 97]]]], ["block", "if", [["get", "session.data.authenticated.can_manage_jobs", ["loc", [null, [61, 18], [61, 60]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [61, 12], [65, 19]]]], ["block", "if", [["get", "isRoot", ["loc", [null, [68, 18], [68, 24]]], 0, 0, 0, 0]], [], 2, 3, ["loc", [null, [68, 12], [72, 19]]]]],
          locals: ["child"],
          templates: [child0, child1, child2, child3]
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 41,
              "column": 0
            },
            "end": {
              "line": 80,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/node/show.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "panel panel-default");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "panel-heading");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3, "class", "panel-title");
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n  ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "panel-body");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("table");
          dom.setAttribute(el3, "class", "table table-hover");
          var el4 = dom.createTextNode("\n      ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("thead");
          var el5 = dom.createTextNode("\n        ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("tr");
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("th");
          var el7 = dom.createComment("");
          dom.appendChild(el6, el7);
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("th");
          var el7 = dom.createComment("");
          dom.appendChild(el6, el7);
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("th");
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n        ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n      ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n      ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("tbody");
          var el5 = dom.createTextNode("\n");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("      ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n    ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n  ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element11 = dom.childAt(fragment, [0]);
          var element12 = dom.childAt(element11, [3, 1]);
          var element13 = dom.childAt(element12, [1, 1]);
          var morphs = new Array(4);
          morphs[0] = dom.createMorphAt(dom.childAt(element11, [1, 1]), 0, 0);
          morphs[1] = dom.createMorphAt(dom.childAt(element13, [1]), 0, 0);
          morphs[2] = dom.createMorphAt(dom.childAt(element13, [3]), 0, 0);
          morphs[3] = dom.createMorphAt(dom.childAt(element12, [3]), 1, 1);
          return morphs;
        },
        statements: [["inline", "t", ["nodes.children.header"], [], ["loc", [null, [44, 29], [44, 58]]], 0, 0], ["inline", "t", ["nodes.id"], [], ["loc", [null, [50, 14], [50, 30]]], 0, 0], ["inline", "t", ["nodes.name"], [], ["loc", [null, [51, 14], [51, 32]]], 0, 0], ["block", "each", [["get", "model.children", ["loc", [null, [56, 16], [56, 30]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [56, 8], [75, 17]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child6 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 104,
                  "column": 14
                },
                "end": {
                  "line": 104,
                  "column": 30
                }
              },
              "moduleName": "d-flow-ember/templates/node/show.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("---");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes() {
              return [];
            },
            statements: [],
            locals: [],
            templates: []
          };
        })();
        var child1 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "revision": "Ember@2.7.3",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 106,
                    "column": 16
                  },
                  "end": {
                    "line": 106,
                    "column": 64
                  }
                },
                "moduleName": "d-flow-ember/templates/node/show.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(1);
                morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
                dom.insertBoundary(fragment, 0);
                dom.insertBoundary(fragment, null);
                return morphs;
              },
              statements: [["content", "option.label", ["loc", [null, [106, 48], [106, 64]]], 0, 0, 0, 0]],
              locals: [],
              templates: []
            };
          })();
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 105,
                  "column": 14
                },
                "end": {
                  "line": 107,
                  "column": 14
                }
              },
              "moduleName": "d-flow-ember/templates/node/show.hbs"
            },
            isEmpty: false,
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
              return morphs;
            },
            statements: [["block", "x-option", [], ["value", ["subexpr", "@mut", [["get", "option.value", ["loc", [null, [106, 34], [106, 46]]], 0, 0, 0, 0]], [], [], 0, 0]], 0, null, ["loc", [null, [106, 16], [106, 77]]]]],
            locals: ["option"],
            templates: [child0]
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 103,
                "column": 12
              },
              "end": {
                "line": 108,
                "column": 12
              }
            },
            "moduleName": "d-flow-ember/templates/node/show.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(2);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "x-option", [], [], 0, null, ["loc", [null, [104, 14], [104, 43]]]], ["block", "each", [["get", "stateSelection", ["loc", [null, [105, 22], [105, 36]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [105, 14], [107, 23]]]]],
          locals: [],
          templates: [child0, child1]
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 127,
                "column": 8
              },
              "end": {
                "line": 129,
                "column": 8
              }
            },
            "moduleName": "d-flow-ember/templates/node/show.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["inline", "job-row", [], ["job", ["subexpr", "@mut", [["get", "job", ["loc", [null, [128, 22], [128, 25]]], 0, 0, 0, 0]], [], [], 0, 0], "showTree", false], ["loc", [null, [128, 8], [128, 42]]], 0, 0]],
          locals: ["job"],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 82,
              "column": 0
            },
            "end": {
              "line": 137,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/node/show.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "panel panel-info");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "panel-heading");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3, "class", "panel-title");
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode(" (");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode(")");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n  ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "panel-body");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3, "class", "row");
          var el4 = dom.createTextNode("\n      ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("div");
          dom.setAttribute(el4, "class", "col-md-6 col-xs-12");
          var el5 = dom.createTextNode("\n        ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("div");
          dom.setAttribute(el5, "class", "input-group");
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("span");
          dom.setAttribute(el6, "class", "input-group-btn");
          var el7 = dom.createTextNode("\n            ");
          dom.appendChild(el6, el7);
          var el7 = dom.createElement("button");
          dom.setAttribute(el7, "class", "btn btn-default");
          dom.setAttribute(el7, "type", "button");
          var el8 = dom.createComment("");
          dom.appendChild(el7, el8);
          dom.appendChild(el6, el7);
          var el7 = dom.createTextNode("\n          ");
          dom.appendChild(el6, el7);
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n\n        ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n      ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n      ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("div");
          dom.setAttribute(el4, "class", "col-md-6 col-xs-12");
          var el5 = dom.createTextNode("\n        ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("div");
          dom.setAttribute(el5, "class", "input-group");
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("span");
          dom.setAttribute(el6, "class", "input-group-addon");
          dom.setAttribute(el6, "id", "status-text");
          var el7 = dom.createComment("");
          dom.appendChild(el6, el7);
          var el7 = dom.createTextNode("\n          ");
          dom.appendChild(el6, el7);
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n");
          dom.appendChild(el5, el6);
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("        ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n      ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n    ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n  ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "panel-body");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("table");
          dom.setAttribute(el3, "class", "table table-hover");
          var el4 = dom.createTextNode("\n      ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("thead");
          var el5 = dom.createTextNode("\n        ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("tr");
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("th");
          var el7 = dom.createComment("");
          dom.appendChild(el6, el7);
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("th");
          var el7 = dom.createComment("");
          dom.appendChild(el6, el7);
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("th");
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("th");
          var el7 = dom.createComment("");
          dom.appendChild(el6, el7);
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("th");
          var el7 = dom.createComment("");
          dom.appendChild(el6, el7);
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n        ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n      ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n      ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("tbody");
          var el5 = dom.createTextNode("\n");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("      ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n    ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n  ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "panel-body");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n  ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [0]);
          var element1 = dom.childAt(element0, [1, 1]);
          var element2 = dom.childAt(element0, [3]);
          var element3 = dom.childAt(element2, [1]);
          var element4 = dom.childAt(element3, [1, 1]);
          var element5 = dom.childAt(element4, [3, 1]);
          var element6 = dom.childAt(element3, [3, 1]);
          var element7 = dom.childAt(element0, [5, 1]);
          var element8 = dom.childAt(element7, [1, 1]);
          var morphs = new Array(14);
          morphs[0] = dom.createMorphAt(element1, 0, 0);
          morphs[1] = dom.createMorphAt(element1, 2, 2);
          morphs[2] = dom.createMorphAt(element4, 1, 1);
          morphs[3] = dom.createElementMorph(element5);
          morphs[4] = dom.createMorphAt(element5, 0, 0);
          morphs[5] = dom.createMorphAt(dom.childAt(element6, [1]), 0, 0);
          morphs[6] = dom.createMorphAt(element6, 3, 3);
          morphs[7] = dom.createMorphAt(element2, 3, 3);
          morphs[8] = dom.createMorphAt(dom.childAt(element8, [1]), 0, 0);
          morphs[9] = dom.createMorphAt(dom.childAt(element8, [3]), 0, 0);
          morphs[10] = dom.createMorphAt(dom.childAt(element8, [7]), 0, 0);
          morphs[11] = dom.createMorphAt(dom.childAt(element8, [9]), 0, 0);
          morphs[12] = dom.createMorphAt(dom.childAt(element7, [3]), 1, 1);
          morphs[13] = dom.createMorphAt(dom.childAt(element0, [7]), 1, 1);
          return morphs;
        },
        statements: [["inline", "t", ["jobs.header"], [], ["loc", [null, [85, 29], [85, 48]]], 0, 0], ["content", "model.jobs_count", ["loc", [null, [85, 50], [85, 70]]], 0, 0, 0, 0], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "query", ["loc", [null, [91, 24], [91, 29]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control", "placeholder", ["subexpr", "t", ["jobs.search"], [], ["loc", [null, [92, 22], [92, 39]]], 0, 0]], ["loc", [null, [91, 10], [92, 41]]], 0, 0], ["element", "action", ["searchJobs", ["get", "query", ["loc", [null, [94, 80], [94, 85]]], 0, 0, 0, 0]], [], ["loc", [null, [94, 58], [94, 87]]], 0, 0], ["inline", "t", ["jobs.search"], [], ["loc", [null, [94, 88], [94, 107]]], 0, 0], ["inline", "t", ["jobs.status"], [], ["loc", [null, [101, 59], [101, 78]]], 0, 0], ["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "state", ["loc", [null, [103, 30], [103, 35]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 0, null, ["loc", [null, [103, 12], [108, 25]]]], ["inline", "pagination-pager-data", [], ["pagination", ["subexpr", "@mut", [["get", "model.jobs.meta.pagination", ["loc", [null, [112, 39], [112, 65]]], 0, 0, 0, 0]], [], [], 0, 0], "total", ["subexpr", "@mut", [["get", "model.jobs.meta.query.total", ["loc", [null, [112, 72], [112, 99]]], 0, 0, 0, 0]], [], [], 0, 0]], ["loc", [null, [112, 4], [112, 101]]], 0, 0], ["inline", "t", ["jobs.id"], [], ["loc", [null, [119, 14], [119, 29]]], 0, 0], ["inline", "t", ["jobs.name"], [], ["loc", [null, [120, 14], [120, 31]]], 0, 0], ["inline", "t", ["jobs.flowStep"], [], ["loc", [null, [122, 14], [122, 35]]], 0, 0], ["inline", "t", ["jobs.flow"], [], ["loc", [null, [123, 14], [123, 31]]], 0, 0], ["block", "each", [["get", "model.jobs", ["loc", [null, [127, 16], [127, 26]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [127, 8], [129, 17]]]], ["inline", "pagination-pager", [], ["pagination", ["subexpr", "@mut", [["get", "model.jobs.meta.pagination", ["loc", [null, [134, 34], [134, 60]]], 0, 0, 0, 0]], [], [], 0, 0]], ["loc", [null, [134, 4], [134, 62]]], 0, 0]],
        locals: [],
        templates: [child0, child1]
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 138,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/node/show.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "navbar navbar-default sub-navbar");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "navbar-header");
        dom.setAttribute(el2, "style", "width:50%");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("ul");
        dom.setAttribute(el2, "class", "navbar-nav nav navbar-right");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element16 = dom.childAt(fragment, [2]);
        var element17 = dom.childAt(element16, [3]);
        var morphs = new Array(7);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        morphs[1] = dom.createMorphAt(dom.childAt(element16, [1]), 1, 1);
        morphs[2] = dom.createMorphAt(element17, 1, 1);
        morphs[3] = dom.createMorphAt(element17, 2, 2);
        morphs[4] = dom.createMorphAt(fragment, 4, 4, contextualElement);
        morphs[5] = dom.createMorphAt(fragment, 6, 6, contextualElement);
        morphs[6] = dom.createMorphAt(fragment, 8, 8, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "if", [["get", "model.breadcrumb", ["loc", [null, [1, 6], [1, 22]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [1, 0], [12, 7]]]], ["block", "if", [["get", "isRoot", ["loc", [null, [16, 10], [16, 16]]], 0, 0, 0, 0]], [], 1, 2, ["loc", [null, [16, 4], [21, 11]]]], ["block", "unless", [["get", "isRoot", ["loc", [null, [24, 14], [24, 20]]], 0, 0, 0, 0]], [], 3, null, ["loc", [null, [24, 4], [30, 15]]]], ["block", "if", [["get", "isRoot", ["loc", [null, [31, 10], [31, 16]]], 0, 0, 0, 0]], [], 4, null, ["loc", [null, [31, 4], [35, 11]]]], ["content", "outlet", ["loc", [null, [39, 0], [39, 10]]], 0, 0, 0, 0], ["block", "if", [["get", "model.children", ["loc", [null, [41, 6], [41, 20]]], 0, 0, 0, 0]], [], 5, null, ["loc", [null, [41, 0], [80, 7]]]], ["block", "if", [["get", "model.jobs_count", ["loc", [null, [82, 6], [82, 22]]], 0, 0, 0, 0]], [], 6, null, ["loc", [null, [82, 0], [137, 7]]]]],
      locals: [],
      templates: [child0, child1, child2, child3, child4, child5, child6]
    };
  })());
});
define("d-flow-ember/templates/node/show/edit", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 7,
              "column": 6
            },
            "end": {
              "line": 11,
              "column": 6
            }
          },
          "moduleName": "d-flow-ember/templates/node/show/edit.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "alert alert-danger");
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["inline", "t", ["nodes.generalError"], [], ["loc", [null, [9, 10], [9, 36]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 20,
              "column": 10
            },
            "end": {
              "line": 22,
              "column": 10
            }
          },
          "moduleName": "d-flow-ember/templates/node/show/edit.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["nodes.updating"], [], ["loc", [null, [21, 12], [21, 34]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 22,
              "column": 10
            },
            "end": {
              "line": 24,
              "column": 10
            }
          },
          "moduleName": "d-flow-ember/templates/node/show/edit.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["nodes.update"], [], ["loc", [null, [23, 12], [23, 32]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 26,
              "column": 8
            },
            "end": {
              "line": 26,
              "column": 76
            }
          },
          "moduleName": "d-flow-ember/templates/node/show/edit.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["inline", "t", ["nodes.cancel"], [], ["loc", [null, [26, 56], [26, 76]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child4 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 29,
              "column": 10
            },
            "end": {
              "line": 31,
              "column": 10
            }
          },
          "moduleName": "d-flow-ember/templates/node/show/edit.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["nodes.deleting"], [], ["loc", [null, [30, 12], [30, 34]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child5 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 31,
              "column": 10
            },
            "end": {
              "line": 33,
              "column": 10
            }
          },
          "moduleName": "d-flow-ember/templates/node/show/edit.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["nodes.delete"], [], ["loc", [null, [32, 12], [32, 32]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 41,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/node/show/edit.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "panel panel-default");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-heading");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "panel-title");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-body");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "form-group col-xs-12");
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("label");
        dom.setAttribute(el4, "class", "col-xs-12");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("label");
        dom.setAttribute(el4, "class", "col-xs-12");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "col-xs-12");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "class", "btn btn-primary");
        var el6 = dom.createTextNode("\n");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("      ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "pull-right");
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("button");
        dom.setAttribute(el6, "class", "btn btn-danger");
        var el7 = dom.createTextNode("\n");
        dom.appendChild(el6, el7);
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("      ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(element0, [1, 1]);
        var element2 = dom.childAt(element0, [3, 1]);
        var element3 = dom.childAt(element2, [3]);
        var element4 = dom.childAt(element2, [5]);
        var element5 = dom.childAt(element2, [7]);
        var element6 = dom.childAt(element5, [1]);
        var element7 = dom.childAt(element5, [5, 1]);
        var morphs = new Array(14);
        morphs[0] = dom.createMorphAt(element1, 0, 0);
        morphs[1] = dom.createMorphAt(element1, 2, 2);
        morphs[2] = dom.createMorphAt(element2, 1, 1);
        morphs[3] = dom.createMorphAt(element3, 0, 0);
        morphs[4] = dom.createMorphAt(element3, 2, 2);
        morphs[5] = dom.createMorphAt(element4, 0, 0);
        morphs[6] = dom.createMorphAt(element4, 2, 2);
        morphs[7] = dom.createAttrMorph(element6, 'disabled');
        morphs[8] = dom.createElementMorph(element6);
        morphs[9] = dom.createMorphAt(element6, 1, 1);
        morphs[10] = dom.createMorphAt(element5, 3, 3);
        morphs[11] = dom.createAttrMorph(element7, 'disabled');
        morphs[12] = dom.createElementMorph(element7);
        morphs[13] = dom.createMorphAt(element7, 1, 1);
        return morphs;
      },
      statements: [["inline", "t", ["nodes.edit"], [], ["loc", [null, [3, 29], [3, 47]]], 0, 0], ["content", "model.name", ["loc", [null, [3, 48], [3, 62]]], 0, 0, 0, 0], ["block", "if", [["get", "error", ["loc", [null, [7, 12], [7, 17]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [7, 6], [11, 13]]]], ["inline", "t", ["nodes.name"], [], ["loc", [null, [12, 31], [12, 49]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.name", ["loc", [null, [13, 73], [13, 83]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [13, 8], [13, 85]]], 0, 0], ["inline", "t", ["nodes.new_parent_id"], [], ["loc", [null, [15, 31], [15, 58]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.new_parent_id", ["loc", [null, [16, 73], [16, 92]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [16, 8], [16, 94]]], 0, 0], ["attribute", "disabled", ["get", "performingUpdate", ["loc", [null, [19, 51], [19, 67]]], 0, 0, 0, 0], 0, 0, 0, 0], ["element", "action", ["updateNode", ["get", "model", ["loc", [null, [19, 92], [19, 97]]], 0, 0, 0, 0]], [], ["loc", [null, [19, 70], [19, 99]]], 0, 0], ["block", "if", [["get", "performingUpdate", ["loc", [null, [20, 16], [20, 32]]], 0, 0, 0, 0]], [], 1, 2, ["loc", [null, [20, 10], [24, 17]]]], ["block", "link-to", ["node.show"], ["class", "btn btn-default"], 3, null, ["loc", [null, [26, 8], [26, 88]]]], ["attribute", "disabled", ["get", "performingDelete", ["loc", [null, [28, 50], [28, 66]]], 0, 0, 0, 0], 0, 0, 0, 0], ["element", "action", ["deleteNode", ["get", "model.id", ["loc", [null, [28, 91], [28, 99]]], 0, 0, 0, 0]], [], ["loc", [null, [28, 69], [28, 101]]], 0, 0], ["block", "if", [["get", "performingDelete", ["loc", [null, [29, 16], [29, 32]]], 0, 0, 0, 0]], [], 4, 5, ["loc", [null, [29, 10], [33, 17]]]]],
      locals: [],
      templates: [child0, child1, child2, child3, child4, child5]
    };
  })());
});
define("d-flow-ember/templates/node/show/jobs/import", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 7,
                "column": 6
              },
              "end": {
                "line": 12,
                "column": 6
              }
            },
            "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("label");
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("br");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element13 = dom.childAt(fragment, [1]);
            var morphs = new Array(2);
            morphs[0] = dom.createMorphAt(dom.childAt(element13, [1]), 0, 0);
            morphs[1] = dom.createMorphAt(element13, 4, 4);
            return morphs;
          },
          statements: [["inline", "t", ["jobs.import_running"], [], ["loc", [null, [9, 17], [9, 44]]], 0, 0], ["content", "progress.message", ["loc", [null, [10, 10], [10, 30]]], 0, 0, 0, 0]],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 19,
                  "column": 10
                },
                "end": {
                  "line": 19,
                  "column": 73
                }
              },
              "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("OK");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes() {
              return [];
            },
            statements: [],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 13,
                "column": 6
              },
              "end": {
                "line": 21,
                "column": 6
              }
            },
            "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("label");
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("br");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element12 = dom.childAt(fragment, [1]);
            var morphs = new Array(3);
            morphs[0] = dom.createMorphAt(dom.childAt(element12, [1]), 0, 0);
            morphs[1] = dom.createMorphAt(element12, 4, 4);
            morphs[2] = dom.createMorphAt(dom.childAt(fragment, [3]), 1, 1);
            return morphs;
          },
          statements: [["inline", "t", ["jobs.import_finished"], [], ["loc", [null, [15, 17], [15, 45]]], 0, 0], ["content", "progress.message", ["loc", [null, [16, 10], [16, 30]]], 0, 0, 0, 0], ["block", "link-to", ["node.show"], ["active", false, "class", "btn btn-primary"], 0, null, ["loc", [null, [19, 10], [19, 85]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      var child2 = (function () {
        var child0 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "revision": "Ember@2.7.3",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 31,
                    "column": 14
                  },
                  "end": {
                    "line": 33,
                    "column": 14
                  }
                },
                "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
              },
              isEmpty: false,
              arity: 1,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("              ");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode(": ");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode(" (");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode(")");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("br");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(3);
                morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
                morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
                morphs[2] = dom.createMorphAt(fragment, 5, 5, contextualElement);
                return morphs;
              },
              statements: [["inline", "t", ["jobs.import_file_error_row"], [], ["loc", [null, [32, 14], [32, 48]]], 0, 0], ["content", "fail.location", ["loc", [null, [32, 50], [32, 67]]], 0, 0, 0, 0], ["content", "fail.message", ["loc", [null, [32, 69], [32, 85]]], 0, 0, 0, 0]],
              locals: ["fail"],
              templates: []
            };
          })();
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 28,
                  "column": 10
                },
                "end": {
                  "line": 35,
                  "column": 10
                }
              },
              "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode(": ");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              var el2 = dom.createTextNode("\n");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("            ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var element10 = dom.childAt(fragment, [1]);
              var morphs = new Array(3);
              morphs[0] = dom.createMorphAt(element10, 0, 0);
              morphs[1] = dom.createMorphAt(element10, 2, 2);
              morphs[2] = dom.createMorphAt(dom.childAt(fragment, [3]), 1, 1);
              return morphs;
            },
            statements: [["inline", "t", ["jobs.import_success"], [], ["loc", [null, [29, 17], [29, 44]]], 0, 0], ["content", "progress.data.successful", ["loc", [null, [29, 46], [29, 74]]], 0, 0, 0, 0], ["block", "each", [["get", "progress.data.error", ["loc", [null, [31, 22], [31, 41]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [31, 14], [33, 23]]]]],
            locals: [],
            templates: [child0]
          };
        })();
        var child1 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 38,
                  "column": 10
                },
                "end": {
                  "line": 38,
                  "column": 91
                }
              },
              "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["inline", "t", ["nodes.cancel"], [], ["loc", [null, [38, 71], [38, 91]]], 0, 0]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 22,
                "column": 6
              },
              "end": {
                "line": 40,
                "column": 6
              }
            },
            "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "col-xs-12 alert alert-danger");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("label");
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("br");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element11 = dom.childAt(fragment, [3]);
            var morphs = new Array(4);
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
            morphs[1] = dom.createMorphAt(dom.childAt(element11, [1]), 0, 0);
            morphs[2] = dom.createMorphAt(element11, 4, 4);
            morphs[3] = dom.createMorphAt(dom.childAt(fragment, [5]), 1, 1);
            return morphs;
          },
          statements: [["content", "progress.message", ["loc", [null, [24, 10], [24, 30]]], 0, 0, 0, 0], ["inline", "t", ["jobs.import_aborted"], [], ["loc", [null, [27, 17], [27, 44]]], 0, 0], ["block", "if", [["get", "jobError", ["loc", [null, [28, 16], [28, 24]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [28, 10], [35, 17]]]], ["block", "link-to", ["node.show"], ["active", false, "class", "btn btn-default"], 1, null, ["loc", [null, [38, 10], [38, 103]]]]],
          locals: [],
          templates: [child0, child1]
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 6,
              "column": 4
            },
            "end": {
              "line": 41,
              "column": 4
            }
          },
          "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          morphs[1] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          morphs[2] = dom.createMorphAt(fragment, 2, 2, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "if", [["get", "isRunning", ["loc", [null, [7, 12], [7, 21]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [7, 6], [12, 13]]]], ["block", "if", [["get", "isDone", ["loc", [null, [13, 12], [13, 18]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [13, 6], [21, 13]]]], ["block", "if", [["get", "isAborted", ["loc", [null, [22, 12], [22, 21]]], 0, 0, 0, 0]], [], 2, null, ["loc", [null, [22, 6], [40, 13]]]]],
        locals: [],
        templates: [child0, child1, child2]
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 44,
                "column": 8
              },
              "end": {
                "line": 48,
                "column": 8
              }
            },
            "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("          ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "alert alert-danger");
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
            return morphs;
          },
          statements: [["content", "error.msg", ["loc", [null, [46, 12], [46, 25]]], 0, 0, 0, 0]],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        var child0 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "revision": "Ember@2.7.3",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 60,
                    "column": 12
                  },
                  "end": {
                    "line": 60,
                    "column": 59
                  }
                },
                "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(1);
                morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
                dom.insertBoundary(fragment, 0);
                dom.insertBoundary(fragment, null);
                return morphs;
              },
              statements: [["content", "option.label", ["loc", [null, [60, 43], [60, 59]]], 0, 0, 0, 0]],
              locals: [],
              templates: []
            };
          })();
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 59,
                  "column": 12
                },
                "end": {
                  "line": 61,
                  "column": 12
                }
              },
              "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
            },
            isEmpty: false,
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
              return morphs;
            },
            statements: [["block", "x-option", [], ["value", ["subexpr", "@mut", [["get", "option.name", ["loc", [null, [60, 30], [60, 41]]], 0, 0, 0, 0]], [], [], 0, 0]], 0, null, ["loc", [null, [60, 12], [60, 72]]]]],
            locals: ["option"],
            templates: [child0]
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 58,
                "column": 12
              },
              "end": {
                "line": 62,
                "column": 12
              }
            },
            "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "each", [["get", "sourceSelection", ["loc", [null, [59, 20], [59, 35]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [59, 12], [61, 21]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      var child2 = (function () {
        var child0 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "revision": "Ember@2.7.3",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 71,
                    "column": 16
                  },
                  "end": {
                    "line": 71,
                    "column": 64
                  }
                },
                "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(1);
                morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
                dom.insertBoundary(fragment, 0);
                dom.insertBoundary(fragment, null);
                return morphs;
              },
              statements: [["content", "option.label", ["loc", [null, [71, 48], [71, 64]]], 0, 0, 0, 0]],
              locals: [],
              templates: []
            };
          })();
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 70,
                  "column": 14
                },
                "end": {
                  "line": 72,
                  "column": 14
                }
              },
              "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
            },
            isEmpty: false,
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
              return morphs;
            },
            statements: [["block", "x-option", [], ["value", ["subexpr", "@mut", [["get", "option.value", ["loc", [null, [71, 34], [71, 46]]], 0, 0, 0, 0]], [], [], 0, 0]], 0, null, ["loc", [null, [71, 16], [71, 77]]]]],
            locals: ["option"],
            templates: [child0]
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 69,
                "column": 12
              },
              "end": {
                "line": 73,
                "column": 12
              }
            },
            "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "each", [["get", "copyrightSelection", ["loc", [null, [70, 22], [70, 40]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [70, 14], [72, 23]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      var child3 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 81,
                  "column": 14
                },
                "end": {
                  "line": 81,
                  "column": 70
                }
              },
              "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["inline", "t", ["jobs.priority_values.normal"], [], ["loc", [null, [81, 35], [81, 70]]], 0, 0]],
            locals: [],
            templates: []
          };
        })();
        var child1 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 82,
                  "column": 14
                },
                "end": {
                  "line": 82,
                  "column": 68
                }
              },
              "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["inline", "t", ["jobs.priority_values.high"], [], ["loc", [null, [82, 35], [82, 68]]], 0, 0]],
            locals: [],
            templates: []
          };
        })();
        var child2 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 83,
                  "column": 14
                },
                "end": {
                  "line": 83,
                  "column": 67
                }
              },
              "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["inline", "t", ["jobs.priority_values.low"], [], ["loc", [null, [83, 35], [83, 67]]], 0, 0]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 80,
                "column": 12
              },
              "end": {
                "line": 84,
                "column": 12
              }
            },
            "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(3);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
            morphs[2] = dom.createMorphAt(fragment, 5, 5, contextualElement);
            return morphs;
          },
          statements: [["block", "x-option", [], ["value", 2], 0, null, ["loc", [null, [81, 14], [81, 83]]]], ["block", "x-option", [], ["value", 1], 1, null, ["loc", [null, [82, 14], [82, 81]]]], ["block", "x-option", [], ["value", 3], 2, null, ["loc", [null, [83, 14], [83, 80]]]]],
          locals: [],
          templates: [child0, child1, child2]
        };
      })();
      var child4 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 92,
                  "column": 14
                },
                "end": {
                  "line": 92,
                  "column": 37
                }
              },
              "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("-- Välj --");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes() {
              return [];
            },
            statements: [],
            locals: [],
            templates: []
          };
        })();
        var child1 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "revision": "Ember@2.7.3",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 94,
                    "column": 16
                  },
                  "end": {
                    "line": 94,
                    "column": 64
                  }
                },
                "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(1);
                morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
                dom.insertBoundary(fragment, 0);
                dom.insertBoundary(fragment, null);
                return morphs;
              },
              statements: [["content", "option.label", ["loc", [null, [94, 48], [94, 64]]], 0, 0, 0, 0]],
              locals: [],
              templates: []
            };
          })();
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 93,
                  "column": 14
                },
                "end": {
                  "line": 95,
                  "column": 14
                }
              },
              "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
            },
            isEmpty: false,
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
              return morphs;
            },
            statements: [["block", "x-option", [], ["value", ["subexpr", "@mut", [["get", "option.value", ["loc", [null, [94, 34], [94, 46]]], 0, 0, 0, 0]], [], [], 0, 0]], 0, null, ["loc", [null, [94, 16], [94, 77]]]]],
            locals: ["option"],
            templates: [child0]
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 91,
                "column": 12
              },
              "end": {
                "line": 96,
                "column": 12
              }
            },
            "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(2);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "x-option", [], [], 0, null, ["loc", [null, [92, 14], [92, 50]]]], ["block", "each", [["get", "flowSelection", ["loc", [null, [93, 22], [93, 35]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [93, 14], [95, 23]]]]],
          locals: [],
          templates: [child0, child1]
        };
      })();
      var child5 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 101,
                "column": 10
              },
              "end": {
                "line": 107,
                "column": 8
              }
            },
            "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("          ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "row");
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2, "class", "col-xs-offset-2 col-xs-10");
            var el3 = dom.createTextNode("\n              ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1, 1]), 1, 1);
            return morphs;
          },
          statements: [["inline", "parameter-input", [], ["parameter", ["subexpr", "@mut", [["get", "parameter", ["loc", [null, [104, 42], [104, 51]]], 0, 0, 0, 0]], [], [], 0, 0], "values", ["subexpr", "@mut", [["get", "model.flow_parameters", ["loc", [null, [104, 59], [104, 80]]], 0, 0, 0, 0]], [], [], 0, 0]], ["loc", [null, [104, 14], [104, 82]]], 0, 0]],
          locals: ["parameter"],
          templates: []
        };
      })();
      var child6 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 107,
                "column": 8
              },
              "end": {
                "line": 111,
                "column": 10
              }
            },
            "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("          ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "col-xs-offset-2 col-xs-4");
            var el2 = dom.createTextNode("\n            Inga flödesparametrar är definierade.\n          ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child7 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 123,
                "column": 10
              },
              "end": {
                "line": 123,
                "column": 91
              }
            },
            "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["inline", "t", ["nodes.cancel"], [], ["loc", [null, [123, 71], [123, 91]]], 0, 0]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 41,
              "column": 4
            },
            "end": {
              "line": 127,
              "column": 4
            }
          },
          "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "form-group");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("form");
          var el3 = dom.createTextNode("\n");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n        ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          var el4 = dom.createTextNode("\n          ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("label");
          dom.setAttribute(el4, "class", "col-xs-2 control-label");
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n          ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("div");
          dom.setAttribute(el4, "class", "col-xs-4");
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode(" (");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode(")");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n        ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n\n        ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          var el4 = dom.createTextNode("\n          ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("label");
          dom.setAttribute(el4, "class", "col-xs-2 control-label");
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n          ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("div");
          dom.setAttribute(el4, "class", "col-xs-4");
          var el5 = dom.createTextNode("\n");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("          ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n        ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n\n        ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          var el4 = dom.createTextNode("\n          ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("label");
          dom.setAttribute(el4, "class", "col-xs-2 control-label");
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n          ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("div");
          dom.setAttribute(el4, "class", "col-xs-4");
          var el5 = dom.createTextNode("\n");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("          ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n        ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n\n        ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          var el4 = dom.createTextNode("\n          ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("label");
          dom.setAttribute(el4, "class", "col-xs-2 control-label");
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n          ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("div");
          dom.setAttribute(el4, "class", "col-xs-4");
          var el5 = dom.createTextNode("\n");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("          ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n        ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n\n        ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          var el4 = dom.createTextNode("\n          ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("label");
          dom.setAttribute(el4, "class", "col-xs-2 control-label");
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n          ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("div");
          dom.setAttribute(el4, "class", "col-xs-4");
          var el5 = dom.createTextNode("\n");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("          ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode(" \n        ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n\n        ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3, "class", "col-xs-12 flow-param-group");
          var el4 = dom.createTextNode("\n");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("        ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n\n        ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          var el4 = dom.createTextNode("\n          ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("label");
          dom.setAttribute(el4, "class", "col-xs-2 control-label");
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n          ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("div");
          dom.setAttribute(el4, "class", "col-xs-4");
          var el5 = dom.createTextNode("\n            ");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n          ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n        ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n\n        ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3, "class", "col-xs-12");
          var el4 = dom.createTextNode("\n          ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("button");
          dom.setAttribute(el4, "class", "btn btn-primary");
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n          ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n        ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n      ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1, 1]);
          var element1 = dom.childAt(element0, [3]);
          var element2 = dom.childAt(element1, [3]);
          var element3 = dom.childAt(element0, [5]);
          var element4 = dom.childAt(element0, [7]);
          var element5 = dom.childAt(element0, [9]);
          var element6 = dom.childAt(element0, [11]);
          var element7 = dom.childAt(element0, [15]);
          var element8 = dom.childAt(element0, [17]);
          var element9 = dom.childAt(element8, [1]);
          var morphs = new Array(25);
          morphs[0] = dom.createElementMorph(element0);
          morphs[1] = dom.createMorphAt(element0, 1, 1);
          morphs[2] = dom.createAttrMorph(element1, 'class');
          morphs[3] = dom.createMorphAt(dom.childAt(element1, [1]), 0, 0);
          morphs[4] = dom.createMorphAt(element2, 0, 0);
          morphs[5] = dom.createMorphAt(element2, 2, 2);
          morphs[6] = dom.createAttrMorph(element3, 'class');
          morphs[7] = dom.createMorphAt(dom.childAt(element3, [1]), 0, 0);
          morphs[8] = dom.createMorphAt(dom.childAt(element3, [3]), 1, 1);
          morphs[9] = dom.createAttrMorph(element4, 'class');
          morphs[10] = dom.createMorphAt(dom.childAt(element4, [1]), 0, 0);
          morphs[11] = dom.createMorphAt(dom.childAt(element4, [3]), 1, 1);
          morphs[12] = dom.createAttrMorph(element5, 'class');
          morphs[13] = dom.createMorphAt(dom.childAt(element5, [1]), 0, 0);
          morphs[14] = dom.createMorphAt(dom.childAt(element5, [3]), 1, 1);
          morphs[15] = dom.createAttrMorph(element6, 'class');
          morphs[16] = dom.createMorphAt(dom.childAt(element6, [1]), 0, 0);
          morphs[17] = dom.createMorphAt(dom.childAt(element6, [3]), 1, 1);
          morphs[18] = dom.createMorphAt(dom.childAt(element0, [13]), 1, 1);
          morphs[19] = dom.createAttrMorph(element7, 'class');
          morphs[20] = dom.createMorphAt(dom.childAt(element7, [1]), 0, 0);
          morphs[21] = dom.createMorphAt(dom.childAt(element7, [3]), 1, 1);
          morphs[22] = dom.createElementMorph(element9);
          morphs[23] = dom.createMorphAt(element9, 0, 0);
          morphs[24] = dom.createMorphAt(element8, 3, 3);
          return morphs;
        },
        statements: [["element", "action", ["importFile", ["get", "model", ["loc", [null, [43, 34], [43, 39]]], 0, 0, 0, 0]], ["on", "submit"], ["loc", [null, [43, 12], [43, 53]]], 0, 0], ["block", "if", [["get", "error", ["loc", [null, [44, 14], [44, 19]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [44, 8], [48, 15]]]], ["attribute", "class", ["concat", ["col-xs-12 form-group ", ["subexpr", "if", [["get", "error.errors.source", ["loc", [null, [50, 46], [50, 65]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [50, 41], [50, 79]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["jobs.node_name"], [], ["loc", [null, [51, 48], [51, 70]]], 0, 0], ["content", "node.model.name", ["loc", [null, [52, 32], [52, 51]]], 0, 0, 0, 0], ["content", "node.model.id", ["loc", [null, [52, 53], [52, 70]]], 0, 0, 0, 0], ["attribute", "class", ["concat", ["col-xs-12 form-group ", ["subexpr", "if", [["get", "error.errors.source", ["loc", [null, [55, 46], [55, 65]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [55, 41], [55, 79]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["jobs.source"], [], ["loc", [null, [56, 48], [56, 67]]], 0, 0], ["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "model.source_name", ["loc", [null, [58, 30], [58, 47]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 1, null, ["loc", [null, [58, 12], [62, 25]]]], ["attribute", "class", ["concat", ["col-xs-12 form-group ", ["subexpr", "if", [["get", "error.errors.copyright", ["loc", [null, [66, 46], [66, 68]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [66, 41], [66, 82]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["jobs.copyright"], [], ["loc", [null, [67, 48], [67, 70]]], 0, 0], ["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "model.copyright", ["loc", [null, [69, 30], [69, 45]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 2, null, ["loc", [null, [69, 12], [73, 25]]]], ["attribute", "class", ["concat", ["col-xs-12 form-group ", ["subexpr", "if", [["get", "error.errors.priority", ["loc", [null, [77, 46], [77, 67]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [77, 41], [77, 81]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["jobs.priority"], [], ["loc", [null, [78, 48], [78, 69]]], 0, 0], ["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "model.priority", ["loc", [null, [80, 30], [80, 44]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 3, null, ["loc", [null, [80, 12], [84, 25]]]], ["attribute", "class", ["concat", ["col-xs-12 form-group ", ["subexpr", "if", [["get", "error.errors.flow", ["loc", [null, [88, 46], [88, 63]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [88, 41], [88, 77]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["jobs.flow"], [], ["loc", [null, [89, 48], [89, 65]]], 0, 0], ["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "model.flow_id", ["loc", [null, [91, 30], [91, 43]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 4, null, ["loc", [null, [91, 12], [96, 25]]]], ["block", "each", [["get", "currentFlow.parameters.parameters", ["loc", [null, [101, 18], [101, 51]]], 0, 0, 0, 0]], [], 5, 6, ["loc", [null, [101, 10], [111, 19]]]], ["attribute", "class", ["concat", ["col-xs-12 form-group ", ["subexpr", "if", [["get", "error.errors.file_path", ["loc", [null, [114, 46], [114, 68]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [114, 41], [114, 82]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["jobs.file_path"], [], ["loc", [null, [115, 48], [115, 70]]], 0, 0], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "model.file_path", ["loc", [null, [117, 26], [117, 41]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], ["loc", [null, [117, 12], [117, 64]]], 0, 0], ["element", "action", ["importFile", ["get", "model", ["loc", [null, [122, 64], [122, 69]]], 0, 0, 0, 0]], [], ["loc", [null, [122, 42], [122, 71]]], 0, 0], ["inline", "t", ["jobs.import"], [], ["loc", [null, [122, 72], [122, 91]]], 0, 0], ["block", "link-to", ["node.show"], ["active", false, "class", "btn btn-default"], 7, null, ["loc", [null, [123, 10], [123, 103]]]]],
        locals: [],
        templates: [child0, child1, child2, child3, child4, child5, child6, child7]
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 129,
            "column": 6
          }
        },
        "moduleName": "d-flow-ember/templates/node/show/jobs/import.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "panel panel-default");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-heading");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "panel-title");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-body");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element14 = dom.childAt(fragment, [0]);
        var morphs = new Array(2);
        morphs[0] = dom.createMorphAt(dom.childAt(element14, [1, 1]), 0, 0);
        morphs[1] = dom.createMorphAt(dom.childAt(element14, [3]), 1, 1);
        return morphs;
      },
      statements: [["inline", "t", ["jobs.import"], [], ["loc", [null, [3, 29], [3, 48]]], 0, 0], ["block", "if", [["get", "process_id", ["loc", [null, [6, 10], [6, 20]]], 0, 0, 0, 0]], [], 0, 1, ["loc", [null, [6, 4], [127, 11]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("d-flow-ember/templates/node/show/jobs/show", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 3,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/node/show/jobs/show.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h3");
        var el2 = dom.createTextNode("In Jobs show.hbs");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        return morphs;
      },
      statements: [["content", "outlet", ["loc", [null, [2, 0], [2, 10]]], 0, 0, 0, 0]],
      locals: [],
      templates: []
    };
  })());
});
define("d-flow-ember/templates/node/show/jobs/source", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 10,
                "column": 6
              },
              "end": {
                "line": 14,
                "column": 6
              }
            },
            "moduleName": "d-flow-ember/templates/node/show/jobs/source.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "alert alert-danger");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
            return morphs;
          },
          statements: [["content", "error.msg", ["loc", [null, [12, 10], [12, 23]]], 0, 0, 0, 0]],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        var child0 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "revision": "Ember@2.7.3",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 19,
                    "column": 14
                  },
                  "end": {
                    "line": 19,
                    "column": 61
                  }
                },
                "moduleName": "d-flow-ember/templates/node/show/jobs/source.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(1);
                morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
                dom.insertBoundary(fragment, 0);
                dom.insertBoundary(fragment, null);
                return morphs;
              },
              statements: [["content", "option.label", ["loc", [null, [19, 45], [19, 61]]], 0, 0, 0, 0]],
              locals: [],
              templates: []
            };
          })();
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 18,
                  "column": 12
                },
                "end": {
                  "line": 20,
                  "column": 14
                }
              },
              "moduleName": "d-flow-ember/templates/node/show/jobs/source.hbs"
            },
            isEmpty: false,
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("              ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
              return morphs;
            },
            statements: [["block", "x-option", [], ["value", ["subexpr", "@mut", [["get", "option.name", ["loc", [null, [19, 32], [19, 43]]], 0, 0, 0, 0]], [], [], 0, 0]], 0, null, ["loc", [null, [19, 14], [19, 74]]]]],
            locals: ["option"],
            templates: [child0]
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 17,
                "column": 10
              },
              "end": {
                "line": 21,
                "column": 12
              }
            },
            "moduleName": "d-flow-ember/templates/node/show/jobs/source.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "each", [["get", "sourceSelection", ["loc", [null, [18, 20], [18, 35]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [18, 12], [20, 23]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      var child2 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 23,
                "column": 6
              },
              "end": {
                "line": 75,
                "column": 6
              }
            },
            "moduleName": "d-flow-ember/templates/node/show/jobs/source.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element1 = dom.childAt(fragment, [3]);
            var element2 = dom.childAt(fragment, [5]);
            var element3 = dom.childAt(fragment, [7]);
            var element4 = dom.childAt(fragment, [9]);
            var element5 = dom.childAt(fragment, [11]);
            var element6 = dom.childAt(fragment, [13]);
            var element7 = dom.childAt(fragment, [15]);
            var element8 = dom.childAt(fragment, [17]);
            var element9 = dom.childAt(fragment, [19]);
            var element10 = dom.childAt(fragment, [21]);
            var element11 = dom.childAt(fragment, [23]);
            var element12 = dom.childAt(fragment, [25]);
            var element13 = dom.childAt(fragment, [27]);
            var element14 = dom.childAt(fragment, [29]);
            var element15 = dom.childAt(fragment, [31]);
            var morphs = new Array(31);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            morphs[1] = dom.createMorphAt(element1, 0, 0);
            morphs[2] = dom.createMorphAt(element1, 2, 2);
            morphs[3] = dom.createMorphAt(element2, 0, 0);
            morphs[4] = dom.createMorphAt(element2, 2, 2);
            morphs[5] = dom.createMorphAt(element3, 0, 0);
            morphs[6] = dom.createMorphAt(element3, 2, 2);
            morphs[7] = dom.createMorphAt(element4, 0, 0);
            morphs[8] = dom.createMorphAt(element4, 2, 2);
            morphs[9] = dom.createMorphAt(element5, 0, 0);
            morphs[10] = dom.createMorphAt(element5, 2, 2);
            morphs[11] = dom.createMorphAt(element6, 0, 0);
            morphs[12] = dom.createMorphAt(element6, 2, 2);
            morphs[13] = dom.createMorphAt(element7, 0, 0);
            morphs[14] = dom.createMorphAt(element7, 2, 2);
            morphs[15] = dom.createMorphAt(element8, 0, 0);
            morphs[16] = dom.createMorphAt(element8, 2, 2);
            morphs[17] = dom.createMorphAt(element9, 0, 0);
            morphs[18] = dom.createMorphAt(element9, 2, 2);
            morphs[19] = dom.createMorphAt(element10, 0, 0);
            morphs[20] = dom.createMorphAt(element10, 2, 2);
            morphs[21] = dom.createMorphAt(element11, 0, 0);
            morphs[22] = dom.createMorphAt(element11, 2, 2);
            morphs[23] = dom.createMorphAt(element12, 0, 0);
            morphs[24] = dom.createMorphAt(element12, 2, 2);
            morphs[25] = dom.createMorphAt(element13, 0, 0);
            morphs[26] = dom.createMorphAt(element13, 2, 2);
            morphs[27] = dom.createMorphAt(element14, 0, 0);
            morphs[28] = dom.createMorphAt(element14, 2, 2);
            morphs[29] = dom.createMorphAt(element15, 0, 0);
            morphs[30] = dom.createMorphAt(element15, 2, 2);
            return morphs;
          },
          statements: [["inline", "input", [], ["type", "hidden", "value", ["subexpr", "@mut", [["get", "model.catalog_id", ["loc", [null, [24, 75], [24, 91]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [24, 8], [24, 93]]], 0, 0], ["inline", "t", ["sources.dc.title"], [], ["loc", [null, [25, 33], [25, 57]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.dc.title", ["loc", [null, [26, 75], [26, 89]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [26, 10], [26, 91]]], 0, 0], ["inline", "t", ["sources.dc.creator"], [], ["loc", [null, [28, 33], [28, 59]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.dc.creator", ["loc", [null, [29, 75], [29, 91]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [29, 10], [29, 93]]], 0, 0], ["inline", "t", ["sources.dc.subject"], [], ["loc", [null, [31, 33], [31, 59]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.dc.subject", ["loc", [null, [32, 75], [32, 91]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [32, 10], [32, 93]]], 0, 0], ["inline", "t", ["sources.dc.description"], [], ["loc", [null, [35, 33], [35, 63]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.dc.description", ["loc", [null, [36, 75], [36, 95]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [36, 10], [36, 97]]], 0, 0], ["inline", "t", ["sources.dc.publisher"], [], ["loc", [null, [38, 33], [38, 61]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.dc.publisher", ["loc", [null, [39, 75], [39, 93]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [39, 10], [39, 95]]], 0, 0], ["inline", "t", ["sources.dc.contributor"], [], ["loc", [null, [41, 33], [41, 63]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.dc.contributor", ["loc", [null, [42, 75], [42, 95]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [42, 10], [42, 97]]], 0, 0], ["inline", "t", ["sources.dc.date"], [], ["loc", [null, [45, 33], [45, 56]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.dc.date", ["loc", [null, [46, 75], [46, 88]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [46, 10], [46, 90]]], 0, 0], ["inline", "t", ["sources.dc.type"], [], ["loc", [null, [48, 33], [48, 56]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.dc.type", ["loc", [null, [49, 75], [49, 88]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [49, 10], [49, 90]]], 0, 0], ["inline", "t", ["sources.dc.format"], [], ["loc", [null, [51, 33], [51, 58]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.dc.format", ["loc", [null, [52, 75], [52, 90]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [52, 10], [52, 92]]], 0, 0], ["inline", "t", ["sources.dc.identifier"], [], ["loc", [null, [55, 33], [55, 62]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.dc.identifier", ["loc", [null, [56, 75], [56, 94]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [56, 10], [56, 96]]], 0, 0], ["inline", "t", ["sources.dc.source"], [], ["loc", [null, [58, 33], [58, 58]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.dc.source", ["loc", [null, [59, 75], [59, 90]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [59, 10], [59, 92]]], 0, 0], ["inline", "t", ["sources.dc.language"], [], ["loc", [null, [61, 33], [61, 60]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.dc.language", ["loc", [null, [62, 75], [62, 92]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [62, 10], [62, 94]]], 0, 0], ["inline", "t", ["sources.dc.relation"], [], ["loc", [null, [65, 33], [65, 60]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.dc.relation", ["loc", [null, [66, 75], [66, 92]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [66, 10], [66, 94]]], 0, 0], ["inline", "t", ["sources.dc.coverage"], [], ["loc", [null, [68, 33], [68, 60]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.dc.coverage", ["loc", [null, [69, 75], [69, 92]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [69, 10], [69, 94]]], 0, 0], ["inline", "t", ["sources.dc.rights"], [], ["loc", [null, [71, 33], [71, 58]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.dc.rights", ["loc", [null, [72, 75], [72, 90]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [72, 10], [72, 92]]], 0, 0]],
          locals: [],
          templates: []
        };
      })();
      var child3 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 75,
                "column": 6
              },
              "end": {
                "line": 79,
                "column": 6
              }
            },
            "moduleName": "d-flow-ember/templates/node/show/jobs/source.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1, "class", "col-xs-12");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element0 = dom.childAt(fragment, [1]);
            var morphs = new Array(2);
            morphs[0] = dom.createMorphAt(element0, 0, 0);
            morphs[1] = dom.createMorphAt(element0, 2, 2);
            return morphs;
          },
          statements: [["inline", "t", ["jobs.catalog_id"], [], ["loc", [null, [76, 33], [76, 56]]], 0, 0], ["inline", "focus-input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.catalog_id", ["loc", [null, [77, 81], [77, 97]]], 0, 0, 0, 0]], [], [], 0, 0], "id", "catalog_id_input_field", "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [77, 10], [77, 127]]], 0, 0]],
          locals: [],
          templates: []
        };
      })();
      var child4 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 83,
                "column": 8
              },
              "end": {
                "line": 83,
                "column": 76
              }
            },
            "moduleName": "d-flow-ember/templates/node/show/jobs/source.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["inline", "t", ["nodes.cancel"], [], ["loc", [null, [83, 56], [83, 76]]], 0, 0]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 89,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/node/show/jobs/source.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "panel panel-default");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "panel-heading");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3, "class", "panel-title");
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n  ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "panel-body");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3, "class", "form-group");
          var el4 = dom.createTextNode("\n    ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("form");
          var el5 = dom.createTextNode("\n");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n      ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("label");
          dom.setAttribute(el5, "class", "col-xs-12");
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n");
          dom.appendChild(el5, el6);
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("      ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n      ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("div");
          dom.setAttribute(el5, "class", "col-xs-12");
          var el6 = dom.createTextNode("\n        ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("button");
          dom.setAttribute(el6, "class", "btn btn-primary");
          var el7 = dom.createComment("");
          dom.appendChild(el6, el7);
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n        ");
          dom.appendChild(el5, el6);
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n      ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n      ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n    ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n  ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element16 = dom.childAt(fragment, [1]);
          var element17 = dom.childAt(element16, [3, 1, 1]);
          var element18 = dom.childAt(element17, [3]);
          var element19 = dom.childAt(element17, [7]);
          var element20 = dom.childAt(element19, [1]);
          var morphs = new Array(9);
          morphs[0] = dom.createMorphAt(dom.childAt(element16, [1, 1]), 0, 0);
          morphs[1] = dom.createElementMorph(element17);
          morphs[2] = dom.createMorphAt(element17, 1, 1);
          morphs[3] = dom.createMorphAt(element18, 0, 0);
          morphs[4] = dom.createMorphAt(element18, 2, 2);
          morphs[5] = dom.createMorphAt(element17, 5, 5);
          morphs[6] = dom.createElementMorph(element20);
          morphs[7] = dom.createMorphAt(element20, 0, 0);
          morphs[8] = dom.createMorphAt(element19, 3, 3);
          return morphs;
        },
        statements: [["inline", "t", ["sources.formlabel"], [], ["loc", [null, [5, 29], [5, 54]]], 0, 0], ["element", "action", ["fetchSource", ["get", "model", ["loc", [null, [9, 33], [9, 38]]], 0, 0, 0, 0]], ["on", "submit"], ["loc", [null, [9, 10], [9, 52]]], 0, 0], ["block", "if", [["get", "error", ["loc", [null, [10, 12], [10, 17]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [10, 6], [14, 13]]]], ["inline", "t", ["jobs.source"], [], ["loc", [null, [16, 31], [16, 50]]], 0, 0], ["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "model.source", ["loc", [null, [17, 28], [17, 40]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 1, null, ["loc", [null, [17, 10], [21, 25]]]], ["block", "if", [["get", "isDC", ["loc", [null, [23, 12], [23, 16]]], 0, 0, 0, 0]], [], 2, 3, ["loc", [null, [23, 6], [79, 13]]]], ["element", "action", ["fetchSource", ["get", "model", ["loc", [null, [82, 63], [82, 68]]], 0, 0, 0, 0]], [], ["loc", [null, [82, 40], [82, 70]]], 0, 0], ["inline", "t", ["sources.fetch"], [], ["loc", [null, [82, 71], [82, 92]]], 0, 0], ["block", "link-to", ["node.show"], ["class", "btn btn-default"], 4, null, ["loc", [null, [83, 8], [83, 88]]]]],
        locals: [],
        templates: [child0, child1, child2, child3, child4]
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 91,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/node/show/jobs/source.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(2);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        morphs[1] = dom.createMorphAt(fragment, 1, 1, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["block", "unless", [["get", "hasFetchedData", ["loc", [null, [1, 10], [1, 24]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [1, 0], [89, 11]]]], ["content", "outlet", ["loc", [null, [90, 0], [90, 10]]], 0, 0, 0, 0]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("d-flow-ember/templates/node/show/jobs/source/new", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/node/show/jobs/source/new.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["inline", "job-form", [], ["copyrightSelection", ["subexpr", "@mut", [["get", "copyrightSelection", ["loc", [null, [1, 30], [1, 48]]], 0, 0, 0, 0]], [], [], 0, 0], "flowSelection", ["subexpr", "@mut", [["get", "flowSelection", ["loc", [null, [1, 63], [1, 76]]], 0, 0, 0, 0]], [], [], 0, 0], "flows", ["subexpr", "@mut", [["get", "flows", ["loc", [null, [1, 83], [1, 88]]], 0, 0, 0, 0]], [], [], 0, 0], "model", ["subexpr", "@mut", [["get", "model", ["loc", [null, [1, 95], [1, 100]]], 0, 0, 0, 0]], [], [], 0, 0]], ["loc", [null, [1, 0], [1, 102]]], 0, 0]],
      locals: [],
      templates: []
    };
  })());
});
define("d-flow-ember/templates/node/show/new", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 8,
              "column": 8
            },
            "end": {
              "line": 12,
              "column": 8
            }
          },
          "moduleName": "d-flow-ember/templates/node/show/new.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "alert alert-danger");
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["content", "error.msg", ["loc", [null, [10, 12], [10, 25]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 18,
              "column": 12
            },
            "end": {
              "line": 20,
              "column": 12
            }
          },
          "moduleName": "d-flow-ember/templates/node/show/new.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("              ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["nodes.creating"], [], ["loc", [null, [19, 14], [19, 36]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 20,
              "column": 12
            },
            "end": {
              "line": 22,
              "column": 12
            }
          },
          "moduleName": "d-flow-ember/templates/node/show/new.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("              ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["nodes.create"], [], ["loc", [null, [21, 14], [21, 34]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 24,
              "column": 10
            },
            "end": {
              "line": 24,
              "column": 78
            }
          },
          "moduleName": "d-flow-ember/templates/node/show/new.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["inline", "t", ["nodes.cancel"], [], ["loc", [null, [24, 58], [24, 78]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 30,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/node/show/new.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "panel panel-default");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-heading");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "panel-title");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-body");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("form");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "form-group col-xs-12");
        var el5 = dom.createTextNode("\n");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("label");
        dom.setAttribute(el5, "class", "col-xs-12");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "col-xs-12");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("button");
        dom.setAttribute(el6, "class", "btn btn-primary");
        var el7 = dom.createTextNode("\n");
        dom.appendChild(el6, el7);
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(element0, [3, 1]);
        var element2 = dom.childAt(element1, [1]);
        var element3 = dom.childAt(element2, [3]);
        var element4 = dom.childAt(element2, [5]);
        var element5 = dom.childAt(element4, [1]);
        var morphs = new Array(9);
        morphs[0] = dom.createMorphAt(dom.childAt(element0, [1, 1]), 0, 0);
        morphs[1] = dom.createElementMorph(element1);
        morphs[2] = dom.createMorphAt(element2, 1, 1);
        morphs[3] = dom.createMorphAt(element3, 0, 0);
        morphs[4] = dom.createMorphAt(element3, 2, 2);
        morphs[5] = dom.createAttrMorph(element5, 'disabled');
        morphs[6] = dom.createElementMorph(element5);
        morphs[7] = dom.createMorphAt(element5, 1, 1);
        morphs[8] = dom.createMorphAt(element4, 3, 3);
        return morphs;
      },
      statements: [["inline", "t", ["nodes.new"], [], ["loc", [null, [3, 29], [3, 46]]], 0, 0], ["element", "action", ["createNode", ["get", "model", ["loc", [null, [6, 32], [6, 37]]], 0, 0, 0, 0]], ["on", "submit"], ["loc", [null, [6, 10], [6, 51]]], 0, 0], ["block", "if", [["get", "error", ["loc", [null, [8, 14], [8, 19]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [8, 8], [12, 15]]]], ["inline", "t", ["nodes.name"], [], ["loc", [null, [13, 33], [13, 51]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.name", ["loc", [null, [14, 75], [14, 85]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [14, 10], [14, 87]]], 0, 0], ["attribute", "disabled", ["get", "performingCreate", ["loc", [null, [17, 53], [17, 69]]], 0, 0, 0, 0], 0, 0, 0, 0], ["element", "action", ["createNode", ["get", "model", ["loc", [null, [17, 94], [17, 99]]], 0, 0, 0, 0]], [], ["loc", [null, [17, 72], [17, 101]]], 0, 0], ["block", "if", [["get", "performingCreate", ["loc", [null, [18, 18], [18, 34]]], 0, 0, 0, 0]], [], 1, 2, ["loc", [null, [18, 12], [22, 19]]]], ["block", "link-to", ["node.show"], ["class", "btn btn-default"], 3, null, ["loc", [null, [24, 10], [24, 90]]]]],
      locals: [],
      templates: [child0, child1, child2, child3]
    };
  })());
});
define("d-flow-ember/templates/queuemanager", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 13,
                "column": 10
              },
              "end": {
                "line": 18,
                "column": 10
              }
            },
            "moduleName": "d-flow-ember/templates/queuemanager.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("          ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "row");
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("label");
            dom.setAttribute(el2, "class", "col-xs-2");
            var el3 = dom.createTextNode("Begärd stängning");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2, "class", "col-xs-10");
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1, 3]), 0, 0);
            return morphs;
          },
          statements: [["content", "abortedAt", ["loc", [null, [16, 35], [16, 48]]], 0, 0, 0, 0]],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 27,
                  "column": 16
                },
                "end": {
                  "line": 29,
                  "column": 16
                }
              },
              "moduleName": "d-flow-ember/templates/queuemanager.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
              return morphs;
            },
            statements: [["content", "model.last_flow_step.job_id", ["loc", [null, [28, 16], [28, 47]]], 0, 0, 0, 0]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 23,
                "column": 10
              },
              "end": {
                "line": 36,
                "column": 10
              }
            },
            "moduleName": "d-flow-ember/templates/queuemanager.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("            ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "row");
            var el2 = dom.createTextNode("\n              ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("label");
            dom.setAttribute(el2, "class", "col-xs-2");
            var el3 = dom.createTextNode("Senaste jobb");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n              ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2, "class", "col-xs-10");
            var el3 = dom.createTextNode("\n");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("              ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n            ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "row");
            var el2 = dom.createTextNode("\n              ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("label");
            dom.setAttribute(el2, "class", "col-xs-12");
            var el3 = dom.createTextNode("Senaste flödessteg");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n              ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(2);
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1, 3]), 1, 1);
            morphs[1] = dom.createMorphAt(dom.childAt(fragment, [3]), 3, 3);
            return morphs;
          },
          statements: [["block", "link-to", ["jobs.show", ["get", "model.last_flow_step.job_id", ["loc", [null, [27, 39], [27, 66]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [27, 16], [29, 28]]]], ["inline", "flow-table", [], ["flowSteps", ["subexpr", "@mut", [["get", "lastFlowStepArray", ["loc", [null, [34, 37], [34, 54]]], 0, 0, 0, 0]], [], [], 0, 0], "viewMode", true, "class", "col-xs-12 panelized-table"], ["loc", [null, [34, 14], [34, 104]]], 0, 0]],
          locals: [],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 8,
              "column": 8
            },
            "end": {
              "line": 37,
              "column": 8
            }
          },
          "moduleName": "d-flow-ember/templates/queuemanager.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "row");
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          dom.setAttribute(el2, "class", "col-xs-2");
          var el3 = dom.createTextNode("Startad");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "col-xs-10");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "row");
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          dom.setAttribute(el2, "class", "col-xs-2");
          var el3 = dom.createTextNode("Version");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "col-xs-10");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(4);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1, 3]), 0, 0);
          morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
          morphs[2] = dom.createMorphAt(dom.childAt(fragment, [5, 3]), 0, 0);
          morphs[3] = dom.createMorphAt(fragment, 7, 7, contextualElement);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["content", "startedAt", ["loc", [null, [11, 35], [11, 48]]], 0, 0, 0, 0], ["block", "if", [["get", "model.aborted_at", ["loc", [null, [13, 16], [13, 32]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [13, 10], [18, 17]]]], ["content", "model.version_string", ["loc", [null, [21, 35], [21, 59]]], 0, 0, 0, 0], ["block", "if", [["get", "model.last_flow_step", ["loc", [null, [23, 16], [23, 36]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [23, 10], [36, 17]]]]],
        locals: [],
        templates: [child0, child1]
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 37,
              "column": 8
            },
            "end": {
              "line": 39,
              "column": 8
            }
          },
          "moduleName": "d-flow-ember/templates/queuemanager.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("label");
          dom.setAttribute(el1, "class", "col-xs-12");
          var el2 = dom.createTextNode("Köhanteraren är inte igång");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 48,
              "column": 4
            },
            "end": {
              "line": 57,
              "column": 4
            }
          },
          "moduleName": "d-flow-ember/templates/queuemanager.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "row");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "panel-heading");
          var el3 = dom.createTextNode("\n          ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3, "class", "panel-title");
          var el4 = dom.createTextNode("Logg");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n        ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "col-xs-12");
          var el3 = dom.createTextNode("\n          ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("pre");
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n        ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1, 3, 1]), 0, 0);
          return morphs;
        },
        statements: [["content", "meta.log_output", ["loc", [null, [54, 15], [54, 34]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 62,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/queuemanager.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "panel panel-default");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-heading");
        dom.setAttribute(el2, "style", "padding-top:8px;");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("span");
        dom.setAttribute(el3, "class", "panel-title");
        var el4 = dom.createTextNode("Köhanterare");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-body");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "row");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "container");
        var el5 = dom.createTextNode("\n");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "row");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "col-xs-12");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "class", "btn btn-default");
        var el6 = dom.createTextNode("Starta");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "class", "btn btn-default");
        var el6 = dom.createTextNode("Stoppa");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0, 3]);
        var element1 = dom.childAt(element0, [3, 1]);
        var element2 = dom.childAt(element1, [1]);
        var element3 = dom.childAt(element1, [3]);
        var morphs = new Array(6);
        morphs[0] = dom.createMorphAt(dom.childAt(element0, [1, 1]), 1, 1);
        morphs[1] = dom.createAttrMorph(element2, 'disabled');
        morphs[2] = dom.createElementMorph(element2);
        morphs[3] = dom.createAttrMorph(element3, 'disabled');
        morphs[4] = dom.createElementMorph(element3);
        morphs[5] = dom.createMorphAt(element0, 5, 5);
        return morphs;
      },
      statements: [["block", "if", [["get", "model", ["loc", [null, [8, 14], [8, 19]]], 0, 0, 0, 0]], [], 0, 1, ["loc", [null, [8, 8], [39, 15]]]], ["attribute", "disabled", ["concat", [["subexpr", "unless", [["get", "canStart", ["loc", [null, [44, 35], [44, 43]]], 0, 0, 0, 0], "disabled"], [], ["loc", [null, [44, 26], [44, 56]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["element", "action", ["startQueueManager"], [], ["loc", [null, [44, 82], [44, 112]]], 0, 0], ["attribute", "disabled", ["concat", [["subexpr", "unless", [["get", "canStop", ["loc", [null, [45, 35], [45, 42]]], 0, 0, 0, 0], "disabled"], [], ["loc", [null, [45, 26], [45, 55]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["element", "action", ["stopQueueManager", ["get", "model.pid", ["loc", [null, [45, 109], [45, 118]]], 0, 0, 0, 0]], [], ["loc", [null, [45, 81], [45, 120]]], 0, 0], ["block", "if", [["get", "meta.log_output", ["loc", [null, [48, 10], [48, 25]]], 0, 0, 0, 0]], [], 2, null, ["loc", [null, [48, 4], [57, 11]]]]],
      locals: [],
      templates: [child0, child1, child2]
    };
  })());
});
define("d-flow-ember/templates/statistics", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 8,
              "column": 6
            },
            "end": {
              "line": 12,
              "column": 6
            }
          },
          "moduleName": "d-flow-ember/templates/statistics.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "alert alert-danger col-xs-12");
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["content", "error.msg", ["loc", [null, [10, 10], [10, 23]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 38,
              "column": 8
            },
            "end": {
              "line": 44,
              "column": 8
            }
          },
          "moduleName": "d-flow-ember/templates/statistics.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "btn-toolbar pull-right");
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("a");
          dom.setAttribute(el2, "class", "btn btn-success");
          var el3 = dom.createTextNode("\n               ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("i");
          dom.setAttribute(el3, "class", "fa fa-table");
          dom.setAttribute(el3, "aria-hidden", "true");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode(" \n               ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1, 1]);
          var morphs = new Array(2);
          morphs[0] = dom.createAttrMorph(element0, 'href');
          morphs[1] = dom.createMorphAt(element0, 3, 3);
          return morphs;
        },
        statements: [["attribute", "href", ["concat", [["get", "fileUrl", ["loc", [null, [40, 23], [40, 30]]], 0, 0, 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["statistics.download_file"], [], ["loc", [null, [42, 15], [42, 47]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 50,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/statistics.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "panel panel-default");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-heading");
        dom.setAttribute(el2, "style", "padding-top:8px;");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("span");
        dom.setAttribute(el3, "class", "panel-title");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-body");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "form-group");
        var el4 = dom.createTextNode("\n\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("label");
        dom.setAttribute(el5, "class", "col-xs-12 control-label");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("label");
        dom.setAttribute(el5, "class", "col-xs-12 control-label");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "col-xs-12");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "class", "btn btn-primary");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode(" ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element1 = dom.childAt(fragment, [0]);
        var element2 = dom.childAt(element1, [3, 1]);
        var element3 = dom.childAt(element2, [3]);
        var element4 = dom.childAt(element3, [1]);
        var element5 = dom.childAt(element2, [5]);
        var element6 = dom.childAt(element5, [1]);
        var element7 = dom.childAt(element2, [7]);
        var element8 = dom.childAt(element7, [1]);
        var morphs = new Array(14);
        morphs[0] = dom.createMorphAt(dom.childAt(element1, [1, 1]), 0, 0);
        morphs[1] = dom.createMorphAt(element2, 1, 1);
        morphs[2] = dom.createAttrMorph(element3, 'class');
        morphs[3] = dom.createMorphAt(element4, 0, 0);
        morphs[4] = dom.createMorphAt(element4, 2, 2);
        morphs[5] = dom.createAttrMorph(element5, 'class');
        morphs[6] = dom.createMorphAt(element6, 0, 0);
        morphs[7] = dom.createMorphAt(element6, 2, 2);
        morphs[8] = dom.createAttrMorph(element8, 'disabled');
        morphs[9] = dom.createElementMorph(element8);
        morphs[10] = dom.createMorphAt(element8, 0, 0);
        morphs[11] = dom.createMorphAt(element7, 3, 3);
        morphs[12] = dom.createMorphAt(element7, 5, 5);
        morphs[13] = dom.createMorphAt(element7, 7, 7);
        return morphs;
      },
      statements: [["inline", "t", ["statistics.create_file"], [], ["loc", [null, [3, 30], [3, 60]]], 0, 0], ["block", "if", [["get", "error", ["loc", [null, [8, 12], [8, 17]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [8, 6], [12, 13]]]], ["attribute", "class", ["concat", ["form-group ", ["subexpr", "if", [["get", "validationErrorStartDate", ["loc", [null, [14, 34], [14, 58]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [14, 29], [14, 72]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["statistics.start_date"], [], ["loc", [null, [15, 47], [15, 76]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "startDate", ["loc", [null, [18, 33], [18, 42]]], 0, 0, 0, 0]], [], [], 0, 0], "placeholder", ["subexpr", "t", ["statistics.start_date_placeholder"], [], ["loc", [null, [19, 33], [19, 72]]], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [16, 10], [19, 74]]], 0, 0], ["attribute", "class", ["concat", ["form-group ", ["subexpr", "if", [["get", "validationErrorEndDate", ["loc", [null, [23, 34], [23, 56]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [23, 29], [23, 70]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["statistics.end_date"], [], ["loc", [null, [24, 47], [24, 74]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "endDate", ["loc", [null, [27, 33], [27, 40]]], 0, 0, 0, 0]], [], [], 0, 0], "placeholder", ["subexpr", "t", ["statistics.end_date_placeholder"], [], ["loc", [null, [28, 33], [28, 70]]], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [25, 10], [28, 72]]], 0, 0], ["attribute", "disabled", ["get", "fileCreationButtonDisabled", ["loc", [null, [35, 21], [35, 47]]], 0, 0, 0, 0], 0, 0, 0, 0], ["element", "action", ["createJobDataForStatisticsFile", ["get", "startDate", ["loc", [null, [34, 52], [34, 61]]], 0, 0, 0, 0], ["get", "endDate", ["loc", [null, [34, 62], [34, 69]]], 0, 0, 0, 0]], [], ["loc", [null, [34, 10], [34, 71]]], 0, 0], ["inline", "t", ["statistics.start_creation"], [], ["loc", [null, [35, 50], [35, 83]]], 0, 0], ["inline", "if", [["get", "isPollingStarted", ["loc", [null, [37, 13], [37, 29]]], 0, 0, 0, 0], ["subexpr", "concat", ["[ ", ["get", "pollCounter", ["loc", [null, [37, 43], [37, 54]]], 0, 0, 0, 0], " ]"], [], ["loc", [null, [37, 30], [37, 60]]], 0, 0]], [], ["loc", [null, [37, 8], [37, 62]]], 0, 0], ["content", "statusMessage", ["loc", [null, [37, 63], [37, 80]]], 0, 0, 0, 0], ["block", "if", [["get", "fileReadyForDownload", ["loc", [null, [38, 14], [38, 34]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [38, 8], [44, 15]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("d-flow-ember/templates/users", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 10
          }
        },
        "moduleName": "d-flow-ember/templates/users.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["content", "outlet", ["loc", [null, [1, 0], [1, 10]]], 0, 0, 0, 0]],
      locals: [],
      templates: []
    };
  })());
});
define("d-flow-ember/templates/users/index", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 4,
                "column": 6
              },
              "end": {
                "line": 4,
                "column": 99
              }
            },
            "moduleName": "d-flow-ember/templates/users/index.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["inline", "t", ["users.new"], [], ["loc", [null, [4, 82], [4, 99]]], 0, 0]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 3,
              "column": 4
            },
            "end": {
              "line": 5,
              "column": 4
            }
          },
          "moduleName": "d-flow-ember/templates/users/index.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["block", "link-to", ["users.index.new"], ["class", "btn btn-default navbar-btn pull-right"], 0, null, ["loc", [null, [4, 6], [4, 111]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 31,
                "column": 16
              },
              "end": {
                "line": 31,
                "column": 73
              }
            },
            "moduleName": "d-flow-ember/templates/users/index.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["inline", "t", ["users.edit"], [], ["loc", [null, [31, 55], [31, 73]]], 0, 0]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 25,
              "column": 8
            },
            "end": {
              "line": 33,
              "column": 8
            }
          },
          "moduleName": "d-flow-ember/templates/users/index.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("tr");
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("td");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("td");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("td");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("td");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("td");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(5);
          morphs[0] = dom.createMorphAt(dom.childAt(element0, [1]), 0, 0);
          morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]), 0, 0);
          morphs[2] = dom.createMorphAt(dom.childAt(element0, [5]), 0, 0);
          morphs[3] = dom.createMorphAt(dom.childAt(element0, [7]), 0, 0);
          morphs[4] = dom.createMorphAt(dom.childAt(element0, [9]), 0, 0);
          return morphs;
        },
        statements: [["content", "user.id", ["loc", [null, [27, 16], [27, 27]]], 0, 0, 0, 0], ["content", "user.username", ["loc", [null, [28, 16], [28, 33]]], 0, 0, 0, 0], ["content", "user.name", ["loc", [null, [29, 16], [29, 29]]], 0, 0, 0, 0], ["content", "user.role", ["loc", [null, [30, 16], [30, 29]]], 0, 0, 0, 0], ["block", "link-to", ["users.index.edit", ["get", "user.id", ["loc", [null, [31, 46], [31, 53]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [31, 16], [31, 85]]]]],
        locals: ["user"],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 39,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/users/index.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "navbar navbar-default sub-navbar");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("ul");
        dom.setAttribute(el2, "class", "navbar-nav nav navbar-right");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "panel panel-default");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-heading");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "panel-title");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-body");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("table");
        dom.setAttribute(el3, "class", "table");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("thead");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("tr");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("tbody");
        var el5 = dom.createTextNode("\n");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element1 = dom.childAt(fragment, [4]);
        var element2 = dom.childAt(element1, [3, 1]);
        var element3 = dom.childAt(element2, [1, 1]);
        var morphs = new Array(8);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0, 1]), 1, 1);
        morphs[1] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        morphs[2] = dom.createMorphAt(dom.childAt(element1, [1, 1]), 0, 0);
        morphs[3] = dom.createMorphAt(dom.childAt(element3, [1]), 0, 0);
        morphs[4] = dom.createMorphAt(dom.childAt(element3, [3]), 0, 0);
        morphs[5] = dom.createMorphAt(dom.childAt(element3, [5]), 0, 0);
        morphs[6] = dom.createMorphAt(dom.childAt(element3, [7]), 0, 0);
        morphs[7] = dom.createMorphAt(dom.childAt(element2, [3]), 1, 1);
        return morphs;
      },
      statements: [["block", "if", [["get", "session.data.authenticated.can_view_users", ["loc", [null, [3, 10], [3, 51]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [3, 4], [5, 11]]]], ["content", "outlet", ["loc", [null, [8, 0], [8, 10]]], 0, 0, 0, 0], ["inline", "t", ["users.header"], [], ["loc", [null, [11, 29], [11, 49]]], 0, 0], ["inline", "t", ["users.id"], [], ["loc", [null, [17, 14], [17, 30]]], 0, 0], ["inline", "t", ["users.username"], [], ["loc", [null, [18, 14], [18, 36]]], 0, 0], ["inline", "t", ["users.name"], [], ["loc", [null, [19, 14], [19, 32]]], 0, 0], ["inline", "t", ["users.role"], [], ["loc", [null, [20, 14], [20, 32]]], 0, 0], ["block", "each", [["get", "model", ["loc", [null, [25, 16], [25, 21]]], 0, 0, 0, 0]], [], 1, null, ["loc", [null, [25, 8], [33, 17]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("d-flow-ember/templates/users/index/-userform", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 5,
              "column": 0
            }
          },
          "moduleName": "d-flow-ember/templates/users/index/-userform.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "alert alert-danger");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["content", "error.msg", ["loc", [null, [3, 4], [3, 17]]], 0, 0, 0, 0]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "revision": "Ember@2.7.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 40,
                  "column": 6
                },
                "end": {
                  "line": 40,
                  "column": 52
                }
              },
              "moduleName": "d-flow-ember/templates/users/index/-userform.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["content", "option.name", ["loc", [null, [40, 37], [40, 52]]], 0, 0, 0, 0]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "revision": "Ember@2.7.3",
            "loc": {
              "source": null,
              "start": {
                "line": 39,
                "column": 4
              },
              "end": {
                "line": 41,
                "column": 4
              }
            },
            "moduleName": "d-flow-ember/templates/users/index/-userform.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["block", "x-option", [], ["value", ["subexpr", "@mut", [["get", "option.name", ["loc", [null, [40, 24], [40, 35]]], 0, 0, 0, 0]], [], [], 0, 0]], 0, null, ["loc", [null, [40, 6], [40, 65]]]]],
          locals: ["option"],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 38,
              "column": 2
            },
            "end": {
              "line": 42,
              "column": 2
            }
          },
          "moduleName": "d-flow-ember/templates/users/index/-userform.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "each", [["get", "roleSelection", ["loc", [null, [39, 12], [39, 25]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [39, 4], [41, 13]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 44,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/users/index/-userform.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("label");
        dom.setAttribute(el2, "class", "col-xs-12 control-label");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("label");
        dom.setAttribute(el2, "class", "col-xs-12 control-label");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("label");
        dom.setAttribute(el2, "class", "col-xs-12 control-label");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("label");
        dom.setAttribute(el2, "class", "col-xs-12 control-label");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("label");
        dom.setAttribute(el2, "class", "col-xs-12 control-label");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("label");
        dom.setAttribute(el1, "class", "col-xs-12");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [2]);
        var element1 = dom.childAt(element0, [1]);
        var element2 = dom.childAt(fragment, [4]);
        var element3 = dom.childAt(element2, [1]);
        var element4 = dom.childAt(fragment, [6]);
        var element5 = dom.childAt(element4, [1]);
        var element6 = dom.childAt(fragment, [8]);
        var element7 = dom.childAt(element6, [1]);
        var element8 = dom.childAt(fragment, [10]);
        var element9 = dom.childAt(element8, [1]);
        var element10 = dom.childAt(fragment, [12]);
        var morphs = new Array(18);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        morphs[1] = dom.createAttrMorph(element0, 'class');
        morphs[2] = dom.createMorphAt(element1, 0, 0);
        morphs[3] = dom.createMorphAt(element1, 2, 2);
        morphs[4] = dom.createAttrMorph(element2, 'class');
        morphs[5] = dom.createMorphAt(element3, 0, 0);
        morphs[6] = dom.createMorphAt(element3, 2, 2);
        morphs[7] = dom.createAttrMorph(element4, 'class');
        morphs[8] = dom.createMorphAt(element5, 0, 0);
        morphs[9] = dom.createMorphAt(element5, 2, 2);
        morphs[10] = dom.createAttrMorph(element6, 'class');
        morphs[11] = dom.createMorphAt(element7, 0, 0);
        morphs[12] = dom.createMorphAt(element7, 2, 2);
        morphs[13] = dom.createAttrMorph(element8, 'class');
        morphs[14] = dom.createMorphAt(element9, 0, 0);
        morphs[15] = dom.createMorphAt(element9, 2, 2);
        morphs[16] = dom.createMorphAt(element10, 0, 0);
        morphs[17] = dom.createMorphAt(element10, 2, 2);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["block", "if", [["get", "error", ["loc", [null, [1, 6], [1, 11]]], 0, 0, 0, 0]], [], 0, null, ["loc", [null, [1, 0], [5, 7]]]], ["attribute", "class", ["concat", ["form-group ", ["subexpr", "if", [["get", "error.errors.username", ["loc", [null, [7, 28], [7, 49]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [7, 23], [7, 63]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["users.username"], [], ["loc", [null, [8, 41], [8, 63]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.username", ["loc", [null, [9, 69], [9, 83]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [9, 4], [9, 85]]], 0, 0], ["attribute", "class", ["concat", ["form-group ", ["subexpr", "if", [["get", "error.errors.name", ["loc", [null, [13, 28], [13, 45]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [13, 23], [13, 59]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["users.name"], [], ["loc", [null, [14, 41], [14, 59]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.name", ["loc", [null, [15, 69], [15, 79]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [15, 4], [15, 81]]], 0, 0], ["attribute", "class", ["concat", ["form-group ", ["subexpr", "if", [["get", "error.errors.email", ["loc", [null, [19, 28], [19, 46]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [19, 23], [19, 60]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["users.email"], [], ["loc", [null, [20, 41], [20, 60]]], 0, 0], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.email", ["loc", [null, [21, 69], [21, 80]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [21, 4], [21, 82]]], 0, 0], ["attribute", "class", ["concat", ["form-group ", ["subexpr", "if", [["get", "error.errors.password", ["loc", [null, [25, 28], [25, 49]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [25, 23], [25, 63]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["users.password"], [], ["loc", [null, [26, 41], [26, 63]]], 0, 0], ["inline", "input", [], ["type", "password", "value", ["subexpr", "@mut", [["get", "model.password", ["loc", [null, [27, 73], [27, 87]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [27, 4], [27, 89]]], 0, 0], ["attribute", "class", ["concat", ["form-group ", ["subexpr", "if", [["get", "error.errors.password_confirmation", ["loc", [null, [31, 28], [31, 62]]], 0, 0, 0, 0], "has-error"], [], ["loc", [null, [31, 23], [31, 76]]], 0, 0]], 0, 0, 0, 0, 0], 0, 0, 0, 0], ["inline", "t", ["users.password_confirmation"], [], ["loc", [null, [32, 41], [32, 76]]], 0, 0], ["inline", "input", [], ["type", "password", "value", ["subexpr", "@mut", [["get", "model.password_confirmation", ["loc", [null, [33, 73], [33, 100]]], 0, 0, 0, 0]], [], [], 0, 0], "class", ["subexpr", "concat", ["form-control", " ", "col-xs-6", " "], [], [], 0, 0]], ["loc", [null, [33, 4], [33, 102]]], 0, 0], ["inline", "t", ["users.role"], [], ["loc", [null, [37, 25], [37, 43]]], 0, 0], ["block", "x-select", [], ["value", ["subexpr", "@mut", [["get", "model.role", ["loc", [null, [38, 20], [38, 30]]], 0, 0, 0, 0]], [], [], 0, 0], "class", "form-control"], 1, null, ["loc", [null, [38, 2], [42, 15]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("d-flow-ember/templates/users/index/edit", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 10,
              "column": 8
            },
            "end": {
              "line": 10,
              "column": 92
            }
          },
          "moduleName": "d-flow-ember/templates/users/index/edit.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["inline", "t", ["users.cancel"], [], ["loc", [null, [10, 72], [10, 92]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 19,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/users/index/edit.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "panel panel-default");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-heading");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "panel-title");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-body");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "form-group");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "col-xs-12");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "class", "btn btn-primary");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "pull-right");
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("button");
        dom.setAttribute(el6, "class", "btn btn-danger");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(element0, [3, 1]);
        var element2 = dom.childAt(element1, [3]);
        var element3 = dom.childAt(element2, [1]);
        var element4 = dom.childAt(element2, [5, 1]);
        var morphs = new Array(7);
        morphs[0] = dom.createMorphAt(dom.childAt(element0, [1, 1]), 0, 0);
        morphs[1] = dom.createMorphAt(element1, 1, 1);
        morphs[2] = dom.createElementMorph(element3);
        morphs[3] = dom.createMorphAt(element3, 0, 0);
        morphs[4] = dom.createMorphAt(element2, 3, 3);
        morphs[5] = dom.createElementMorph(element4);
        morphs[6] = dom.createMorphAt(element4, 0, 0);
        return morphs;
      },
      statements: [["inline", "t", ["users.edit"], [], ["loc", [null, [3, 29], [3, 47]]], 0, 0], ["inline", "partial", ["users/index/userform"], [], ["loc", [null, [7, 6], [7, 40]]], 0, 0], ["element", "action", ["saveUser", ["get", "model", ["loc", [null, [9, 60], [9, 65]]], 0, 0, 0, 0]], [], ["loc", [null, [9, 40], [9, 67]]], 0, 0], ["inline", "t", ["users.update"], [], ["loc", [null, [9, 68], [9, 88]]], 0, 0], ["block", "link-to", ["users.index"], ["class", "btn btn-warning offset3 span2"], 0, null, ["loc", [null, [10, 8], [10, 104]]]], ["element", "action", ["deleteUser", ["get", "model.id", ["loc", [null, [12, 61], [12, 69]]], 0, 0, 0, 0]], [], ["loc", [null, [12, 39], [12, 71]]], 0, 0], ["inline", "t", ["users.delete"], [], ["loc", [null, [12, 72], [12, 92]]], 0, 0]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("d-flow-ember/templates/users/index/new", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "revision": "Ember@2.7.3",
          "loc": {
            "source": null,
            "start": {
              "line": 10,
              "column": 8
            },
            "end": {
              "line": 10,
              "column": 78
            }
          },
          "moduleName": "d-flow-ember/templates/users/index/new.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["inline", "t", ["users.cancel"], [], ["loc", [null, [10, 58], [10, 78]]], 0, 0]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "revision": "Ember@2.7.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 15,
            "column": 0
          }
        },
        "moduleName": "d-flow-ember/templates/users/index/new.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "panel panel-default");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-heading");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "panel-title");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "panel-body");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "form-group");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "col-xs-12");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("button");
        dom.setAttribute(el5, "class", "btn btn-primary");
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(element0, [3, 1]);
        var element2 = dom.childAt(element1, [3]);
        var element3 = dom.childAt(element2, [1]);
        var morphs = new Array(5);
        morphs[0] = dom.createMorphAt(dom.childAt(element0, [1, 1]), 0, 0);
        morphs[1] = dom.createMorphAt(element1, 1, 1);
        morphs[2] = dom.createElementMorph(element3);
        morphs[3] = dom.createMorphAt(element3, 0, 0);
        morphs[4] = dom.createMorphAt(element2, 3, 3);
        return morphs;
      },
      statements: [["inline", "t", ["users.new"], [], ["loc", [null, [3, 29], [3, 46]]], 0, 0], ["inline", "partial", ["users/index/userform"], [], ["loc", [null, [7, 6], [7, 40]]], 0, 0], ["element", "action", ["createUser", ["get", "model", ["loc", [null, [9, 62], [9, 67]]], 0, 0, 0, 0]], [], ["loc", [null, [9, 40], [9, 69]]], 0, 0], ["inline", "t", ["users.create"], [], ["loc", [null, [9, 70], [9, 90]]], 0, 0], ["block", "link-to", ["users.index"], ["class", "btn btn-default"], 0, null, ["loc", [null, [10, 8], [10, 90]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define('d-flow-ember/utils/i18n/compile-template', ['exports', 'ember-i18n/utils/i18n/compile-template'], function (exports, _emberI18nUtilsI18nCompileTemplate) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberI18nUtilsI18nCompileTemplate['default'];
    }
  });
});
define('d-flow-ember/utils/i18n/missing-message', ['exports', 'ember-i18n/utils/i18n/missing-message'], function (exports, _emberI18nUtilsI18nMissingMessage) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberI18nUtilsI18nMissingMessage['default'];
    }
  });
});
/* jshint ignore:start */



/* jshint ignore:end */

/* jshint ignore:start */

define('d-flow-ember/config/environment', ['ember'], function(Ember) {
  return { 'default': {"modulePrefix":"d-flow-ember","environment":"development","rootURL":"/","locationType":"auto","EmberENV":{"FEATURES":{}},"i18n":{"defaultLocale":"sv"},"APP":{"authenticationBaseURL":"/session","serviceURL":"","LOG_ACTIVE_GENERATION":true,"LOG_TRANSITIONS":true,"LOG_TRANSITIONS_INTERNAL":true,"name":"d-flow-ember","version":"0.0.0+4ef43e63"},"contentSecurityPolicyHeader":"Disabled-Content-Security-Policy","exportApplicationGlobal":true}};
});

/* jshint ignore:end */

/* jshint ignore:start */

if (!runningTests) {
  require("d-flow-ember/app")["default"].create({"authenticationBaseURL":"/session","serviceURL":"","LOG_ACTIVE_GENERATION":true,"LOG_TRANSITIONS":true,"LOG_TRANSITIONS_INTERNAL":true,"name":"d-flow-ember","version":"0.0.0+4ef43e63"});
}

/* jshint ignore:end */
//# sourceMappingURL=d-flow-ember.map

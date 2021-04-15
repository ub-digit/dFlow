import Ember from 'ember';
import InViewportMixin from 'd-flow-ember/mixins/in-view-port';

export default Ember.Component.extend(InViewportMixin, {
  session: Ember.inject.service(),
  store: Ember.inject.service(),
  init() {
    var that = this;
    var token =  this.get('session.data.authenticated.token');
    if (this.get('imagesFolderPath') && this.get('imagesSource')){
      var filetypeString = '';
      if (!!this.get('filetype')) {
        filetypeString = "&filetype=" + this.get('filetype');
      }
    this.store.find('thumbnail', '?source_dir=' + this.get('imagesFolderPath') + '&source=' + this.get('imagesSource')+ '&size=200&image=' + this.get('image.num') + filetypeString + '&token=' + token).then(function(response){
      that.set('small', response.thumbnail);
    });
    }
    this._super();
  },

  showLogical: Ember.computed('image.page_content', function() {
    if ((this.get('image.page_content') === "undefined") || (this.get('image.page_content') === "Undefined") || (this.get('image.page_content') === undefined)) {
      return false;
    }
    return true;
  }),

  showPhysical: Ember.computed('image.page_type', function() {
    if ((this.get('image.page_type') === "undefined") || (this.get('image.page_type') === "Undefined") || (this.get('image.page_type') === undefined)) {
      return false;
    }
    return true;
  }),

  fileUrl: Ember.computed('imagesFolderPath', 'imagesSource', 'image.num', 'filetype', function() {
    var token =  this.get('session.data.authenticated.token');
    var file_path = this.get('imagesFolderPath')+"/"+this.get('imagesSource')+"/"+this.get('image.num')+'.'+this.get('filetype');
    return "/assets/file?file_path="+file_path+'&token='+token;
  }),

  mouseEnter: function(){
    this.set('activeFrame', true);
  },
  mouseLeave: function(){
    this.set('activeFrame', false);
  },
  togglePhysical: function(page_type){
    if (this.get("image.page_type") === page_type) {
      this.set('image.page_type', undefined);
    }
    else {
      this.set('image.page_type', page_type);
    }
    return false;
  },
  toggleLogical: function(page_content) {
    if (this.get("image.page_content") === page_content) {
      this.set('image.page_content', undefined);
    }
    else {
      this.set('image.page_content', page_content);
    }
    return false;
  },

  actions: {
    catchPhysical: function(event) {
      if (event.path[0].nodeName === "I") {
        this.togglePhysical(event.path[1].id);
      }
      else if (event.path[0].nodeName === 'BUTTON') {
        this.togglePhysical(event.path[0].id);
      }
    },
    catchLogical: function(event) {
      if (event.path[0].nodeName === "I") {
        this.toggleLogical(event.path[1].id);
      }
      else if (event.path[0].nodeName === 'BUTTON') {
        this.toggleLogical(event.path[0].id);
      }
    },
    setLogical: function(page_content){
      this.set('image.page_content', page_content);
    },
    clickToggleSelect: function(e) {
      if (e.target.type === "submit" || e.target.localName === "i") {
        if (e.target.className === "fa fa-search") {
          window.open(
            this.get("fileUrl"),
            '_blank' // <- This is what makes it open in a new window.
          );
        }
        return false;
      }
      if (e.shiftKey) {
        if (!this.get("latestSelected")) {return;}
        var pageNumbersToSelect = [];
        if (this.get("latestSelected") === this.get("image.num")) {
          return;
        }
        if ((this.get("image.num") > this.latestSelected)) {
          for (var i = parseInt(this.latestSelected); i <= parseInt(this.get("image.num")); i++) {
            var padded = ('000'+i).slice(-4);
            pageNumbersToSelect.push(padded);
          }
        }
        else if ((this.get("image.num") < this.latestSelected)) {
          for (var i = parseInt(this.get("image.num")); i < parseInt(this.latestSelected); i++) {
            var padded = ('000'+i).slice(-4);
            pageNumbersToSelect.push(padded);
          }
        }
        // create array with pages to select


        // if pageNumberToUse is undefined find the closest to the clicked page
        if (pageNumbersToSelect.length) {
            this.get("images").forEach((item, index) => {
              if (pageNumbersToSelect.includes(item.num)) {
                Ember.set(item, 'selected', true);
              }
            })
        }



        // Find closest already selected and select from that to the clicked
      }
      else {
        if ( (e.ctrlKey === false) && (this.get("image.num") !== this.get("latestSelected")) ) {
          this.get("images").forEach(item => {
            Ember.set(item, "selected", false);
          })
        }
        this.set('image.selected', (this.get('image.selected') ? false : true));
        this.set('latestSelected', this.get("image.num"));
      }

    },
  }
});

import Ember from 'ember';

export default Ember.Component.extend({
  page_type: undefined,
  page_content: undefined,
  select_all: true,
  select_odd: true,
  select_even: true,
  latestSelected: null, 

  hasSelected: Ember.computed('packageMetadata.images.@each.selected', function() {
     return this.get("packageMetadata.images").filter(image => {
        return image.selected;
      }).length;
  }),

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

    saveMetaData(flowStep) {
      var r = confirm("Är du säker på att du vill spara metadatan?");
      if (r == true) {
        this.get('flowStepSuccess')(flowStep);
      }
    },

    applyMetadataSequence() {
      this.get('packageMetadata.images').filter(function(item) {return item.selected}).forEach((image, index) => {
        var even = 'Undefined';
        var odd = 'Undefined';
        var currIndex = index;
        switch (this.get('sequence')) {
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
          Ember.set(image, 'page_type', even);
        } else {
          Ember.set(image, 'page_type', odd);
        }
      })
    },
    applyMetadataPhysical() {
      this.get('packageMetadata.images').forEach((image, index) => {
        if (image.selected) {
          Ember.set(image, 'page_type', this.page_type);
         // Ember.set(image, 'page_content', this.page_content);
        }
      })
    },
    applyMetadataLogical() {
      this.get('packageMetadata.images').forEach((image, index) => {
        if (image.selected) {
          Ember.set(image, 'page_content', this.page_content);
        }
      })
    },
    selectAll() {
      this.get('packageMetadata.images').forEach((image, index) => {
          Ember.set(image, 'selected', true);        
      })
      this.set("latestSelected", null);
    },

    deselectAll() {
      this.get('packageMetadata.images').forEach((image, index) => {
        Ember.set(image, 'selected', false);        
      })
    },


  }
});

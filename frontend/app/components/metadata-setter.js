import Ember from 'ember';

export default Ember.Component.extend({
  page_type: undefined,
  page_content: undefined,
  select_all: true,
  select_odd: true,
  select_even: true,
  latestSelected: null,
  currentPage: 1,
  per_page_items: 500,
  pages_in_number_arr: [],

  metadataImages: Ember.computed('packageMetadata.images.[]','currentPage', function() {
    this.deselectAllImages();
    return this.paginator(this.get('packageMetadata.images'),this.get('currentPage'),this.get('per_page_items'));
  }),
  hasSelected: Ember.computed('packageMetadata.images.@each.selected', function() {
    if (this.get("packageMetadata.images")) {
    return this.get("packageMetadata.images").filter(image => {
        return image.selected;
      }).length;
    }
  }),

  paginator: function(items, current_page, per_page_items) {
    let page = current_page || 1,
    per_page = per_page_items || 10,
    offset = (page - 1) * per_page,
    paginatedItems = items.slice(offset).slice(0, per_page_items),
    total_pages = Math.ceil(items.length / per_page);
    this.set("pages_in_number_arr", this.range(1,total_pages));
    return {
      page: page,
      per_page: per_page,
      pre_page: page - 1 ? page - 1 : null,
      next_page: (total_pages > page) ? page + 1 : null,
      total: items.length,
      total_pages: total_pages,
      data: paginatedItems
    };
  },

  range: function(start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx)
  },

  setup: function() {
    $('[data-toggle="tooltip"]').tooltip({
      trigger : 'hover'
  });
  }.on('didRender'),

  deselectAllImages() {
    this.get('packageMetadata.images').forEach((image, index) => {
      Ember.set(image, 'selected', false);
    })
  },

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

    specificPage(page) {
      this.set('currentPage', page);
    },
    previousPage() {
      var newPage = this.get("currentPage")-1;
      this.set('currentPage', newPage);
    },
    nextPage() {
      var newPage = this.get("currentPage")+1;
      this.set('currentPage', newPage);
    },
    saveMetaData(flowStep) {
      var r = confirm("Är du säker på att du vill spara metadatan?");
      if (r == true) {
        this.get('flowStepSuccess')(flowStep);
        $('#myModal').modal('hide');
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
      this.deselectAllImages();
    },


  }
});

angular.module('tm-branding', [])

  .service('$$cssLoader', [
    '$http',
    function ($http) {
      this.loadStyles = function (url) {
        return $http.get(url)
          .then(function (res) {
            return res.data;
          })
          .finally(function (err) {
            if (err) console.log(err);
          });
      }
    }
  ])

  .factory('$$StyleClass', [
    '$q',
    '$$cssLoader',
    function ($q, $$cssLoader) {

      /**
       * Style constructor
       * @param {angular.element} el A tmStyle directive's angular element.
       */
      function StyleClass(el) {
        this.sheet = el[0].sheet;
        this.src = el.attr('src');
        this.name = el.attr('name');
        this.template = '';
        this.loaded = false;
      };

      /**
       * Loads the template css file of the style object.
       * @return {Promise}
       */
      StyleClass.prototype.load = function () {
        if (this.loaded) {
          var deferred = $q.defer();
          deferred.resolve();
          return deferred.promise;
        }

        return $$cssLoader.loadStyles(this.src)
          .then(function (rules) {
            this.template = rules;
            this.loaded = true;
          }.bind(this));
      };

      /**
       * Clears all stylesheet rules from the style object.
       */
      StyleClass.prototype.clear = function () {
        while (this.sheet.rules.length) {
          this.sheet.removeRule(0);
        }
      };

      /**
       * Inserts a CSS rule at the specified index.
       * @param  {String} rule  The ruleset to be inserted.
       * @param  {Number} index The insertion index.
       */
      StyleClass.prototype.insertRule = function (rule, index) {
        index = index !== undefined ? index : 0;
        this.sheet.insertRule(rule, index);
      };

      /**
       * Removes a CSS rule at the specified index.
       * @param  {Number} index The stack index of the style sheet to be removed.
       */
      StyleClass.prototype.removeRule = function (index) {
        this.sheet.removeRule(index);
      };

      /**
       * Toggles the style object. When disabled, styles are no longer active.
       */
      StyleClass.prototype.toggle = function () {
        this.sheet.disabled = !this.sheet.disabled;
      };

      return StyleClass;
    }
  ])

  .service('stylesService', [
    '$$StyleClass',
    function ($$StyleClass) {
      var styles = [];
      var names = {};

      /**
       * Initializes a tmStyle element.
       * @param  {angular.element} el
       * @return {StyleClass} A StyleClass instance object.
       */
      this.init = function (el) {
        var styleObj = new $$StyleClass(el);

        styles.push(styleObj);

        if (styleObj.name) {
          names[styleObj.name] = styleObj;
        }

        return styleObj;
      };

      /**
       * Renders style boject template with the provided object.
       * @param  {Number|String} id The stack index or name of the style object.
       * @param  {Object} object The data needed to render the template
       */
      this.render = function (id, object) {
        var style = getById(id);

        style.load().then(function () {
          var rules = style.template;

          style.clear();

          Object.keys(object).forEach(function (key) {
            rules = rules.replace(new RegExp('{{'+ key +'}}', 'g'), object[key]);
          });

          if (rules.length) {
            style.insertRule(rules);
          }
        });
      };

      /**
       * Toggles the stylesheet at the specified id.
       * @param  {Number|String} id The stack index or name of the style object.
       */
      this.toggle = function (id) {
        getById(id).toggle();
      }

      /**
       * Clears the stylesheet at the specified id.
       * @param  {Number|String} id The stack index or name of the style object.
       */
      this.clear = function(id) {
        getById(id).clear();
      };

      // Helper function
      function getById(id) {
        return (typeof id === 'number') ? styles[id] : names[id];
      }
    }
  ])

  .directive('tmStyle', [
    'stylesService',
    function (stylesService) {
      return {
        restrict: 'EA',
        template: '<style></style>',
        replace: true,
        link: function (scope, element, attr) {
          stylesService.init(element);
        }
      };
    }
  ])

  .factory('$$ImageClass', [
    function () {
      function ImageClass (el) {
        this.scope = el.isolateScope();
        this.type = el.attr('type');
      }

      /**
       * Updates the image object with a new url value.
       * @param {String} url Valid URL or base64 to image
       */
      ImageClass.prototype.setUrl = function (url) {
        this.scope.imgUrl = url;
      };

      return ImageClass;
    }
  ])

  .service('imagesService', [
    '$$ImageClass',
    function ($$ImageClass) {
      var images = [];
      var media = {};

      /**
       * Initializes a tmImage element and attempts to load it.
       * @param  {angular.element} el A tmImage directive's angular element.
       */
      this.init = function (el) {
        var image = new $$ImageClass(el);
        images.push(image);
        loadImage(image);
      };

      /**
       * TBD
       * @param  {Object} obj An object with keys specifying the images to load.
       */
      this.load = function (obj) {
        media = obj;
        images.forEach(loadImage);
      };

      /**
       * Helper method for loading a tmImage with a new source.
       * @param  {angular.element} el A tmImage directive's angular element.
       */
      function loadImage(image) {
        var type = image.type;
        if (media[type] && media[type].url) {
          image.setUrl(media[type].url);
        }
      }
    }
  ])

  .directive('tmImage', [
    'imagesService',
    function (imagesService) {
      return {
        restrict: 'E',
        template: '<img ng-src={{imgUrl}}></img>',
        replace: true,
        scope: {},
        link: function (scope, element, attr) {
          imagesService.init(element);
        }
      };
    }
  ])

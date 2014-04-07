
(function(/*! Stitch !*/) {
  if (!this.require) {
    var modules = {}, cache = {}, require = function(name, root) {
      var path = expand(root, name), module = cache[path], fn;
      if (module) {
        return module.exports;
      } else if (fn = modules[path] || modules[path = expand(path, './index')]) {
        module = {id: path, exports: {}};
        try {
          cache[path] = module;
          fn(module.exports, function(name) {
            return require(name, dirname(path));
          }, module);
          return module.exports;
        } catch (err) {
          delete cache[path];
          throw err;
        }
      } else {
        throw 'module \'' + name + '\' not found';
      }
    }, expand = function(root, name) {
      var results = [], parts, part;
      if (/^\.\.?(\/|$)/.test(name)) {
        parts = [root, name].join('/').split('/');
      } else {
        parts = name.split('/');
      }
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part == '..') {
          results.pop();
        } else if (part != '.' && part != '') {
          results.push(part);
        }
      }
      return results.join('/');
    }, dirname = function(path) {
      return path.split('/').slice(0, -1).join('/');
    };
    this.require = function(name) {
      return require(name, '');
    }
    this.require.define = function(bundle) {
      for (var key in bundle)
        modules[key] = bundle[key];
    };
  }
  return this.require.define;
}).call(this)({"app": function(exports, require, module) {(function() {
  var availableRolesTemplate, slideTemplate;

  availableRolesTemplate = require('templates/available-roles');

  slideTemplate = require('templates/slide');

  exports.init = function() {
    var socket;
    console.log("client inited");
    socket = io.connect('http://localhost');
    socket.on('available-roles', function(roles) {
      var dialog;
      console.log("available-roles: " + roles.length);
      dialog = availableRolesTemplate(roles);
      $('body').append(dialog);
      $('#available-roles a').on('click', function(ev) {
        var SELECT_ROLE, role;
        SELECT_ROLE = 'select-role-';
        if (this.id.indexOf(SELECT_ROLE) === 0) {
          role = this.id.substring(SELECT_ROLE.length);
          console.log("announce-role " + role);
          socket.emit('announce-role', role);
          return ev.preventDefault();
        } else {
          return console.log("Error: select unknown " + this.id);
        }
      });
      return $("body").pagecontainer('change', '#available-roles');
    });
    return socket.on('show-slide', function(slide) {
      var slideEl;
      console.log("show-slide");
      slideEl = slideTemplate(slide);
      $('#slide-' + slide.ix).remove();
      $('body').append(slideEl);
      $('#slide-' + slide.ix + ' a').on('click', function(ev) {
        console.log("click slide " + this.id);
        if (this.id === 'slide-' + slide.ix + '-advance') {
          console.log("advance from " + slide.ix);
          socket.emit('advance', {
            from: slide.ix
          });
        }
        if (this.id === 'slide-' + slide.ix + '-back') {
          console.log("back from " + slide.ix);
          socket.emit('back', {
            from: slide.ix
          });
        }
        if (this.id === 'slide-' + slide.ix + '-restart') {
          console.log("restart from " + slide.ix);
          return socket.emit('restart', {
            from: slide.ix
          });
        }
      });
      console.log("show-slide " + slide.ix);
      return $('body').pagecontainer('change', '#slide-' + slide.ix);
    });
  };

}).call(this);
}, "templates/available-roles": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      var ix, role, _i, _len;
    
      __out.push('<div data-role="page" data-dialog="true" id="available-roles">\n\n\t<div data-role="header">\n\t\t<h1>Available Roles</h1>\n\t</div><!-- /header -->\n\n\t<div role="main" class="ui-content">\n\t\t<p>Which role do you want to play?</p>\n');
    
      for (ix = _i = 0, _len = this.length; _i < _len; ix = ++_i) {
        role = this[ix];
        __out.push('\n\t\t<a href="#" class="select-role" id="select-role-');
        __out.push(__sanitize(ix));
        __out.push('" data-role="button" data-rel="back">');
        __out.push(__sanitize(role.title));
        __out.push(__sanitize(role.optional ? " (optional)" : void 0));
        __out.push('</a>\n');
      }
    
      __out.push('\n\t</div><!-- /content -->\n\n</div><!-- /page -->\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/slide": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      var _ref, _ref1, _ref2;
    
      __out.push('<div data-role="page" id="slide-');
    
      __out.push(__sanitize(this.ix));
    
      __out.push('">\n\n\t<div data-role="header">\n\t\t<h1>');
    
      __out.push(__sanitize(this.title != null ? this.title : '(no title)'));
    
      __out.push('</h1>\n\t\t<div data-role="navbar">\n\t\t\t<ul>\n\t\t\t\t<li><a href="#" id="slide-');
    
      __out.push(__sanitize(this.ix));
    
      __out.push('-back" class="');
    
      __out.push(__sanitize(!((_ref = this.controls) != null ? _ref.back : void 0) ? 'ui-state-disabled' : void 0));
    
      __out.push('" data-icon="arrow-l">Back</a></li>\n\t\t\t\t<li><a href="#" id="slide-');
    
      __out.push(__sanitize(this.ix));
    
      __out.push('-restart" class="');
    
      __out.push(__sanitize(!((_ref1 = this.controls) != null ? _ref1.restart : void 0) ? 'ui-state-disabled' : void 0));
    
      __out.push('" data-icon="bars">Restart</a></li>\n\t\t\t\t<li><a href="#" id="slide-');
    
      __out.push(__sanitize(this.ix));
    
      __out.push('-advance" class="');
    
      __out.push(__sanitize(!((_ref2 = this.controls) != null ? _ref2.advance : void 0) ? 'ui-state-disabled' : void 0));
    
      __out.push('" data-icon="arrow-r">Advance</a></li>\n\t\t\t</ul>\n\t\t</div>\n\t</div><!-- /header -->\n\n\t<div role="main" class="ui-content">\n');
    
      __out.push(this.html);
    
      __out.push('\n\t</div><!-- /content -->\n\n</div><!-- /page -->\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}});

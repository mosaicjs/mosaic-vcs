(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("promise"), require("events"));
	else if(typeof define === 'function' && define.amd)
		define(["promise", "events"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("promise"), require("events")) : factory(root["promise"], root["events"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function(__WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_3__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	    value: true
	});

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	var _libIntent = __webpack_require__(1);

	var _libIntent2 = _interopRequireDefault(_libIntent);

	var _libIntents = __webpack_require__(4);

	var _libIntents2 = _interopRequireDefault(_libIntents);

	exports['default'] = {
	    Intent: _libIntent2['default'],
	    Intents: _libIntents2['default'] };
	module.exports = exports['default'];

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	    value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

	var _promise = __webpack_require__(2);

	var _promise2 = _interopRequireDefault(_promise);

	var _events = __webpack_require__(3);

	var Intent = (function (_EventEmitter) {
	    function Intent(params, key) {
	        _classCallCheck(this, Intent);

	        _get(Object.getPrototypeOf(Intent.prototype), 'constructor', this).call(this);
	        this.params = params;
	        if (key) {
	            this.key = key;
	        }
	        this.handled = false;
	        this._after = [];
	        this._innerPromise = new _promise2['default']((function (resolve, reject) {
	            this.resolve = function (result) {
	                this.handled = true;
	                resolve(result);
	                return this;
	            };
	            this.reject = function (err) {
	                this.handled = true;
	                reject(err);
	                return this;
	            };
	        }).bind(this));
	        this.promise = this._innerPromise.then((function (res) {
	            if (this._after.length) {
	                return _promise2['default'].all(this._after).then(function () {
	                    return res;
	                }, function (err) {
	                    throw err;
	                });
	            }
	            return res;
	        }).bind(this));
	    }

	    _inherits(Intent, _EventEmitter);

	    _createClass(Intent, [{
	        key: 'then',
	        value: function then(onResolve, onReject) {
	            return this.promise.then(onResolve, onReject);
	        }
	    }, {
	        key: 'after',

	        /**
	         * The specified action will be executed just after the main promise is
	         * resolved.
	         */
	        value: function after(onResolve, onReject) {
	            var res = this._innerPromise.then(onResolve, onReject);
	            this._after.push(res);
	            return res;
	        }
	    }]);

	    return Intent;
	})(_events.EventEmitter);

	exports['default'] = Intent;
	module.exports = exports['default'];

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_3__;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	    value: true
	});

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	var _events = __webpack_require__(3);

	var _Intent = __webpack_require__(1);

	var _Intent2 = _interopRequireDefault(_Intent);

	function Intents(obj) {
	    obj = obj || this;
	    _events.EventEmitter.apply(obj);
	}
	extend(Intents.prototype, {
	    intent: function intent(key, params) {
	        var intent = this._newIntent(key, params);
	        return this.fireIntent(key, intent);
	    },
	    action: function action(key, params, _action) {
	        if (_action === undefined) {
	            _action = params;
	            params = undefined;
	        }
	        var intent = this._newIntent(key, params);
	        return this.runAction(key, intent, _action);
	    },
	    fireIntent: function fireIntent(key, intent) {
	        try {
	            this.emit(key, intent);
	        } catch (err) {
	            intent.reject(err);
	        }
	        return intent;
	    },
	    runAction: function runAction(key, intent, action) {
	        try {
	            intent = this.fireIntent(key, intent);
	            if (!intent.handled) {
	                var result = action.call(this, intent);
	                if (result !== undefined && !intent.handled) {
	                    intent.resolve(result);
	                }
	            }
	        } catch (err) {
	            intent.reject(err);
	        }
	        return intent;
	    },
	    _newIntent: function _newIntent(key, params) {
	        return new _Intent2['default'](params, key);
	    }
	}, _events.EventEmitter.prototype);

	Intents.addTo = function (Type) {
	    extend(Type.prototype, Intents.prototype);
	};

	function extend(to) {
	    for (var i = 1; i < arguments.length; i++) {
	        var from = arguments[i];
	        for (var key in from) {
	            if (!to[key] && Object.prototype.hasOwnProperty.call(from, key)) {
	                to[key] = from[key];
	            }
	        }
	    }
	}

	exports['default'] = Intents;
	module.exports = exports['default'];

/***/ }
/******/ ])
});
;
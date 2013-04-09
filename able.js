/*jslint nomen: true  vars: true */
/*global window */

var able = (function (root) {
    "use strict";
    var old_able = root.able;
    var able = function () { };
    able.version = "0.1.0";
    
    able.noConflict = function () { root.able = able; return able; };
    
    
    (function () {
        var listener_prop_name = "__listeners",
            emit_fn_name = "_emit";
    
        able.make_this_listenable = function (instance) {
            instance[listener_prop_name] = {};
            instance.forward = function () {
                var args = toArray(arguments);
                var type = args[args.length - 1];
                instance._emit.apply(instance, ([type]).concat(args.slice(0, args.length - 1)));
            };
        };
    
        able.make_proto_listenable = function (proto) {
            proto.on = function (event_type, callback, context) {
                var listeners = this[listener_prop_name][event_type];
    
                var linfo = {callback: callback, context: context};
                if (listeners) {
                    listeners.push(linfo);
                } else {
                    listeners = this[listener_prop_name][event_type] = [linfo];
                }
    
                return this;
            };
            proto.once = function (event_type, callback, context) {
                var listeners = this[listener_prop_name][event_type];
                if (!isArray(listeners)) {
                    listeners = this[listener_prop_name][event_type] = [];
                }
                listeners.push({callback: callback, context: context, once: true});
                return this;
            };
            proto.off = function (event_type, callback) {
                var listeners = this[listener_prop_name][event_type];
                var i;
                if (listeners) {
                    for (i = 0; i < listeners.length; i += 1) {
                        var listener = listeners[i];
                        if (listener.callback === callback) {
                            listeners.splice(i, 1);
                            i -= 1;
                        }
                    }
                    if (listeners.length === 0) {
                        delete this[listener_prop_name][event_type];
                    }
                }
                return this;
            };
            proto[emit_fn_name] = function (event_type) {
                var i;
                var args = rest(arguments);
                args.push(event_type);
                var listeners = this[listener_prop_name][event_type];
                if (listeners) {
                    var cloned_listeners = listeners.slice();
                    var len = cloned_listeners.length;
                    var num_removed = 0;
                    for (i = 0; i < len; i += 1) {
                        var listener = cloned_listeners[i];
                        var context = listener.context || this;
                        listener.callback.apply(context, args);
                        if (listener.once === true) {
                            listeners.splice(i - num_removed, 1);
                            num_removed += 1;
                        }
                    }
                    if (listeners.length === 0) {
                        delete this[listener_prop_name][event_type];
                    }
                }
            };
        };
    
        able.destroy_this_listenable = function (instance) {
            delete instance[listener_prop_name];
            delete instance.forward;
        };
    }());
        
    
    var extend = function (obj) {
        var i, prop;
        for (i = 1; i < arguments.length; i += 1) {
            var source = arguments[i];
            if (source) {
                for (prop in source) {
                    if (source.hasOwnProperty(prop)) {
                        obj[prop] = source[prop];
                    }
                }
            }
        }
        return obj;
    };
        
    
    (function () {
        var options_prop_name = "__options",
            emit_fn_name = "_emit";
        
        able.make_this_optionable = function (instance) {
            instance[options_prop_name] = extend.apply(_, [{}].concat(Array.prototype.slice.call(arguments, 1)));
        };
        
        able.make_proto_optionable = function (proto) {
            proto._get_option = function (key) {
                var value = this[options_prop_name][key];
                if (isFunction(value)) {
                    return value.call(this);
                } else {
                    return value;
                }
            };
            proto._set_option = function(key, value) {
                this[options_prop_name][key] = value;
            };
        
            proto._on_option_set = function (key, value) { };
            proto._on_options_set = function (values) { };
        
            proto.option = function (key, value) {
                var args;
                if (arguments.length === 0) {
                    return this;
                } else if (isString(key)) {
                    if (arguments.length === 1) {
                        return this._get_option(key);
                    } else {
                        args = rest(arguments, 2);
                        this._set_option.apply(this, [key, value].concat(args));
                        this._on_option_set.apply(this, [key, value].concat(args));
        
                        var keys_val = {};
                        keys_val[key] = value;
                        this._on_options_set.apply(this, [keys_val].concat(args));
        
                        return this;
                    }
                } else {
                    args = rest(arguments, 1);
                    each(key, function (v, k) {
                        this._set_option.apply(this, [k, v].concat(args));
                        this._on_option_set.apply(this, [k, v].concat(args));
                    }, this);
                    this._on_options_set.apply(this, [key].concat(args));
                    return this;
                }
            };
        };
    }());
    
    //
    // ============== UTILITY FUNCTIONS ============== 
    //
    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;
    var slice = ArrayProto.slice,
        toString = ObjProto.toString,
        nativeForEach = ArrayProto.forEach,
        nativeMap = ArrayProto.map;
    
    // Is a given value an array?
    // Delegates to ECMA5's native Array.isArray
    var isArray = Array.isArray || function (obj) {
        return toString.call(obj) === '[object Array]';
    };
    
    // Retrieve the values of an object's properties.
    var values = function (obj) {
        return map(obj, identity);
    };
      
    // Safely convert anything iterable into a real, live array.
    var toArray = function (obj) {
        if (!obj) { return []; }
        if (isArray(obj)) { return slice.call(obj); }
        if (isArguments(obj)) { return slice.call(obj); }
        if (obj.toArray && isFunction(obj.toArray)) { return obj.toArray(); }
        return values(obj);
    };
    
    // Is a given value a function?
    var isFunction = function (obj) {
        return toString.call(obj) === '[object Function]';
    };
    
    // Is a given variable a string?
    var isString = function (obj) {
        return toString.call(obj) === '[object String]';
    };
    
    // Is a given variable an arguments object?
    var isArguments = function (obj) {
        return toString.call(obj) === '[object Arguments]';
    };
    
    // Establish the object that gets returned to break out of a loop iteration.
    var breaker = {};
    
    var extend = function (obj) {
        var args = slice.call(arguments, 1),
            i,
            len = args.length;
        for (i = 0; i < len; i += 1) {
            var source = args[i];
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        }
        return obj;
    };
    
    var last = function (arr) {
        return arr[arr.length - 1];
    };
    
    var each = function (obj, iterator, context) {
        if (obj == null) { return; }
        if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) { return; }
            }
        } else {
            for (var key in obj) {
                if (has(obj, key)) {
                    if (iterator.call(context, obj[key], key, obj) === breaker) { return; }
                }
            }
        }
    };
    
    var map = function (obj, iterator, context) {
        var results = [];
        if (obj == null) { return results; }
        if (nativeMap && obj.map === nativeMap) { return obj.map(iterator, context); }
        each(obj, function(value, index, list) {
            results[results.length] = iterator.call(context, value, index, list);
        });
        if (obj.length === +obj.length) { results.length = obj.length; }
        return results;
    };
    
    var nativeFilter = Array.prototype.filter;
    var filter = function (obj, iterator, context) {
        var results = [];
        if (obj == null) { return results; }
        if (nativeFilter && obj.filter === nativeFilter) { return obj.filter(iterator, context); }
        var i, len = obj.length, value;
        for (i = 0; i<len; i++) {
            value = obj[i];
            if(iterator.call(context, value, i, obj)) { results.push(value); }
        }
        return results;
    };
      
    // Returns everything but the first entry of the array. Aliased as `tail`.
    // Especially useful on the arguments object. Passing an **index** will return
    // the rest of the values in the array from that index onward. The **guard**
    // check allows it to work with `_.map`.
    var rest = function (array, index, guard) {
        return slice.call(array, (index == null) || guard ? 1 : index);
    };
    
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var has = function (obj, key) {
        return hasOwnProperty.call(obj, key);
    };
    
    return able;
}(this));

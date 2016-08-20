/**
 * Event Emitter
 * @returns {*} emitter
 */
var Tw2EventEmitter = function()
{
    Object.defineProperty(
        this, '__events',
        {
            value: {},
            writable: false
        });
    return this;
};

/**
 * Emits an event
 * @param {String} eventName - The event to emit
 * @param {*} ...args - Any arguments to be passed to the event's listeners
 * @returns {*} emitter object
 *
 * @example emitter.emit('myEvent', arg1, arg2, arg3);
 * // Emits the 'myEvent' event and calls each of it's listeners with the supplied arguments
 */
Tw2EventEmitter.prototype.emit = function(eventName)
{
    eventName = Tw2EventEmitter.Register(this, eventName);
    var args = Array.prototype.slice.call(arguments);
    args.splice(0, 1);
    this.__events[eventName].forEach(
        function(listener)
        {
            listener.apply(undefined, args);
        }
    );
    return this;
};

/**
 * Adds a listener to an event
 * - A listener can only exist on an Event once unless using the `once` method, self removing listeners are preferred
 * @param {String} eventName - The target event
 * @param {Function} listener - The listener to add
 * @returns {*} emitter object
 *
 * @example emitter.on('myEvent', myListener);
 * // Adds `myListener` to the `myEvent` event
 */
Tw2EventEmitter.prototype.on = function(eventName, listener)
{
    eventName = Tw2EventEmitter.Register(this, eventName);
    this.__events[eventName].add(listener);
    return this;
};

/**
 * Adds a listener to an event and removes it after it's first emit
 * @param {String} eventName - The target event
 * @param {Function} listener - The listener to add for one emit only
 * @returns {*} emitter object
 *
 * @example emitter.once('myEvent', myListener);
 * // Adds `myListener` to the `myEvent` event
 * // After the first `myEvent` emit the listener is removed
 */
Tw2EventEmitter.prototype.once = function(eventName, listener)
{
    eventName = Tw2EventEmitter.Register(this, eventName);
    var self = this;
    var once = function once()
    {
        listener.apply(undefined, arguments);
        self.off(eventName, once);
    };
    this.on(eventName, once);
    return this;
};

/**
 * Removes a listener from an event
 * @param {String} eventName - The target event
 * @param {Function} listener - The listener to remove
 * @returns {*} emitter object
 *
 * @example emitter.off('myEvent', myListener);
 * // Removes `myListener` from the `myEvent` event
 */
Tw2EventEmitter.prototype.off = function(eventName, listener)
{
    eventName = eventName.toLowerCase();
    if ('__events' in this && eventName in this.__events)
    {
        this.__events[eventName].delete(listener)
    }
    return this;
};

/**
 * Internal helper
 * - Adds the `__event` property to objects that don't already have it (allows for usage of Object.assign)
 * - Adds an event name to an emitter if it doesn't already exist
 * - Ensures that eventNames are always lower case
 * @param {*} emitter - target emitter
 * @param {String} eventName - event to register
 * @returns {String} eventName
 */
Tw2EventEmitter.Register = function(emitter, eventName)
{
    if (!('__events' in emitter))
    {
        Object.defineProperty(emitter, '__events',
            {
                value: {},
                writable: false
            });
    }

    eventName = eventName.toLowerCase();
    if (!(eventName in emitter.__events))
    {
        emitter.__events[eventName] = new Set();
        emitter.emit('EventAdded', eventName);
    }
    return eventName;
}

/**
 * Checks if an emitter's event has any listeners
 * @param {*} emitter - target emitter
 * @param {String} eventName - event to check
 * @returns {Boolean}
 *
 * @example Tw2EventEmitter.HasListeners(myEmitter, 'myEvent');
 * // Returns true or false
 */
Tw2EventEmitter.HasListeners = function(emitter, eventName)
{
    if (!('__events' in emitter) || !(eventName in emitter.__events))
    {
        return false;
    }
    return (emitter.__events[eventName].size !== 0)
};

/**
 * Gets an array of an emitter's event names that a listener is on
 * @param {*} emitter - target emitter
 * @param {Function} listener - listener to check
 * @returns {Array.<String>}
 *
 * @example Tw2EventEmitter.HasListener(myEmitter, myListener)
 * // returns an array of `myEmitter`'s event names that `myListener` is on
 */
Tw2EventEmitter.HasListener = function(emitter, listener)
{
    var result = [];
    if ('__events' in emitter)
    {
        for (var eventName in emitter.__events)
        {
            if (emitter.__events.hasOwnProperty(eventName))
            {
                if (emitter.__events[eventName].has(listener))
                {
                    result.push(eventName);
                }
            }
        }
    }
    return result;
}

/**
 * Removes a listener completely from an emitter
 * @param {*} emitter - target emitter
 * @param {Function} listener - listener to delete
 *
 * @example Tw2EventEmitter.RemoveListener(myEmitter, myListener);
 * // Removes `myListener` from every event on `myEmitter`
 */
Tw2EventEmitter.RemoveListener = function(emitter, listener)
{
    if ('__events' in emitter)
    {
        for (var eventName in emitter.__events)
        {
            if (emitter.__events.hasOwnProperty(eventName))
            {
                emitter.__events[eventName].delete(listener)
            }
        }
    }
};

/**
 * Removes an event from an emitter, and all of it's listeners
 * @param {*} emitter
 * @param {String} eventName
 *
 * @example Tw2EventEmitter.RemoveEvent(myEmitter, 'myEvent');
 * // Removes all listeners on `myEvent`
 * // Deletes the `myEvent` event
 * // emits `EventRemoved` with the event name as it's argument
 */
Tw2EventEmitter.RemoveEvent = function(emitter, eventName)
{
    if ('__events' in emitter)
    {
        eventName = eventName.toLowerCase();
        if (eventName in emitter.__events)
        {
            emitter.__events[eventName].clear();
            delete emitter.__events[eventName];
            emitter.emit('EventRemoved', eventName);
        }
    }
}

/**
 * Adds bound emitter functions to a target object
 * - No checks are made to see if these methods or property names already exist in the target object
 * @param {*} emitter - source emitter
 * @param {{}} target - target object
 * @param {Boolean} [excludeEmit=false] - Optional control for excluding the `emit` method
 * @return {*}
 *
 * @example Tw2EventEmitter.Inherit(myEmitter, myObject, true);
 * // `myObject` now has `on`, `off`, and `log` emitter methods
 * @example Tw2EventEmitter.Inherit(myEmitter, myObject);
 * // `myObject` now has `on`, `off`, `log` and `emit` emitter methods
 */
Tw2EventEmitter.Inherit = function(emitter, target, excludeEmit)
{
    target['on'] = emitter.on.bind(emitter);
    target['off'] = emitter.off.bind(emitter);
    target['once'] = emitter.once.bind(emitter);
    if (!excludeEmit) target['emit'] = emitter.emit.bind(this);
    return target;
};

/**
 * CCPWGL Global emitter
 * @param {String} name - Console log prefix
 * @param {Boolean} consoleErrors - Toggle for displaying console error outputs (warn, error)
 * @param {Boolean} consoleLogs - Toggle for displaying console log outputs (log, info, debug)
 * @type {Tw2EventEmitter}
 */
var emitter = new Tw2EventEmitter();
emitter.name = 'CCPWGL';
emitter.consoleErrors = true;
emitter.consoleLogs = true;

/**
 * An Emit wrapper for the ccpwgl global emitter which emits an event and also creates a console output from a supplied event data object
 * @param {String}  eventName               - The event to emit
 * @param {{}}      eventData               - event data
 * @param {String} [eventData.msg='']       - event message
 * @param {String} [eventData.log=log]      - desired console output type (log, info, debug, warn, error, throw)
 * @param {String} [eventData.path]         - the unmodified path for the file related to the event
 * @param {Number} [eventData.time]         - the time it took to process the event path (rounds to 3 decimal places)
 * @param {String} [eventData.type]         - a string representing the unique event type
 * @param {Object} [eventData.data]         - data relevant to the event type
 * @param {Object} [eventData.err]          - javascript error object
 * @param {Number|String} [eventData.value] - a single value relevant to the event type
 * @param {Error} [eventData.err]           - Error Event object, if supplied the stack trace will be displayed
 * @param {Array.<String>} [eventData.src]  - an array of the functions involved in the event
 */
emitter.log = function(eventName, eventData)
{
    var d = eventData;
    if (!d.log) d.log = 'log';
    this.emit(eventName, d);
    var log = d.log;

    switch (d.log)
    {
        case ('throw'):
            log = 'error';
            if (!this.consoleErrors) return;
            break;

        case ('error'):
        case ('warn'):
            if (!this.consoleErrors) return;
            break;

        default:
            if (!this.consoleLogs) return;
    }

    var header = this.name.concat(': {', eventName, '}');
    var body = d.msg || '';
    if (d.path) body = body.concat(' \'', d.path, '\'', ('time' in d) ? ' in ' + d.time.toFixed(3) + 'secs' : '');
    if (d.type && (log === 'error' || log === 'warn')) body = body.concat(' (', d.type, (d.value !== undefined) ? ':' + d.value : '', ')');

    if ('data' in d)
    {
        console.group(header);
        console[log](body);
        console.dir(d.data);
        if ('err' in d && d.err.stack) console.debug(d.err.stack);
        console.groupEnd();
    }
    else
    {
        console[log](header, body);
    }

};
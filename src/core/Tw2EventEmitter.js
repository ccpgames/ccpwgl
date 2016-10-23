/**
 * Event Emitter
 *
 * @property {{}} _events
 * @returns {Tw2EventEmitter}
 */
var Tw2EventEmitter = function()
{
    Tw2EventEmitter.Define(this);
};

/**
 * Adds a listener to an event
 * - The first argument of a called listener is always the event name
 * - Event names are forced to lowercase
 * - Listeners can only be on an event once, unless using the 'once' method
 *
 * @param {String} eventName  - the event to fire the listener on
 * @param {Function} listener - the listener
 * @returns {*} emitter       - the emitter object
 *
 * @example
 * var myListener1 = function(eventName, arg1, arg2, arg3){ .... };
 * myEmitter.on('someEvent', myListener1);
 * // myListener1 will be called whenever 'someEvent' is emitted
 */
Tw2EventEmitter.prototype.on = function(eventName, listener)
{
    eventName = Tw2EventEmitter.Register(this, eventName);
    if (this._events[eventName].indexOf(listener) == -1)
    {
        this._events[eventName].push(listener);
    }
    return this;
};

/**
 * Adds a listener to an event and removes it after it's first emit
 * - Creates a temporary version of the listener which removes itself after one emit
 * - Caveat: It is possible to have the same listener on the same event multiple times when using `once`
 *
 * @param {String} eventName  - the target event
 * @param {Function} listener - the listener to add for one emit only
 * @returns {*} emitter       - the emitter object
 *
 * @example
 * myEmitter.once('someEvent', myListener1);
 * // myListener will be fired one time only before being removed from the event
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
 * Emits an event and calls any of it's listeners
 * - An event's listeners are called with the event name, and then any other supplied arguments
 *
 * @param {String} eventName - the event to emit
 * @param {*} [arguments]    - any arguments to be passed to the event's listeners
 * @returns {*} emitter      - the emitter object
 *
 * @example
 * var myListener1 = function(eventName, arg1, arg2, arg3){ .... };
 * var myListener2 = function(eventName, arg1){ .... };
 * myEmitter.on('someEvent', myListener);
 * myEmitter.emit('someEvent', arg1, arg2, arg3)
 * // myListener1 called with ('someEvent', arg1, arg2, arg3)
 * // myListener2 called with ('someEvent', arg1);
 */
Tw2EventEmitter.prototype.emit = function(eventName)
{
    eventName = Tw2EventEmitter.Register(this, eventName);
    var args = Array.prototype.slice.call(arguments);
    for (var i = 0; i < this._events[eventName].length; i++)
    {
        this._events[eventName][i].apply(undefined, args);
    }
    return this;
};

/**
 * Removes a listener from a specific event
 *
 * @param {String} eventName  - the target event
 * @param {Function} listener - the listener to remove
 * @returns {*} emitter       - the emitter object
 */
Tw2EventEmitter.prototype.off = function(eventName, listener)
{
    eventName = eventName.toLowerCase();
    if ('_events' in this && eventName in this._events)
    {
        var index = this._events[eventName].indexOf(listener);
        if (index !== -1) this._events[eventName].splice(index, 1);
    }
    return this;
};

/**
 * Removes the supplied listener(s) from any of the emitter's events
 *
 * @param {*} [arguments] - the listener(s) to remove
 * @returns {*} emitter   - the emitter object
 *
 * @example
 * myEmitter.del(myListener1, myListener2)
 * // myListener1 and myListener2 are removed from any of the emitter's events
 */
Tw2EventEmitter.prototype.remove = function()
{
    var args = Array.prototype.slice.call(arguments);
    if (this._events)
    {
        for (var i = 0; i < args.length; i++)
        {
            Tw2EventEmitter.RemoveListener(this, args[i]);
        }
    }
    return this;
};

/**
 * Internal helper that defines an event emitter's un-writable properties
 *
 * @param {*} emitter - target emitter
 */
Tw2EventEmitter.Define = function(emitter)
{
    Object.defineProperty(emitter, '_events',
        {
            value: {},
            writable: false
        });
};

/**
 * Internal helper that registers an event on an emitter
 * - Adds the `_event` property to objects that don't already have it (allows for usage of Object.assign)
 * - Ensures that eventName is lower case
 * - Adds the event if it doesn't already exist
 *
 * @param {*} emitter          - target emitter
 * @param {String} eventName   - event to register
 * @returns {String} eventName - the event name, in lower case
 */
Tw2EventEmitter.Register = function(emitter, eventName)
{
    if (!('_events' in emitter)) Tw2EventEmitter.Define(emitter);
    eventName = eventName.toLowerCase();
    if (!(eventName in emitter._events)) emitter._events[eventName] = [];
    return eventName;
};

/**
 * Checks if an emitter's event has any listeners on it
 *
 * @param {*} emitter        - target emitter
 * @param {String} eventName - event to check
 * @returns {boolean}
 */
Tw2EventEmitter.HasListeners = function(emitter, eventName)
{
    if (!('_events' in emitter) || !(eventName in emitter._events)) return false;
    return (emitter._events[eventName].length)
};

/**
 * Gets an array of an emitter's events that a listener is on
 *
 * @param {*} emitter         - target emitter
 * @param {Function} listener - listener to check
 * @returns {Array.<String>}  - an array of event names the listener is on
 */
Tw2EventEmitter.HasListener = function(emitter, listener)
{
    var result = [];
    if ('_events' in emitter)
    {
        for (var eventName in emitter._events)
        {
            if (emitter._events.hasOwnProperty(eventName))
            {
                var index = emitter._events[eventName].indexOf(listener);
                if (index !== -1) result.push(eventName);
            }
        }
    }
    return result;
};

/**
 * Removes a listener completely from an emitter
 *
 * @param {*} emitter         - target emitter
 * @param {Function} listener - listener to remove
 */
Tw2EventEmitter.RemoveListener = function(emitter, listener)
{
    if ('_events' in emitter)
    {
        for (var eventName in emitter._events)
        {
            if (emitter._events.hasOwnProperty(eventName))
            {
                var index = emitter._events[eventName].indexOf(listener);
                if (index !== -1)
                {
                    emitter._events[eventName].splice(index, 1);
                }
            }
        }
    }
};

/**
 * Removes an event from an emitter, and all of it's listeners
 *
 * @param {*} emitter        - target emitter
 * @param {String} eventName - the event to purge
 */
Tw2EventEmitter.RemoveEvent = function(emitter, eventName)
{
    if ('_events' in emitter)
    {
        eventName = eventName.toLowerCase();
        if (eventName in emitter._events) delete emitter._events[eventName];
    }
};

/**
 * Adds bound emitter functions to a target object
 * - No checks are made to see if these methods or property names already exist in the target object
 *
 * @param {*} emitter                   - source emitter
 * @param {{}} target                   - target object
 * @param {boolean} [excludeEmit=false] - Optional control for excluding the `emit` method
 * @return {*}
 */
Tw2EventEmitter.Inherit = function(emitter, target, excludeEmit)
{
    target['on'] = emitter.on.bind(emitter);
    target['off'] = emitter.off.bind(emitter);
    target['once'] = emitter.once.bind(emitter);
    if (!excludeEmit) target['emit'] = emitter.emit.bind(emitter);
    return target;
};

/**
 * Global emitter
 *
 * @emit (res.event, eventData) - Resource events (prepare, load, unload, request)
 * @emit (res.error, eventData) - Resource errors (any resource error)
 *
 * @example:
 * var myResErrorHandler = function(eventName, eventData){ .... };
 * ccpwgl_int.emitter.on('res.error', myErrorHandler);
 *
 * @example:
 * var myResEventHandler = function(eventName, eventData){ .... };
 * ccpwgl_int.emitter.on('res.event', myResEventHandler);
 *
 * @property {string}  consolePrefix
 * @property {boolean} consoleErrors
 * @property {boolean} consoleLogs
 * @property {boolean} consoleDefault
 * @inherits {Tw2EventEmitter}
 */
var emitter = new Tw2EventEmitter();
emitter.consolePrefix = 'CCPWGL';
emitter.consoleErrors = true;
emitter.consoleLogs = true;
emitter.consoleDefault = 'log';

/**
 * Creates a console output from an event name and event object, then re-emits the event.
 * - The console outputs can be disabled by setting the `consoleErrors` and `consoleLogs` properties to false
 * - The event is re-emitted after any console output
 *
 * @param {String}  eventName              - The event to emit
 * @param {{}}      eventData              - event data
 * @param {String} [eventData.msg=]        - event message
 * @param {String} [eventData.log=]        - desired console output type (log, info, debug, warn, error, throw)
 * @param {String} [eventData.path=]       - the unmodified path for the file related to the event
 * @param {number} [eventData.time=]       - the time it took to process the event path (rounds to 3 decimal places)
 * @param {String} [eventData.type=]       - a string representing the unique event type
 * @param {Object} [eventData.data=]       - data relevant to the event type
 * @param {*}      [eventData.value=]      - a single value relevant to the event type
 * @param {Error}  [eventData.err=]        - Error Event object, if supplied the stack trace will be displayed
 * @param {Array.<String>} [eventData.src] - an array of the functions involved in the event
 */
emitter.log = function(eventName, eventData)
{
    var output = true;
    var logType = eventData.log;

    switch (logType)
    {
        case ('throw'):
            logType = 'error'; // throws use 'console.error'
            if (!this.consoleErrors) output = false;
            break;

        case ('error'):
        case ('warn'):
            if (!this.consoleErrors) output = false;
            break;

        case('debug'):
        case('log'):
        case('info'):
            if (!this.consoleLogs) output = false;
            break;

        default:
            logType = this.consoleDefault; // default log type
            if (!this.consoleLogs) output = false;
    }

    if (output)
    {
        var d = eventData;
        var header = this.consolePrefix.concat(': {', eventName, '}');
        var body = d.msg || '';
        if (d.path) body = body.concat(' \'', d.path, '\'', ('time' in d) ? ' in ' + d.time.toFixed(3) + 'secs' : '');
        if (d.type && (logType === 'error' || logType === 'warn'))
        {
            body = body.concat(' (', d.type, (d.value !== undefined) ? ':' + d.value : '', ')');
        }

        if ('data' in d || 'err' in d)
        {
            console.group(header);
            console[logType](body);
            if ('data' in d) console.dir(d.data);
            // Correctly output error stacks
            if ('err' in d) console.debug(d.err.stack || d.err.toString());
            console.groupEnd();
        }
        else
        {
            console[logType](header, body);
        }
    }

    this.emit(eventName, eventData);
};
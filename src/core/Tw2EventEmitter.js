/**
 * Event Emitter
 * @param {String} [name='']
 * @property {String} [name=''] - The name of the emitter
 * @property {{}} events
 * @returns {Tw2EventEmitter}
 */
var Tw2EventEmitter = function(name)
{
    this.name = name || '';
    this.events = {};
    return this;
};

/**
 * Gets public only emitter methods (`on`, `off`, `once`, `del`)
 * @param {{}} [out={}] An optional receiving object
 * @returns {{}}
 *
 * @example var public = emitter.GetPublic()
 * // The public object now has the emitter's public functions
 */
Tw2EventEmitter.prototype.GetPublic = function(out)
{
    out || (out = {});
    this.inherit(out, false);
    return out;
};

/**
 * Checks if an event has any listeners
 * @param {String} eventName - The event to check
 * @returns {Boolean}
 *
 * @example emitter.HasListeners('myEvent');
 * // Returns true or false
 */
Tw2EventEmitter.prototype.HasListeners = function(eventName)
{
    if (!(eventName in this.events)) return false;
    return (this.events[eventName].size !== 0)
};

/**
 * Registers an Event
 * - Event names are case insensitive
 * - Emits an `EventAdded` event with the event's name as an argument
 * - When using the `on` and `once` methods an event is automatically registered
 * @param  {String} eventName - The event to register
 * @returns {Tw2EventEmitter}
 *
 * @example emitter.register('myEvent');
 * // creates the myEvent event
 * // emits a `EventAdded` event
 */
Tw2EventEmitter.prototype.register = function(eventName)
{
    eventName = eventName.toLowerCase();

    if (!(eventName in this.events))
    {
        this.events[eventName] = new Set();
        this.emit('EventAdded', eventName);
    }
    return this;
};

/**
 * Deregisters an event and removes all listeners
 * - Emits an `EventRemoved` event with the event's name as an argument
 * @param {String} eventName - The event to deregister
 * @returns {Tw2EventEmitter}
 *
 * @example emitter.deregister('myEvent');
 * // Removes all listeners from the event, and then deletes the event
 * // Emits an `EventRemoved` event
 */
Tw2EventEmitter.prototype.deregister = function(eventName)
{
    eventName = eventName.toLowerCase();

    if (eventName in this.events)
    {
        this.emit('EventRemoved', eventName);
        delete this.events[eventName];
    }
    return this;
};

/**
 * Emits an event
 * @param {String} eventName - The event to emit
 * @param {*} ...args - Any arguments to be passed to the event's listeners
 * @returns {Tw2EventEmitter}
 *
 * @example emitter.emit('myEvent', arg1, arg2, arg3);
 * // Emits the 'myEvent' event and calls all of it's listeners with the supplied arguments
 */
Tw2EventEmitter.prototype.emit = function(eventName)
{
    eventName = eventName.toLowerCase();

    if (!(eventName in this.events))
    {
        return this.register(eventName);
    }

    var args = Array.prototype.slice.call(arguments);
    args.splice(0, 1);

    this.events[eventName].forEach(
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
 * @param {Function} listener - The listener function to add
 * @returns {Tw2EventEmitter}
 *
 * @example emitter.on('myEvent', myListener);
 * // Adds `myListener` to the `myEvent` event
 */
Tw2EventEmitter.prototype.on = function(eventName, listener)
{
    eventName = eventName.toLowerCase();

    this.register(eventName);
    this.events[eventName].add(listener);
    return this;
};

/**
 * Adds a listener to an event and removes it after it's first emit
 * @param {String} eventName - The target event
 * @param {Function} listener - The listener function to add for one emit only
 * @returns {Tw2EventEmitter}
 *
 * @example emitter.once('myEvent', myListener);
 * // Adds `myListener` to the `myEvent` event
 * // After the first `myEvent` emit the listener is removed
 */
Tw2EventEmitter.prototype.once = function(eventName, listener)
{
    var self = this;
    eventName = eventName.toLowerCase();

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
 * @param {Function} listener - The listener to remove from an event
 * @returns {Tw2EventEmitter}
 *
 * @example emitter.off('myEvent', myListener);
 * // Removes `myListener` from the `myEvent` event
 */
Tw2EventEmitter.prototype.off = function(eventName, listener)
{
    eventName = eventName.toLowerCase();

    if (eventName in this.events)
    {
        this.events[eventName].delete(listener)
    }
    return this;
};

/**
 * Deletes a listener from all of the emitter's events
 * @param {Function} listener - The listener to delete
 * @returns {Tw2EventEmitter}
 *
 * @example emitter.del(myListener);
 * // Removes `myListener` from every emitter event
 */
Tw2EventEmitter.prototype.del = function(listener)
{
    const self = this;
    for (var eventName in this.events)
    {
        if (this.events.hasOwnProperty(eventName))
        {
            self.off(eventName, listener);
        }
    }
    return this;
};

/**
 * Adds bound emitter functions to a target object
 * - No checks are made to see if these methods or property names already exist
 * @param {{}} target - The object inheriting the emitter's functions
 * @param {Boolean} [excludeEmit=false] - Optional control for excluding the `emit` method
 * @return {Tw2EventEmitter}
 *
 * @example emitter.inherit(myObject, true);
 * // `myObject` now has `on`, `off`, `del` and `log` emitter methods
 * @example emitter.inherit(myObject);
 * // `myObject` now has `on`, `off`, `del`, `log` and `emit` emitter methods
 */
Tw2EventEmitter.prototype.inherit = function(target, excludeEmit)
{
    target['on'] = this.on.bind(this);
    target['off'] = this.off.bind(this);
    target['del'] = this.del.bind(this);
    target['log'] = this.log.bind(this);

    if (!excludeEmit)
    {
        target['emit'] = this.emit.bind(this);
    }

    return this;
};

/**
 * An Emit wrapper that emits an event and also creates a console output from a supplied event data object
 * - The console output replicates the existing ccpwgl console logging
 * - Console output can be toggled globally with { @link<Tw2EventEmitter.consoleErrors> and @link<Tw2EventEmitter.consoleLogs> }
 * @param {String}  eventName               - The event to emit
 * @param {{}}      eventData               - event data
 * @param {String} [eventData.msg='']       - event message
 * @param {String} [eventData.log=log]      - desired console output type (log, info, debug, warn, error, throw)
 * @param {String} [eventData.path]         - the unmodified path for the file related to the event
 * @param {Number} [eventData.time]         - the time it took to process the event path (rounds to 3 decimal places)
 * @param {String} [eventData.type]         - a string representing the unique event type
 * @param {Object} [eventData.data]         - data relevant to the event type
 * @param {Number|String} [eventData.value] - a single value relevant to the event type
 * @param {Array.<String>} [eventData.src]  - an array of the functions involved in the event
 */
Tw2EventEmitter.prototype.log = function(eventName, eventData)
{
    var d = eventData;
    if (!d.log) d.log = 'log';
    this.emit(eventName, d);
    var log = d.log;

    switch (d.log)
    {
        case ('throw'):
            log = 'error';
            if (!Tw2EventEmitter.consoleErrors) return;
            break;

        case ('error'):
        case ('warn'):
            if (!Tw2EventEmitter.consoleErrors) return;
            break;

        default:
            if (!Tw2EventEmitter.consoleLogs) return;
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
        console.groupEnd();
    }
    else
    {
        console[log](header, body);
    }
};

/**
 * Global toggle to disable `warn`, `error` and `throw` console logging from Emitter `log` calls
 * @type {Boolean}
 */
Tw2EventEmitter.consoleErrors = true;

/**
 * Global toggle to disable `log`, `info` and `debug` console logging from Emitter `log` calls
 * @type {Boolean}
 */
Tw2EventEmitter.consoleLogs = true;


var emitter = new Tw2EventEmitter('CCPWGL');

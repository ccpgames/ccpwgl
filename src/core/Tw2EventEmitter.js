/**
 * Event Emitter
 * @param {String} [name='']
 * @property {String} name
 * @property {{}} events
 * @property {{}} _public
 * @property {Function} _public.on
 * @property {Function} _public.once
 * @property {Function} _public.off
 * @property {Function} _public.delete
 * @returns {Tw2EventEmitter}
 */
var Tw2EventEmitter = function(name)
{
    this.name = name || '';
    this.events = {};
    this._public = {};
    this._public.on = this.on.bind(this);
    this._public.once = this.once.bind(this);
    this._public.off = this.off.bind(this);
    this._public.delete = this.delete.bind(this);
    return this;
}

/**
 * Returns public only methods
 * @returns {{}}
 */
Tw2EventEmitter.prototype.GetPublic = function()
{
    return this._public;
}

/**
 * Checks if an event has any listeners
 * @param {String} eventName
 * @returns {boolean}
 */
Tw2EventEmitter.prototype.HasListeners = function(eventName)
{
    if (!(eventName in this.events)) return false;
    if (this.events[eventName].size === 0) return false;
    return true;
};

/**
 * Registers an Event
 * @param  {String} eventName
 * @returns {Tw2EventEmitter}
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
 * Deregisters and event
 * @param {String} eventName
 * @returns {Tw2EventEmitter}
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
}

/**
 * Adds a listener to an event
 * - A listener can only exist on an Event once, unless using the `once` method which you probably shouldn't!
 * @param {String} eventName
 * @param {Function} listener
 * @returns {Tw2EventEmitter}
 */
Tw2EventEmitter.prototype.on = function(eventName, listener)
{
    eventName = eventName.toLowerCase();
    this.register(eventName);
    this.events[eventName].add(listener);
    return this;
}

/**
 * Adds a listener to an event and removes it after it's first emit
 * @param {String} eventName
 * @param {Function} listener
 * @returns {Tw2EventEmitter}
 * @throws When registering a listener once, and it is already registered
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
}

/**
 * Deletes all instances of a listener
 * @param {Function} listener
 * @returns {Tw2EventEmitter}
 */
Tw2EventEmitter.prototype.delete = function(listener)
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
}

/**
 * Removes a listener from an event
 * @param {String} eventName
 * @param {Function} listener
 * @returns {Tw2EventEmitter}
 */
Tw2EventEmitter.prototype.off = function(eventName, listener)
{
    eventName = eventName.toLowerCase();

    if (eventName in this.events)
    {
        this.events[eventName].delete(listener)
    }
    return this;
}

/**
 * Emits an event
 * @param {String} eventName
 * @returns {Tw2EventEmitter}
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
}

/**
 * Global toggle to disable warn, error, and throw console logging
 * @type {boolean}
 */
Tw2EventEmitter.consoleErrors = true;

/**
 * Global toggle to disable log, info, and debug console logging
 * @type {boolean}
 */
Tw2EventEmitter.consoleLogs = true;

/**
 * Emit wrapper that creates a console output from supplied event data
 * - Console output can be toggled with { @link<Tw2EventEmitter.consoleErrors> and @link<Tw2EventEmitter.consoleLogs> }
 * @param {String} eventName        - The event to emit
 * @param {{}} eventData            - event data
 * @param {String} [d.msg='']       - event message
 * @param {String} [d.log=log]      - console output type (log, info, debug, warn, error, throw)
 * @param {String} [d.path]         - the unmodified path for the file related to the event
 * @param {Number} [d.time]         - this time it took to process the event path (rounds to 3 decimal places)
 * @param {String} [d.type]         - a string representing the event type (for external event handlers)
 * @param {Object} [d.data]         - any values or data relevant to the event type
 * @param {Number|String} [d.value] - a value relevant to the event type
 * @param {Array.<String>} [d.src]  - an array of the functions involved in the event
 */
Tw2EventEmitter.prototype.log = function(eventName, eventData)
{
    var d = eventData;
    if (!d.log) d.log = 'log';
    this.emit(eventName, d);

    switch(d.log)
    {
        case('throw'):
        case('error'):
        case('warn'):
            if (!Tw2EventEmitter.consoleErrors) return;
            break;

        default:
            if (!Tw2EventEmitter.consoleLogs) return;
    }

    var header = this.name.concat(': {', eventName, '}');
    var body = d.msg || '';
    if (d.path) body = body.concat(' \'', d.path, '\'', ('time' in d) ? ' in ' + d.time.toFixed(3) + 'secs' : '');
    if (d.type && (d.log === 'error' || d.log === 'warn')) body = body.concat(' (', d.type, (d.value !== undefined) ? ':' + d.value : '', ')');

    if ('data' in d)
    {
        console.group(header);
        console[d.log](body);
        console.dir(d.data);
        console.groupEnd();
    }
    else
    {
        console[d.log](header, body);
    }
}

var emitter = new Tw2EventEmitter('CCPWGL');

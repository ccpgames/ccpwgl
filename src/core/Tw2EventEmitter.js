/**
 * Emitter privates
 * @type {WeakMap<object, *>}
 */
const PRIVATE = new WeakMap();

/**
 * Tw2EventEmitter
 * @class
 */
export class Tw2EventEmitter
{
    /**
     * Emits an event
     * @param {string} eventName
     * @param {*} [e={}]
     * @returns {Tw2EventEmitter}
     */
    emit(eventName, e = {})
    {
        // Short cut to creating a log output
        if (e.log && !e.log._logged)
        {
            e.log = this.log(e.log);
        }

        const events = PRIVATE.get(this);
        if (!events) return this;

        eventName = eventName.toLowerCase();
        if (eventName in events)
        {
            events[eventName].forEach(
                function (value, key)
                {
                    key.call(value.context, e);
                    if (value.once) events[eventName].delete(key);
                }
            );
        }
        return this;
    }

    /**
     * Adds a listener to an event
     * @param {Array|string} eventName
     * @param {Function} listener
     * @param {*} [context=undefined]
     * @param {boolean} [once=false]
     * @returns {Tw2EventEmitter}
     */
    on(eventName, listener, context = undefined, once = false)
    {
        let events = PRIVATE.get(this);
        if (!events)
        {
            events = {};
            PRIVATE.set(this, events);
        }
        eventName = eventName.toLowerCase();
        if (!events[eventName]) events[eventName] = new Set();
        events[eventName].add(listener, {context: context, once: once});
        return this;
    }

    /**
     * Adds a listener to an event, and clears it after it's first emit
     * @param {string} eventName
     * @param {Function} listener
     * @param {*} [context]
     * @returns {Tw2EventEmitter}
     */
    once(eventName, listener, context)
    {
        return this.on(eventName, listener, context, true);
    }

    /**
     * Removes a listener from a specific event or from all by passing '*' as the eventName
     * @param {string} eventName
     * @param {Function} listener
     * @returns {Tw2EventEmitter}
     */
    off(eventName, listener)
    {
        const events = PRIVATE.get(this);
        if (!events) return this;

        eventName = eventName.toLowerCase();
        if (eventName === '*')
        {
            for (const name in events)
            {
                if (events.hasOwnProperty(name))
                {
                    events[name].delete(listener);
                }
            }
        }
        else if (eventName in events)
        {
            events[eventName].delete(listener);
        }
        return this;
    }

    /**
     * Deletes an event and it's listeners
     * @param {string} eventName
     * @returns {Tw2EventEmitter}
     */
    del(eventName)
    {
        const events = PRIVATE.get(this);
        if (!events) return this;

        eventName = eventName.toLowerCase();
        if (eventName in events) delete events[eventName];
        return this;
    }

    /**
     * Clears a listener from all events
     * @param {Function} listener
     * @returns {Tw2EventEmitter}
     */
    clr(listener)
    {
        const events = PRIVATE.get(this);
        if (!events) return this;

        for (let eventName in events)
        {
            if (events.hasOwnProperty(eventName) && events[eventName].has(listener))
            {
                events[eventName].delete(listener);
            }
        }
        return this;
    }

    /**
     * Kills all events and listeners from the emitter
     * @returns {Tw2EventEmitter}
     * @emit event_kill
     */
    kill()
    {
        if (PRIVATE.has(this))
        {
            this.emit('kill');
            PRIVATE.delete(this);
        }
        return this;
    }

    /**
     * Logs an event log
     * @param {eventLog|Error} eventLog
     * @returns {eventLog}
     */
    log(eventLog)
    {
        if (!eventLog.name)
        {
            eventLog.name = this.constructor.category || this.constructor.name;
        }

        if (!this.constructor.defaultLogger)
        {
            return eventLog;
        }

        return this.constructor.defaultLogger.log(eventLog, this);
    }

    /**
     * Global logger
     * @type {*}
     */
    static defaultLogger = null;

}

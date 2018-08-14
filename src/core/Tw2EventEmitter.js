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
     * @emit event_added { eventName: string} - the first time an event is emitted
     */
    emit(eventName, e = {})
    {
        if (PRIVATE.has(this))
        {
            const events = PRIVATE.get(this);
            eventName = eventName.toLowerCase();

            // Short cut to creating a log output
            if (e.log && !e.log.logged)
            {
                e.log = this.log(eventName, e.log);
            }

            if (eventName in events)
            {
                events[eventName].forEach(
                    function(value, key)
                    {
                        key.call(value.context, e);
                        if (value.once) events[eventName].delete(key);
                    }
                );
            }
            else
            {
                events[eventName] = new Set();
                this.emit('event_added', {eventName: eventName});
            }
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
        if (!PRIVATE.has(this)) PRIVATE.set(this, {});
        const events = PRIVATE.get(this);

        eventName = eventName.toLowerCase();
        if (!events[eventName])
        {
            events[eventName] = new Set();
            events[eventName].add(() => this.emit('event_added', {eventName: eventName}), {once: true});
        }
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
        if (PRIVATE.has(this))
        {
            const events = PRIVATE.get(this);
            eventName = eventName.toLowerCase();
            if (eventName in events) events[eventName].delete(listener);
        }
        return this;
    }

    /**
     * Deletes an event and it's listeners
     * @param {string} eventName
     * @returns {Tw2EventEmitter}
     * @emit event_removed { eventName: String }
     */
    del(eventName)
    {
        if (PRIVATE.has(this))
        {
            const events = PRIVATE.get(this);
            eventName = eventName.toLowerCase();
            if (eventName in events)
            {
                this.emit('event_removed', {eventName: eventName});
                delete events[eventName];
            }
        }
        return this;
    }

    /**
     * Clears a listener from all events
     * @param {Function} listener
     * @returns {Tw2EventEmitter}
     */
    clr(listener)
    {
        if (PRIVATE.has(this))
        {
            const events = PRIVATE.get(this);
            for (let eventName in events)
            {
                if (events.hasOwnProperty(eventName) && events[eventName].has(listener))
                {
                    events[eventName].delete(listener);
                }
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
            this.emit('event_kill');
            PRIVATE.set(this, {});
        }
        return this;
    }

    /**
     * Logs an event log
     * @param {string} eventName
     * @param {eventLog} eventLog
     * @returns {eventLog}
     */
    log(eventName, eventLog)
    {
        if (this.constructor.logger)
        {
            this.constructor.logger.log(eventName, eventLog);
        }
        return eventLog;
    }

    /**
     * Assigns the event emitter's prototypes to a constructor/class
     * @param Constructor
     */
    static assign(Constructor)
    {
        Object.assign(Constructor.prototype, Tw2EventEmitter.prototype);
    }
}

/**
 * Global logger
 * @type {*}
 */
Tw2EventEmitter.logger = null;
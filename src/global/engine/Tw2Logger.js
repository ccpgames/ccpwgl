import {Tw2EventEmitter} from '../../core/Tw2EventEmitter';
import {assignIfExists, isError} from '../util';

/**
 * eventLog
 * @typedef {{}} eventLog
 * @property {string} eventLog.type       - The log's type
 * @property {string} eventLog.name       - The log's name
 * @property {string} eventLog.message    - The log's message
 * @property {boolean} [eventLog.hide]    - Toggles log visibility
 * @property {boolean} [eventLog._logged] - Identifies if the log has been logged
 * @property {Error} [eventLog.err]       - Optional error (output to the console)
 * @property {*} [eventLog.data]          - Optional data (output to the console)
 */


/**
 * Handles basic event logging
 *
 * @property {string} name                   - The name of the logger
 * @property {boolean} display               - Toggles console logging
 * @property {{}} visible                    - Visibility options
 * @property {boolean} visible.log           - Toggles console log output
 * @property {boolean} visible.info          - Toggles console info output
 * @property {boolean} visible.debug         - Toggles console debug output
 * @property {boolean} visible.warn          - Toggles console warn output
 * @property {boolean} visible.error         - Toggles console error output
 * @property {number} history                - The maximum history to store
 * @property {number} throttle               - The maximum throttling per log type
 * @property {Array} _logs                   - Stored logs
 * @property {?{string:string[]}} _throttled - Throttles message cache
 */
class Tw2Logger extends Tw2EventEmitter
{

    name = '';
    display = true;
    visible = {
        log: true,
        info: true,
        debug: true,
        warn: true,
        error: true
    };
    history = 100;
    throttle = 20;
    _logs = [];
    _throttled = null;


    /**
     * Sets the logger's properties
     * @param {*} [opt]
     */
    Set(opt)
    {
        if (!opt) return;
        assignIfExists(this, opt, ['name', 'display', 'history', 'throttle']);
        assignIfExists(this.visible, opt.visible, ['log', 'info', 'debug', 'warn', 'error']);
    }

    /**
     * Adds an event log and outputs it to the console
     * @param {*|eventLog|Error} log - The eventLog or error to log
     * @returns {eventLog} log
     */
    log(log)
    {
        if (log._logged) return log;

        // Allow errors as logs
        if (isError(log))
        {
            log = {err: log};
        }

        // Normalize log details
        if (log.err)
        {
            log.type = 'error';
            if (!log.name) log.name = log.err.name;
            if (!log.message) log.message = log.err.message;
        }
        else
        {
            log.type = Tw2Logger.LogType[log.type ? log.type.toUpperCase() : 'LOG'] || 'log';
            log.message = log.message || '';
        }

        // Normalize the log name
        let name = log.name || this.constructor.category;
        name = name.replace(/_/g, ' ');
        name = name.charAt(0).toUpperCase() + name.slice(1);
        log.name = name;

        if (!this.display || !this.visible[log.type])
        {
            log.hide = true;
        }

        // Throttle excessive output
        if (!this.throttle)
        {
            this._throttled = null;
        }
        else
        {
            if (!log.hide)
            {
                if (!this._throttled) this._throttled = {};
                if (!this._throttled[log.type]) this._throttled[log.type] = [];
                const t = this._throttled[log.type];
                if (!t.includes(log.message))
                {
                    t.unshift(log.message);
                    t.splice(this.throttle);
                }
                else
                {
                    log.hide = true;
                }
            }
        }

        // Output to the console
        if (!log.hide)
        {
            let header = `${this.name} ${log.name}:`;
            if (log.err || log.data)
            {
                console.group(header, log.message);
                if (log.err) console.debug(log.err.stack || log.err.toString());
                if (log.data) console.debug(JSON.stringify(log.data, null, 4));
                console.groupEnd();
            }
            else
            {
                console[log.type](header, log.message);
            }
        }

        // Manage log history
        if (this.history)
        {
            this._logs.unshift(log);
            this._logs.splice(this.history);
        }
        else
        {
            this._logs = [];
        }

        log._logged = true;
        this.emit(log.type, log);
        return log;
    }

    /**
     * Log types
     * @type {*}
     */
    static LogType = {
        ERROR: 'error',
        WARNING: 'warn',
        INFO: 'info',
        LOG: 'log',
        DEBUG: 'debug'
    };

    /**
     * Class category
     * @type {string}
     */
    static category = 'logger';

}


export const logger = new Tw2Logger();

/**
 * The default event logger
 * @type {Tw2Logger}
 */
Tw2EventEmitter.defaultLogger = logger;
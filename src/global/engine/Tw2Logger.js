import {Tw2EventEmitter} from '../../core/Tw2EventEmitter';
import {assignIfExists, isError} from '../util';

/**
 * Handles basic event logging
 *
 * @param {string} [name='']          - The logger's name
 * @property {string} name            - The name of the logger and it's prefix
 * @property {{}} visible             - Visibility options
 * @property {boolean} visible.log    - Toggles console log output
 * @property {boolean} visible.info   - Toggles console info output
 * @property {boolean} visible.debug  - Toggles console debug output
 * @property {boolean} visible.warn   - Toggles console warn output
 * @property {boolean} visible.error  - Toggles console error output
 * @property {number} maxLogs         - The maximum logs that will be stored
 * @property {boolean} display        - Enabled console logging
 * @property {Array} _logs            - Stored logs
 * @property {?Function} _onNewLog    - On new log
 */
class Tw2Logger extends Tw2EventEmitter
{
    constructor(name = '')
    {
        super();
        this.name = name;
        this.display = true;
        this.visible = {};
        this.visible.log = true;
        this.visible.info = true;
        this.visible.debug = false;
        this.visible.warn = true;
        this.visible.error = true;
        this.maxLogs = 100;
        this._logs = [];
    }

    /**
     * Adds an event log and outputs it to the console
     * @param {*} log
     * @returns {*} log
     */
    log(log)
    {
        if (log.logged)
        {
            return log;
        }

        // Allow errors to be logged directly
        if (isError(log))
        {
            log = {err: log};
        }

        // Normalize error logs
        if (log.err)
        {
            log.type = log.type || 'error';
            log.name = log.name || log.err.name;
            log.message = log.message || log.err.message;
        }

        log.type = Tw2Logger.Type[log.type ? log.type.toUpperCase() : 'LOG'] || 'log';
        log.message = log.message || '';
        log.title = log.title || '';

        if (!log.hide && this.display && this.visible[log.type])
        {
            let header = `${this.name} ${log.title}:`;

            if (log.err)
            {
                console.group(header, log.message);
                if (log.err) console.debug(log.err.stack || log.err.toString());
                console.groupEnd();
            }
            else
            {
                console[log.type](header, log.message);
            }
        }

        if (this.maxLogs)
        {
            if (this._logs.length >= this.maxLogs)
            {
                this._logs.splice(this.maxLogs, this._logs.length - 1);
            }
            this._logs.unshift(log);
        }
        else
        {
            this._logs = [];
        }

        this.emit(log.type, log);
        log.logged = true;
        return log;
    }

    /**
     * Gets an array of logs
     * @param {number} [count]
     * @returns {Array<eventLog>}
     */
    GetLogs(count)
    {
        return Object.assign([], count === undefined ? this._logs : this._logs.splice(0, count));
    }

    /**
     * Sets the logger's properties
     * @param {*} [opt={}]
     */
    Set(opt = {})
    {
        assignIfExists(this, opt, ['name', 'maxLogs', 'display']);
        assignIfExists(this.visible, opt.visible, ['log', 'info', 'debug', 'warn', 'error']);
    }
}

/**
 * Console outputs
 * @type {*}
 */
Tw2Logger.Type = {
    ERROR: 'error',
    WARNING: 'warn',
    INFO: 'info',
    LOG: 'log',
    DEBUG: 'debug'
};

export const logger = new Tw2Logger('CCPWGL');

/**
 * The default event logger logger
 * @type {Tw2Logger}
 */
Tw2EventEmitter.logger = logger;
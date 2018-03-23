import {Tw2EventEmitter} from '../Tw2EventEmitter';
import {util} from '../../math';

/**
 * Event log
 * @typedef {*} eventLog
 * @property {string} log       - Desired console output type
 * @property {string} msg       - A message to log
 * @property {string} path      - An optional resource path
 * @property {number} time      - An optional time
 * @property {string} type      - The type of log
 * @property {*} value          - An optional value
 * @property {*} data           - An optional values object
 * @property {Error} err        - An optional caught error
 * @property {boolean} hide     - True to skip console output
 * @property {boolean} logged   - Identifies if the log has been logged
 */

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
export class Tw2Logger extends Tw2EventEmitter
{
    constructor(name='')
    {
        super();
        this.name = name;
        this.display = true;
        this.visible = {};
        this.visible.log = true;
        this.visible.info = true;
        this.visible.debug = true;
        this.visible.warn = true;
        this.visible.error = true;
        this.maxLogs = 100;
        this._logs = [];
    }

    /**
     * Adds an event log and outputs it to the console
     * @param {string} eventName
     * @param {eventLog} log
     * @returns {eventLog} log
     */
    log(eventName, log)
    {
        log.log = Tw2Logger.Type[log.log ? log.log.toUpperCase() : 'LOG'] || 'log';

        if (!log.hide && this.display && this.visible[log.log])
        {
            let header = `${this.name}: {${eventName}}`;
            let body = log.msg || '';

            if (log.path)
            {
                body += ` '${log.path}'`;
                if ('time' in log) body += ` in ${log.time.toFixed(3)} secs`;
            }

            if (log.value !== undefined || log.type)
            {
                body += ' (';
                if (log.type) body += log.type;
                if (log.type && log.value !== undefined) body += ':';
                if (log.value !== undefined) body += log.value;
                body += ')';
            }

            if ('data' in log || 'err' in log)
            {
                console.group(header);
                console[log.log](body);
                if (log.data) console.debug(log.data);
                if (log.err) console.debug(log.err.stack || log.err.toString());
                console.groupEnd();
            }
            else
            {
                console[log.log](header, body);
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

        this.emit('log', log);
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
    Set(opt={})
    {
        util.assignIfExists(this, opt, ['name', 'maxLogs', 'display']);
        util.assignIfExists(this.visible, opt.visible, ['log','info','debug','warn','error']);
    }
}

/**
 * Console outputs
 * @type {{THROW: string, ERROR: string, WARNING: string, WARN: string, INFO: string, LOG: string, DEBUG: string}}
 */
Tw2Logger.Type = {
    THROW: 'error',
    ERROR: 'error',
    WARNING: 'warn',
    WARN: 'warn',
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
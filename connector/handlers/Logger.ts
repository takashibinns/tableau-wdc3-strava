import { log } from '@tableau/taco-toolkit/handlers'

//  Use env variable to decide whether we are should use taco-toolkit's logger or not (true mean use it)
const isDebugMode = (process.env.DEBUGGING === "true");

//  Define the logging function
const Logger = (message:string, level:string='Info') => {

    //  Structure the message to include the log level
    const logMessage = `[${level}] ${message}`;
    const logMessageWithTimestamp = `${new Date()} ${logMessage}`;

    //  Should we use taco-toolkit's log function or just console.log()
    if (!isDebugMode){
        //  Running on Tableau Desktop/Server/Cloud, use EPS logging
        try {
            log(logMessage);
        } catch (error) {
            console.error(`Taco Toolkit's log function didn't work, here's what it was trying to log: ${logMessageWithTimestamp}`);
        }
    } else {
        //  Running from regular node, use console logging
        if (level.toLowerCase() == 'error') {
            console.error(logMessageWithTimestamp);
        } else if (level.toLocaleLowerCase() == 'warn') {
            console.warn(logMessageWithTimestamp);
        } else {
            console.log(logMessageWithTimestamp)
        }
    }
}

module.exports = { Logger };
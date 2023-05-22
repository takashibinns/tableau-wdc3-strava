import { log as tacoLogger } from '@tableau/taco-toolkit/handlers'

//  Global setting for whether we are should use taco-toolkit's logger or not (true mean use it)
const debugging = true;

//  Define the logging function
const Log = (message:string, level:string='Info', ) => {

    //  Structure the message to include the log level
    const logMessage = `[${level}] ${message}`;
    const logMessageWithTimestamp = `${new Date()} ${logMessage}`;

    //  Should we use taco-toolkit's log function or just console.log()
    if (debugging){
        try {
            tacoLogger(logMessage);
        } catch (error) {
            console.error(`Taco Toolkit's log function didn't work, here's what it was trying to log: ${logMessageWithTimestamp}`);
        }
    } else {
        if (level.toLowerCase() == 'error') {
            console.error(logMessageWithTimestamp);
        } else if (level.toLocaleLowerCase() == 'warn') {
            console.warn(logMessageWithTimestamp);
        } else {
            console.log(logMessageWithTimestamp)
        }
    }
}

module.exports = { Log };
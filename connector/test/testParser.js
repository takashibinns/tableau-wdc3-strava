"use strict";
let __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

//  Import dependencies
let fs = __importDefault(require("node:fs"));
let { AsyncParser, DataContainer, ExcelUtils, ParseOptions } = __importDefault(require('@tableau/taco-toolkit/handlers'))
let parser = require('./../handlers/OAuthParser.ts')

//  Main function to test the parser, using data from a JSON file
const test = async () => {

    //  Is this an asyncronous parser?
    const isAsync = true;

    //  Load sample data from JSON file
    const sampleDataFile = `${__dirname}/sample-response.json`;
    const rawData = fs.default.readFileSync(sampleDataFile, 'utf8')
    const data = JSON.parse(rawData);

    //  Create a DataContainer, to pass to the parsing function
    let options = {
        dataContainer: {
            metadata: {
                name: "test-data",
                sourceType: "test"
            },
            tables: []
        },
        handlerInput: "",
        phase: "test"
    }

    //  Try to execute the parse function
    let results = null;
    const myParser = new parser.default();
    try {
        if (isAsync){
            results = await myParser.parse(data,options);
        } else {
            results = myParser.parse(data,options);
        }
        console.log(results)
    } catch(err) {
        console.error(err);
    }
}

//  Execute the test
test();

/*
//  Launch.json should look something like this
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Test Parser",
            "skipFiles": [
                "<node_internals>/**"
            ],
            "runtimeArgs": [
                "-r",
                "/usr/local/lib/node_modules/ts-node/register"
            ],
            "args": [
                "${workspaceFolder}/strava/connector/test/testParser.js"
            ]            
        }
    ]
}
*/
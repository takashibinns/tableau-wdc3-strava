"use strict";
let __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

//  Import dependencies
let fs = __importDefault(require("node:fs"));
let { Fetcher, FetchUtils, FetchOptions, getOAuthHeader, } = __importDefault(require('@tableau/taco-toolkit/handlers'))
let fetcher = require('./../handlers/OAuthFetcher.ts')

//  Main function to test the parser, using data from a JSON file
const test = async () => {

    //  Is this an asyncronous parser?
    const isAsync = true;

    //  Load Auth credentials from JSON file
    const sampleAuthCredentialsFile = `${__dirname}/sample-auth-credentials.json`;
    const data = fs.default.readFileSync(sampleAuthCredentialsFile, 'utf8')
    const auth = JSON.parse(data);

    //  Create the FetchOptions
    const fetchOptions = {
        handlerInput: {
            fetcher: 'OAuthFetcher',
            parser: 'OAuthParser',
            data: {
                url: `https://www.strava.com/api/v3/athlete/activities`,
            },
        },
        secrets: {
            accessToken: auth.access_token,
            refreshToken: auth.refresh_token
        }
    }

    //  Try and execute the fetcher
    const myFetcher = new fetcher.default();
    try {
        const results = await myFetcher.fetch(fetchOptions).next().then(({value,done}) => {
            console.log(value)
        })
        console.log(results)
    } catch ( err ) {
        console.error(err)
    }

    
}

//  Execute the test
test();
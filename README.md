# Tableau Web Data Connector for Strava

##  How to use

This connector uses version 3 of Tableau's [Web Data Connector](https://help.tableau.com/current/api/webdataconnector/en-us/docs/wdc_whats_new.html) framework.  In order to get this working with your own Strava account, there are a few steps.

### 1. Install the TACO toolkit
There are official instructions [here](https://help.tableau.com/current/api/webdataconnector/en-us/index.html), but there are only a few commands to get running.  If you are using MacOS, you will also need the [XCode Command Line Tools](https://mac.install.guide/commandlinetools/index.html) which can be installed by running the command ```xcode-select --install```. 

Assuming you have NodeJS installed, you can install the TACO toolkit using the following command:

```npm install -g @tableau/taco-toolkit```

### 2. Build the connector
In order to connect to Strava's API, you need to create an App in Strava first.  Follow the instructions [here](https://developers.strava.com/docs/getting-started/#account) to create your app, and copy the Client ID and Client Secret.  Open the **connector.json** file, and paste in the Client ID & Client Secret into the *clientIdDesktop* and *clientSecretDesktop* properties.  Now you can run the below commands to build the connector

``` 
taco build
taco pack
```

### 3. Use the connector
Normally, in order to run a custom connector it must be signed by a trusted CA.  There are instructions on how to do this on Tableau's [help documention](https://help.tableau.com/current/api/webdataconnector/en-us/docs/wdc_packaging.html), but if you are just trying to run this locally you can run the below command:

``` taco run Desktop```

This will start up Tableau Desktop and include the connector.  You should see the Strava connector show up, when you click on it Tableau will open an authorization prompt through your web browser.  Strava will prompt you to authorize Tableau and display the scopes we are requesting.  

![Authorization Prompt](/screenshots/authorization-prompt.png)

Click the orange Authorize button, and you will see configuration popup from Tableau.

![Configuration Popup](/screenshots/config.png)

Since Strava limits the number of API calls, it's recommended to specify a time range when pulling data from Strava.  The default is the last 6 months, but you can adjust this to whatever duration you like.  You can also choose to specify data streams for each activity.  The defaults are Lat/Lng and Distance, but all available options through Strava's API are included as checkboxes.  When your selections are complete, click on the green **Get Data** button

![Tableau Desktop](/screenshots/tables.png)

Once the web data connector has fetched all the necessary data, it will show the available tables to analyze.  

* **Activities** - A list of all activities returned by the Strava API
* **ActivityStreams** - This appears when you have selected 1 or more Data Streams.  For each row in the Activity table, you will find many rows in the ActivityStreams table.  It allows you to track your stats throughout the duration of the activity (GPS coordinates, speed, heart rate, etc)

Drag the table(s) you want to analyze into the Data Source canvas, and you're all set!

## How this works
In order to authenticate you against Strava's API, this connector follows the OAuth 2.0 standard.  By adding your Client ID and Client Secret to the connector, you won't have to enter a username/password whenever using it.  When you select the Strava connector from Tableau, it will trigger an OAuth flow (using your credentials) and return an Access Token and Refresh Token.  These are then used by Tableau to fetch data from Strava.  Tableau's [help docs](https://help.tableau.com/current/api/webdataconnector/en-us/docs/wdc_dev_considerations.html#configuring-for-oauth) have a bit more detail on how OAuth works and what properties were set, in order to develop this connector.

When the OAuth flow is complete, the connector will execute API calls for each "table".  Using the returned data set, it creates some metadata to describe the results (columns, datatypes, etc) and passes in that data to Tableau.  

When you've added the tables you wish to analyze into your Data Source, Tableau will execute the API calls to Strava again, and write it to disk as a Extract (Hyper file).  This data will need to be refreshed periodically, in order see updated data.

## Known Issues / Notes

* Working with data from either the Activties or ActivityStreams table works fine on their own, however joining or relating them will cause the Hyper extract to fail.  Currently working on a solution to this...
* This connector requires Tableau version 2023.1 or newer in order to work. It may work with older versions as well, but you will need to adjust the tableau-version.min property in connector.json before building it.  There may also be [different steps](https://help.tableau.com/current/pro/desktop/en-us/examples_wdc_connector_sdk.htm#use-a-connector-built-with-the-web-data-connector-30-sdk) required to get it working.
* If you want to use this connector with Tableau Cloud, you will need to use Tableau Bridge in order to connect it.

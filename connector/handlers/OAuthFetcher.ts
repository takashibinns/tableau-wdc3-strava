import { Fetcher, FetchUtils, FetchOptions, getOAuthHeader, log } from '@tableau/taco-toolkit/handlers'

//  Default settings for fetching activities
const defaultSettings = {
  pageSize: 200,
  maxPagesToFetch: 50,
  months: 6,
  dataStreams: {
    distance: true,
    latlng: true
  }
}

//  Function to retrieve the 
const fetchActivityStream = async (activityId:string, headers:any, streamType:string='latlng') => {

  //  Define the API endpoint
  const url = `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=${streamType}`;

  //  Return the promise
  return FetchUtils.fetchJson(url, { headers }).then( (streamData) => {
    //  Define a starting point for this activity's data stream
    let activityStream:any = {
      activityId: activityId
    }
    //  Append the data stream to this activityStream object
    streamData.forEach( (stream:any) => {
      if (stream.type === 'latlng'){
        //  Need to restructure lat/lng fields, since it returns an array of arrays
        let lat: any[] = [],
            lon: any[] = [];
        stream.data.map( (point: any[]) => {
          lat.push(point[0]);
          lon.push(point[1])
        })
        //  Split them into arrays for each lat and lng
        activityStream['lat'] = lat;
        activityStream['lon'] = lon;
      } else {
        activityStream[stream.type] = stream.data;
      }
    })
    //  Return the activity stream object
    return activityStream;
  })
}

export default class OAuthFetcher extends Fetcher {
  async *fetch({ handlerInput, secrets }: FetchOptions) {
    
    //  Get the headers needed for Auth
    const headers = getOAuthHeader(secrets)

    //  Get the settings to use
    const activityFilters = {...defaultSettings, ...handlerInput.data.settings};

    //  Figure out the time range to use
    let afterDate = new Date();
    afterDate.setMonth(afterDate.getMonth()-activityFilters.months);
    const filterAfter = Math.round(afterDate.getTime() / 1000)

    //  What data streams should we query for?
    let streamTypes:string[] = [];
    Object.keys(activityFilters.dataStreams).forEach( (streamType) => {
      if (activityFilters.dataStreams[streamType]){
        streamTypes.push(streamType)
      }
    })

    //  Derive the initial URL
    let pageNumber = 1;
    const activitiesUrl = `${handlerInput.data.url}?after=${filterAfter}&per_page=${activityFilters.pageSize}&page=${pageNumber}`;
    
    //  Get a list of all activities
    log(`Making GET request to ${activitiesUrl}`);
    let activities = await FetchUtils.fetchJson(activitiesUrl, {headers});
    log(`Found ${activities.length} activities in our first API call, keep making API calls until it returns an empty resultset`);

    //  We have a single page of activities, but maybe there are more.  Make more API calls until we get an empty result
    let isComplete = false;
    do {
      //  Increment the page number
      pageNumber += 1;

      //  Create a new URL
      const moreActivitiesUrl = `${handlerInput.data.url}?after=${filterAfter}&per_page=${activityFilters.pageSize}&page=${pageNumber}`;

      //  Fetch more activities
      let moreActivities = await FetchUtils.fetchJson(moreActivitiesUrl, {headers});
      log(`Found ${moreActivities.length} more activities`)

      //  Check the results
      if (moreActivities.length == 0) {
        //  No more activities to fetch, we have them all
        isComplete = true;
        log(`[page ${pageNumber}] No activities found, we got them all`)
      } else {
        //  We got some more activities, add them to the activities array
        activities.push(...moreActivities);
        log(`[page ${pageNumber} of ${activityFilters.maxPagesToFetch}] Found another ${moreActivities.length} activities, adding them to the list`);
      }

      //  To prevent the possibility of an infinite loop, cap the number of pages we can request
      if (pageNumber >= activityFilters.maxPagesToFetch){
        isComplete = true;
        log(`Stop fetching activities, we've hit the max number of pages to fetch (${activityFilters.maxPagesToFetch})`)
      }
    } while (!isComplete)

    //  Create a results object, to hold all activities (and possibly any streams)
    let results:any = {
      'activities': activities
    }

    //  Did the user ask to fetch activity stream data?
    if (streamTypes.length == 0) {
      log(`No stream types specified, so skip building that table`);
    } else {
      //  Create an array of promises for each activity's Stream API call (for getting the latlng coordinates)
      let activityStreamPromises: Promise<any>[] = [];
      activities.forEach( (activity:any) => {
        //  Skip manually entered activities, as they won't have a data stream
        if (!activity.manual) {
          activityStreamPromises.push(fetchActivityStream(activity.id, headers, streamTypes.join(',')));
        }
      })

      //  Execute all the API calls, and get the result
      log(`Fetch data streams for ${activityStreamPromises.length} activities (skipping manual entries)`)
      results['activityStreams'] = await Promise.all(activityStreamPromises);
    }

    //  Pass along the strava activities
    log(`Fetched data for ${activities.length} activities`);
    yield results;
    //yield await FetchUtils.fetchJson(data.url, {headers} )
  }
}

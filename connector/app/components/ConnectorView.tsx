import React from 'react'
import useConnector from './useConnector'

const baseUrl = 'https://www.strava.com/api/v3';

/*
const { isAuthenticated, isSubmitting, errorMessage, isInitializing, oauthCredentials, handleSubmit } = useConnector()


class ConnectorView extends React.Component {
  
  constructor(props: {}) {
    super(props);
    this.state = {date: new Date()};
  }

  //TODO: add your API URL
  onClick = () => {
    handleSubmit([
      {
        fetcher: 'OAuthFetcher',
        parser: 'OAuthParser',
        data: {
          url: `${baseUrl}/athlete/activities`,
        },
      },
    ])
  }

  

  // Authenticated
  render() {

    if (isInitializing) {
      return <div className="p-3 text-muted text-center">Initializing...</div>
    }
  
    if (!isAuthenticated) {
      return <div className="alert alert-danger text-center">Not Authenticated!</div>
    }

    return (
      <div className="box">
        <div className="alert alert-success">
          <h4 className="alert-heading">Authenticated</h4>

          <label>Access Token</label>
          <p>
            <code>{JSON.stringify(oauthCredentials?.accessToken, null, 2)}</code>
          </p>

          <label>Refresh Token</label>
          <p>
            <code>{JSON.stringify(oauthCredentials?.refreshToken, null, 2)}</code>
          </p>
        </div>

        <button className="btn btn-success px-5" onClick={this.onClick} disabled={isSubmitting}>
          Get Data
        </button>

        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      </div>
    )
  }
}
*/

const ConnectorView = () => {

  const { isAuthenticated, isSubmitting, errorMessage, isInitializing, oauthCredentials, handleSubmit } = useConnector()

  console.log(oauthCredentials);

  //  Input Handlers
  const [months, setMonths] = React.useState(6);

  // Data Streams to fetch
  const defaultStreams:any = {
    "distance": true,
    "latlng": true,
    "time": false,
    "altitude": false,
    "heartrate": false,
    "velocity_smooth": false,
    "cadence": false,
    "watts": false,
    "temp": false,
    "moving": false,
    "grade_smooth": false
  }
  const dataStreamsList = Object.keys(defaultStreams);
  const [dataStreams, setDataStreams] = React.useState(defaultStreams);

  //  Handler for Get Data button
  const onClick = () => {
    handleSubmit([
      {
        fetcher: 'OAuthFetcher',
        parser: 'OAuthParser',
        data: {
          url: `${baseUrl}/athlete/activities`,
          settings: {
            months: months,
            dataStreams: dataStreams
          }
        },
      },
    ])
  }

  if (isInitializing) {
    return <div className="p-3 text-muted text-center">Initializing...</div>
  }

  if (!isAuthenticated) {
    return <div className="alert alert-danger text-center">Not Authenticated!</div>
  }

  // Authenticated
  return (
    <div className="box">
      <div className="alert alert-success">
        <h4 className="alert-heading">Authenticated</h4>

        <br></br>
        
        <form>
          <legend>Time Range</legend>
          <label>Last </label>
          <input id="months" type="number" min="1" max="120" step="1" 
                 style={{marginLeft: '0.5em', marginRight: '0.5em'}}
                 value={months} onChange={ event => { setMonths(parseInt(event.target.value)); } }/>
          <label> months</label>
        </form>
        
        <br></br>
        
        <form>
          <legend>
              Select Data Streams for activities
          </legend>
          <table style={{marginLeft:'300px'}}>  
            {dataStreamsList.map( (option:string) => (
              <tr key={option}>
                <td>
                <input
                  type="checkbox"
                  id={option}
                  style={{'display': 'table-cell'}}
                  value={option}
                  checked={dataStreams[option] === true}
                  onChange={event => {
                    setDataStreams({
                      ...dataStreams,
                      [option]: event.target.checked,
                    })
                  }}
                />
                </td>
                <td>
                <label htmlFor={option} style={{'display': 'table-cell'}}>
                  {option}
                </label>
                </td>
              </tr>
            ))}
          </table>
        </form>

        <br></br>

        <label>Access Token</label>
        <p>
          <code>{JSON.stringify(oauthCredentials?.accessToken, null, 2)}</code>
        </p>

        <label>Refresh Token</label>
        <p>
          <code>{JSON.stringify(oauthCredentials?.refreshToken, null, 2)}</code>
        </p>
      </div>

      <button className="btn btn-success px-5" onClick={onClick} disabled={isSubmitting}>
        Get Data
      </button>

      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
    </div>
  )
}

export default ConnectorView

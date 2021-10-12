import CircularProgress from '@material-ui/core/CircularProgress';
import axios from 'axios';
import moment from 'moment';
import "moment/locale/fr";
import React, { Component } from 'react';
import Protect from 'react-app-protect';
import 'react-app-protect/dist/index.css';
import "react-datetime/css/react-datetime.css";
import './App.css';
import compareLists from "./common/compareList.js";
import EventsFilter from './components/EventsFilter';
import EventsTables from './components/EventsTables';
import logo from './presto-park.jpg';

class App extends Component{
  constructor(){
    super();
    this.state = { 
      eventsListsByProvider: {},
      eventsFilter: {
        dateGte: moment().subtract(1, 'hours')
      }
    };
    window.localStorage.clear();
  }

  componentDidMount() {
    // this.searchEvents();
  }

  setDateGte(dateGte) {
    this.setState( (prevState) => ({
      eventsFilter: {
        ...prevState.eventsFilter,
        dateGte: dateGte
      }
    }));
  }
  setDateLte(dateLte) {
    this.setState( (prevState) => ({
      eventsFilter: {
        ...prevState.eventsFilter,
        dateLte: dateLte
      }
    }));
  }
  setPlate(event) {
    this.setState((prevState) => ({
      eventsFilter: {
        ...prevState.eventsFilter,
        plate: event.target.value
      }
    }));
  }

  updateEventStatus = (provider, eventIndex, event) => {
    const status = event.target.value;
    const eventsListsByProvider = this.state.eventsListsByProvider;
    const id = eventsListsByProvider[provider][eventIndex]._id;
    eventsListsByProvider[provider][eventIndex].status = status;
    this.setState({eventsListsByProvider});
    this.updateEvent(id, {status});
  }

  updateEventCauseOfError = (provider, eventIndex, causeOfError) => {
    const eventsListsByProvider = this.state.eventsListsByProvider;
    const id = eventsListsByProvider[provider][eventIndex]._id;
    eventsListsByProvider[provider][eventIndex].causeOfError = causeOfError;
    this.setState({eventsListsByProvider})
    this.updateEvent(id, {causeOfError});
    // console.log('updateEvautCauseOfError', eventsListsByProvider[provider][eventIndex], text)
  }

  async searchEvents(){
    this.setState({
      isLoading: true
    })
    const dateGte = this.state.eventsFilter.dateGte;
    const dateLte = this.state.eventsFilter.dateLte;
    const plate = this.state.eventsFilter.plate;
    const filters = {
      ...(dateGte && { startISODate: moment(dateGte).toISOString() }),
      ...(dateLte && { endISODate: moment(dateLte).toISOString() }),
      ...(plate && { plate })
    };
    const host = process.env.REACT_APP_HOST;
      
    const eventsListsByProvider = {};
    
    const result = await axios.get(host, {
      params:{
        ...filters, 
        cameraIds: [process.env.REACT_APP_CAMERA_1_ID, process.env.REACT_APP_CAMERA_2_ID]
      }
    });
    const events = result?.data;
    const eventsCamera1 = events.filter( event => event.iemCameraId === process.env.REACT_APP_CAMERA_1_ID )
    const eventsCamera2 = events.filter( event => event.iemCameraId === process.env.REACT_APP_CAMERA_2_ID )
    const [eventsList1, eventsList2] = compareLists(eventsCamera1, eventsCamera2);
    eventsListsByProvider[`HIK (${process.env.REACT_APP_CAMERA_1_ID})`] = eventsList1
    eventsListsByProvider[`HIK (${process.env.REACT_APP_CAMERA_2_ID})`] = eventsList2
    this.setState({ 
      eventsListsByProvider: eventsListsByProvider,
      isLoading: false
    });
  }

  async updateEvent(id, fields){
    const url = `${process.env.REACT_APP_HOST}/${id}`;
    return await axios.patch(url, fields);
  }

  render(){
    return(
      <Protect
        sha512={process.env.REACT_APP_PASS}
      >
        <div className="App">
        {/* <MyComponent title="React" /> */}
          <div className="container">
            <div className="title">
            <h1>ANPR Benchmark by</h1>
            <img src={logo} className="App-logo" alt="logo" />
            <p>Ver. {process.env.REACT_APP_VERSION}</p>
            </div>
            <EventsFilter 
              values = {{dateGte: this.state.eventsFilter.dateGte, dateLte: this.state.eventsFilter.dateLte}}
              setDateGte={this.setDateGte.bind(this)} 
              setDateLte={this.setDateLte.bind(this)}
              setPlate={this.setPlate.bind(this)}
              validate={this.searchEvents.bind(this)}
            />
            { !!this.state.isLoading && 
              <CircularProgress style={{color: '#082851'}} />
            }
            { !this.state.isLoading && !!this.state.eventsListsByProvider &&
              <EventsTables
                eventsListsByProvider={this.state.eventsListsByProvider} 
                updateEventStatus={this.updateEventStatus}
                updateEventCauseOfError={this.updateEventCauseOfError}
              />
            }
          </div>
        </div>
      </Protect>
    )
  }
}

export default App;
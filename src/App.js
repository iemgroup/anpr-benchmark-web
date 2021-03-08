import React, {Component} from 'react';
import logo from './presto-park.jpg';
import './App.css';

import _ from 'lodash';
import axios from 'axios';
import moment from 'moment';
import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";

import Button from '@material-ui/core/Button';
import "moment/locale/fr";



function compareLists(list1, list2){
  // - trier les deux listes par timestamp
  const sortedList1 = list1.sort((a, b) => a.timestamp - b.timestamp);
  const sortedList2 = list2.sort((a, b) => a.timestamp - b.timestamp);
  let currEvent1, currEvent2;
  // - parcourir les deux listes sequentiellement
  for (let i = 0; i < sortedList1.length && i < sortedList2.length; i++) {
    currEvent1 = sortedList1[i];
    currEvent2 = sortedList2[i];
    // - si plate1 = plate2 continuer
    if (currEvent1.plate === currEvent2.plate){
      currEvent1.status = currEvent2.status = 'maybe';
      continue;
    }
    // - sinon chercher dans list2 en haut et en bas +- 10 plaques jusqu à trouver la plate1 dans list2
    currEvent1.status = currEvent2.status = 'unknown';
    let plateFound = false;
    // recherche vers le haut
    let j = i-1;
    while(!plateFound && j >= 0 && i - j < 10 && sortedList2[j]?.status !== 'maybe'){
      // - si trouvé, décaller plate2 au même niveau que plate1
      if(sortedList1[i].plate === sortedList2[j].plate){
        plateFound = true;
        currEvent1.status = sortedList2[j].status = 'maybe';
        sortedList2.splice(j, 0, ...( new Array(i-j).fill({}) ))
      } 
      j--;
    }
    // recherche vers le bas
    j = i+1;
    while(!plateFound && j < sortedList2.length && j - i < 10 && sortedList2[j]?.status !== 'maybe'){
      // - si trouvé, décaller plate1 au même niveau que plate2
      if(sortedList1[i].plate === sortedList2[j].plate){
        plateFound = true;
        currEvent1.status = sortedList2[j].status = 'maybe';
        sortedList1.splice(i, 0, ...( new Array(j-i).fill({}) ))
      } 
      j++;
    }
  }
  return [sortedList1, sortedList2];
}

class EventsFilter extends Component{

  render(){
    return(
      <div className="filter">
        <div>
          <label>Date début</label>
          <Datetime 
            locale="fr"
            value={this.props.values.dateGte}
            onChange={this.props.setDateGte} 
          />
        </div>
        <div>
          <label>Date fin</label>
          <Datetime 
            locale="fr"
            value={this.props.values.dateLte}
            onChange={this.props.setDateLte} 
          />
        </div>
        <div>
          <label>Plaque</label>
          <input 
            placeholder="Plate..."
            onChange={this.props.setPlate} 
          />
        </div>
        <Button variant="contained" color="primary" onClick={this.props.validate}>Recherche</Button>
      </div>
    );
  }
}

class App extends Component{
  constructor(){
    super();
    this.state = { 
      eventsLists: [],
      eventsFilter: {
        dateGte: moment().subtract(7, 'days').startOf('day')
      }
    };
  }

  componentDidMount() {
    // this.searchEvents();
  }

  // const tableaux = [
  //   {
  //     provider: 'Axis',
  //     route: 'http://localhost:3020/v1/events'
  //   },
  //   {
  //     provider: 'Axis',

  //   }
  // ]

  setDateGte(dateGte) {
    this.setState({
      eventsFilter: {
        dateGte: dateGte
      }
    });
  }
  setDateLte(dateLte) {
    this.setState({
      eventsFilter: {
        dateLte: dateLte
      }
    });
  }
  setPlate(event) {
    this.setState({
      eventsFilter: {
        plate: event.target.value
      }
    });
  }
  
  async searchEvents(){
    const dateGte = this.state.eventsFilter.dateGte;
    const dateLte = this.state.eventsFilter.dateLte;
    const plate = this.state.eventsFilter.plate;
    const params = {
      ...(dateGte && { dateGte: moment(dateGte).toISOString() }),
      ...(dateLte && { dateLte: moment(dateLte).toISOString() }),
      ...(plate && { plate })
    };
    const host = process.env.REACT_APP_HOST;
    const events1 = await axios.get(host, {params});
    const filteredEvents1 = events1?.data.filter((event) => event.carState === 'new');
    const events2 = await axios.get(host, {params});
    // const events2 = await response2.json();
    const filteredEvents2 = events2?.data.filter((event) => event.carState === 'new');
    filteredEvents2.unshift({plate: 'BIDON'});
    filteredEvents1.splice(10, 0, {plate: 'FOO'}, {plate: 'RE-BIDON'});
    filteredEvents2.splice(4, 2, {plate: 'BAR'});
    const sortedEventsLists = compareLists(filteredEvents1, filteredEvents2);
    this.setState({ eventsLists: sortedEventsLists });
    console.log('events', {sortedEventsLists});
  }

  render(){
    return(
      <div className="App">
       {/* <MyComponent title="React" /> */}
        <div className="container">
          <div className="title">
          <h1>ANPR Benchmark by</h1>
          <img src={logo} className="App-logo" alt="logo" />
          </div>
          <EventsFilter 
            values = {{dateGte: this.state.eventsFilter.dateGte, dateLte: this.state.eventsFilter.dateLte}}
            setDateGte={this.setDateGte.bind(this)} 
            setDateLte={this.setDateLte.bind(this)}
            setPlate={this.setPlate.bind(this)}
            validate={this.searchEvents.bind(this)}
          />
          <div className="tables"> 
          <table>
            <tr>
            {
              this.state.eventsLists.map((events, index)=>{
                return (
                  <td style={{verticalAlign: "baseline"}}>
                    <table className="events-table">
                      <thead>
                        <tr>
                          <th colSpan="11">{"Axis " + (Number(index) + 1)}</th>
                        </tr>
                        <tr>
                          <th>Timestamp</th>
                          <th>Plaque</th>
                          <th>Confiance</th>
                          <th>Franchissement</th>
                          <th>Direction</th>
                          <th>Type</th>
                          <th>Marque</th>
                          <th>Couleur</th>
                          <th>Pays</th>
                          <th>Photo</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>  
                        {
                          events.map(( event, index ) => {
                          return (
                            <tr key={index}>
                              <td>{event.captureDatetime || '-'}</td>
                              <td>{event.plate || '-'}</td>
                              <td>{event.plateConfidence || '-'}</td>
                              <td>{event.crossing || '-'}</td>
                              <td>{event.carMoveDirection || '-'}</td>
                              <td>{event.vehicleType || '-'}</td>
                              <td>{event.brand || '-'}</td>
                              <td>{event.color || '-'}</td>
                              <td>{event.plateCountry || '-'}</td>
                              <td><a href={event.imagesURI}>{event.imagesURI ? 'lien' : '-'}</a></td>
                              {event.status === 'maybe'
                                ? <td className="green">Probable</td>
                                : <td className="red">Inconnu</td>
                              }
                            </tr>
                          );
                        })
                        }
                      </tbody>
                    </table>
                  </td>
                )
              })
            }
            </tr>
          </table>
          </div>
        </div>
      </div>
    )
  }
}

export default App;

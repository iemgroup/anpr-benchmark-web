import React, {Component} from 'react';
import logo from './presto-park.jpg';
import './App.css';

import _ from 'lodash';
import axios from 'axios';
import moment from 'moment';
import "moment/locale/fr"; 
import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";

import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import { CSVLink, CSVDownload } from "react-csv";
import MaterialTable from 'material-table'
import ReactHTMLTableToExcel from 'react-html-table-to-excel';



function compareLists(list1, list2){
  // sort both lists by timestamp
  const sortedList1 = list1.sort((a, b) => a.timestamp - b.timestamp);
  const sortedList2 = list2.sort((a, b) => a.timestamp - b.timestamp);
  let currEvent1, currEvent2;
  // browse the two lists sequentially
  for (let i = 0; i < sortedList1.length && i < sortedList2.length; i++) {
    currEvent1 = sortedList1[i];
    currEvent2 = sortedList2[i];
    if (currEvent1.plate === currEvent2.plate){
      currEvent1.status = currEvent2.status = 'maybe';
      continue;
    }
    // otherwise search in list2 up and down + - 10 plates to find plate1 in list2
    currEvent1.status = currEvent2.status = 'unknown';
    let plateFound = false;
    // search up
    let j = i-1;
    while(!plateFound && j >= 0 && i - j < 10 && sortedList2[j]?.status !== 'maybe'){
      // - if found, shift plate2 to the same level as plate1
      if(sortedList1[i].plate === sortedList2[j].plate){
        plateFound = true;
        currEvent1.status = sortedList2[j].status = 'maybe';
        sortedList2.splice(j, 0, ...( new Array(i-j).fill({status: 'unknown'}) ))
      } 
      j--;
    }
    // search down
    j = i+1;
    while(!plateFound && j < sortedList2.length && j - i < 10 && sortedList2[j]?.status !== 'maybe'){
      // if found, shift plate1 to the same level as plate2
      if(sortedList1[i].plate === sortedList2[j].plate){
        plateFound = true;
        currEvent1.status = sortedList2[j].status = 'maybe';
        sortedList1.splice(i, 0, ...( new Array(j-i).fill({status: 'unknown'}) ))
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
            placeholder="Ex:GE1234ABCD"
            onChange={this.props.setPlate} 
          />
        </div>
        <Button variant="contained" onClick={this.props.validate} style={{color: 'white', backgroundColor: '#082851'}}>Recherche</Button>
      </div>
    );
  }
}

class EventsTables extends Component{

  successRatio(list){
    const nbFail = list.filter(e => e.status === 'unknown').length;
    return list.length && 'Succès: '+Number( ((list.length - nbFail) / list.length ) * 100).toFixed(1) + '%' || '-';
  }

//   exportCSV(lists){
//     // data = [
// //   ["firstname", "lastname", "email"],
// //   ["Ahmed", "Tomi", "ah@smthing.co.com"],
// //   ["Raed", "Labes", "rl@smthing.co.com"],
// //   ["Yezzi", "Min l3b", "ymin@cocococo.com"]
// // ];
//     const headers = ["Timestamp","Plaque","Confiance","Franchissement","Direction","Type","Marque","Couleur","Pays","Photo","Statut"];
//     const data = [
//       [...headers, '', ...headers]
//     ];
//     lists.forEach((list, i)=>{
      
//     });
//   }

  render(){
    return(
      <div className="tables"> 
          <ReactHTMLTableToExcel
        id="test-table-xls-button"
        className="download-table-xls-button"
        table="benchmark-table"
        filename="comparatif-anpr"
        sheet="comparatif ANPR"
        buttonText="Export Excel"
      />
          {/* <div><CSVLink data={csvData}>Download me</CSVLink>;</div> */}
          <table id="benchmark-table">
            <tr>
            {
              Object.keys(this.props.eventsListsByProvider).map((provider, index)=>{
                const events = this.props.eventsListsByProvider[provider];
                return (
                  <td style={{verticalAlign: "baseline"}}>
                    <table className="events-table">
                      <thead>
                        <tr>
                          <th colSpan="10">{provider}</th>
                          <th style={{color: 'green'}}>{this.successRatio(events)}</th>
                        </tr>
                        <tr>
                          <th>Date</th>
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
                              <td>{ moment(event.captureDatetime).format('DD-MM-YYYY HH:mm:ss') || '-'}</td>
                              <td>{event.plate || '-'}</td>
                              <td>{ (event.plateConfidence && Number(event.plateConfidence).toFixed(2)) || '-'}</td>
                              <td>{event.crossing || '-'}</td>
                              <td>{event.carMoveDirection || '-'}</td>
                              <td>{event.carType || '-'}</td>
                              <td>{event.brand || '-'}</td>
                              <td>{event.color || '-'}</td>
                              <td>{event.plateCountry || '-'}</td>
                              <td><a href={event.imagesURI} target="_blank">{event.imagesURI ? 'lien' : '-'}</a></td>
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
    );
  }
}

class App extends Component{
  constructor(){
    super();
    this.state = { 
      eventsListsByProvider: {},
      eventsFilter: {
        dateGte: moment().subtract(1, 'hours')
      }
    };
  }

  componentDidMount() {
    // this.searchEvents();
  }

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
    const providers = ['Axis','Hik'];
    this.setState({
      isLoading: true
    })
    const dateGte = this.state.eventsFilter.dateGte;
    const dateLte = this.state.eventsFilter.dateLte;
    const plate = this.state.eventsFilter.plate;
    const filters = {
      ...(dateGte && { dateGte: moment(dateGte).toISOString() }),
      ...(dateLte && { dateLte: moment(dateLte).toISOString() }),
      ...(plate && { plate })
    };
    const host = process.env.REACT_APP_HOST;
    // providers.forEach((provider)=>{
      //   filters.provider = provider;
      //   eventsListsByProvider[provider].events = await axios.get(host, {filters})
      // });
      
    const eventsListsByProvider = {};
    
    const result1 = await axios.get(host, {
      params:{
        ...filters, 
        provider: providers[0] 
      }
    });
    const events1 = result1?.data;
    const result2 = await axios.get(host, { 
      params:{
        ...filters, 
        provider: providers[1] 
      }
    });
    // const events2 = await response2.json();
    const events2 = result2?.data;
    const [eventsList1, eventsList2] = compareLists(events1, events2);
    eventsListsByProvider[providers[0]] = eventsList1
    eventsListsByProvider[providers[1]] = eventsList2
    this.setState({ 
      eventsListsByProvider: eventsListsByProvider,
      isLoading: false
    });
  }

  render(){
    return(
      <div className="App">
       {/* <MyComponent title="React" /> */}
        <div className="container">
          <div className="title">
          <h1>ANPR Benchmark by</h1>
          <img src={logo} className="App-logo" alt="logo" />
          <p>Ver. {process.env.npm_package_version}</p>
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
            <EventsTables eventsListsByProvider={this.state.eventsListsByProvider} />
          }
        </div>
      </div>
    )
  }
}

export default App;

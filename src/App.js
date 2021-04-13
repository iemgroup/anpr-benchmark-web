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
import MaterialTable from 'material-table'
import ReactHTMLTableToExcel from 'react-html-table-to-excel';




function compareLists(list1, list2){
  // sort both lists by timestamp
  const sortedList1 = list1.sort((a, b) => a.timestamp - b.timestamp);
  const sortedList2 = list2.sort((a, b) => a.timestamp - b.timestamp);
  let currEvent1, currEvent2, diffSeconds, i = 0, j = 0;
  const timePeriodSeconds = 60;
  // ======================
  // pads the top of the lists to align leading value by time if the gap is too large
  
  while( i < sortedList1.length
      && j < sortedList2.length){
    diffSeconds = moment(sortedList1[i]?.captureDatetime).diff(moment(sortedList2[j]?.captureDatetime), 'seconds');
    if(Math.abs(diffSeconds) <= timePeriodSeconds) break;
    // list 1's date > list 2's date
    if(diffSeconds > 0){
      sortedList1.splice(i, 0, ...( new Array(1).fill({status: 'unknown'}) ))
    }
    // list 1's date < list 2's date
    else{
      sortedList2.splice(j, 0, ...( new Array(1).fill({status: 'unknown'}) ))
    }
    i++;
    j++;
    // diffSeconds = moment(sortedList1[i]?.captureDatetime).diff(moment(sortedList2[j]?.captureDatetime), 'seconds');
  }
  // ======================
  // browse the two lists sequentially and check plates correspondance within time period
  for (; i < sortedList1.length && i < sortedList2.length; i++) {
    currEvent1 = sortedList1[i];
    currEvent2 = sortedList2[i];
    if (currEvent1.plate === currEvent2.plate){
      currEvent1.status = currEvent2.status = 'maybe';
      continue;
    }
    // otherwise search in list2 up and down + - 10 plates to find plate1 in list2
    currEvent1.status = currEvent2.status = 'unknown';
    let plateFound = false;
    // -----------------------
    // search up
    j = i-1;
    diffSeconds = moment(sortedList1[i]?.captureDatetime).diff(moment(sortedList2[j]?.captureDatetime), 'seconds');
    while(!plateFound 
        && j >= 0 
        &&  diffSeconds < timePeriodSeconds
        && sortedList2[j]?.status !== 'maybe'){
      // - if found, shift plate2 to the same level as plate1
      if(sortedList1[i].plate === sortedList2[j].plate){
        plateFound = true;
        currEvent1.status = sortedList2[j].status = 'maybe';
        sortedList2.splice(j, 0, ...( new Array(i-j).fill({status: 'unknown'}) ));
      } 
      j--;
      diffSeconds = moment(sortedList1[i]?.captureDatetime).diff(moment(sortedList2[j]?.captureDatetime), 'seconds')
    }
    // -----------------------
    // search down
    j = i+1;
    diffSeconds = moment(sortedList2[j]?.captureDatetime).diff(moment(sortedList1[i]?.captureDatetime), 'seconds');
    while(!plateFound 
        && j < sortedList2.length 
        && diffSeconds < timePeriodSeconds 
        && sortedList2[j]?.status !== 'maybe'){
      // if found, shift plate1 to the same level as plate2
      if(sortedList1[i].plate === sortedList2[j].plate){
        plateFound = true;
        currEvent1.status = sortedList2[j].status = 'maybe';
        sortedList1.splice(i, 0, ...( new Array(j-i).fill({status: 'unknown'}) ));
      } 
      j++;
      diffSeconds = moment(sortedList2[j]?.captureDatetime).diff(moment(sortedList1[i]?.captureDatetime), 'seconds');
    }
    // -----------------------
  }
  // ======================
  // pads the two lists to get same length at the end
  while(sortedList1.length > sortedList2.length) sortedList2.push({status: 'unknown'});
  while(sortedList1.length < sortedList2.length) sortedList1.push({status: 'unknown'});
  
  
  return [sortedList1, sortedList2];
}

class EventsFilter extends Component{

  render(){
    return(
      <div className="filter">
        <div>
          <label>Start date</label>
          <Datetime 
            locale="fr"
            value={this.props.values.dateGte}
            onChange={this.props.setDateGte} 
          />
        </div>
        <div>
          <label>End date</label>
          <Datetime 
            locale="fr"
            value={this.props.values.dateLte}
            onChange={this.props.setDateLte} 
          />
        </div>
        <div>
          <label>Plate</label>
          <input 
            placeholder="Ex:GE1234ABCD"
            onChange={this.props.setPlate} 
          />
        </div>
        <Button variant="contained" onClick={this.props.validate} style={{color: 'white', backgroundColor: '#082851'}}>Search</Button>
      </div>
    );
  }
}

class EditableCell extends Component{
  constructor(props){
    super(props);
    this.state = {
      cause: ''
    }
  }
  onFocusIn (event) {
    if (event.target.matches('[contenteditable]')) {
      var editable = event.target
      // enter edit mode
      // editable.classList.add("editing")
      // get text
      var text = editable.innerText
      // create input
      var input = document.createElement("input");
      input.type = "text";
      input.className = "editable-mirror";
      input.setAttribute("list", "causes");
      input.value = text;
      console.log('input', input)
      console.log('editable', editable)
  
      editable.appendChild(input);
  
      input.addEventListener('focusout', (event2)=>{
        if (event2.target.matches('.editable-mirror')) {
          // leave edit mode
          // editable.classList.remove("editing")
          var text = input.value;
          editable.innerHTML = text;
          // destroy input
          input.remove();
          // apply value
        }
      });
      
      input.focus();
    }
  }


  render(){
    return(
      <span contentEditable onFocus={this.onFocusIn.bind(this)} ></span>
    );
  }
}

class EventsTables extends Component{
  constructor(props){
    super(props);
    this.state = {
      causes : [
          "Pas une plaque",
          "Mauvais éclairage",
        ]
    }
  }
  selectCallback = (cause) => {
    // return this.setState({ ...cause })
  }
  successRatio(list){
    const nbFail = list.filter(e => e.status !== 'maybe').length;
    return list.length && 'Success: '+Number( ((list.length - nbFail) / list.length ) * 100).toFixed(1) + '%' || '-';
  }

  render(){
    return(
      <div className="tables"> 
        {
          !!Object.keys(this.props.eventsListsByProvider).length && 
          <ReactHTMLTableToExcel
          id="test-table-xls-button"
          className="download-table-xls-button"
          table="benchmark-table"
          filename="comparatif-anpr"
          sheet="comparatif ANPR"
          buttonText="Export Excel"
          />
        }
          {/* <div><CSVLink data={csvData}>Download me</CSVLink>;</div> */}
          <table id="benchmark-table">
          <tbody> 
            <tr>
            {
              Object.keys(this.props.eventsListsByProvider).map((provider, index)=>{
                const events = this.props.eventsListsByProvider[provider];
                return (
                  <td style={{verticalAlign: "baseline"}}>
                    <table className="events-table">
                      <thead>
                        <tr>
                          <th colSpan="8">{provider}</th>
                          <th style={{color: 'green'}}>{this.successRatio(events)}</th>
                        </tr>
                        <tr>
                          <th className="nowrap">Date</th>
                          <th className="nowrap">Record date</th>
                          <th className="nowrap">Plate</th>
                          <th className="nowrap">Trust</th>
                          {/* <th className="nowrap">Franchissement</th> */}
                          <th className="nowrap">Direction</th>
                          {/* <th className="nowrap">Type</th> */}
                          {/* <th className="nowrap">Marque</th> */}
                          {/* <th className="nowrap">Couleur</th> */}
                          <th className="nowrap">Country</th>
                          <th className="nowrap">Photo</th>
                          <th className="nowrap">Cause of error</th>
                          <th className="nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody>  
                        {
                          events.map(( event, index ) => {
                          return (
                            <tr key={index}>
                              <td className="nowrap">{ ( !!event.captureDatetime && moment(event.captureDatetime).format('DD-MM-YYYY HH:mm:ss') ) || '-'}</td>
                              <td className="nowrap">{ (!!event.recordDatetime && moment(event.recordDatetime).format('DD-MM-YYYY HH:mm:ss') ) || '-'}</td>
                              <td className="nowrap">{event.plate || '-'}</td>
                              <td className="nowrap">{ (event.plateConfidence && Number(event.plateConfidence).toFixed(2)) || '-'}</td>
                              {/* <td className="nowrap">{event.crossing || '-'}</td> */}
                              <td className="nowrap">{event.carMoveDirection || '-'}</td>
                              {/* <td className="nowrap">{event.carType || '-'}</td> */}
                              {/* <td className="nowrap">{event.brand || '-'}</td> */}
                              {/* <td className="nowrap">{event.color || '-'}</td> */}
                              <td className="nowrap">{event.plateCountry || '-'}</td>
                              <td className="nowrap"><a href={event.imagesURI} target="_blank">{event.imagesURI ? 'lien' : '-'}</a></td>
                              <td className="nowrap">
                              <EditableCell />
                              </td>
                              {event.status === 'maybe'
                                ? <td className="green nowrap">Likely</td>
                                : <td className="red nowrap">Unknown</td>
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
          </tbody>
          </table>
          <datalist id="causes">
            {this.state.causes.map((cause, key) =>
            <option key={key} value={cause} />
            )}
          </datalist>
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
            <EventsTables eventsListsByProvider={this.state.eventsListsByProvider} />
          }
        </div>
      </div>
    )
  }
}

export default App;

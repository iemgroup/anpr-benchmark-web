import React, {Component} from 'react';
import logo from './presto-park.jpg';
import './App.css';

import _ from 'lodash';
import axios from 'axios';
import moment from 'moment';
import "moment/locale/fr"; 
import Datetime from 'react-datetime';
import Protect from 'react-app-protect'
import 'react-app-protect/dist/index.css'
import "react-datetime/css/react-datetime.css";

import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import MaterialTable from 'material-table'
import ReactHTMLTableToExcel from 'react-html-table-to-excel';


const statusParams = {
  correct: {color: '#0f6600', label: 'Correct'},
  maybe: {color: '#49a800', label: 'Likely'},
  unknown: {color: '#ab8900', label: 'Unknown'},
  wrong: {color: '#ba170b', label: 'Wrong'},
  ignore: {color: '#808080', label: 'Ignore'}
}

function alignInTime(list1, list2, index=0, timePeriodSeconds){
  let diffSeconds;
  while( index < list1.length
      && index < list2.length){
    diffSeconds = moment(list1[index]?.captureDatetime).diff(moment(list2[index]?.captureDatetime), 'seconds');
    if(Math.abs(diffSeconds) <= timePeriodSeconds) break;
    // list 1's date > list 2's date
    if(diffSeconds > 0){
      list1.splice(index, 0, ...( new Array(1).fill({status: 'unknown'}) ))
    }
    // list 1's date < list 2's date
    else{
      list2.splice(index, 0, ...( new Array(1).fill({status: 'unknown'}) ))
    }
    index++;
  }
  return index;
}

function compareLists(list1, list2){
  // sort both lists by timestamp
  const sortedList1 = list1.sort((a, b) => a.timestamp - b.timestamp);
  const sortedList2 = list2.sort((a, b) => a.timestamp - b.timestamp);
  let currEvent1, currEvent2, diffSeconds, i = 0, j = 0;
  const timePeriodSeconds = 60;
  // ======================
  // browse the two lists sequentially and check plates correspondance within time period
  for (; i < sortedList1.length && i < sortedList2.length; i++) {
    // pads the top of the lists to align leading value by time if the gap is too large
    i = alignInTime(sortedList1, sortedList2, i, timePeriodSeconds);
    currEvent1 = sortedList1[i];
    currEvent2 = sortedList2[i];
    if ( currEvent1.plate === currEvent2.plate ){
      currEvent1.status = currEvent1.status || 'maybe';
      currEvent2.status = currEvent2.status || 'maybe';
      // currEvent1.status = currEvent2.status = 'maybe';
      continue;
    }
    let plateFound = false;
    // -----------------------
    // search up
    j = i-1;
    diffSeconds = moment(sortedList1[i]?.captureDatetime).diff(moment(sortedList2[j]?.captureDatetime), 'seconds');
    while(!plateFound 
        && j >= 0 
        &&  diffSeconds < timePeriodSeconds
        // && sortedList2[j]?.status !== 'maybe'){
      ){
      // - if found, shift plate2 to the same level as plate1
      if(sortedList1[i].plate === sortedList2[j].plate){
        plateFound = true;
        // currEvent1.status = sortedList2[j].status = 'maybe';
        currEvent1.status = currEvent1.status || 'maybe';
        sortedList2[j].status = sortedList2[j].status || 'maybe';
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
        // && sortedList2[j]?.status !== 'maybe'){
      ){
      // if found, shift plate1 to the same level as plate2
      if(sortedList1[i].plate === sortedList2[j].plate){
        plateFound = true;
        // currEvent1.status = sortedList2[j].status = 'maybe';
        currEvent1.status = currEvent1.status || 'maybe';
        sortedList2[j].status = sortedList2[j].status || 'maybe';
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
  
      editable.appendChild(input);
  
      input.addEventListener('focusout', (event2)=>{
        if (event2.target.matches('.editable-mirror')) {
          // console.log('focus out!')
          // leave edit mode
          // editable.classList.remove("editing")
          var text = input.value;
          editable.innerHTML = text;
          // destroy input
          input.remove();
          // apply value
          this.props.onFocusOut(text);
        }
      });
      
      input.focus();
    }
  }


  render(){
    return(
      <span contentEditable 
        onFocus={this.onFocusIn.bind(this)} 
        suppressContentEditableWarning={true}
      >{this.props.value || ''}</span>
    );
  }
}

class EventsTables extends Component{
  constructor(props){
    super(props);
    this.state = {
      causes : [
        "Pas de plaque",
        "Plaque illisible",
        "Plaque truquée",
        "Plaque masquée",
        "Doublon",
        "Autre"
        ]
    }
  }
  selectCallback = (cause) => {
    // return this.setState({ ...cause })
  }
  successRatio(list){
    const nbFail = list.filter(e => e.status !== 'maybe' && e.status !== 'correct' && e.status !== 'ignore').length;
    const listLength = list.filter(e => e.status !== 'ignore').length;
    return listLength && 'Success: '+Number( ((listLength - nbFail) / listLength ) * 100).toFixed(1) + '%' || '-';
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
              Object.keys(this.props.eventsListsByProvider).map((provider)=>{
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
                          <th className="nowrap">Date</th>
                          <th className="nowrap">Record date</th>
                          <th className="nowrap">Plate</th>
                          <th className="nowrap">Trust</th>
                          <th className="nowrap">Franic Plate</th>
                          <th className="nowrap">Franic Trust</th>
                          {/* <th className="nowrap">Franchissement</th> */}
                          <th className="nowrap">Direction</th>
                          {/* <th className="nowrap">Type</th> */}
                          {/* <th className="nowrap">Marque</th> */}
                          {/* <th className="nowrap">Couleur</th> */}
                          <th className="nowrap">Country</th>
                          <th className="nowrap">Photo</th>
                          <th className="nowrap">Cause of error</th>
                          <th className="nowrap">Status</th>
                          {/* <th className="nowrap">Save</th> */}
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
                              <td className="nowrap">{ ( event.plateConfidence && Number(event.plateConfidence).toFixed(2) + ' %' ) || '-'}</td>
                              <td className={`${event.plate !== event.franicPlate?.Value ? "red": ""} nowrap`}>{event.franicPlate?.Value || '-'}</td>
                              <td className="nowrap">{ ( event.franicPlate?.Confidence && Number( Number(event.franicPlate?.Confidence)*100 ).toFixed(2) + ' %' )|| '-'}</td>
                              {/* <td className="nowrap">{event.crossing || '-'}</td> */}
                              <td className="nowrap">{event.carMoveDirection || '-'}</td>
                              {/* <td className="nowrap">{event.carType || '-'}</td> */}
                              {/* <td className="nowrap">{event.brand || '-'}</td> */}
                              {/* <td className="nowrap">{event.color || '-'}</td> */}
                              <td className="nowrap">{event.plateCountry || '-'}</td>
                              <td className="nowrap"><a href={event.imagesURI} target="_blank">{event.imagesURI ? 'lien' : '-'}</a></td>
                              {event._id
                                ? <td className="nowrap">
                                  <EditableCell 
                                  value={event.causeOfError} 
                                  onFocusOut={(text)=>this.props.updateEventCauseOfError(provider, index, text)}
                                  />
                                </td>
                                : <td className="nowrap">-</td>
                              }
                              {event._id
                                ? <td className="nowrap">
                                    <Select
                                      value={event.status || 'unknown'} 
                                      onChange={(e)=>this.props.updateEventStatus(provider, index, e)}
                                      style={{color: statusParams[event.status]?.color, width:'100%'}}
                                    >
                                      {
                                        Object.keys(statusParams).map((status)=>{
                                          return <MenuItem value={status} style={{color:statusParams[status].color}}>{statusParams[status].label}</MenuItem>
                                        })
                                      }
                                    </Select>
                                  </td>
                                : <td className="nowrap">-</td>
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

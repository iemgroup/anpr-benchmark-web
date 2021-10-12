import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { saveAs } from 'file-saver';
import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import EditableCell from './EditableCell';
import ExportButton from './ExportButton';

const statusParams = {
  correct: {color: '#0f6600', label: 'Correct'},
  maybe: {color: '#49a800', label: 'Likely', static: true},
  unknown: {color: '#ab8900', label: 'Unknown', static: true},
  wrong: {color: '#ba170b', label: 'Wrong'},
  ignore: {color: '#808080', label: 'Ignore'}
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
        ],
      isExportReady: false
    }
  }
  selectCallback = (cause) => {
    // return this.setState({ ...cause })
  }

  handleExport = () => {
    this.setState({
        isExportReady: true
    }, ()=> {
      const table = document.querySelector('#benchmark-table');
      var blob = new Blob([table.outerHTML], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=iso-8859-1"
      });  
      saveAs(blob, "comparatif-anpr.xls");
      this.setState({
        isExportReady: false
    });
  });
    
  }

  successRatio(list){
    const nbFail = list.filter(e => e.status !== 'maybe' && e.status !== 'correct' && e.status !== 'ignore').length;
    const listLength = list.filter(e => e.status !== 'ignore').length;
    return listLength && 'Success: '+Number( ((listLength - nbFail) / listLength ) * 100).toFixed(1) + '%' || '-';
  }

  isCarEnteringOrLeaving = (isCarEnteringParking) => {
    if(isCarEnteringParking !== undefined && isCarEnteringParking !== null){
      return isCarEnteringParking ? 'Entering' : 'Leaving';
    }
    return '-'
  }

  render(){
    return(
      <div className="tables"> 
        {
          !!Object.keys(this.props.eventsListsByProvider).length && 
          <ExportButton isExportReady={this.state.isExportReady} handleClick={this.handleExport} />
        }
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
                          <th colSpan="13">{provider}</th>
                          <th style={{color: 'green'}}>{events.length && this.successRatio(events)}</th>
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
                          <th className="nowrap">Type</th>
                          <th className="nowrap">Brand</th>
                          <th className="nowrap">Color</th>
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
                          const ocrConfirmation = event.ocrConfirmation;
                          return (
                            <tr key={index}>
                              <td className="nowrap">{ ( !!event.captureISODate && moment(event.captureISODate).format('DD-MM-YYYY HH:mm:ss') ) || '-'}</td>
                              <td className="nowrap">{ (!!event.creationISODate && moment(event.creationISODate).format('DD-MM-YYYY HH:mm:ss') ) || '-'}</td>
                              <td className="nowrap">{event.plate || '-'}</td>
                              <td className="nowrap">{ ( event.plateConfidence && Number(event.plateConfidence).toFixed(2) + ' %' ) || '-'}</td>
                              <td className={`${event.plate !== ocrConfirmation?.plate ? "red": ""} nowrap`}>{ocrConfirmation?.plate || '-'}</td>
                              <td className="nowrap">{ ( ocrConfirmation?.confidence && Number( Number(ocrConfirmation?.confidence)*100 ).toFixed(2) + ' %' )|| '-'}</td>
                              {/* <td className="nowrap">{event.crossing || '-'}</td> */}
                              <td className="nowrap">{ this.isCarEnteringOrLeaving(event.isCarEnteringParking) }</td>
                              <td className="nowrap">{event.carType || '-'}</td>
                              <td className="nowrap">{event.carBrand || '-'}</td>
                              <td className="nowrap">{event.carColor || '-'}</td>
                              <td className="nowrap">{event.plateCountry || '-'}</td>
                              <td className="nowrap"><a href={_.get(event, 'images[0].uri')} target="_blank">{_.get(event, 'images[0].uri') ? 'link' : '-'}</a></td>
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


                                {this.state.isExportReady
                                  ? statusParams[event.status]?.label
                                  : <Select
                                      value={event.status || 'unknown'} 
                                      onChange={(e)=>this.props.updateEventStatus(provider, index, e)}
                                      style={{color: statusParams[event.status]?.color || statusParams.unknown.color, width:'100%'}}
                                    >
                                      {
                                        Object.keys(statusParams).map((status)=>{
                                          return <MenuItem disabled={ statusParams[status].static === true } value={status} style={{color:statusParams[status].color}}>{statusParams[status].label}</MenuItem>
                                        })
                                      }
                                    </Select>
                                 }
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

export default EventsTables;
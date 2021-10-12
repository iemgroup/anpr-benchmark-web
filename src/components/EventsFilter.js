import { Button } from "@material-ui/core";
import { Component } from "react";
import Datetime from 'react-datetime';
import '../App.css';
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

  export default EventsFilter;
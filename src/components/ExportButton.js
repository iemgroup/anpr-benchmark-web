import React, { Component } from "react";

class ExportButton extends Component {
    constructor(props) {
      super(props);
      this.exportButton = React.createRef();
      this.buttonId = "test-table-xls-button";
    }
  
    
  
    render() {
      return (
        <button className="download-table-xls-button" onClick={this.props.handleClick}>Export</button>
        
      );
    }
  }

  export default ExportButton;
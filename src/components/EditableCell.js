import { Component } from "react";

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

  export default EditableCell;
import React,{ Component } from 'react';

class KindEditor extends React.Component {
    constructor(props){
        super(props)
        this.state={
            value:''
        }
        this.editor=null;
    }
    componentDidMount(){
    }
    handleChange () {
        // let { value }=this.state;
        let value = this.editor.root.innerHTML;
        // this.setState({value:value});
        this.props.setText(value)
    }
    render(){
        return (
                <div ref='textarea'> </div>
        )
    }
}

export default KindEditor;
import React,{ Component } from 'react';
import { Button } from 'antd';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

class UEditor extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            value:'',
        };
        this.editor=null;
    }
    componentDidMount(){
        const textbox = this.refs.textarea;
        const options = {
            debug: 'warn',
            modules: {
                toolbar: ['bold', 'italic', 'underline', 'strike', 'image'],
                history: {          // Enable with custom configurations
                    delay: 2500,
                    userOnly: true
                },
            },
            placeholder: '请输入文本...',
            readOnly: false,
            theme: 'snow'
        };
        const editor =this.editor= new Quill(textbox,options);
        const {value}=this.state;
        if (value) editor.clipboard.dangerouslyPasteHTML(value);
        editor.on('text-change', this.handleChange.bind(this));
    }
    handleChange () {
        let { value }=this.state;
        value = this.editor.root.innerHTML;
        this.setState({value:value});
    }
    render(){
        return (
                <div ref="textarea"> </div>
        )
    }
}

export default UEditor;
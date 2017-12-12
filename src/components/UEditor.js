import React,{ Component } from 'react';
import { Button } from 'antd';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

class UEditor extends React.Component {
    constructor(props){
        super(props)
        this.state={
            value:''
        }
        this.editor=null;
    }
    componentDidMount(){
        const textbox = this.refs.textarea;
        const options = {
            debug: 'warn',
            modules: {
                toolbar: [{ header: [1, 2, 3, false] },
                    'bold', 'italic', 'underline', 'strike',
                    {color:['white','red','orange','yellow','green','blue','purple','black']},
                    {background:['white','red','orange','yellow','green','blue','purple','black']},
                     'image'],
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
        let BackgroundClass = Quill.import('attributors/class/background');
        let ColorClass = Quill.import('attributors/class/color');
        let SizeClass = Quill.import('attributors/class/size');
        Quill.register(BackgroundClass, true);
        Quill.register(ColorClass, true);
        Quill.register(SizeClass, true);
        if (value) editor.clipboard.dangerouslyPasteHTML(value);
        editor.on('text-change', this.handleChange.bind(this));
    }
    handleChange () {
        // let { value }=this.state;
        let value = this.editor.root.innerHTML;
        let temp = value.replace(/<p><br><\/p>/g,'');
        this.props.setText(temp)
    }
    render(){
        return (
                <div onKeyDown={(e)=>{this.props.keydownHandle(e)}} ref="textarea"> </div>
        )
    }
}

export default UEditor;
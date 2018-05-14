import React,{ Component } from 'react';
import { Button } from 'antd';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

class UEditor extends React.Component {
    constructor(props){
        super(props);
        this.state={
            value:''
        };
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

            },
            placeholder: '请输入文本...',
            readOnly: false,
            theme: 'snow'
        };
        const editor =this.editor= new Quill(textbox,options);
        //将输入区dom传给父组件
        this.props.setDom(editor.root);
        const {value}=this.state;
        let BackgroundClass = Quill.import('attributors/class/background');
        let ColorClass = Quill.import('attributors/class/color');
        let SizeClass = Quill.import('attributors/class/size');
        Quill.register(BackgroundClass, true);
        Quill.register(ColorClass, true);
        Quill.register(SizeClass, true);
        // console.log(editor.clipboard);
        if (value) editor.clipboard.dangerouslyPasteHTML(value);
        editor.on('text-change', this.handleChange.bind(this));

        //剪切粘贴
        (function(){
            let imgReader = function( item ){
                let blob = item.getAsFile(),
                    reader = new FileReader();

                reader.onload = function( e ){
                    let img = new Image();

                    img.src = e.target.result;
                    editor.root.appendChild( img );
                };

                reader.readAsDataURL( blob );
            };

            editor.root.addEventListener( 'paste', function( e ){
                let clipboardData = e.clipboardData,
                    i = 0,
                    items, item, types;

                if( clipboardData ){
                    items = clipboardData.items;

                    if( !items ){
                        return;
                    }

                    item = items[0];
                    types = clipboardData.types || [];

                    for( ; i < types.length; i++ ){
                        if( types[i] === 'Files' ){
                            item = items[i];
                            break;
                        }
                    }

                    if( item && item.kind === 'file' && item.type.match(/^image\//i) ){
                        imgReader( item );
                    }
                }
            });
        })();
        // console.log(editor.root);
        // ql-editor ql-blank
    }
    handleChange () {
        // let { value }=this.props;
        let value = this.editor.root.innerHTML;
        let temp = value.replace(/<p><br><\/p>/g,'');
        this.props.setText(temp);
    }
    render(){
        return (
                <div onKeyDown={(e)=>{this.props.keydownHandle(e);}} ref='textarea'> </div>
        );
    }
}

export default UEditor;
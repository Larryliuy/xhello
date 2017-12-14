import React,{Component} from 'react'
import UEditor from '../components/UEditor';
import { Button } from 'antd';
import '../static/login.scss'
// import WS from  '../static/wsInstace';

const divStyle = {
    position: 'relative',
    height:'100%'
};


class UEditorBox extends React.Component {
    constructor(){
        super();
        this.state={
            value:''
        }
    }
    componentDidMount(){
    }
    setText(value){
        //过滤空字符串和回车字符串
        if(!value || !value.trim()) return;
        this.setState({
            value:value
        });
        console.log(value);
    }
    sendClickhandle(){
        let message = {username:'larry',time:new Date().toLocaleDateString(),value:this.state.value};
        console.log(message);
        alert(message.value);
        //通过websocket发送给服务器
        // WS.emit('message',message);
    }
    keydownHandle(e){
        if(!this.state.value || this.state.value.indexOf('<p><br></p>') !== -1) {
            e.target.innerHTML = '';
            return false;
        };
        //ctrl+enter发送，enter发送需要做字符串处理
        if(e.keyCode === 13 && e.ctrlKey){
            console.log(this.state.value);
            alert(this.state.value);
            e.target.innerHTML = '';
        }else if(e.keyCode === 13 && !e.ctrlKey){
            e.target.innerHTML = this.state.value;
        }
    }
    render(){
        return(
        <div style={divStyle}>
            <UEditor keydownHandle={this.keydownHandle.bind(this)} setText={this.setText.bind(this)}></UEditor>
            <Button onClick={() => {this.sendClickhandle()} }
                    className = 'send-btn'
                    type='primary'
            >发送</Button>
        </div>
    )}
}
export default UEditorBox;
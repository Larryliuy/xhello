import React,{Component} from 'react'
import store,{ CONSTANT } from '../reducer/reducer';
import UEditor from '../components/UEditor';
import { Button } from 'antd';
import '../static/login.scss'
import WS,{ getSendData } from  '../static/wsInstace';

let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});
let uId = state.homeState.userInfo.id,
    uName = state.homeState.userInfo.userName,
    rId = state.homeState.currentRoomInfo.id,
    rTitle = state.homeState.currentRoomInfo.title;
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
        uId = state.homeState.userInfo.id;
        uName = state.homeState.userInfo.userName;
        rId = state.homeState.currentRoomInfo.id;
        rTitle = state.homeState.currentRoomInfo.title;
    }
    setText(value){
        //过滤空字符串和回车字符串
        if(!value || !value.trim()) return;
        this.setState({
            value:value
        });
    }
    sendClickhandle(){
        /*let message = {username:uName,time:new Date().toLocaleDateString(),data:this.state.value};
        console.log(message);
        alert(message.value);*/
        //通过websocket发送给服务器
        // WS.emit('message',message);
        console.log(this.state.value);
        this.props.setData(this.state.value);
        let msg = getSendData('msg',rId,rTitle,uId,uName,null,this.state.value);
        WS.send(JSON.stringify(msg));
    }
    keydownHandle(e){
        if(!this.state.value || this.state.value.indexOf('<p><br></p>') !== -1) {
            e.target.innerHTML = '';
            return false;
        };
        //ctrl+enter发送，enter发送需要做字符串处理
        if(e.keyCode === 13 && !e.ctrlKey){
            // console.log(this.state.value);
            // alert(this.state.value);
            e.target.innerHTML = '';
            this.props.setData(this.state.value);
            let msg = getSendData('msg',rId,rTitle,uId,uName,null,null,null,this.state.value);
            WS.send(JSON.stringify(msg));
        }else if(e.keyCode === 13 && e.ctrlKey){
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
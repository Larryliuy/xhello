import React,{Component} from 'react'
import store,{ CONSTANT } from '../reducer/reducer';
import UEditor from '../components/UEditor';
import { Button, message } from 'antd';
import '../static/login.scss'
import WS,{ getSendData } from  '../static/wsInstace';

let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});
let uId = state.homeState.userInfo.id,
    uName = state.homeState.userInfo.name;
const divStyle = {
    position: 'relative',
    height:'100%'
};


class UEditorBox extends React.Component {
    constructor(){
        super();
        this.state={
            value:'',
            textareaDom:''
        }
    }
    componentDidMount(){
        uId = state.homeState.userInfo.id;
        uName = state.homeState.userInfo.name;
    }
    setDom(ele){
        this.setState({textareaDom:ele});
    }
    setText(value){
        //过滤空字符串和回车字符串
        if(!value || !value.trim()) return;
        this.setState({
            value:value
        });
    }
    limitTextOrImg(limit,type){
        //type=1表示用户限制，type=2表示房间限制
        switch(limit){
            case '1':
                let value = this.state.value;
                // console.log(value);
                function removeHTMLTag(str) {
                    str = str.replace(/<\/?[^>]*>/g,''); //去除HTML tag
                    str = str.replace(/[ | ]*\n/g,'\n'); //去除行尾空白
                    //str = str.replace(/\n[\s| | ]*\r/g,'\n'); //去除多余空行
                    str=str.replace(/ /ig,'');//去掉
                    if(str.length>0){
                        str=true
                    }else {
                        str=false
                    }
                    return str;
                }
                if(this.state.value.indexOf('<img') !== -1 && removeHTMLTag(value)){
                    if(type === 1){
                        message.warning('您已被禁止发送文字');
                    }else {
                        message.warning('此房间已被禁止发送文字');
                    }
                    return false;
                }
                //检测<p>()<img , ">()<img , ">()</p> 这3组字符串括号内不能存在文本(数字，字母，汉字)即可
                if(this.state.value.indexOf('<p><img') !== -1 && this.state.value.indexOf('><\/p>') !== -1){
                    return true;
                }
                if(this.state.value.indexOf('<p>') !== -1){
                    if(type === 1){
                        message.warning('您已被禁止发送文字');
                    }else {
                        message.warning('此房间已被禁止发送文字');
                    }
                    return false;
                }
                // return true;
                break;
            case '2':
                if(this.state.value.match(/\<img(\s|\S)+?\>/g)){
                    if(type === 1){
                        message.warning('您已被禁止发送图片');
                    }else {
                        message.warning('此房间已被禁止发送图片');
                    }
                    return false;
                }else{
                    return true;
                }
                break;
            case '12':
                if(this.state.value.indexOf('<p>') !== -1 || this.state.value.indexOf('<img>') !== -1){
                    if(type === 1){
                        message.warning('您已被禁止发送文字和图片');
                    }else {
                        message.warning('此房间已被禁止发送文字和图片');
                    }
                    return false;
                }
                break;
            case '123':
                if(this.state.value.indexOf('<p>') !== -1 || this.state.value.indexOf('<img') !== -1){
                    if(type === 1){
                        message.warning('您已被禁止发送文字和图片');
                    }else {
                        message.warning('此房间已被禁止发送文字和图片');
                    }
                    return false;
                }
                break;
            default:
                return true;
                break;
        }
    }
    sendClickhandle(){
        if(!this.state.value)return;
        //通过websocket发送给服务器
        // WS.emit('message',message);
        // console.log('ueditor:'+state.homeState.currentRoomInfo.id);
        // console.log(state.homeState.currentRoomInfo.limited);
        if(!this.limitTextOrImg(state.homeState.userInfo.limit.toString(),1))return;
        if(state.homeState.currentRoomInfo.limited){
            if(!this.limitTextOrImg(state.homeState.currentRoomInfo.limited.toString(),2))return;
        }
        this.props.setData(this.state.value);
        let msg = getSendData('msg',
            state.homeState.currentRoomInfo.roomId,
            state.homeState.currentRoomInfo.roomName,
            state.homeState.userInfo,
            this.state.value);
        msg.timeStamp = new Date().getTime();
        WS.send(JSON.stringify(msg));
        this.setState({value:''});
        this.state.textareaDom.innerHTML = '';
    }
    keydownHandle(e){
        if(!this.state.value || this.state.value.indexOf('<p><br></p>') !== -1) {
            e.target.innerHTML = '';
            return false;
        };
        //ctrl+enter发送，enter发送需要做字符串处理
        if(e.keyCode === 13 && !e.ctrlKey){
            if(!this.limitTextOrImg(state.homeState.userInfo.limit.toString(),1))return;
            if(state.homeState.currentRoomInfo.limited){
                if(!this.limitTextOrImg(state.homeState.currentRoomInfo.limited.toString(),2))return;
            }
            e.target.innerHTML = '';
            this.props.setData(this.state.value);
            let msg = getSendData('msg',
                state.homeState.currentRoomInfo.roomId,
                state.homeState.currentRoomInfo.roomName,
                state.homeState.userInfo,
                this.state.value);
            msg.timeStamp = new Date().getTime();
            WS.send(JSON.stringify(msg));
            this.setState({value:''});
        }else if(e.keyCode === 13 && e.ctrlKey){
            e.target.innerHTML = this.state.value;
        }

    }
    render(){
        return(
        <div style={divStyle}>
            <UEditor keydownHandle={this.keydownHandle.bind(this)}
                     setDom={this.setDom.bind(this)}
                     setText={this.setText.bind(this)}></UEditor>
            <Button onClick={() => {this.sendClickhandle()} }
                    className = 'send-btn'
                    type='primary'
            >发送</Button>
        </div>
    )}
}
export default UEditorBox;
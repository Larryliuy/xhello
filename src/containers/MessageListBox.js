import React,{ Component } from 'react'
import MessageList from '../components/MessageList'
import WS, {getDateString, getSendData, send} from "../static/wsInstace";


import store,{ CONSTANT } from '../reducer/reducer';
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});

let uId = '',
    uName = '',
    uLevel = '',
    uSex = '';

// let _this = null;
class MessageListBox extends React.Component{
    constructor(props) {
        super(props);
        this.state={data:[]};
    }
    componentDidMount(){
        uId = state.homeState.userInfo.id;
        uName = state.homeState.userInfo.name;
        uLevel = state.homeState.userInfo.level;
        uSex = state.homeState.userInfo.sex;


    }
    render(){
        return (<div ref={'myRef'} className='message-box' id='messageBox'><MessageList data={state.homeState.messageData}/></div>)
    }
}


export default MessageListBox
import React,{ Component } from 'react'
import MessageList from '../components/MessageList'
// import WS from "../static/wsInstace";

class MessageListBox extends React.Component{
    constructor(props) {
        super(props);
        this.state={data:[]};
    }
    scrollToBottom(){
        setTimeout(function(){
            let mb = document.getElementById('messageBox');
            mb.scrollTop = mb.scrollHeight;
            /*this.refs.messageBox.scrollTop = this.refs.messageBox.clientHeight;
            // window.scrollTo(0,this.refs.messageBox.clientHeight);
            console.log('hello:'+this.refs.messageBox.clientHeight);*/
        },100);
    }
    componentDidMount(){
        const data = [{username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'}];
        /*WS.on('message',function(obj){
                data.push(obj);
        });*/
        this.setState({data:data});
        this.scrollToBottom();
    }
    render(){
        return (<div className='message-box' id='messageBox'><MessageList data={this.state.data}/></div>)
    }
}


export default MessageListBox
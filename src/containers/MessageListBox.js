import React,{ Component } from 'react'
import MessageList from '../components/MessageList'


class MessageListBox extends React.Component{
    constructor(props) {
        super(props)
    }
        render(){
            return (<div className='message-box'><MessageList/></div>)
        }
}


export default MessageListBox
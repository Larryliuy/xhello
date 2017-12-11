import React,{Component} from 'react'
import UEditor from '../components/UEditor';
import { Button } from 'antd';
import '../static/login.scss'
const divStyle = {
    position: 'relation',
    height: '130px'
};


class UEditorBox extends React.Component {
    constructor(){
        super()
        this.state={
            value:''
        }
    }
    componentDidMount(){
    }
    setText(value){
        this.setState({
            value:value
        })
        console.log(value)
    }
    sendClickhandle(){
        let message = {username:'larry',time:new Date().toLocaleDateString(),value:this.state.value};
        console.log(message)
        //通过websocket发送给服务器
    }
    render(){
        return(
        <div style={divStyle}>
            <UEditor setText={this.setText.bind(this)}></UEditor>
            <Button onClick={() => {this.sendClickhandle()} }
                    className = 'send-btn'
                    type='primary'
            >发送</Button>
        </div>
    )}
}
export default UEditorBox;
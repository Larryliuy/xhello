import React,{Component} from 'react'
import UEditor from '../components/UEditor';
import { Button } from 'antd';
import '../static/login.scss'
const divStyle = {
    position: 'relation',
    height: '130px'
};


class UEditorBox extends React.Component {

    componentDidMount(){
    }
    render(){
        return(
        <div style={divStyle}>
            <UEditor></UEditor>
            <Button className= 'send-btn' type='primary'>发送</Button>
        </div>
    )}
}
export default UEditorBox;
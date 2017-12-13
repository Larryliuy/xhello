import React,{ Component } from 'react';
import { Layout, Icon ,message, Button } from 'antd';

class FooterBottom extends React.Component{
    constructor(props){
        super(props)
    }
    render(){
        return (<div className ='footer'>
            <div>
                <span style={{fontSize:13,marginRight:80,top:3}}>{this.props.userName}</span>
            </div>
            <div>
                <span style={{cursor:'pointer'}}><Icon type="sound" /></span>
                <span style={{marginLeft:10,top:3,cursor:'pointer'}}><Icon type="phone" /></span>
            </div>
            <div>
                <span style={{marginLeft:80,top:3}}><Button type='primary'>点击开麦</Button></span>
            </div>
            <div>
                <span style={{marginLeft:80,top:3,cursor:'pointer'}}>欢呼</span>
                <span style={{marginLeft:10,top:3,cursor:'pointer'}}>鼓掌</span>
            </div>
            <div>
                <span style={{cursor:'pointer'}}><Icon type="sound" />播放</span>
            </div>
        </div>)
    }
}

export default FooterBottom;
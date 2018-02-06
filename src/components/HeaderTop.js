import React, { Component } from 'react';
import {Link} from 'react-router-dom'
import { Icon ,message, Popover, List } from 'antd';
import cookieUtil from "../libs/cookieUtil";
import HeaderLeft from "../components/HeaderLeft";
import { send } from '../static/webSocket';
import store, {CONSTANT} from "../reducer/reducer";
let state = store.getState();
store.subscribe(function () {
    state = store.getState()
});

import Skin from './Skin';

class HeaderTop extends React.Component{
    constructor(){
        super();
        this.state = {
            menuVisible:false
        }
    }
    loginOut=()=>{
        // location.reload();
        message.success('退出成功！');
        cookieUtil.unset('userName');
        cookieUtil.unset('password');
        cookieUtil.unset('userData');
        location.reload();
    };
    vodPlay(){
        let currentRoomInfo = state.homeState.currentRoomInfo;
        if(currentRoomInfo.mode === 1){
            message('已开启直播模式，不能点播');
            return;
        }
        currentRoomInfo.mode = 2;
        store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:currentRoomInfo});
        //切换房间模式，mode
        let sendMsg = {
            type:'msg',
            typeString:'changeRoomMode',
            roomId:state.homeState.currentRoomInfo.roomId,
            roomName:state.homeState.currentRoomInfo.roomName,
            user:state.homeState.userInfo,
            roomMode:2
        };
        send(JSON.stringify(sendMsg),function () {
            console.log('发送改变房间模式消息成功');
        })
    }
    render(){
        const data = ['播放网络视频'];
        const content = (<div style={{width:'200px'}} onClick={()=>this.vodPlay()}>
            <List dataSource={data}
                  size="small"
                  bordered
                  renderItem={item => (<List.Item>{item}</List.Item>)}
            >
            </List>
        </div>);
        return (<div>
            <div className="logo" >
                <HeaderLeft></HeaderLeft>
            </div>
            <h2>
                中华人民共和国商务部直销查询信息管理系统
            </h2>
            <span style={{cursor:'pointer',position:'absolute',width:80,fontSize:16,right:60,top:3,display:'flex',justifyContent:'space-around',alignItems:'center'}}>
                <span>
                    <Popover placement="bottomLeft"
                               content={content}
                               trigger="click">
                        <span><Icon style={{color:'#fff',display:'block',marginTop:'3px'}} type="appstore-o" /></span>
                    </Popover>
                </span>
                <span><Skin></Skin></span>
                    </span>
            <Link to='/'
                  onClick={this.loginOut}
                  style={{position:'absolute',top:5,right:30,cursor:'pointer'}}
            >
                <Icon type="poweroff" style={{fontSize:16,color:'red'}}/>
            </Link>

        </div>)
    }
}

export default HeaderTop;
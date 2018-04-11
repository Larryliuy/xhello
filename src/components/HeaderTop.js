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
import {getRoomInfoVideo, initVariableVideo, onLeaveVideo} from "../webrtc/webRtcVideo";
import {leaveRoom} from "../static/comFunctions";
import {initVariableAudio, onLeave} from "../webrtc/webRtcAudio";

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
        let localUri = location.href,
            localUriNo = localUri.split('?')[0];
        console.log(localUri.indexOf('?') !== -1);
        leaveRoom(state.homeState.currentRoomInfo);
        store.dispatch({type:CONSTANT.ALLROOMLIST,val:[]});
        setTimeout(function () {
            if(state.homeState.currentRoomInfo.mode == '0'){
                onLeave(state.homeState.userInfo);
                initVariableAudio();
            }else{
                onLeaveVideo(state.homeState.userInfo);
                initVariableVideo();
            }
            //还是得重新加载一下
            if(localUri.indexOf('?') !== -1){
                location.replace(localUriNo+'#/');//针对QQ登录这种场景
            }else{
                location.reload();
            }
        },200);

        // setTimeout(function () {
        //     if(localUri.indexOf('?') !== -1){
        //         location.replace(localUriNo+'#/');//针对QQ登录这种场景
        //     }else{
        //         location.reload();
        //     }
        // },200);
        // location.reload();
    };
    switchVideoMode(e){
        console.log(e.target.innerText);
        let roomInfo = state.homeState.currentRoomInfo ;
        console.log(roomInfo);
        switch(e.target.innerText){
            case '播放网络视频':
                if(roomInfo.mode === 2){
                    message.error('已开启点播模式！');
                    return;
                }
                roomInfo.mode = 2;
                break;
            case '开启单人直播':
                if(roomInfo.mode === 1){
                    message.error('已开启单人直播！');
                    return;
                }
                //初始化视频模式webRtcVideo下的变量以及各种对象
                roomInfo.mode = 1;
                break;
            case '开启双人直播':
                if(roomInfo.mode === 3){
                    message.error('已开启双人直播！');
                    return;
                }
                roomInfo.mode = 3;
                break;
        }
        //切换房间模式，mode
        roomInfo.player = state.homeState.userInfo.id;
        roomInfo.secondKing = '';
        //ws 发送set_room_info
        let setRoomMsg = {
            type:'set_room_info',
            roomId: roomInfo.roomId,		//房间唯一标识符
            roomName: roomInfo.roomName,
            user:state.homeState.userInfo,
            data:roomInfo
        };
        send(JSON.stringify(setRoomMsg),function(){
            console.log('更新服务器房间mode信息');
            // store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfo});
            //取消房间的king
            let nullKingMsg = {
                type:'reset_king',
                roomId: roomInfo.roomId,		//房间唯一标识符
                roomName: roomInfo.roomName,
                user:state.homeState.userInfo,
            };
            send(JSON.stringify(nullKingMsg),function(){
                let sendMsg = {
                    type:'msg',
                    typeString:'changeRoomMode',
                    roomId:roomInfo.roomId,
                    roomName:roomInfo.roomName,
                    user:state.homeState.userInfo,
                    mode:roomInfo.mode,
                    player:state.homeState.userInfo.id
                };
                send(JSON.stringify(sendMsg),function () {
                    console.log('发送改变房间模式消息成功');
                    //http请求改变数据库mode=2
                });
            });

        });

    }
    render(){
        const data = ['播放网络视频','开启单人直播','开启双人直播'];
        const content = (<div className={'vodMenu'} style={{width:'200px',cursor:'pointer'}} onClick={(e)=>this.switchVideoMode(e)}>
            <List dataSource={data}
                  size="small"
                  bordered
                  renderItem={item => (<List.Item>{item}</List.Item>)}
            >
            </List>
        </div>);
        return (<div>
            <div className="logo">
                <HeaderLeft></HeaderLeft>
            </div>
            <h2>
                中华人民共和国商务部直销查询信息管理系统
            </h2>
            <span style={{cursor:'pointer',position:'absolute',width:80,fontSize:16,right:60,top:3,display:'flex',justifyContent:'space-around',alignItems:'center'}}>
                <span style={{display:state.homeState.userInfo.level < 3?'block':'none'}}>
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
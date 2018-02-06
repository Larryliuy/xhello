import React,{ Component } from 'react';
import { Popover, Input, Button, message } from 'antd';
import { send } from '../static/webSocket';
import {CONSTANT} from "../reducer/reducer";
import store from "../reducer/reducer";
let state = store.getState();
store.subscribe(function () {
    state = store.getState()
});
class VideoOnDemand extends React.Component{
    constructor(){
        super();
        this.state = {vodSrc:'',popVisible:false};
    }
    componentDidMount(){

    }
    addVideoSrc(){
        this.setState({popVisible:true});
    }
    planeCancelHandle(){
        this.setState({popVisible:false});
    }
    planeOkHandle(){
        //广播给所有人视频连接地址
        let sendSrcMsg = {
            type:'msg',
            typeString:'vodSrc',
            roomId:state.homeState.currentRoomInfo.roomId,
            roomName:state.homeState.currentRoomInfo.roomName,
            user:state.homeState.userInfo,
            vodSrc:this.state.vodSrc
        };
        let vodVideo = document.getElementById('vodVideo'),
            videoSrc = this.state.vodSrc,
            _this=this;
        if(!videoSrc){
            console.log('视频链接不正确，请重新输入');
            message.error('视频链接不正确，请重新输入');
            return;
        }
        console.log(videoSrc);
        // vodVideo.addEventListener('canplay', function(){
        //     vodVideo.muted = true;		//mute local video to avoid echo by myself.
        // });
        // vodVideo.addEventListener('play', function(){
        //     vodVideo.muted = true;		//mute local video to avoid echo by myself.
        // });
        vodVideo.src = videoSrc;
        vodVideo.autoplay=true;
        vodVideo.controls=true;
        send(JSON.stringify(sendSrcMsg),function () {
            console.log('视频连接已广播');
            if(!vodVideo){
                console.log('vodVideo不存在');
                return;
            }
            _this.setState({popVisible:false});
        })
    }
    userNameChange(e){
        console.log(e.target.value);
        this.setState({vodSrc:e.target.value});
    }
    closeVod(){
        //关闭点播
        let roomInfoTmp = state.homeState.currentRoomInfo;
        roomInfoTmp.mode = 0;
        store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfoTmp});
        //发消息给其他用户调整房间模式
        let sendMsg = {
            type:'msg',
            typeString:'changeRoomMode',
            roomId:state.homeState.currentRoomInfo.roomId,
            roomName:state.homeState.currentRoomInfo.roomName,
            user:state.homeState.userInfo,
            roomMode:0
        };
        send(JSON.stringify(sendMsg),function () {
            console.log('发送关闭点播消息成功');
        })
    }
    render(){
        const content = (<div style={{width:'300px'}}>
            <Input onChange={(e)=>this.userNameChange(e)} placeholder={'请输入视频网址'}/>
            <br/>
            <br/>
            <span style={{display:'flex',justifyContent:'space-between'}}>
                <Button onClick={()=>this.planeCancelHandle()}>取消</Button>
                <Button type={'primary'} onClick={()=>this.planeOkHandle()}>确定</Button>
            </span>
        </div>);
        return (
            <div style={{height:'100%',textAlign:'center !important'}}>
                <div style={{textAlign:'center'}}>
                    <Popover placement="bottom"
                             title={'添加网络视频连接'}
                             content={content}
                             visible={this.state.popVisible}
                             trigger="click">
                        <Button onClick={()=>this.addVideoSrc()}>添加视频网址</Button>
                    </Popover>
                    <Button onClick={()=>this.closeVod()}></Button>
                </div>
                <video id={'vodVideo'}
                       src={this.state.vodSrc}
                       style={{position:'relative',width:'640px',height:'320px'}}>不支持video</video>
            </div>
        )
    }
}

export default VideoOnDemand;

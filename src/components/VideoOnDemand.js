import React,{ Component } from 'react';
import { Popover, Input, Button, message } from 'antd';
import { send } from '../static/webSocket';
import { closeVideoMode } from '../webrtc/webRtcVideo';
import store,{CONSTANT} from "../reducer/reducer";
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
            // vodSrc:this.state.vodSrc
        };
        let vodVideo = document.getElementById('vodVideo'),
            videoSrc = this.state.vodSrc,
            _this=this;
        if(!videoSrc){
            console.log('视频链接不正确，请重新输入');
            message.error('视频链接不正确，请重新输入');
            return;
        }
        //如果是优酷视频，则需要截取出优酷视频id
        if(videoSrc.indexOf('v.youku.') !== -1){
            store.dispatch({type:CONSTANT.ISYOUKU,val:true});
            let videoId = videoSrc.substring(videoSrc.indexOf('id_')+3,videoSrc.indexOf('.html'));
            videoSrc = 'https://player.youku.com/embed/'+ videoId+'?isAutoPlay=true';//不用加https
            sendSrcMsg.webSite = 'youku';
        }else if(videoSrc.indexOf('.qq.com') !== -1){
            //https://v.qq.com/x/cover/g7m84rhikqkd772.html
            let videoId = videoSrc.substring(videoSrc.indexOf('cover/')+6,videoSrc.indexOf('.html'));
            if(videoId.indexOf('/') !== -1){
                videoId = videoId.substring(videoId.indexOf('/')+1);
            }
            videoSrc = "https://v.qq.com/iframe/player.html?vid="+videoId+"&tiny=0";
        }
        console.log(videoSrc);
        vodVideo.src = videoSrc;
        vodVideo.autoplay=true;
        vodVideo.controls=true;
        send(JSON.stringify(sendSrcMsg),function () {
            console.log('视频连接已广播');
            //set_room_info
            let roomInfo = state.homeState.currentRoomInfo;
            roomInfo.videoSrc = videoSrc;
            let setRoomMsg = {
                type:'set_room_info',
                roomId:state.homeState.currentRoomInfo.roomId,
                roomName:state.homeState.currentRoomInfo.roomName,
                user:state.homeState.userInfo,
                data:roomInfo
            };
            console.log(setRoomMsg);
            send(JSON.stringify(setRoomMsg),function () {
                console.log('发送set videoSrc消息发服务器');
            });
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
    getContent(){
        return  (<div style={{width:'300px'}}>
            <Input onChange={(e)=>this.userNameChange(e)} placeholder={'请输入视频网址'}/>
            <br/>
            <br/>
            <span style={{display:'flex',justifyContent:'space-between'}}>
                <Button onClick={()=>this.planeCancelHandle()}>取消</Button>
                <Button type={'primary'} onClick={()=>this.planeOkHandle()}>确定</Button>
            </span>
        </div>);
    }
    render(){
        return (
            <div style={{height:'100%',textAlign:'center !important'}}>
                <div style={{textAlign:'center',display:(state.homeState.currentRoomInfo.mode !== 0 && state.homeState.currentRoomInfo.player == state.homeState.userInfo.id)?'block':'none'}}>
                    <Popover placement="bottom"
                             title={'添加网络视频连接'}
                             content={this.getContent()}
                             visible={this.state.popVisible}
                             trigger="click">
                        <Button onClick={()=>this.addVideoSrc()}>添加视频网址</Button>
                    </Popover>
                    <Button onClick={closeVideoMode}>关闭点播</Button>
                </div>
                <div style={{color:'#666',textAlign:'center',display:(state.homeState.currentRoomInfo.mode !== 0 && state.homeState.currentRoomInfo.player == state.homeState.userInfo.id)?'none':'block'}}><p>管理正在添加视频中...</p></div>
                <iframe height={'80%'}
                        id={'vodVideo'}
                        width={'100%'}
                        src={this.state.vodSrc}
                        frameBorder={'0'}
                        allowTransparency={true}
                        allowFullScreen={true}>
                </iframe>
                {/*<video id={'vodVideo'}
                       src={this.state.vodSrc}
                       style={{position:'relative',width:'640px',height:'320px'}}>
                    不支持video
                </video>*/}
            </div>
        )
    }
}

export default VideoOnDemand;

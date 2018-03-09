import React,{ Component } from 'react';
import { Button, message } from 'antd';
import store from "../reducer/reducer";
import { send } from "../static/webSocket";
import { closeVideoMode, onLeaveVideo, refreshVideo } from "../webrtc/webRtcVideo";
let state = store.getState();
store.subscribe(function () {
    state = store.getState()
});

class LivingDouble extends React.Component{
    componentDidMount(){
    }
    onApplyToBebarley(){
        let roomInfo = state.homeState.currentRoomInfo,
            userInfo = state.homeState.userInfo;
        console.log(roomInfo);
        if(roomInfo.king){
            let msg = {
                type:'msg',
                ToUserOnly:roomInfo.king,
                typeString:'applyToBebarley',
                roomId:roomInfo.roomId,
                user:userInfo
            };
            send(JSON.stringify(msg),function () {
                message.info('申请已发出');
            });
        }

    }
    onAgreeToBebarley(e){
        onLeaveVideo(state.homeState.userInfo);
        console.log(e.target.style.zIndex);
        if(!e.target.style.zIndex){console.error('用户ID未获取到:'+e.target.style.zIndex);return;}
        let msg = {
            type:'msg',
            ToUserOnly:e.target.style.zIndex,
            typeString:'agreeToBebarley',
            roomId:state.homeState.currentRoomInfo.roomId,
            user:state.homeState.userInfo
        };
        send(JSON.stringify(msg),function () {
            message.info('同意agreeToBebarley已发出');
            e.target.style.visibility = 'hidden';
        });
    }
    render(){
        return (
            <div className={'double-live-div'}>
                <div>
                    <video id={'firstVideo'}>不支持video</video>
                    <video id={'secondVideo'}>不支持video</video>
                    <canvas id={'liveCanvas'}></canvas>
                    <audio id={'myAudio'}></audio>
                </div>
                {state.homeState.userInfo.id != state.homeState.currentRoomInfo.king && !state.homeState.currentRoomInfo.secondKing &&
                <Button className={'apply-tobe-barley-btn'} onClick={()=>this.onApplyToBebarley()}>申请连麦</Button>}
                {state.homeState.userInfo.id == state.homeState.currentRoomInfo.king ?
                    <div className={'closeVideoMode'}>
                        <Button onClick={closeVideoMode}>关闭直播</Button>
                        <button id={'preBarleyLists'} onClick={(e)=>this.onAgreeToBebarley(e)}></button>
                    </div>
                :
                    <div className={'refreshVideo'}>
                        <Button onClick={refreshVideo}>刷新</Button>
                    </div>}
                <div className='host-text'><p><a target={'_blank'} href={'http://www.xtell.cn'}>打个小广告:极智未来</a></p></div>
            </div>
        )
    }
}

export default LivingDouble;

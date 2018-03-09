import React,{ Component } from 'react';
import { Button } from 'antd';
import { closeVideoMode, refreshVideo} from "../webrtc/webRtcVideo";
import store from "../reducer/reducer";
let state = store.getState();
store.subscribe(function () {
    state = store.getState()
});
class Living extends React.Component{
    componentDidMount(){
    }
    isKingPlayer(){
        let result = false;
        if(state.homeState.userInfo.id == state.homeState.currentRoomInfo.king){
            result = true;
        }else {
            if(state.homeState.userInfo.id == state.homeState.currentRoomInfo.player){
                result = true;
            }
        }
        return result;
    }
    render(){
        return (
            <div className={'single-live-div'}>
                <div className={'mediaBox'}>
                        <video id={'myVideo'}
                               style={{position:'relative',width:'480px',height:'320px'}}>不支持video</video>
                        <video id={'theirVideo'}
                               style={{position:'relative',width:'200px',height:'120px'}}>不支持video</video>
                    <canvas id={'myCanvas'}></canvas>
                    <audio id={'myAudio'}></audio>
                </div>
                {this.isKingPlayer() ?
                    <Button className={'closeVideoMode'} onClick={closeVideoMode}>关闭直播</Button>
                    :
                    <Button className={'refreshVideo'} onClick={refreshVideo}>刷新</Button>}
                <div className='host-text'><p><a target={'_blank'} href={'http://www.xtell.cn'}>打个小广告:极智未来</a></p></div>
            </div>
        )
    }
}

export default Living;

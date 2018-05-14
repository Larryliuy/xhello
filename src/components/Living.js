import React,{ Component } from 'react';
import { Button, Popover, Input } from 'antd';
import {closeVideoMode, refreshVideo} from '../webrtc/webRtcVideo';
import store, {CONSTANT} from '../reducer/reducer';
import {send} from '../static/webSocket';
import {setRoomInfo} from '../static/comFunctions';
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
});
class Living extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            popVisible:false,
            newContents:'文字内容显示区域'
        };
    }
    componentDidMount(){
        // setTimeout(function () {
        //     let roomInfo = state.homeState.currentRoomInfo;
        //     roomInfo.contents = '文字内容显示区域';
        //     store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfo});
        // },1000);
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
    editContents(){
        console.log('编辑内容');
        this.setState({popVisible:true});
    }
    editChange(e){
        // console.log(e.target.value);
        this.setState({newContents:e.target.value});
    }
    editCancelHandle(){
        this.setState({popVisible:false});
        // this.setState({newContents:this.state.contents});
    }
    editOkHandle(){
        this.setState({popVisible:false});
        let roomInfo = state.homeState.currentRoomInfo;
        roomInfo.contents = this.state.newContents;
        // store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfo});
        //给在线的其他用户发送消息
        let msg = {
            type:'msg',
            typeString:'updateContents',
            roomId:roomInfo.roomId,
            roomContents:this.state.newContents,
            user:state.homeState.userInfo
        };
        send(JSON.stringify(msg),function () {
            console.log('发送 updateContents 消息 ');
            //更新服务器房间内容
            setRoomInfo(roomInfo);
        });
    }
    getContent(){
        return  (<div style={{width:'300px'}}>
            <Input onChange={(e)=>this.editChange(e)} placeholder={'文字内容'}/>
            <br/>
            <br/>
            <span style={{display:'flex',justifyContent:'space-between'}}>
                <Button onClick={()=>this.editCancelHandle()}>取消</Button>
                <Button type={'primary'} onClick={()=>this.editOkHandle()}>确定</Button>
            </span>
        </div>);
    }
    render(){
        return (
            <div className={'single-live-div'}>
                <div className={'mediaBox'}>
                        <video id={'myVideo'}
                               style={{position:'relative',width:'480px',height:'320px'}}>不支持video</video>
                        <video id={'theirVideo'}>不支持video</video>
                    <canvas id={'myCanvas'}></canvas>
                    <audio id={'myAudio'}></audio>
                </div>
                {this.isKingPlayer() ?
                    <Button className={'closeVideoMode'} onClick={closeVideoMode}>关闭直播</Button>
                    :
                    <Button className={'refreshVideo'} onClick={refreshVideo}>刷新</Button>
                }
                <div className='host-text'>
                    {this.isKingPlayer() &&
                    <Popover placement='top'
                             title={'编辑文字'}
                             content={this.getContent()}
                             visible={this.state.popVisible}
                             trigger='click'>
                        <span id={'edit-contents'} onClick={()=>this.editContents()}>点击编辑内容</span>
                    </Popover>
                    }
                    <p style={{color:'red',fontSize:'16px'}}>{state.homeState.currentRoomInfo.contents}</p>
                </div>
            </div>
        );
    }
}

export default Living;

import React,{ Component } from 'react';
import { message ,Input, Button, Slider, Popover } from 'antd';
import UploadAvatar from './UploadAvatar';
import { generalApi } from "../static/apiInfo";
import store, {CONSTANT} from "../reducer/reducer";
import { closeMicrophone, openMicrophone } from '../webrtc/webRtcAudio';
import {send} from "../static/webSocket";

let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});
let isAudioPlay = false,startTime = 0,endTime;
class FooterBottom extends React.Component{
    constructor(props){
        super(props);
        this.state={
            visible: false,
            inputVisible:false,
            popVisible:false,
            musicAddress:'',
            inputValue:'',
            audioTrack:'',
            microphoneOpen:false
        }
    }
    clickHandle(e){
        // alert(e.target)
        if(!e.target.id) return;
        console.log(e.target.id);
        let audioDom = '';
        switch (e.target.id){
            case 'avatar-img':
                this.setState({visible: true});
                break;
            case 'audio-img':
                // alert('控制音量');
                break;
            case 'microphone-img':
                // alert('控制麦克风');
                break;
            case 'cheer-span':
                if(!isAudioPlay && (new Date().getTime()/1000 - startTime) > 5){
                    audioDom = document.getElementById('cheer-audio');
                    audioDom.src = './sounds/cheer.mp3';
                    audioDom.autoplay = true;
                    isAudioPlay = true;
                    startTime = new Date().getTime()/1000;
                    setTimeout(function () {
                        isAudioPlay = false;
                    },5000);
                }
                break;
            case 'applause-span':
                if(!isAudioPlay && (new Date().getTime()/1000 - startTime) > 5) {
                    audioDom = document.getElementById('applause-audio');
                    audioDom.src = './sounds/applause.mp3';
                    audioDom.autoplay = true;
                    isAudioPlay = true;
                    startTime = new Date().getTime()/1000;
                    setTimeout(function () {
                        isAudioPlay = false;
                    },5000);
                }
                break;
            case 'open-microphone-btn':
                // alert('开启麦克风');
                // myLocalStream
                // let audioTrack = state.homeState.myAudioTrack;
                if(state.homeState.microphoneOpen){
                    closeMicrophone();
                }else{
                    openMicrophone();
                }
                break;
            case 'user-name':
                this.setState({inputVisible:true});
                break;
            case 'play-span':
            case 'play-img':
                //播放本地音乐并将流混入mixer
                console.log('播放音乐');
                break;
        }
    }
    handOk(){
        this.setState({visible: false});
    }
    handleCancel(){
        this.setState({visible: false});
    }
    onchangeHandle(e){
        this.setState({inputValue:e.target.value});
    }
    onblurHandle(){
        this.setState({inputVisible:false});
        if(!this.state.inputValue)return;
        //请求修改用户名API
        let args = 'action=update&table=xuser&cond=id='+state.homeState.userInfo.id+'&LoginName='+this.state.inputValue,
            _this = this;
        fetch(generalApi,{
            method:'POST',
            // credentials: "include",
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body:args//JSON.stringify(args)
        }).then((response) => {/*console.log(response);*/return response.text()})
            .then(data=>{
                console.log(data);
                let datatmp;
                try {
                    datatmp = JSON.parse(data);
                    //JSON.parse没问题的情况
                    console.log(datatmp);
                    if(datatmp.status === 'ok'){
                        message.success('修改成功');
                        let userInfoTmp = state.homeState.userInfo;
                        userInfoTmp.name = _this.state.inputValue;
                        store.dispatch({type:CONSTANT.USERINFO,val:userInfoTmp});
                        //这里还需要更新allRoomList中的name
                    }else {
                        message.error('修改失败');
                    }
                }catch (e){
                    //JSON.parse有问题的情况,手动截取返回信息中JSON字符串
                    datatmp = JSON.parse(data.substring(data.indexOf('{')));
                    console.log(datatmp);
                    if(datatmp.status === 'ok'){
                        message.success('修改成功');
                        let userInfoTmp = state.homeState.userInfo;
                        userInfoTmp.name = _this.state.inputValue;
                        store.dispatch({type:CONSTANT.USERINFO,val:userInfoTmp});
                        //这里还需要更新allRoomList中的name
                    }else {
                        message.error('修改失败');
                    }
                }

            }).catch(err=>{
            console.log(err);
        });
        console.log(this.state.inputValue);
        // message.success('修改成功');
    }
    handleSliderAudio(value){
        // console.log(value);
        if(!value) return;
        //这里设置音频声量
        let videoBox = document.getElementById('audioBox').getElementsByTagName('video');
        for(let i=0; i<videoBox.length; i++ ){
            videoBox[i].volume = value/100;
        }
    }
    handleSliderMicrophone(value){
        // console.log(value);
        if(!value) return;
    }
    micBtnDisabled(){
        let micMode = state.homeState.microphoneMode,
            userInfo = state.homeState.userInfo,
            micUsers = state.homeState.roomMicrophoneUser,
            result = false;
        if(userInfo.level > 3) {
            if (micMode == 2 || micMode == 3) {
                result = true;
            }
        }else{
            result = false;
        }
        if(micUsers instanceof Array && micUsers.length !== 0 && micUsers[0].id === userInfo.id){
            return false;
        }
        return result;
    }
    playMusic(){
        if(state.homeState.userInfo.level < 3){//房主及副房主才可以播放音乐
            this.setState({popVisible:true});
        }else{
            message.error('您的权限不够');
        }
    }
    musicAddressChange(e){
        console.log(e.target.value);
        this.setState({musicAddress:e.target.value});
    }
    planeCancelHandle(){
        this.setState({popVisible:false});
    }
    planeOkHandle(){
        console.log('play music');
        let musicSrc = this.state.musicAddress;
        console.log(musicSrc);
        if(this.checkFileType(musicSrc)){
            let videoTag = document.getElementById('play-audio');
            videoTag.src = musicSrc;
            videoTag.autoplay = true;
            this.setState({popVisible:false});

            let msg = {
                type:'msg',
                typeString:'playMusic',
                roomId:state.homeState.currentRoomInfo.roomId,
                user:state.homeState.userInfo,
                musicSrc:musicSrc
            };
            send(JSON.stringify(msg),function () {
                console.log('send play music msg');
                /*let roomInfo = state.homeState.currentRoomInfo;
                roomInfo.videoSrc = musicSrc;
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
                });*/
            })
        }
    }
    checkFileType(musicSrc){
        if(musicSrc.indexOf('.mp3') || musicSrc.indexOf('.m4a')){
            return true;
        }else{
            return false;
        }

    }
    getContent(){
        return  (<div style={{width:'300px'}}>
            <Input onChange={(e)=>this.musicAddressChange(e)} placeholder={'请输入音乐地址'}/>
            <br/>
            <br/>
            <span style={{display:'flex',justifyContent:'space-between'}}>
                <Button onClick={()=>this.planeCancelHandle()}>取消</Button>
                <Button type={'primary'} onClick={()=>this.planeOkHandle()}>确定</Button>
            </span>
        </div>);
    }
    render(){
        console.log('footer');
        return (<div className ='footer' onClick={e => this.clickHandle(e)}>
            <div>
                <span className={'user-info'}>
                    <img id='avatar-img' src={state.homeState.userInfo.avatar}></img>
                    <span>
                        {this.state.inputVisible ?
                            <span className={'modify-username'}><Input onChange={e=>this.onchangeHandle(e)} onPressEnter={()=>this.onblurHandle()} onBlur={()=>this.onblurHandle()} placeholder={'请输入用户名'}/></span>
                            :
                            <span id={'user-name'}>{this.props.userName}</span>}
                    </span>
                </span>
                <UploadAvatar visible={this.state.visible}
                              title={'修改头像'}
                              handleOk={this.handOk.bind(this)}
                              handleCancel={this.handleCancel.bind(this)}
                >
                </UploadAvatar>
            </div>
            <div>
                <span>
                    <img id='audio-img' src='./images/icons/audio.png' />
                    <div className='sound-slider'>
                        <Slider className='slider' onChange={this.handleSliderAudio} defaultValue={100} />
                    </div>
                </span>
                <span style={{marginLeft:10}}>
                    <img id='microphone-img' src='./images/icons/Microphone_open.png' />
                    <div className='sound-slider'>
                        <Slider defaultValue={100} onChange={this.handleSliderMicrophone} />
                    </div>
                </span>
            </div>
            <div>
                <span style={{marginLeft:80}}>
                    <Button id='open-microphone-btn'
                            disabled={this.micBtnDisabled()}
                            type='primary'>{state.homeState.microphoneOpen?'点击关麦':'点击开麦'}</Button>
                </span>
            </div>
            <div>
                <span id='cheer-span' style={{marginLeft:80}}>欢呼</span>
                <span id='applause-span' style={{marginLeft:10}}>鼓掌</span>
            </div>
            <div className='play-sound'>
                <span>
                    <img id='play-img' src='./images/icons/music.png' />
                    <Popover placement="top"
                             title={'播放网络音乐'}
                             content={this.getContent()}
                             visible={this.state.popVisible}
                             trigger="click">
                    <span id={'play-span'} onClick={()=>this.playMusic()}>播放</span>
                    </Popover>
                </span>
            </div>
            <div className={'cheer-applause-audioBox'}>
                <audio id={'cheer-audio'}></audio>
                <audio id={'applause-audio'}></audio>
                <video id={'play-audio'}></video>
            </div>
        </div>)
    }
}

export default FooterBottom;
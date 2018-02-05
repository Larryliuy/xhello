import React,{ Component } from 'react';
import { message ,Input, Button, Slider } from 'antd';
import UploadAvatar from './UploadAvatar';
import {generalApi} from "../static/apiInfo";
import store, {CONSTANT} from "../reducer/reducer";
import { closeMicrophone, openMicrophone } from '../webrtc/webRtcCom';

let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});
class FooterBottom extends React.Component{
    constructor(props){
        super(props);
        this.state={
            visible: false,
            inputVisible:false,
            inputValue:'',
            audioTrack:'',
            microphoneOpen:true
        }
    }
    clickHandle(e){
        // alert(e.target)
        if(!e.target.id) return;
        console.log(e.target.id);
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
                alert('欢呼');
                break;
            case 'applause-span':
                alert('鼓掌');
                break;
            case 'open-microphone-btn':
                // alert('开启麦克风');
                // myLocalStream
                let audioTrack = state.homeState.myAudioTrack;
                if(this.state.microphoneOpen){
                    closeMicrophone();
                    this.setState({microphoneOpen:false});
                }else{
                    openMicrophone();
                    this.setState({microphoneOpen:true});
                }
                break;
            case 'user-name':
                this.setState({inputVisible:true});
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
        let videoBox = document.getElementById('audioBox').getElementsByTagName('video'),newArr=[];
        for(let i=0; i<videoBox.length; i++ ){
            newArr.push(videoBox[i]);
        }
        newArr.map(function (item) {
            item.volume = value/100;
        })
    }
    handleSliderMicrophone(value){
        // console.log(value);
        if(!value) return;
        //这里设置麦克风声量
        // let videoBox = document.getElementById('audioBox').getElementsByTagName('video'),newArr=[];
        // for(let i=0; i<videoBox.length; i++ ){
        //     newArr.push(videoBox[i]);
        // }
        // newArr.map(function (item) {
        //     item.volume = value/100;
        // })
    }
    render(){
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
                <span style={{marginLeft:80}}><Button id='open-microphone-btn' type='primary'>{this.state.microphoneOpen?'点击关麦':'点击开麦'}</Button></span>
            </div>
            <div>
                <span id='cheer-span' style={{marginLeft:80}}>欢呼</span>
                <span id='applause-span' style={{marginLeft:10}}>鼓掌</span>
            </div>
            <div className='play-sound'>
                <span><img id='play-img' src='./images/icons/music.png' />播放</span>
            </div>
        </div>)
    }
}

export default FooterBottom;
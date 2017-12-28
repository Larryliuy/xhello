import React,{ Component } from 'react';
import { message ,Input, Button, Slider } from 'antd';
import UploadAvatar from './UploadAvatar';

class FooterBottom extends React.Component{
    constructor(props){
        super(props);
        this.state={
            visible: false,
            inputVisible:false,
            inputValue:''
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
                alert('控制音量');
                break;
            case 'microphone-img':
                alert('控制麦克风');
                break;
            case 'cheer-span':
                alert('欢呼');
                break;
            case 'applause-span':
                alert('鼓掌');
                break;
            case 'open-microphone-btn':
                alert('开启麦克风');
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
        //请求修改用户名API
        if(!this.state.inputValue)return;
        console.log(this.state.inputValue);
        message.success('修改成功');
    }
    render(){
        return (<div className ='footer' onClick={e => this.clickHandle(e)}>
            <div>
                <span className={'user-info'}>
                    <img id='avatar-img' src={'./images/avatar.png'}></img>
                    <span>
                        {this.state.inputVisible ?
                            <span className={'modify-username'}><Input onChange={e=>this.onchangeHandle(e)} onPressEnter={()=>this.onblurHandle()} onBlur={()=>this.onblurHandle()} placeholder={'请输入用户名'}/></span>:
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
                        <Slider className='slider' defaultValue={30} />
                    </div>
                </span>
                <span style={{marginLeft:10}}>
                    <img id='microphone-img' src='./images/icons/Microphone_open.png' />
                    <div className='sound-slider'>
                        <Slider defaultValue={30} />
                    </div>
                </span>
            </div>
            <div>
                <span style={{marginLeft:80}}><Button id='open-microphone-btn' type='primary'>点击开麦</Button></span>
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
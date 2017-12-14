import React,{ Component } from 'react';
import { Icon ,message, Button, Slider } from 'antd';

class FooterBottom extends React.Component{
    constructor(props){
        super(props)
    }
    clickHandle(e){
        // alert(e.target)
        if(!e.target.id) return;
        alert(e.target.id);
    }
    render(){
        return (<div className ='footer' onClick={e => this.clickHandle(e)}>
            <div>
                <span className={'user-info'}>
                    <img id='avatar-img' src={'./images/avatar.png'}></img>
                    {this.props.userName}
                    </span>
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
                <span id='huanhu-span' style={{marginLeft:80}}>欢呼</span>
                <span id='guzhang-span' style={{marginLeft:10}}>鼓掌</span>
            </div>
            <div className='play-sound'>
                <span><img id='play-img' src='./images/icons/music.png' />播放</span>
            </div>
        </div>)
    }
}

export default FooterBottom;
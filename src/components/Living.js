import React,{ Component } from 'react';

class Living extends React.Component{
    componentDidMount(){
        // let player =  new TcPlayer('idVideo', {
        //     "m3u8": "http://www.ossrs.net:8080/live/livestream.m3u8",
        //     "flv": "http://19657.liveplay.myqcloud.com/live/19657_ce032fcc56.flv", //增加了一个flv的播放地址，用于PC平台的播放 请替换成实际可用的播放地址
        //     "autoplay" : true,      //iOS下safari浏览器，以及大部分移动端浏览器是不开放视频自动播放这个能力的
        //     "coverpic" : "http://www.test.com/myimage.jpg",
        //     "width" :  '480',//视频的显示宽度，请尽量使用视频分辨率宽度
        //     "height" : '320'//视频的显示高度，请尽量使用视频分辨率高度
        // });
    }
    render(){
        return (
            <div style={{height:'100%',textAlign:'center !important'}}>
                {/*<div id='idVideo' className='video-ele'>*/}

                {/*</div>*/}
                <div>
                        <video id={'myVideo'}
                               style={{position:'relative',width:'100%',height:'100%'}}>不支持video</video>
                        <video id={'theirVideo'}
                               style={{position:'relative',width:'200px',height:'120px'}}>不支持video</video>
                </div>
                <div className='host-text'><p><a href={'http://www.xtell.cn'}>打个小广告</a></p></div>
            </div>
        )
    }
}

export default Living;

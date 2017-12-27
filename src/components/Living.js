import React,{ Component } from 'react';

class Living extends React.Component{
    render(){
        return (
            <div style={{height:'100%'}}>
                <video id='video' className='video-ele' src="movie.ogg" controls="controls">
                    您的浏览器不支持 video 标签。
                </video>
                <div className='host-text'><p><a href={'http://www.baidu.com'}>打个小广告</a></p></div>
            </div>
        )
    }
}

export default Living;

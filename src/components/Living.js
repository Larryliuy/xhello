import React,{ Component } from 'react';

class Living extends React.Component{
    render(){
        return (
            <div style={{height:'100%'}}>
                <video className='video-ele' src="movie.ogg" controls="controls">
                    您的浏览器不支持 video 标签。
                </video>
                <div className='host-text'><p>打个小广告</p></div>
            </div>
        )
    }
}

export default Living;

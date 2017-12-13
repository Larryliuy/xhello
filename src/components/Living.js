import React,{ Component } from 'react';

class Living extends React.Component{
    render(){
        return (
            <div>
                <video src="movie.ogg" controls="controls">
                    您的浏览器不支持 video 标签。
                </video>
            </div>
        )
    }
}

export default Living;
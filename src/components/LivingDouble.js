import React,{ Component } from 'react';

class LivingDouble extends React.Component{
    componentDidMount(){
    }
    render(){
        return (
            <div style={{height:'100%',textAlign:'center !important'}}>
                <div>
                        <video id={'firstVideo'}
                               style={{position:'relative',width:'1px',height:'1px'}}>不支持video</video>
                        <video id={'secondVideo'}
                               style={{position:'relative',width:'1px',height:'1px'}}>不支持video</video>
                    <canvas id={'liveCanvas'} style={{position:'relative',width:'100%',height:'100%'}}></canvas>
                    <audio id={'myAudio'}></audio>
                </div>
                <div className='host-text'><p><a target={'_blank'} href={'http://www.xtell.cn'}>打个小广告:极智未来</a></p></div>
            </div>
        )
    }
}

export default LivingDouble;

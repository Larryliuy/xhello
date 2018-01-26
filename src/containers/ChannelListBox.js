import React,{ Component } from 'react';
import ChannelList from '../components/ChannelList';
import store,{ CONSTANT } from '../reducer/reducer';
import WS,{ getSendData, send } from '../static/webSocket.js';


let state = store.getState();
store.subscribe(function () {
    state = store.getState();
});

const rightClickHandle = (e) => {
    // console.log(state.homeState.userInfo.level);
    if(state.homeState.userInfo.level > 4)return;
    if(e.button !== 2){
        //如果点击的不是右键则隐藏弹窗
        // console.log('no-right');
        store.dispatch({type:CONSTANT.LOCATION,val:{x:0,y:0,display:'none',obj:0}});
    }else{
        const id = e.target.getAttribute('id') || '';
        // console.log(id);
        if(id.indexOf('rc') !== -1) {
            store.dispatch({
                type: CONSTANT.LOCATION,
                val: {x: e.clientX, y: e.clientY, display: 'block', obj: id}
            });
        }else if(id.indexOf('u') !== -1) {
            store.dispatch({
                type: CONSTANT.LOCATION,
                val: {x: e.clientX, y: e.clientY, display: 'block', obj: id}
            });
        }else if(id.indexOf('r') !== -1 && id.indexOf('rc') === -1) {
            //这里为一级房间
            store.dispatch({
                type: CONSTANT.LOCATION,
                val: {x: e.clientX, y: e.clientY, display: 'block', obj: id}
            });
        }else{
            store.dispatch({type:CONSTANT.LOCATION,val:{x:0,y:0,display:'none',obj:0}});
            return;
        }
        let classArr = e.target;
        console.log(classArr);
    }
};

class ChannelListBox extends  React.Component{
    /*state = {
        data:[]
    };*/
    componentDidMount(){
        //发送get_rooms消息
        let getRoomsMsg = {
            type:'get_rooms',
            user:state.homeState.userInfo,
            data:''
        };
        send(JSON.stringify(getRoomsMsg),function () {
            // console.log('get_rooms');
        });

    }
    render(){
        return(
        <div className='channel-list-box'
             onMouseDown={e => rightClickHandle(e)}
        >
            <ChannelList/>
        </div>);
    }
}

export default ChannelListBox;
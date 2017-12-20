import React,{ Component } from 'react';
import ChannelList from '../components/ChannelList';
import store,{ CONSTANT } from '../reducer/reducer';



let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});

const rightClickHandle = (e) => {
    if(e.button !== 2){
        //如果点击的不是右键则隐藏弹窗
        store.dispatch({type:CONSTANT.LOCATION,val:{x:0,y:0,display:'none'}});
    }else{
        const id = e.target.getAttribute('id');
        store.dispatch({type:CONSTANT.LOCATION,val:{x:e.clientX,y:e.clientY,display:'block'}});
        if(id){
            if(id.indexOf('r') !== -1){
                // alert('对房间进行操作');
                //弹出创建频道列表
            }else{
                // alert('对用户进行操作');
                //弹出创建房间或子房间列表
            }
        }
        let classArr = e.target;
        console.log(classArr);
    }
};

const ChannelListBox = () => (
                        <div className='channel-list-box'
                             onMouseDown={e => rightClickHandle(e)}
                        >
                            <ChannelList/>
                        </div>);

export default ChannelListBox;
import React,{ Component } from 'react';
import RightClickPanel from '../components/RightClickPanel';

import store,{ CONTANT } from '../reducer/reducer';

let state = store.getState();
store.subscribe(function(){
    state = store.getState();
});

//点击用户时的数据
const clcikUserData = [
    {title:'人员管理',operate:['封IP','封ID']},
    {title:'权限管理',operate:['副房主','一级管理员','二级管理员','VIP','会员','撤销级别']},
    {title:'禁止操作',operate:['禁止此人文字','禁止此人语音','禁止此人图片']}
    ];
//点击子房间时数据
const clickChildRoomData = [
    {title:'禁止权限',operate:['禁止文字','禁止语音','禁止图片']},
    {title:'删除房间'},
    {title:'房间设置'},
    {title:'排序'},
    {title:'移动到本房间'}
];
//点击房间时数据
const clickRoomData = [
    {title:'创建同级别房间'},
    {title:'创建子房间'},
    {title:'删除房间'}
];
class RightClickPanelBox extends React.Component{
    constructor(props){
        super(props);
    }
    getPlaneByType(type){
        let str = type.toString();
        if(str.indexOf('u') !== -1){
            return clcikUserData;
        }else if(str.indexOf('rc') !== -1){
            return clickChildRoomData;
        }else if(str.indexOf('r') !== -1){
            return clickRoomData;
        }else{
            return [];
        }
    }
    render(){
        return (<div id='right-click'
        style={{position:'absolute',
            // width:'200px',
            // height:'100%',
            display:state.homeState.location.display,
            left:state.homeState.location.x,
            top:state.homeState.location.y}}
        >
            <RightClickPanel listData={this.getPlaneByType(state.homeState.location.obj)}></RightClickPanel>
        </div>)
    }
}

export default RightClickPanelBox;
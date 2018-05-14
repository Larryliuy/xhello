import React,{ Component } from 'react';
import { Icon, Modal } from 'antd';
import VerifyPassword from './VerifyPassword';
import store,{ CONSTANT } from '../reducer/reducer';
import WS,{ getSendData, send, resetIsplaying } from '../static/webSocket.js';
import {getUserIconSrc, getRoomUsersCount, getSingleRoomUserCounts, getRoomUsers} from '../static/comFunctions';
import '../static/login.scss';
import { onLeave, getRoomInfo, getPrepareConnectionState, initVariableAudio } from '../webrtc/webRtcAudio';
import { onLeaveVideo, getPrepareConnectionStateVideo} from '../webrtc/webRtcVideo';

let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});
let intval = null;

let tRoomStatus = {};//本地所有房间的开关状态
class ChannelList extends React.Component{
    constructor(props){
        super(props);
        this.state = {roomStatus:{},
            passwordModal:false,
            roomPassword:'',
            inputPassword:'',
            clickRoomInfo:{id:0,title:'',}};
    }
    componentDidMount(){
        let _this = this;
        //暂时使用定时器解决，后续方案需使用redux-saga解决
        setTimeout(function () {
            _this.initInline();
        },500);

    }
    initInline(){
        const datas = state.homeState.allRoomList,_this=this;
        if(datas.length !== 0){
            tRoomStatus['r'+datas[0].roomId] = true;
            tRoomStatus['rc'+datas[0].childNode[0].roomId] = true;
            let firstRoom = datas[0].childNode[0];
            // console.log('crid：'+state.homeState.currentRoomInfo.id);
            //判断用户是否在房间里 && WS.send(JSON.stringify({type:'in_room'}))
            if(firstRoom.roomId){
                let data = state.homeState.userInfo.name + '<p>进入了房间</p>',
                    enterMsg = getSendData(
                        'enter_room',
                        firstRoom.roomId,
                        firstRoom.roomName,
                        state.homeState.userInfo,
                        data);
                send(JSON.stringify(enterMsg),function(){
                    // getRoomUserList(startOnline);
                    getRoomInfo(firstRoom.roomId);
                });
                //需要默认将默认房间信息更新到当前房间
            }else{
                console.log('房间id不存在');
                clearInterval(intval);
            }
            // _this.setState({roomStatus:tRoomStatus});
            store.dispatch({type:CONSTANT.ROOMSTATUS,val:tRoomStatus});
        }else{
            setTimeout(function () {
                _this.initInline();
            },1000);
        }
    }
    componentWillUnmount(){
        //页面卸载是关闭聊天室连接
        WS.close();
    }
    //这里做分离自己进入房间事件，其他人进入房间进去，封装一个getList
    switchRoom(roomIdInt,roomName){
        if(!roomIdInt || !roomName) return;
            //离开上一个聊天室
        let userInfo = state.homeState.userInfo;
        let data = userInfo.name + '<p>离开了房间</p>' + state.homeState.lastRoomInfo.title,
            leaveMsg = getSendData(
                'leave_room',
                state.homeState.currentRoomInfo.roomId,
                state.homeState.currentRoomInfo.roomName,
                userInfo,
                data);
        // console.log(leaveMsg);
        send(JSON.stringify(leaveMsg),function(){
            resetIsplaying();
            store.dispatch({type:CONSTANT.NUMBERONE,val:0});
            setTimeout(function () {
                if(getPrepareConnectionState()){
                    onLeave(state.homeState.userInfo);
                    initVariableAudio();
                }
                if(getPrepareConnectionStateVideo()){
                    onLeaveVideo(state.homeState.userInfo);
                }
            },200);
        });
        //离开后标记离开的房间为最后一次房间
        store.dispatch({type:CONSTANT.LASTROOMINFO,val:state.homeState.currentRoomInfo});
        // 进入该房间聊天室
        // console.log(state.homeState.lastRoomInfo);
        // console.log(roomIdInt+','+roomName);
        data ='<p>'+ state.homeState.userInfo.name + '进入了房间' +'</p>';
        userInfo.Children = [];
        let enterMsg = getSendData(
            'enter_room',
            roomIdInt,
            roomName,
            userInfo,
            data);
        // WS.send(JSON.stringify(enterMsg));
        send(JSON.stringify(enterMsg),function(){
        });
        //进入房间，更新当前房间信息
        state.homeState.allRoomList.map(function(item){
            if(item.childNode){
                item.childNode.map(function (item) {
                    if(parseInt(item.roomId) === roomIdInt){
                        // alert('set');
                        store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:item});
                    }
                    return item;
                });
            }
        });

        // let tRoomState = this.state.roomStatus;
        let tRoomState = state.homeState.roomStatus;
        if(!state.homeState.roomStatus['rc'+roomIdInt]){
            tRoomState['rc'+roomIdInt] = true;
        }
        // this.setState({roomStatus:tRoomState});
        store.dispatch({type:CONSTANT.ROOMSTATUS,val:tRoomStatus});
        getRoomInfo(roomIdInt.toString());
    }
    dblClickHandle(event){
        // if(event.target.id.indexOf('rc') === -1)return;
        const _this = this;
        let roomId = parseInt(event.target.id)? ('rc'+parseInt(event.target.id)) :  event.target.id;
        let roomIdInt = parseInt(roomId.substring(2,roomId.length));
        let roomName = event.target.innerText;
        this.setState({clickRoomInfo:{id:roomIdInt,title:roomName}});
        // console.log(roomId,roomName);
        // console.log(state.homeState.userInfo);
        // console.log(state.homeState.currentRoomInfo);
        //如果双击的不是房间则直接返回
        // console.log(state.homeState.currentRoomInfo.roomId+','+roomId);
        if(roomId.indexOf('rc') === -1 || ('rc'+state.homeState.currentRoomInfo.roomId) === roomId ) return;
        //权限不够给提示
        //参数：roomId
        //返回值：data
        // console.log(channelId);
        state.homeState.allRoomList.map(function(item){
            if(item.childNode){
                item.childNode.map(function (item) {
                    if('rc'+item.roomId === roomId){
                        if(item.password){
                            _this.setState({passwordModal:true});
                            _this.setState({roomPassword:item.password});
                            return;
                        }else{
                            // console.log(roomIdInt+','+roomName);
                            _this.switchRoom(roomIdInt,roomName);
                        }
                    }
                });
            }
            });
    }
    /*rightClickHandle = (e) =>{

    };*/
    clickOpenHandle(e){
        const roomId = e.target.parentNode.parentNode.getAttribute('id');
        if(!roomId){console.log(roomId);return;}
        let tRoomState = state.homeState.roomStatus;
        if(state.homeState.roomStatus[roomId]){
            tRoomState[roomId] = false;
        }else{
            try{
                if(roomId.indexOf('rc') !== -1){
                    console.log(roomId.substring(2));
                    getRoomUsers(roomId.substring(2));
                }
            }catch (e){
                console.error(e);
            }
            tRoomState[roomId] = true;
        }
        // this.setState({roomStatus:tRoomState});
        store.dispatch({type:CONSTANT.ROOMSTATUS,val:tRoomStatus});
    }
    setRoomPassword(value){
        this.setState({inputPassword:value});
    }
    handleOk(){
        //如果密码正确,则进入房间
        // console.log(typeof this.state.roomPassword+':'+typeof this.state.inputPassword);
        if(this.state.roomPassword === this.state.inputPassword){
            this.setState({passwordModal:false});
            this.switchRoom(this.state.clickRoomInfo.id,this.state.clickRoomInfo.title);
        }else{
            Modal.info({
                title:'密码错误'
            });
        }
    }
    handleCancel(){
        this.setState({passwordModal:false});
    }
    render(){
        const { roomStatus } = state.homeState;
        const clickOpenHandle = this.clickOpenHandle;

        return (
            <div style={{paddingLeft:'20px',minWidth:'240px',overflowX:'scroll',height:'100%'}}
                 onDoubleClick={this.dblClickHandle}
                 // onMouseDown={this.rightClickHandle}
                 className='channel-list'
            >
                <ul>
                {state.homeState.allRoomList && state.homeState.allRoomList.map(function (item) {
                    return <li id={'r'+item.roomId} key={'r'+item.roomId}>
                        <span onClick={clickOpenHandle}><Icon type={roomStatus['r'+item.roomId] ?'minus' : 'plus'} /> </span>
                        <span id={item.roomId+'r'} style={{color:item.color}}>{item.roomName}</span><span className={'room-online-count'}>{' ('+getRoomUsersCount(item.childNode)+')'}</span>
                        {roomStatus['r'+item.roomId] && item.childNode &&
                        <ul style={{paddingLeft:'10px'}}>
                            {item.childNode.map(function (item) {
                                // console.log(item)
                                return <li id={'rc'+item.roomId} key={'rc'+item.roomId}>
                                    <span onClick={clickOpenHandle}><Icon type={roomStatus['rc'+item.roomId] ?'minus' : 'plus'} /></span>
                                    <span id={item.roomId+'rc'} style={{color:item.color}}>{item.roomName}</span><span className={'room-online-count'}>{' ('+item.totalClients+')'}</span>
                                    {roomStatus['rc'+item.roomId] && item.childNode &&
                                    <ul style={{paddingLeft:'15px'}}>
                                        {item.childNode.map(function (item) {
                                            // console.log(item)
                                            return <li className={'user-list-li'} id={'u'+item.id} data-level={item.level} key={'u'+item.id}>
                                                <span>
                                                    <span className='user-icon'><img src={getUserIconSrc(item.sex,item.level)} /></span>
                                                    {item.name}
                                                </span>
                                                <span><Icon style={{color:state.homeState.microphoneInputUsers[item.id]?'green':'#fff'}} type='sound' /></span>
                                            </li>;
                                        })}
                                    </ul>}
                                    </li>;
                            })}
                        </ul>}
                        </li>;
                })}
                </ul>
                <VerifyPassword visible={this.state.passwordModal}
                                handleCancel={this.handleCancel.bind(this)}
                                setRoomPassword = {this.setRoomPassword.bind(this)}
                                handleOk={this.handleOk.bind(this)}
                >
                </VerifyPassword>
            </div>
        );
    }
}

export default ChannelList;

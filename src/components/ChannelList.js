import React,{ Component } from 'react';
import { Icon, Modal } from 'antd';
import VerifyPassword from './VerifyPassword';
import store,{ CONSTANT } from '../reducer/reducer';
import WS,{ getSendData, send } from  '../static/wsInstace.js';
import '../static/login.scss';

let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});
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
        //数据从父组件来
        let _this = this;
        //暂时使用定时器解决，后续方案需使用redux-saga解决
        setTimeout(function () {
            if(state.homeState.allRoomList.length !== 0){
                const datas = state.homeState.allRoomList;
                console.log(datas);
                if(datas.length === 0)return;
                //更新当前房间信息
                /*console.log(state.homeState.userInfo);
                console.log(datas);
                console.log(state.homeState.currentRoomInfo);*/
                tRoomStatus['r'+datas[0].roomId] = true;
                tRoomStatus['rc'+datas[0].childNode[0].roomId] = true;

                // console.log('crid：'+state.homeState.currentRoomInfo.id);
                //判断用户是否在房间里 && WS.send(JSON.stringify({type:'in_room'}))
                if(state.homeState.currentRoomInfo.roomId){
                    let data = state.homeState.userInfo.name + "<p>进入了房间</p>" + state.homeState.currentRoomInfo.title,
                        enterMsg = getSendData(
                            'enter_room',
                            state.homeState.currentRoomInfo.roomId,
                            state.homeState.currentRoomInfo.roomName,
                            state.homeState.userInfo,
                            data);
                    // WS.send(JSON.stringify(enterMsg));
                    send(JSON.stringify(enterMsg),function(){
                    });
                    //获取房间里用户列表信息
                    let getUsersInfo = getSendData(
                        'get_room_users',
                        state.homeState.currentRoomInfo.roomId,
                        state.homeState.currentRoomInfo.roomName,
                        state.homeState.userInfo,
                        data);
                    // WS.send(JSON.stringify(enterMsg));
                    send(JSON.stringify(getUsersInfo),function(){

                    });
                    //需要默认将默认房间信息更新到当前房间

                }else{
                    console.log('房间id不存在');
                }
                _this.setState({roomStatus:tRoomStatus});
            }
        },300);

    }

    componentWillUnmount(){
        //页面卸载是关闭聊天室连接
        if(WS){
            let data =  state.homeState.userInfo.name + "<p>离开了房间</p>" + state.homeState.currentRoomInfo.title ;
            send(JSON.stringify(getSendData('leave_room',
                state.homeState.currentRoomInfo.roomId,
                state.homeState.currentRoomInfo.roomName,
                state.homeState.userInfo,
                data)),function(){});
            // alert('close');
            // WS.close();
        }
    }
    enterRoom(roomIdInt,roomName){
            //离开上一个聊天室
        let data = state.homeState.userInfo.name + "<p>离开了房间</p>" + state.homeState.lastRoomInfo.title,
            leaveMsg = getSendData(
                'leave_room',
                state.homeState.currentRoomInfo.roomId,
                state.homeState.currentRoomInfo.roomName,
                state.homeState.userInfo,
                data);
        // WS.send(JSON.stringify(enterMsg));
        send(JSON.stringify(leaveMsg),function(){
        });
        //离开后标记离开的房间为最后一次房间
        store.dispatch({type:CONSTANT.LASTROOMINFO,val:state.homeState.currentRoomInfo});
        // 进入该房间聊天室
        console.log(state.homeState.lastRoomInfo);
        console.log(roomIdInt+','+roomName);
        data ="<p>"+ state.homeState.userInfo.name + "进入了房间" + roomName +"</p>";
        let enterMsg = getSendData(
            'enter_room',
            roomIdInt,
            roomName,
            state.homeState.userInfo,
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

        let tRoomState = this.state.roomStatus;
        if(!this.state.roomStatus['rc'+roomIdInt]){
            tRoomState['rc'+roomIdInt] = true;
        }
        this.setState({roomStatus:tRoomState});

        //获取房间里用户列表信息
        let getUsersInfo = getSendData(
            'get_room_users',
            roomIdInt,
            roomName,
            state.homeState.userInfo,
            data);
        // WS.send(JSON.stringify(enterMsg));
        send(JSON.stringify(getUsersInfo),function(){

        });
    }
    dblClickHandle = (event) =>{
        // if(event.target.id.indexOf('rc') === -1)return;
        const _this = this;
        let roomId = parseInt(event.target.id)? ('rc'+parseInt(event.target.id)) :  event.target.id;
        let roomIdInt = parseInt(roomId.substring(2,roomId.length));
        let roomName = event.target.innerText;
        this.setState({clickRoomInfo:{id:roomIdInt,title:roomName}});
        // console.log(event.target.innerText);
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
                            _this.enterRoom(roomIdInt,roomName);
                        }
                    }
                });
            }
            });
    };
    /*rightClickHandle = (e) =>{

    };*/
    clickOpenHandle  = (e) => {
        const roomId = e.target.parentNode.parentNode.getAttribute('id');
        // console.log(roomId);
        let tRoomState = this.state.roomStatus;
        if(this.state.roomStatus[roomId]){
            tRoomState[roomId] = false;
        }else{
            tRoomState[roomId] = true;
        }
        this.setState({roomStatus:tRoomState});
            //打开本地房间列表
        // console.log(this.state.roomStatus);
    };
    setRoomPassword(value){
        this.setState({inputPassword:value});
    }
    handleOk(){
        //如果密码正确,则进入房间
        // console.log(typeof this.state.roomPassword+':'+typeof this.state.inputPassword);
        if(this.state.roomPassword === this.state.inputPassword){
            this.setState({passwordModal:false});
            this.enterRoom(this.state.clickRoomInfo.id,this.state.clickRoomInfo.title);
        }else{
            Modal.info({
                title:'密码错误'
            })
        }

    }
    handleCancel(){
        this.setState({passwordModal:false})
    }
    render(){
        const { roomStatus } = this.state;
        const clickOpenHandle = this.clickOpenHandle;
        const getUserIconSrc = (sex,level) =>{
            let src = '';
            switch(level){
                case 1:
                    /*if(sex === 1){
                        src = 'p_man.png';
                    }else{
                        src = 'p_female.png';
                    }
                    break;*/
                case 2:
                    if(sex === 1){
                        src = 'p_man.png';
                    }else{
                        src = 'p_female.png';
                    }
                    break;
                case 3:
                    if(sex === 1){
                        src = 'admin_man1.png';
                    }else{
                        src = 'admin_female1.png';
                    }
                    break;
                case 4:
                    if(sex === 1){
                        src = 'admin_man2.png';
                    }else{
                        src = 'admin_female2.png';
                    }
                    break;
                case 5:
                    if(sex === 1){
                        src = 'vip_man1.png';
                    }else{
                        src = 'vip_female1.png';
                    }
                    break;
                case 6:
                    if(sex === 1){
                        src = 'vip_man2.png';
                    }else{
                        src = 'vip_female2.png';
                    }
                    break;
                case 7:
                    if(sex === 1){
                        src = 'c_man.png';
                    }else{
                        src = 'c_female.png';
                    }
                    break;
            }
            // console.log(src);
            return "./images/icons/"+src;
        };
        // console.log(state.homeState.allRoomList);
        return (
            <div style={{paddingLeft:'20px',minWidth:'240px',overflowX:'scroll',height:'100%'}}
                 onDoubleClick={this.dblClickHandle}
                 // onMouseDown={this.rightClickHandle}
                 className='channel-list'
            >
                <ul>
                {state.homeState.allRoomList && state.homeState.allRoomList.map(function (item) {
                    return <li id={'r'+item.roomId} key={'r'+item.roomId}>
                        <span onClick={clickOpenHandle}><Icon type={roomStatus['r'+item.roomId] ?"minus" : "plus"} /> </span>
                        <span id={item.roomId+'r'}>{item.roomName}</span>
                        {roomStatus['r'+item.roomId] && item.childNode &&
                        <ul style={{paddingLeft:'10px'}}>
                            {item.childNode.map(function (item) {
                                // console.log(item)
                                return <li id={'rc'+item.roomId} key={'rc'+item.roomId}>
                                    <span onClick={clickOpenHandle}><Icon type={roomStatus['rc'+item.roomId] ?"minus" : "plus"} /></span>
                                    <span id={item.roomId+'rc'}>{item.roomName}</span>
                                    {roomStatus['rc'+item.roomId] && item.childNode &&
                                    <ul style={{paddingLeft:'15px'}}>
                                        {item.childNode.map(function (item) {
                                            // console.log(item)
                                            return <li id={'u'+item.id} key={'u'+item.id}>
                                                <span className='user-icon'><img src={getUserIconSrc(item.sex,item.level)} /></span>
                                                {item.name}
                                            </li>
                                        })}
                                    </ul>}
                                    </li>
                            })}
                        </ul>}
                        </li>
                })}
                </ul>
                <VerifyPassword visible={this.state.passwordModal}
                                handleCancel={this.handleCancel.bind(this)}
                                setRoomPassword = {this.setRoomPassword.bind(this)}
                                handleOk={this.handleOk.bind(this)}
                >
                </VerifyPassword>
            </div>
        )
    }
};

export default ChannelList;

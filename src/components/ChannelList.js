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
let uId = '',
    uName = '',
    uLevel = '',
    uSex = '';
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
        uId = state.homeState.userInfo.id;
        uName = state.homeState.userInfo.userName;
        uLevel = state.homeState.userInfo.level;
        uSex = state.homeState.userInfo.sex;
        // console.log(uId+':'+uName);
        //数据从父组件来
        const datas = [
            {title:'房间1',id:1,living:false,online:15,childNode:[
                    {userName:'用户1',id:1,level:1,sex:1},
                    {userName:'用户2',id:2,level:4,sex:2},
                    {userName:'用户3',id:3,level:3,sex:1}
                ]},
            {title:'房间2',id:2,living:true,online:10,childNode:[
                    {userName:'用户4',id:4,level:4,sex:2},
                    {userName:'用户5',id:5,level:5,sex:1},
                    {userName:'用户6',id:6,level:6,sex:2}
                ]},
            {title:'密码房123',id:3,living:false,online:5,childNode:[],password:'123'},
            {title:'房间4',id:4,living:false,online:10,childNode:[]}
        ];
        datas.map(function(item){
            let messageJSON = {
                type:'create_room',
                roomId: item.id,		//房间唯一标识符
                roomName: item.title,
                userName: uName,
                userId: uId,
                data: {}
            };
            //前端每运行一次就创建一次聊天室了，创建聊天室让服务端去创建；
            send(JSON.stringify(messageJSON),function(){
                //将当前房间的状态设置为打开
                if(item.id === state.homeState.currentRoomInfo.id){
                    tRoomStatus['r'+item.id] = true;
                }else{
                    tRoomStatus['r'+item.id] = false;
                }
                return item;
            });

        });
        // console.log('crid：'+state.homeState.currentRoomInfo.id);
        //判断用户是否在房间里 && WS.send(JSON.stringify({type:'in_room'}))
        if(state.homeState.currentRoomInfo.id){
            let data = uName + "<p>进入了房间</p>" + state.homeState.currentRoomInfo.title,
                enterMsg = getSendData(
                    'enter_room',
                    state.homeState.currentRoomInfo.id,
                    state.homeState.currentRoomInfo.title,
                    uId,
                    uName,
                    uLevel,
                    uSex,
                    state.homeState.userInfo,
                    data);
            // WS.send(JSON.stringify(enterMsg));
            send(JSON.stringify(enterMsg),function(){

            });
            //获取房间里用户列表信息
            let getUsersInfo = getSendData(
                'get_room_users',
                state.homeState.currentRoomInfo.id,
                state.homeState.currentRoomInfo.title,
                uId,
                uName,
                uLevel,
                uSex,
                state.homeState.userInfo,
                data);
            // WS.send(JSON.stringify(enterMsg));
            send(JSON.stringify(getUsersInfo),function(){

            });
            //需要默认将默认房间信息更新到当前房间

        }else{
            console.log('房间id不存在');
        }
        // console.log(tRoomStatus);
        this.setState({roomStatus:tRoomStatus});
        // store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:{id:item.id,online:item.online,living:item.living}});
        store.dispatch({type:CONSTANT.ALLROOMLIST,val:datas});
        // console.log(this.state.roomStatus);
        // console.log(this.state)
    }

    componentWillUnmount(){
        //页面卸载是关闭聊天室连接
        if(WS){
            let data =  uName + "<p>离开了房间</p>" + state.homeState.currentRoomInfo.title ;
            send(JSON.stringify(getSendData('leave_room',
                state.homeState.currentRoomInfo.id,
                state.homeState.currentRoomInfo.title,
                uId,
                uName,
                uLevel,
                uSex,
                state.homeState.userInfo,
                data)),function(){});
            // alert('close');
            // WS.close();
        }
    }
    enterRoom(roomIdInt,roomName){
        //离开上一个聊天室
        let data = uName + "<p>离开了房间</p>" + state.homeState.lastRoomInfo.title,
            leaveMsg = getSendData(
                'leave_room',
                state.homeState.currentRoomInfo.id,
                state.homeState.currentRoomInfo.title,
                uId,
                uName,
                uLevel,
                uSex,
                state.homeState.userInfo,
                data);
        // WS.send(JSON.stringify(enterMsg));
        send(JSON.stringify(leaveMsg),function(){

        });
        // 进入该房间聊天室
        data ="<p>"+ uName + "进入了房间" + roomName +"</p>";
        let enterMsg = getSendData(
            'enter_room',
            roomIdInt,
            roomName,
            uId,
            uName,
            uLevel,
            uSex,
            state.homeState.userInfo,
            data);
        // WS.send(JSON.stringify(enterMsg));
        send(JSON.stringify(enterMsg),function(){

        });
        //进入房间，更新当前房间信息
        state.homeState.allRoomList.map(function(item){
            if((item.id) === roomIdInt){
                store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:{title:item.title,id:item.id,online:item.online,living:item.living}});
            }
            return item;
        });

        let tRoomState = this.state.roomStatus;
        if(!this.state.roomStatus['r'+roomIdInt]){
            tRoomState['r'+roomIdInt] = true;
        }
        this.setState({roomStatus:tRoomState});

        //获取房间里用户列表信息
        let getUsersInfo = getSendData(
            'get_room_users',
            roomIdInt,
            roomName,
            uId,
            uName,
            uLevel,
            uSex,
            state.homeState.userInfo,
            data);
        // WS.send(JSON.stringify(enterMsg));
        send(JSON.stringify(getUsersInfo),function(){

        });
    }
    dblClickHandle = (event) =>{
        const _this = this;
        let roomId = parseInt(event.target.id)? ('r'+parseInt(event.target.id)) :  event.target.id;
        let roomIdInt = parseInt(roomId.substring(1,roomId.length));
        let roomName = event.target.innerText;
        this.setState({clickRoomInfo:{id:roomIdInt,title:roomName}});
        // console.log(event.target.innerText);
        //如果双击的不是房间则直接返回
        if(roomId.indexOf('r') === -1 || ('r'+state.homeState.currentRoomInfo.id) === roomId ) return;
        //权限不够给提示
        //参数：roomId
        //返回值：data
        // console.log(channelId);
        state.homeState.allRoomList.map(function(item){
            if('r'+item.id === roomId){
                if(item.password){
                    _this.setState({passwordModal:true});
                    _this.setState({roomPassword:item.password});
                    return;
                }else{
                    _this.enterRoom(roomIdInt,roomName);
                }
            }
            });

    };
    rightClickHandle = (e) =>{

    };
    clickOpenHandle  = (e) => {
        const roomId = e.target.parentNode.parentNode.getAttribute('id');
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
        console.log(typeof this.state.roomPassword+':'+typeof this.state.inputPassword);
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
                case 7:
                    if(sex === 1){
                        src = 'c_man.png';
                    }else{
                        src = 'c_female.png';
                    }
                    break;
            }
            return "./images/icons/"+src;
        };
        return (
            <div style={{paddingLeft:'20px',width:240,height:'100%'}}
                 onDoubleClick={this.dblClickHandle}
                 onMouseDown={this.rightClickHandle}
                 className='channel-list'
            >
                <ul>
                {state.homeState.allRoomList.map(function (item) {
                    return <li id={'r'+item.id} key={item.id}>
                        <span onClick={clickOpenHandle}><Icon type={roomStatus['r'+item.id] ?"minus" : "plus"} /> </span>
                        <span id={item.id+'r'}>{item.title}</span>
                        {roomStatus['r'+item.id] && item.childNode &&
                        <ul style={{paddingLeft:'10px'}}>
                            {item.childNode.map(function (item) {
                                // console.log(item)
                                return <li id={item.id} key={item.id}>
                                    <span className='user-icon'><img src={getUserIconSrc(item.sex,item.level)} /></span>
                                    {item.userName}
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

import React,{ Component } from 'react';
import { Card, Popover, List, Modal, message } from 'antd';
const confirm = Modal.confirm;
import CreateRoom from './CreateRoom';
import SetRoom from './SetRoom';
import SortRoom from './SortRoom';
import { getSendData, send } from '../static/webSocket.js';
import { deleteRoomById } from '../static/comFunctions';
import store, {CONSTANT} from "../reducer/reducer";
import {generalApi, blockUserApi} from "../static/apiInfo";
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
});

class RightClickPanel extends React.Component{
    constructor(props){
        super(props);
        this.state = {display:'none',operate:[],createRoom:false,setRoom:false,sortRoom:false,roomType:1,roomInfo:{}}
    }
    setCreateRoomVisible(){
        this.setState({createRoom:false})
    }
    setSetRoomVisible(){
        this.setState({setRoom:false})
    }
    setSortRoomVisible(){
        this.setState({sortRoom:false})
    }
    componentWillMount(){
        // this.setState({operate:operateData});
    }
    mouseOverHandle(e){
        //鼠标进入选项时弹出相应的操作
        let _this = this;
        if(e.target.getAttribute('class').indexOf('ant-list-item') === 0){
            let text = e.target.firstChild.innerText || e.target.innerText;
            // console.log(text);
            //包含‘移动’和‘房间’字眼的是没有联级菜单的，设置不显示
            if(text && text.indexOf('移动') === -1 && text.indexOf('房间') === -1 && text.indexOf('排序') === -1){
                this.props.listData.map(function(item){
                    if(item.title === text){
                        _this.setState({display:'block',operate:item.operate});
                    }
                });
            }else{
                _this.setState({display:'none'});
            }
        }
    }
    componentWillReceiveProps(nextProps){
        console.log(nextProps);
        if(nextProps.listData === this.props.listData)return;
        this.setState({display:'none'});
    }
    clickHandle(e){
        let _this = this;
        if(e.target.getAttribute('class').indexOf('ant-list-item') === 0) {
            let text = e.target.firstChild.innerText || e.target.innerText,
                objId = state.homeState.location.obj,
                Msg,
                allRoomListTmp = state.homeState.allRoomList;
            if(parseInt(objId.substring(1)) <= state.homeState.userInfo.id){
                message.warning('不能操作等级相同或比您高的用户');
                return;
            }
            //提升用户等级时更新用户等级信息
            function updateByPower(level) {
                let allRoomList = state.homeState.allRoomList;
                allRoomList.map(function (item1) {
                    item1.childNode.map(function (item) {
                        if(item.roomId === state.homeState.currentRoomInfo.roomId){
                            item.childNode.map(function (itm) {
                                if(itm.id === objId.substring(1)){
                                    itm.level = level;
                                }
                            })
                        }
                    })
                });
                // console.log(allRoomList);
                store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomList});
            }
            function limitFetch(args) {
                fetch(generalApi,{
                    method:'POST',
                    // credentials: "include",
                    headers:{
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body:args//JSON.stringify(args)
                }).then((response) => {/*console.log(response);*/return response.text()})
                    .then(data=>{
                        console.log(data);
                        let datatmp;
                        try {
                            datatmp = JSON.parse(data);
                            //JSON.parse没问题的情况
                            console.log(datatmp);
                            if(datatmp.status === 'ok'){
                                message.success('设置成功');
                            }else {
                                message.error('设置失败');
                            }
                        }catch (e){
                            //JSON.parse有问题的情况,手动截取返回信息中JSON字符串
                            datatmp = JSON.parse(data.substring(data.indexOf('{')));
                            console.log(datatmp);
                            if(datatmp.status === 'ok'){
                                message.success('设置成功');
                            }else {
                                message.error('设置失败');
                            }
                        }

                    }).catch(err=>{
                    console.log(err);
                });
            }
            let args ='';
            // console.log(text);
            switch(text){
                case '移动到我所在房间':
                    //移动时需要确认，先离开原先的房间，进入到我所在的当前房间,//健壮性
                    let objRoomInfo={},objUserInfo={};
                    console.log(state.homeState.allRoomList);
                    state.homeState.allRoomList.map(function (item) {
                        item.childNode.map(function (cItem) {
                            if(cItem.childNode.length !== 0){
                                cItem.childNode.map(function (uItem) {
                                    // console.log(uItem.id+','+objId.substring(1));
                                    if(!uItem.id)return;
                                    if(uItem.id.toString() === objId.substring(1)){
                                        objRoomInfo = cItem;
                                        objUserInfo = uItem;
                                        // console.log(objUserInfo);
                                    }
                                })
                            }
                        })
                    });
                    // console.log(objRoomInfo);
                    // console.log(objUserInfo);
                    Msg={
                        type:'msg',
                        typeString:'moveToRoom',
                        roomId:objRoomInfo.roomId,
                        roomName:objRoomInfo.roomName,
                        user:objUserInfo,
                        objRoomInfo:state.homeState.currentRoomInfo
                    };
                    // console.log(Msg);
                    send(JSON.stringify(Msg),function(){
                        //删除自己视图中目标对象，更新下allRoomList
                        allRoomListTmp.map(function (item) {
                            item.childNode.map(function (cTtem) {
                                if(cTtem.roomId === objRoomInfo.roomId){
                                    cTtem.childNode = cTtem.childNode.filter(function (uItem) {
                                        // console.log(uItem.id+','+objUserInfo.id);
                                        return uItem.id !== objUserInfo.id;
                                    })
                                }
                            })
                        });
                        // console.log(allRoomListTmp);
                        store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
                    });

                    break;
                case '封IP':
                    let blockMsg = {
                        type:'msg',
                        typeString:'blockIp',
                        ToUserOnly:objId.substring(1),
                        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                        user:state.homeState.userInfo
                    };
                    send(JSON.stringify(blockMsg),function () {
                        console.log('发送封IP消息');
                        message.success('禁止成功');
                    });
                    break;
                case '封ID':
                    //直接插入表backlist
                    console.log(objId);
                    let userId = objId.substring(1);
                    let args = "?action=get&table=xuser&cond=Id="+userId;
                    fetch(generalApi+args)
                        .then(res=>res.json())
                        .then(data=>{
                            console.log(data);
                            let userInfo = data.data[0];
                            console.log(userInfo);
                            args = "?username="+userInfo.LoginName;
                            fetch(blockUserApi+args).then(res=>{message.success('禁止成功');}).catch(e=>console.error(e));
                        })
                        .catch(e=>console.error(e));
                    break;
                case '禁止此人图片':
                    // console.log(objId);
                    Msg = {
                        type:'msg',
                        typeString:'uLimit',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
                        objUserId:objId.substring(1),
                        limit:2
                    };
                    send(JSON.stringify(Msg),function(){
                        //http请求修改数据
                        args = 'action=update&table=xuser&cond=id='+objId.substring(1)+'&Limit=2';
                        limitFetch(args);
                    });
                    break;
                case '禁止此人语音':
                    Msg = {
                        type:'msg',
                        typeString:'uLimit',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
                        objUserId:objId.substring(1),
                        limit:3
                    };
                    send(JSON.stringify(Msg),function(){
                        //http请求修改数据
                        args = 'action=update&table=xuser&cond=id='+objId.substring(1)+'&Limit=3';
                        limitFetch(args);
                    });

                    break;
                case '禁止此人文字':
                    Msg = {
                        type:'msg',
                        typeString:'uLimit',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
                        objUserId:objId.substring(1),
                        limit:1
                    };
                    send(JSON.stringify(Msg),function(){
                        //http请求修改数据
                        args = 'action=update&table=xuser&cond=id='+objId.substring(1)+'&Limit=1';
                        limitFetch(args);
                    });

                    break;
                case '取消此人禁止':
                    Msg = {
                        type:'msg',
                        typeString:'uLimit',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
                        objUserId:objId.substring(1),
                        limit:0
                    };
                    send(JSON.stringify(Msg),function(){
                        //http请求修改数据
                        args = 'action=update&table=xuser&cond=id='+objId.substring(1)+'&Limit=0';
                        limitFetch(args);
                    });

                    break;
                case '一级管理员':
                    Msg = {
                        type:'msg',
                        typeString:'uPower',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
                        objUserId:objId.substring(1),
                        level:3
                    };
                    send(JSON.stringify(Msg),function(){
                        updateByPower(3);
                        //http请求修改数据
                        let args = 'action=update&table=xuser&cond=id='+objId.substring(1)+'&Type=3';
                        limitFetch(args);
                    });

                    break;
                case '二级管理员':
                    Msg = {
                        type:'msg',
                        typeString:'uPower',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
                        objUserId:objId.substring(1),
                        level:4
                    };
                    send(JSON.stringify(Msg),function(){
                        updateByPower(4);
                        //http请求修改数据
                        let args = 'action=update&table=xuser&cond=id='+objId.substring(1)+'&Type=4';
                        limitFetch(args);
                    });

                    break;
                case '副房主':
                    Msg = {
                        type:'msg',
                        typeString:'uPower',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
                        objUserId:objId.substring(1),
                        level:2
                    };
                    send(JSON.stringify(Msg),function(){
                        updateByPower(2);
                        //http请求修改数据
                        let args = 'action=update&table=xuser&cond=id='+objId.substring(1)+'&Type=2';
                        limitFetch(args);
                    });

                    break;
                case 'VIP':
                    Msg = {
                        type:'msg',
                        typeString:'uPower',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
                        objUserId:objId.substring(1),
                        level:5
                    };
                    send(JSON.stringify(Msg),function(){
                        updateByPower(5);
                        //http请求修改数据
                        let args = 'action=update&table=xuser&cond=id='+objId.substring(1)+'&Type=5';
                        limitFetch(args);
                    });
                    break;
                case '会员':
                    Msg = {
                        type:'msg',
                        typeString:'uPower',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
                        objUserId:objId.substring(1),
                        level:6
                    };
                    send(JSON.stringify(Msg),function(){
                        updateByPower(6);
                        //http请求修改数据
                        let args = 'action=update&table=xuser&cond=id='+objId.substring(1)+'&Type=6';
                        limitFetch(args);
                    });

                    break;
                case '撤销级别':
                    Msg = {
                        type:'msg',
                        typeString:'uPower',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
                        objUserId:objId.substring(1),
                        level:7
                    };
                    send(JSON.stringify(Msg),function(){
                        updateByPower(7);
                        //http请求修改数据
                        let args = 'action=update&table=xuser&cond=id='+objId.substring(1)+'&Type=7';
                        limitFetch(args);
                    });

                break;
                case '禁止图片':
                    Msg = {
                        type:'msg',
                        typeString:'rLimit',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
                        objRoomId:parseInt(objId) || objId.substring(2),//这里只有子房间才有效
                        limit:2
                    };
                    send(JSON.stringify(Msg),function(){
                        //http请求修改数据
                        let args = 'action=update&table=room&cond=id='+(parseInt(objId) || objId.substring(2))+'&limited=2';
                        limitFetch(args);
                    });
                    break;
                case '禁止语音':
                    Msg = {
                        type:'msg',
                        typeString:'rLimit',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
                        objRoomId:parseInt(objId) || objId.substring(2),
                        limit:3
                    };
                    send(JSON.stringify(Msg),function(){
                        //http请求修改数据
                        let args = 'action=update&table=room&cond=id='+(parseInt(objId) || objId.substring(2))+'&limited=3';
                        limitFetch(args);
                    });
                    break;
                case '禁止文字':
                    console.log(objId);
                    Msg = {
                        type:'msg',
                        typeString:'rLimit',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
                        objRoomId:parseInt(objId) || objId.substring(2),
                        limit:1
                    };
                    send(JSON.stringify(Msg),function(){
                        //http请求修改数据
                        let args = 'action=update&table=room&cond=id='+(parseInt(objId) || objId.substring(2))+'&limited=1';
                        limitFetch(args);
                        console.log(args)
                    });
                    break;
                case '取消禁止':
                    // console.log(objId);
                    Msg = {
                        type:'msg',
                        typeString:'rLimit',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
                        objRoomId:parseInt(objId) || objId.substring(2),
                        limit:0
                    };
                    send(JSON.stringify(Msg),function(){
                        //http请求修改数据
                        let args = 'action=update&table=room&cond=id='+(parseInt(objId) || objId.substring(2))+'&limited=0';
                        limitFetch(args);
                        console.log(args)
                    });
                    break;
                case '创建同级别房间':
                    // alert(text);
                    _this.setState({createRoom:true});
                    break;
                case '创建子房间':
                    // alert(text);
                    _this.setState({createRoom:true});
                    _this.setState({roomType:2});
                    break;
                case '删除房间':
                    // let roomId = objId;
                    if(objId.indexOf('rc') !== -1){
                        if(parseInt(objId)){
                            objId = objId.substring(0,objId.indexOf('rc'));
                        }else{
                            objId = objId.substring(2);
                        }

                    }else if(objId.indexOf('r') !== -1){
                        if(parseInt(objId)){
                            objId = objId.substring(0,objId.indexOf('r'));
                        }else{
                            objId = objId.substring(1);
                        }
                    }else{
                        return;
                    }
                    console.log(objId);
                    confirm({
                        title:'删除房间会影响房间内用户，确认删除吗？',
                        // content: '',
                        okText: '确认',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk() {
                            console.log('OK');
                            let deleteMsg = {
                                type:'delete_room',
                                roomId:objId,
                                user:state.homeState.userInfo
                            };
                            send(JSON.stringify(deleteMsg),function () {
                                deleteRoomById(objId);
                                //删除完成后获取最新的房间列表
                                let getRoomsMsg = {
                                    type:'get_rooms',
                                    user:state.homeState.userInfo,
                                    data:''
                                };
                                send(JSON.stringify(getRoomsMsg),function () {
                                    let enterMsg = getSendData(
                                        'enter_room',
                                        state.homeState.currentRoomInfo.roomId,
                                        state.homeState.currentRoomInfo.roomName,
                                        state.homeState.userInfo);
                                    // WS.send(JSON.stringify(enterMsg));
                                    send(JSON.stringify(enterMsg),function(){

                                    });
                                });
                            });
                        },
                        onCancel() {
                            console.log('Cancel');
                        },});
                    break;
                case '房间设置':
                    this.setState({setRoom:true});
                    // let id = state.homeState.location.obj;
                    if(objId.indexOf('rc') !== -1){
                        if(parseInt(objId)){
                            objId = objId.substring(0,objId.indexOf('rc'));
                        }else{
                            objId = objId.substring(2);
                        }

                    }else if(objId.indexOf('r') !== -1){
                        if(parseInt(objId)){
                            objId = objId.substring(0,objId.indexOf('r'));
                        }else{
                            objId = objId.substring(1);
                        }
                    }else{
                        return;
                    }
                    console.log(objId);
                    this.setState({roomInfo:{id:objId}});
                    break;
                case '子房间排序':
                    //选中获取元素id（即房间id），然后建一个临时AllRoomList用于更新排序列表，
                    // 点确定按钮更新到state.homeState.allRoomList.
                    this.setState({sortRoom:true});
                    if(objId.indexOf('rc') !== -1){
                        if(parseInt(objId)){
                            objId = objId.substring(0,objId.indexOf('rc'));
                        }else{
                            objId = objId.substring(2);
                        }

                    }else if(objId.indexOf('r') !== -1){
                        if(parseInt(objId)){
                            objId = objId.substring(0,objId.indexOf('r'));
                        }else{
                            objId = objId.substring(1);
                        }
                    }else{
                        return;
                    }
                    console.log(objId);
                    this.setState({roomInfo:{id:objId}});
                    break;
                default:
                    break;
            }
        }
    }
    render(){

        return (<div className={'right-click'}
                     onClick={e => this.clickHandle(e)}
        >
                    <Card bodyStyle={{padding:0}}>

                    <List
                        onMouseOver={e=>this.mouseOverHandle(e)}
                        className={'right-panel'}
                        size="small"
                        bordered
                        dataSource={this.props.listData}
                        renderItem={item => (<List.Item>{item.title}</List.Item>)}
                    /> </Card>
                    <Card bodyStyle={{padding:0,height:'100%',display:this.state.display}}
                    >
                    <List
                        className={'right-panel-item'}
                        size="small"
                        bordered
                        dataSource={this.state.operate}
                        renderItem={item => (<List.Item>{item}</List.Item>)}
                    /> </Card>
            {this.state.createRoom && <CreateRoom roomType={this.state.roomType} setVisible={this.setCreateRoomVisible.bind(this)}></CreateRoom>}
            {this.state.setRoom && <SetRoom roomInfo={this.state.roomInfo} setVisible={this.setSetRoomVisible.bind(this)}></SetRoom>}
            {this.state.sortRoom && <SortRoom roomInfo={this.state.roomInfo} setVisible={this.setSortRoomVisible.bind(this)}></SortRoom>}

        </div>)
    }
}

export default RightClickPanel;
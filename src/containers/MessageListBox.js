import React,{ Component } from 'react'
import MessageList from '../components/MessageList'
import WS, {getDateString, getSendData, send} from "../static/wsInstace";


import store,{ CONSTANT } from '../reducer/reducer';
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});

let uId = '',
    uName = '',
    uLevel = '',
    uSex = '';

// let _this = null;
class MessageListBox extends React.Component{
    constructor(props) {
        super(props);
        this.state={data:[]};
    }
    scrollToBottom(){
        setTimeout(function(){
            let mb = document.getElementById('messageBox');
            if(!mb) return;
            mb.scrollTop = mb.scrollHeight || 0;
            /*this.refs.messageBox.scrollTop = this.refs.messageBox.clientHeight;
            // window.scrollTo(0,this.refs.messageBox.clientHeight);
            console.log('hello:'+this.refs.messageBox.clientHeight);*/
        },100);
    }
    componentDidMount(){
        uId = state.homeState.userInfo.id;
        uName = state.homeState.userInfo.name;
        uLevel = state.homeState.userInfo.level;
        uSex = state.homeState.userInfo.sex;

        //data为消息数据
        let data = [{username:'larry',time:'2017-12-11 13:12',data:'欢迎欢迎'}];
        let _this = this;
        this.setState({data:data});
        this.scrollToBottom();

        WS.onmessage = function(response){
            if(!response) return ;
            let dataJson = JSON.parse(response.data);
            // if(dataJson.result !== 'ok') return ;
            // console.log(dataJson);
            let allRoomListTmp = [];
            switch(dataJson.type){
                case 'msg':
                    // console.log(dataJson);
                    if(dataJson.typeString === '放麦'){
                        let userData = state.homeState.roomMicrophoneUser;
                        // console.log(state.homeState.roomMicrophoneUser);
                        userData.push(dataJson.user);
                        store.dispatch({type:CONSTANT.ROOMMICROPHONEUSER,val:userData});
                        return;
                    }
                    if(dataJson.typeString === '离麦'){
                        let userData = state.homeState.roomMicrophoneUser;
                        // console.log(state.homeState.roomMicrophoneUser);
                        let tmp = userData.filter(function(item){
                            return item.id !== dataJson.user.id;
                        });
                        store.dispatch({type:CONSTANT.ROOMMICROPHONEUSER,val:tmp});
                        return;
                    }
                    if(dataJson.typeString === '禁麦'){
                        // console.log('禁麦');
                        return;
                    }
                    //调整用户限制
                    // console.log(dataJson);
                    if(dataJson.typeString === 'uLimit'){
                        console.log(dataJson);
                        console.log(state.homeState.userInfo);
                        if(dataJson.objUserId === state.homeState.userInfo.id){
                            //设置state.homeState.userInfo
                            let userInfoTmp = state.homeState.userInfo;
                            userInfoTmp.limit = dataJson.limit;
                            store.dispatch({type:CONSTANT.USERINFO,val:userInfoTmp});
                        }
                        return;
                    }
                    //调整房间限制
                    if(dataJson.typeString === 'rLimit'){
                        console.log(dataJson);
                        console.log(dataJson.objRoomId+','+state.homeState.currentRoomInfo.roomId);
                        if(dataJson.objRoomId === state.homeState.currentRoomInfo.roomId){
                            //设置state.homeState.userInfo
                            let currentRoomInfoTmp = state.homeState.currentRoomInfo;
                            console.log(currentRoomInfoTmp);
                            currentRoomInfoTmp.limited = dataJson.limit;
                            store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:currentRoomInfoTmp});
                            //可能需要更新allRoomList中的user
                        }
                        return;
                    }
                    if(dataJson.typeString === 'uPower'){
                        console.log(dataJson);
                        console.log(state.homeState.userInfo);
                        if(dataJson.objUserId === state.homeState.userInfo.id){
                            //设置state.homeState.userInfo
                            let userInfoTmp = state.homeState.userInfo,
                                allRoomList = state.homeState.allRoomList;
                            userInfoTmp.level = dataJson.level;
                            store.dispatch({type:CONSTANT.USERINFO,val:userInfoTmp});
                            //设置state.homeState.allRoomList
                            allRoomList.map(function (item1) {
                                item1.childNode.map(function (item) {
                                    // console.log(item.roomId+','+dataJson.roomId);
                                    if(item.roomId === dataJson.roomId){
                                        item.childNode.map(function (itm) {
                                            // console.log(itm.id+','+dataJson.objUserId);
                                            if(itm.id === dataJson.objUserId){
                                                itm.level = dataJson.level;
                                            }
                                        })
                                    }
                                })
                            });
                            // console.log(allRoomList);
                            store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomList});
                        }
                        return;
                    }
                    //消息撤回
                    if(dataJson.typeString === 'withdraw'){
                        /*console.log(data);
                        console.log(dataJson);*/
                        data = data.filter(function (item) {
                            if(item.timeStamp && item.timeStamp.toString() === dataJson.timeStamp){
                                // console.log(item.timeStamp.toString() === dataJson.timeStamp);
                                return;
                            }else{
                                return item;
                            }
                        });
                        // return;
                    }
                    // console.log(dataJson);
                    if (dataJson.typeString !== 'withdraw') {
                        if (dataJson.data === '消息成功发出') {
                            data.push({
                                userId:dataJson.user.id,
                                userName: dataJson.user.name,
                                time: getDateString(),
                                data: _this.props.sendData,
                                timeStamp: dataJson.timeStamp
                            });
                        } else {
                        data.push({
                            userId:dataJson.user.id,
                            userName: dataJson.user.name,
                            time: getDateString(),
                            data: dataJson.data,
                            timeStamp: dataJson.timeStamp
                        });
                        }
                    }
                    break;
                case 'enter_room':
                    // console.log(dataJson);
                    if(response.data === '房间不存在'){
                        alert('房间不存在需要创建房间');
                        console.log('并进入房间');
                    }
                    //有人进入房间时需要更新AllRoomList
                    allRoomListTmp = state.homeState.allRoomList;
                    // console.log(dataJson);
                    allRoomListTmp.map(function (item) {
                        if(item.childNode.length !== 0){
                            item.childNode.map(function (item) {
                                if(item.roomId === dataJson.roomId.toString()){
                                    item.childNode.push({
                                        name:dataJson.user.name,
                                        id:dataJson.user.id,
                                        level:dataJson.user.level,
                                        sex:dataJson.user.sex,
                                        avatar:dataJson.user.avatar
                                    });
                                }
                            });
                        }
                    });
                    // console.log(allRoomListTmp);
                    store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
                    // console.log(dataJson);
                    data.push({userName:dataJson.user.name,
                        time:getDateString(),
                        data:'<p>'+ dataJson.user.name + '已进入房间'+ dataJson.roomName  +'</p>'});
                    break;
                case 'leave_room':
                    // console.log(dataJson);
                    //有人离开房间时需要更新AllRoomList
                    allRoomListTmp = state.homeState.allRoomList;
                    allRoomListTmp.map(function (item) {
                        if(item.childNode){
                            item.childNode.map(function (item) {
                                if(item.roomId === dataJson.roomId.toString()){
                                    item.childNode = item.childNode.filter(function(item){
                                        return item.id !== dataJson.user.id;
                                    })
                                }
                            });
                        }
                    });
                    store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
                    // console.log(allRoomListTmp);
                    data.push({userName:dataJson.user.name,
                        time:getDateString(),
                        data:'<p>'+ dataJson.user.name + '已离开房间'+ dataJson.roomName +'</p>'});
                    break;
                case 'get_room_users':
                    // console.log(dataJson.data);
                    allRoomListTmp = state.homeState.allRoomList;
                    // console.log(allRoomListTmp);
                    allRoomListTmp.map(function (item) {
                        if(item.childNode){
                            item.childNode.map(function (item) {
                                if(item.roomId === dataJson.roomId){
                                    // console.log(dataJson.data.length);
                                    for(let i in dataJson.data){
                                        // console.log(dataJson.data[i]);
                                        //需要排除空数据，如果用户数据存在才加入列表
                                        if(dataJson.data[i] && dataJson.data[i].id  !== state.homeState.userInfo.id){
                                            item.childNode.push(dataJson.data[i]);
                                        }
                                    }
                                }
                            });
                        }
                    });
                    // console.log(allRoomListTmp)
                    store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
                    // console.log(allRoomListTmp);
                    break;
                case 'get_rooms':
                    // console.log(dataJson.data);
                    let dataTmp = [],
                        i=0;
                    let ids = [];
                    /*console.log(typeof dataTmp);
                    console.log(dataTmp instanceof Array);*/
                    dataJson.data.map(function (item) {
                        ids.push(item.roomId);
                       if(item.parentId.toString() === '0'){
                           dataTmp[i] = item;
                           dataTmp[i++].childNode = [];
                       }else{
                           item.childNode=[];
                       }
                    });
                    dataTmp.map(function (item) {
                        dataJson.data.map(function (itm) {
                            if (item.roomId === itm.parentId) {
                                item.childNode.push(itm);
                            }
                        })
                    });

                    // console.log(dataTmp);
                    // console.log(ids);
                    store.dispatch({type:CONSTANT.ALLROOMLIST,val:dataTmp});
                    store.dispatch({type:CONSTANT.CURRENTROOMINFO,
                        val:dataTmp[0].childNode[0]});
                    store.dispatch({type:CONSTANT.LASTROOMINFO,
                        val:dataTmp[0].childNode[0]});

                    break;
                case 'create_room':
                    // console.log(dataJson);
                    // console.log(dataJson.data);
                    //更新allRoomList
                   /* let allRoomListTmp = state.homeState.allRoomList;
                    allRoomListTmp.map(function (item) {
                        if(item.parentId === 0){
                            item.push()
                        }
                    });*/
                    break;
                case 'delete_room':
                    // console.log(dataJson);
                    // console.log(dataJson.data);
                    //更新allRoomList
                    break;
                default:
                    break;
            }

            _this.setState({data:data});
            _this.scrollToBottom();
        };
    }
    render(){
        return (<div className='message-box' id='messageBox'><MessageList data={this.state.data}/></div>)
    }
}


export default MessageListBox
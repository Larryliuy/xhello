import './pageClose.js';
import './media.js';
import {
    answerPeerConnection, getPrepareConnectionState, offerPeerConnection, onAnswer,
    onCandidate
} from "../webrtc/webRtcCom";
import {CONSTANT} from "../reducer/reducer";
import store from "../reducer/reducer";

let state = store.getState();
store.subscribe(function () {
    state = store.getState()
});

let WS = null,lockReconnect = false ,wsUrl = 'wss://192.168.6.3:443/wss' ;
if (!window.WebSocket) {
    window.WebSocket = window.MozWebSocket;
}
function createWebSocket(url) {
    try {
        WS = new WebSocket(url);
        initEventHandle();
    } catch (e) {
        reconnect(url);
    }
}


// 将WS.send方法封装成send方法
const send = function (message, callback) {
    waitForConnection(function () {
        WS.send(message);
        if (typeof callback !== 'undefined') {
            callback();
        }
    }, 1000);
};

const waitForConnection = function (callback, interval) {
    if (WS.readyState === 1) {
        callback();
    } else {
        // optional: implement backoff for interval here
        setTimeout(function () {
            waitForConnection(callback, interval);
        }, interval);
    }
};

if (window.WebSocket) {
    createWebSocket(wsUrl);
} else {
    alert("Your browser does not support Web Socket.");
}

//重连的方法
function reconnect(){
    if(lockReconnect) return;
    lockReconnect = true;
    //没连接上会一直重连，设置延迟避免请求过多
    setTimeout(function () {
        createWebSocket(wsUrl);
        lockReconnect = false;
    }, 2000);
}

let heartCheck = {
    timeout: 60000,//60ms
    timeoutObj: null,
    serverTimeoutObj: null,
    reset: function(){
        clearTimeout(this.timeoutObj);
        clearTimeout(this.serverTimeoutObj);
        return this;
    },
    start: function(){
        let self = this;
        this.timeoutObj = setTimeout(function(){
            //这里发送一个心跳，后端收到后，返回一个心跳消息，
            //onmessage拿到返回的心跳就说明连接正常
            WS.send("HeartBeat");
            self.serverTimeoutObj = setTimeout(function(){//如果超过一定时间还没重置，说明后端主动断开了
                WS.close();//如果onclose会执行reconnect，我们执行ws.close()就行了.如果直接执行reconnect 会触发onclose导致重连两次
            }, self.timeout)
        }, this.timeout)
    },
};

function initEventHandle() {
    WS.onclose = function () {
        console.log('onclose');
        reconnect(wsUrl);
    };
    WS.onerror = function () {
        reconnect(wsUrl);
    };
    WS.onopen = function () {
        //心跳检测重置
        heartCheck.reset().start();
    };
    WS.onmessage = onmessage;
}

export default WS;

//

export {send, heartCheck};


//消息对象返回函数
export function getSendData(type,roomId,roomTitle,user,data){
    return {
        type:type,
        roomId: roomId,		//房间唯一标识符
        roomName: roomTitle,
        user:user,
        data:data
    }
}

//消息时间以socket事件时间为准
export function getDateString(){
    let year,month,day,hour,minute,second;
    let weekString ='';
    let date =new Date();
    year = date.getFullYear();
    month = date.getMonth()+1;
    day = date.getDate();
    hour = date.getHours();
    minute = date.getMinutes();
    second = date.getSeconds();
    let week = date.getDay();
    switch(week){
        case 0:
            weekString = '星期天';
            break;
        case 1:
            weekString = '星期一';
            break;
        case 2:
            weekString = '星期二';
            break;
        case 3:
            weekString = '星期三';
            break;
        case 4:
            weekString = '星期四';
            break;
        case 5:
            weekString = '星期五';
            break;
        case 6:
            weekString = '星期六';
            break;
    }
    return year+'-'+month+'-'+day+' '+ hour +':'+ minute + ':' + second;
}


//data为消息数据
let messagedata = [{username:'larry',time:getDateString(),data:'欢迎欢迎'}];
store.dispatch({type:CONSTANT.MESSAGEDATA,val:messagedata});
scrollToBottom();
function scrollToBottom(){
    setTimeout(function(){
        let mb = document.getElementById('messageBox');
        if(!mb) return;
        mb.scrollTop = mb.scrollHeight || 0;
        /*this.refs.messageBox.scrollTop = this.refs.messageBox.clientHeight;
        // window.scrollTo(0,this.refs.messageBox.clientHeight);
        console.log('hello:'+this.refs.messageBox.clientHeight);*/
    },200);
}

function onmessage(response){
    if(!response) return ;
    heartCheck.reset().start();
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
            };
            if(dataJson.typeString === 'webrtc' && dataJson.data !== '消息成功发出' ){
                // console.log(dataJson);
                if(dataJson.toUser && dataJson.toUser.id == state.homeState.userInfo.id ){
                    if(dataJson.offer){
                        console.log('recive offer from '+ dataJson.fromUser.id);
                        console.log(dataJson);
                        let Msg = {
                            type:'msg',
                            typeString:'webrtc',
                            roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                            roomName: state.homeState.currentRoomInfo.roomName,
                            fromUser:state.homeState.userInfo,
                            toUser:dataJson.fromUser,
                            sessionId:state.homeState.userInfo.id+'-'+dataJson.fromUser.id,
                        };
                        console.log(getPrepareConnectionState());
                        if(getPrepareConnectionState()) {
                            answerPeerConnection(Msg,dataJson.offer, document.getElementById('audioBox'));
                        }
                    }
                    if(dataJson.answer){
                        console.log('recive answer from '+dataJson.fromUser.id);
                        onAnswer(dataJson.answer,dataJson.sessionId,dataJson.fromUser.id);
                    }
                    if(dataJson.candidate){
                        // console.log('recive candidate and setCandidate');
                        onCandidate(dataJson.candidate,dataJson.sessionId);
                    }
                }
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
            //移动到我所在房间
            // console.log(dataJson);
            if(dataJson.typeString === 'moveToRoom'){
                let roomStatueTmp = state.homeState.roomStatus,rId;
                allRoomListTmp = state.homeState.allRoomList;
                allRoomListTmp.map(function (item) {
                    if(item.childNode){
                        item.childNode.map(function (cItem) {
                            if(cItem.roomId == state.homeState.currentRoomInfo.roomId){
                                rId = item.roomId;
                                //打开目标房间的父房间
                                roomStatueTmp['r'+rId] = true;
                            }
                        })
                    }
                });
                //打开目标房间
                roomStatueTmp['rc'+dataJson.objRoomInfo.roomId] = true;
                store.dispatch({type:CONSTANT.ROOMSTATUS,val:roomStatueTmp});
                //当目标和我不在同一房间时时响应消息
                console.log(dataJson.objRoomInfo.roomId +','+ state.homeState.currentRoomInfo.roomId)
                if(dataJson.objRoomInfo.roomId != state.homeState.currentRoomInfo.roomId){
                    //当不是目标用户时返回null
                    if(dataJson.user.id != state.homeState.userInfo.id) return;
                    console.log('enter');
                    let Msg = {
                        type:'leave_room',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
                        user:state.homeState.userInfo
                    };
                    send(JSON.stringify(Msg),function(){
                        Msg = {
                            type:'enter_room',
                            roomId:dataJson.objRoomInfo.roomId,
                            roomName:dataJson.objRoomInfo.roomName,
                            user:state.homeState.userInfo
                        };
                        send(JSON.stringify(Msg),function(){
                            //需要更新当前房间用户列表
                            let getUsersInfo = getSendData(
                                'get_room_users',
                                dataJson.objRoomInfo.roomId,
                                dataJson.objRoomInfo.roomName,
                                state.homeState.userInfo,
                                data);
                            // WS.send(JSON.stringify(enterMsg));
                            send(JSON.stringify(getUsersInfo),function(){

                            });
                        });
                    });
                }else{
                    if(dataJson.data === '消息成功发出'){
                        //
                    }
                }
                return;
            }
            //调整用户限制
            if(dataJson.typeString === 'uLimit'){
                console.log(dataJson);
                console.log(state.homeState.userInfo);
                if(dataJson.objUserId == state.homeState.userInfo.id){
                    //设置state.homeState.userInfo
                    let userInfoTmp = state.homeState.userInfo;
                    userInfoTmp.limit = dataJson.limit;
                    store.dispatch({type:CONSTANT.USERINFO,val:userInfoTmp});
                }
                return;
            }
            //调整房间限制
            if(dataJson.typeString === 'rLimit'){
                /*console.log(dataJson);
                console.log(typeof dataJson.objRoomId+','+typeof state.homeState.currentRoomInfo.roomId);
                console.log(dataJson.objRoomId===state.homeState.currentRoomInfo.roomId);*/
                if(dataJson.objRoomId == state.homeState.currentRoomInfo.roomId){
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
                //提升权限只通知本人
                if(dataJson.objUserId == state.homeState.userInfo.id){
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
                messagedata = data.filter(function (item) {
                    if(item.timeStamp && item.timeStamp.toString() == dataJson.timeStamp){
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
                // console.log(dataJson);
                if(dataJson.typeString === 'webrtc' && dataJson.data === '消息成功发出'){
                    return;
                }//如果发送的是webrtc消息，则不需要显示在消息列表中
                if (dataJson.data === '消息成功发出') {
                    messagedata.push({
                        userId:dataJson.user.id,
                        userName: dataJson.user.name,
                        time: getDateString(),
                        data: state.homeState.sendData,
                        timeStamp: dataJson.timeStamp
                    });
                } else {
                    messagedata.push({
                        userId:dataJson.user.id,
                        userName: dataJson.user.name,
                        time: getDateString(),
                        data: dataJson.data,
                        timeStamp: dataJson.timeStamp
                    });
                    console.log(messagedata);
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
                        if(item.roomId == dataJson.roomId.toString()){
                            //更新当前房间信息
                            store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:item});
                            let flag = true;//flag表示是否可以插入用户
                            if(item.childNode){
                                item.childNode.map(function (uItem) {
                                    if(uItem.id == dataJson.user.id){
                                        //如果用户存在列表则不让插入
                                        flag = false;
                                    }
                                })
                            }
                            if(flag){
                                item.childNode.push({
                                    name:dataJson.user.name,
                                    id:dataJson.user.id,
                                    level:dataJson.user.level,
                                    sex:dataJson.user.sex,
                                    avatar:dataJson.user.avatar
                                });
                            }
                        }else {
                            if(item.childNode){
                                item.childNode = item.childNode.filter(function (uItem) {
                                    //删除其他房间中的该用户
                                    return uItem.id != dataJson.user.id;

                                })
                            }
                        }
                    });
                }
            });
            // console.log(allRoomListTmp);
            store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
            // console.log(dataJson);
            messagedata.push({userName:dataJson.user.name,
                time:getDateString(),
                data:'<p>'+ dataJson.user.name + '已进入房间'+ dataJson.roomName  +'</p>'});
            //建立webRtc连接
            // let Msg = {
            //     type:'msg',
            //     typeString:'webrtc',
            //     roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
            //     roomName: state.homeState.currentRoomInfo.roomName,
            //     fromUser:state.homeState.userInfo,
            //     toUser:dataJson.user,
            //     sessionId:state.homeState.userInfo.id+'-'+dataJson.user.id
            // };
            // console.log(Msg);
            //遍历人发offer
            // if(state.homeState.userInfo.id !=dataJson.user.id ){
            //     offerPeerConnection(Msg,videoBox);
            // }
            // return;
            //  intval = setInterval(function () {
            //     if(getPrepareConnectionState()){
            //         // startPeerConnection(state.homeState.userInfo.id,Msg);
            //         console.log('clear');
            //         clearInterval(intval);
            //     }
            // },500);
            //  setTimeout(function () {
            //     if(getPrepareConnectionState()){
            //         startPeerConnection(state.homeState.userInfo.id,Msg);
            //         // console.log('clear');
            //         // clearInterval(intval);
            //     }
            // },500);
            break;
        case 'leave_room':
            // console.log(dataJson);
            //有人离开房间时需要更新AllRoomList
            allRoomListTmp = state.homeState.allRoomList;
            allRoomListTmp.map(function (item) {
                if(item.childNode){
                    item.childNode.map(function (item) {
                        if(item.roomId == dataJson.roomId.toString()){
                            item.childNode = item.childNode.filter(function(item){
                                return item.id != dataJson.user.id;
                            })
                        }
                    });
                }
            });
            store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
            // console.log(allRoomListTmp);
            messagedata.push({userName:dataJson.user.name,
                time:getDateString(),
                data:'<p>'+ dataJson.user.name + '已离开房间'+ dataJson.roomName +'</p>'});
            break;
        case 'get_room_users':
            console.log('get_room_users');
            // console.log(dataJson);
            // console.log(dataJson.data);
            allRoomListTmp = state.homeState.allRoomList;
            // console.log(allRoomListTmp);
            let by = function(name,minor){
                return function(o,p){
                    let a,b;
                    if(o && p && typeof o === 'object' && typeof p === 'object'){
                        a = o[name];
                        b = p[name];
                        if(a === b){
                            return typeof minor === 'function' ? minor(o,p):0;
                        }
                        if(typeof a === typeof b){
                            return a < b ? -1:1;
                        }
                        return typeof a < typeof b ? -1 : 1;
                    }else{
                        throw ("error");
                    }
                }
            };
            allRoomListTmp.map(function (item) {
                if(item.childNode){
                    item.childNode.map(function (item) {
                        if(item.roomId == dataJson.roomId){
                            item.childNode=[];
                            // console.log(dataJson.data);
                            for(let i in dataJson.data){
                                // console.log(dataJson.data[i].id);
                                // console.log(state.homeState.userInfo.id);
                                //需要排除空数据，如果用户数据存在才加入列表
                                if(dataJson.data[i].id){
                                    item.childNode.push(dataJson.data[i]);
                                }
                            }
                            item.childNode.sort(by('level',by('name')));
                        }
                    });
                }
            });
            // console.log(allRoomListTmp)
            store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
            // console.log(allRoomListTmp);
            //给不是自己的所有人发offer
            //建立webRtc连接

            // 遍历人发offer
            // console.log(dataJson.data);
            // let intval=null;
            if(dataJson.data && Object.keys(dataJson.data).length > 1){
                intval = setInterval(function () {
                    // console.log('timer');
                    for(let item in dataJson.data) {
                        if(item != state.homeState.userInfo.id
                            && dataJson.data[item].name === 'larry'
                        ){
                            let Msg = {
                                type:'msg',
                                typeString:'webrtc',
                                roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                                roomName: state.homeState.currentRoomInfo.roomName,
                                fromUser:state.homeState.userInfo,
                                toUser:dataJson.data[item],
                                sessionId:state.homeState.userInfo.id+'-'+item
                            };
                            // console.log(Msg);
                            if(getPrepareConnectionState()){
                                console.log("offerPeerConnection ......");
                                offerPeerConnection(Msg,document.getElementById('audioBox'));
                                clearInterval(intval);
                                // break;
                            }
                        }
                    };
                },500);
            }

            break;
        case 'get_rooms':
            // console.log(dataJson.data);
            let dataTmp = [],
                i=0;
            // let ids = [];
            /*console.log(typeof dataTmp);
            console.log(dataTmp instanceof Array);*/
            dataJson.data.map(function (item) {
                // ids.push(item.roomId);
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
            if(dataTmp.length === 0)return;
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
    store.dispatch({type:CONSTANT.MESSAGEDATA,val:messagedata});
    scrollToBottom();
};
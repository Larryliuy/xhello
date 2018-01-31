import './pageClose.js';
import './media.js';
import {
    answerPeerConnection, getPrepareConnectionState, micphoneStream, offerPeerConnection, onAnswer,
    onCandidate, onLeave
} from "../webrtc/webRtcCom";
import store,{CONSTANT} from "../reducer/reducer";

let state = store.getState();
store.subscribe(function () {
    state = store.getState()
});


if (!window.WebSocket) {
    window.WebSocket = window.MozWebSocket;
}
// let WS = null,lockReconnect = false ,wsUrl = 'wss://192.168.6.3:443/wss' ;
let WS = null,lockReconnect = false ,wsUrl = 'wss://a701.xtell.cn:443/wss' ;

if (window.WebSocket) {
    createWebSocket(wsUrl);
} else {
    alert("Your browser does not support Web Socket.");
}

function createWebSocket(url) {
    try {
        WS = new WebSocket(url);
        initEventHandle(WS);
    } catch (e) {
        reconnect(url);
    }
}


// 将WS.send方法封装成send方法，防止消息未发送完成时调用
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


//重连的方法
function reconnect(){
    if(lockReconnect) return;
    lockReconnect = true;
    //没连接上会一直重连，设置延迟避免请求过多
    setTimeout(function () {
        console.log('调用重连函数');
        createWebSocket(wsUrl);
        lockReconnect = false;
    }, 2000);
}

let heartCheck = {
    timeout: 30000,//30s
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
            send({type:'msg',roomId: state.homeState.currentRoomInfo.roomId,typeString:'heartBeat',check:1});
            self.serverTimeoutObj = setTimeout(function(){//如果超过一定时间还没重置，说明后端主动断开了
                // console.log('heartCheck.start,server close ws');
                WS.close();//如果onclose会执行reconnect，我们执行ws.close()就行了.如果直接执行reconnect 会触发onclose导致重连两次
            }, self.timeout)
        }, this.timeout)
    },
};

function initEventHandle(WS) {
    WS.onclose = function () {
        log('webSocket关闭');
        reconnect(wsUrl);
    };
    WS.onerror = function () {
        reconnect(wsUrl);
    };
    WS.onopen = function () {
        //心跳检测重置
        log('webSocket连接成功');
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

let intval=null; //发offer定时器
function onmessage(response){
    // console.log(response);
    if(!response) return ;
    // console.log(response);
    //如果收到的数据是'a'则表示收到的是心跳消息
    if(response.data === 'a'){
        // console.log('beatheart a');
        heartCheck.reset().start();
        return;
    }
    if(response.check){
        // console.log('beatheart check');
        heartCheck.reset().start();
        return;
    }
    let dataJson;
    try{
        dataJson = JSON.parse(response.data);
    }catch (e){
        // console.log(e);
        return;
    }
    // if(dataJson.result !== 'ok') return ;
    // console.log(dataJson);
    let allRoomListTmp = [];
    switch(dataJson.type){
        case 'msg':
            if(dataJson.typeString === 'preOffer'){
                log('从'+dataJson.fromUser.id+'收到准备连接申请');
                // console.log(state.homeState.userInfo);
                // console.log(dataJson.fromUser);
                let preAnswerMsg;
                // console.log(dataJson.toUser.yes+','+state.homeState.userInfo.Children.length +','+ state.homeState.userInfo.maxChildren);
                if((dataJson.toUser && dataJson.toUser.yes) || state.homeState.userInfo.Children.length < state.homeState.userInfo.maxChildren){
                    //先占位
                    if(dataJson.toUser && dataJson.toUser.yes){
                        log('儿子'+ dataJson.toUser.id +'发过来的连接申请不能拒绝,通过yes进来的');
                    }
                    let userInfoTmp = state.homeState.userInfo;
                    /*if(state.homeState.userInfo.numberOne && state.homeState.numberOne === dataJson.toUser.numberOne){
                        console.log('老大：'+state.homeState.numberOne);
                        if(userInfoTmp.Children.length === 0){
                            userInfoTmp.numberOne = 2;
                        }else{
                            userInfoTmp.numberOne = 3;
                        }
                    }*/
                    if(!(dataJson.toUser && dataJson.toUser.yes)){//带yes标签的用户不用占位
                        userInfoTmp.Children.push(0);//0表示占位符
                    }
                    // userInfoTmp.seq = dataJson.toUser.seq;//将我的seq设置给本地state
                    // store.dispatch({type:CONSTANT.USERINFO,val:userInfoTmp});
                    preAnswerMsg = {
                        type:'msg',
                        typeString:'preAnswer',
                        ToUserOnly:dataJson.fromUser.id,
                        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                        roomName: state.homeState.currentRoomInfo.roomName,
                        fromUser:userInfoTmp,
                        status:'ok'
                    };
                    send(JSON.stringify(preAnswerMsg),function () {
                        log('发送连接申请的回复结果给 '+dataJson.fromUser.id+',结果：申请成功');
                        // console.log(dataJson.toUser);
                        if(userInfoTmp.Children[0] === userInfoTmp.Children[userInfoTmp.Children.length-1])return;//如果第一个孩子等于最后一个孩子，则不需要发送断开
                        if(dataJson.toUser.yes && userInfoTmp.Children[userInfoTmp.Children.length-1] != 0){
                            //如果节点满了，这里发消息给最后一个儿子，让其断开连接
                            if(userInfoTmp.Children.length >= userInfoTmp.maxChildren){
                                let sendChildMsg = {
                                    type:'msg',
                                    typeString:'disconnect',
                                    ToUserOnly:dataJson.toUser.Children[dataJson.toUser.Children.length-1],
                                    roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                                    roomName: state.homeState.currentRoomInfo.roomName,
                                    fromUser:userInfoTmp,
                                };
                                // console.log('the last child ID:'+dataJson.toUser.Children[dataJson.toUser.Children.length-1]);
                                send(JSON.stringify(sendChildMsg),function () {
                                    log('通知最后一个儿子，断开连接');
                                })
                            }
                        }
                    })
                }else{
                    preAnswerMsg = {
                        type:'msg',
                        typeString:'preAnswer',
                        ToUserOnly:dataJson.fromUser.id,
                        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                        roomName: state.homeState.currentRoomInfo.roomName,
                        fromUser:state.homeState.userInfo,
                        status:'failed'
                    };
                    send(JSON.stringify(preAnswerMsg),function () {
                        // console.log('send preAnswer for failed status ');
                        log('发送连接申请的回复结果给 '+dataJson.fromUser.id+',结果：申请失败');
                    })
                }
                return;
            }
            if(dataJson.typeString === 'preAnswer'){
                console.log('收到 '+dataJson.fromUser.id + '的申请答复， 结果：'+ dataJson.status);
                // console.log(dataJson);
                if(dataJson.status === 'ok'){
                    //这里发offer
                    let Msg = {
                        type:'msg',
                        typeString:'webrtc',
                        ToUserOnly:dataJson.fromUser.id,
                        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                        roomName: state.homeState.currentRoomInfo.roomName,
                        fromUser:state.homeState.userInfo,
                        toUser:dataJson.fromUser,
                        sessionId:state.homeState.userInfo.id+'-'+dataJson.fromUser.id
                    };
                    // console.log(Msg);
                    /*intval = */setTimeout(function () {
                        if(getPrepareConnectionState()){
                            console.log('intval');
                            // console.log("offerPeerConnection ......");
                            offerPeerConnection(Msg,document.getElementById('audioBox'));
                            clearInterval(intval);
                            // break;
                        }
                    },500);
                }else if(dataJson.status === 'failed'){
                    let objUserId,userIdList = state.homeState.userIdList,preOfferCount = state.homeState.preOfferCount;
                    if(userIdList[preOfferCount]){
                        if(userIdList[preOfferCount] != dataJson.fromUser.id){
                            objUserId = userIdList[preOfferCount];
                            preOfferCount++;
                        }else{
                            preOfferCount = preOfferCount+1;
                            objUserId = userIdList[preOfferCount];
                            preOfferCount++;
                        }
                        userIdList = userIdList.filter(function (item) {
                            return item != userIdList[preOfferCount];
                        });
                        store.dispatch({type:CONSTANT.PREOFFERCOUNT,val:preOfferCount});
                        store.dispatch({type:CONSTANT.USERIDLIST,val:userIdList});
                        //
                        let preOfferMsg = {
                            type:'msg',
                            typeString:'preOffer',
                            ToUserOnly:objUserId,
                            roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                            roomName: state.homeState.currentRoomInfo.roomName,
                            fromUser:state.homeState.userInfo,
                            // toUser:objUser
                        };
                        // console.log(preOfferMsg);
                        send(JSON.stringify(preOfferMsg),function () {
                            log('发送准备连接（pre-offer）消息给 ' + objUserId);
                        });
                    }else{//当userIdList遍历完依然没有找到连接的人，则从新getRoomUsers
                        //重新获取最小seq的用户并发送preOffer
                        let reGetMinSeqUserMsg = {
                            type:'get_room_users',
                            roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                            roomName: state.homeState.currentRoomInfo.roomName,
                            user:state.homeState.userInfo,
                            startSeq:dataJson.fromUser.seq
                        };
                        // setTimeout(function () {
                        send(JSON.stringify(reGetMinSeqUserMsg),function () {
                            console.log('结果失败时，重新发送getRoomUSers消息');
                        })
                        // },500);
                    }

                }else{
                    console.log('未知的状态：'+dataJson.status);
                }
                return;
            }
            if(dataJson.typeString === 'disconnect'){
                log('收到断开连接的消息');
                // console.log('my numberOne '+state.homeState.userInfo.numberOne);
                //在这里断开连接，并去寻找新的节点连接(最后一步)
                if (state.homeState.userInfo.numberOne == 2){//如果我是新预备老大，则我不用离开
                    return;
                }else {
                    onLeave(state.homeState.userInfo);
                    return;
                }
            }
            if(dataJson.typeString === 'setNewPreHead'){//当老二掉线时，老大通知我，并将我设置成新的老二
                log('收到重新设置预备老大的消息');
                //在这里将我的信息发送给服务器
                let userInfot = state.homeState.userInfo;
                if(dataJson.head == userInfot.id){//当老大指定的预备老大是我时，才将自己设置为预备老大
                    userInfot.numberOne = 2;
                    let updateUserMsg = {
                        type:'update_user',
                        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                        roomName: state.homeState.currentRoomInfo.roomName,
                        user:userInfot
                    };
                    if(!userInfot.seq)return;
                    store.dispatch({type:CONSTANT.USERINFO,val:userInfot});
                    send(JSON.stringify(updateUserMsg),function () {
                        log('发送预备老大的信息到服务器');
                    });
                }else{
                    //那我就是其他孩子
                    let updateUserMsg = {
                        type:'update_user',
                        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                        roomName: state.homeState.currentRoomInfo.roomName,
                        user:userInfot
                    };
                    userInfot.numberOne = 3;
                    store.dispatch({type:CONSTANT.USERINFO,val:userInfot});
                    send(JSON.stringify(updateUserMsg),function () {
                        console.log('发送其他孩子的信息到服务器');
                    });
                }
                return;
            }
            // console.log(dataJson);
            if(dataJson.typeString === '放麦'){
                let userData = state.homeState.roomMicrophoneUser;
                // console.log(state.homeState.roomMicrophoneUser);
                userData.push(dataJson.user);
                store.dispatch({type:CONSTANT.ROOMMICROPHONEUSER,val:userData});
                return;
            };
            if(dataJson.typeString === 'microphoneMode'){//麦序模式改变
                store.dispatch({type:CONSTANT.MICROPHONEMODE,val:dataJson.mode});
                if(dataJson.mode == 1){
                    micphoneStream.addTrack(state.homeState.myAudioTrack[0]);
                }
                if(dataJson.mode == 2){
                    if(state.homeState.userInfo.level >= 4){
                        console.log(state.homeState.myAudioTrack);
                        micphoneStream.removeTrack(state.homeState.myAudioTrack[0]);//如果是主席模式，权限不够的直接关闭音轨
                    }
                }
                if(dataJson.mode == 3){
                    if(state.homeState.userInfo.level >= 4){
                        micphoneStream.removeTrack(state.homeState.myAudioTrack[0]);//如果是主席模式，权限不够的直接关闭音轨
                    }
                }
                return;
            };
            if(dataJson.typeString === 'webrtc' && dataJson.data !== '消息成功发出' ){
                // console.log(dataJson);
                if(dataJson.toUser && dataJson.toUser.id == state.homeState.userInfo.id ){
                    if(dataJson.offer){
                        log('从'+ dataJson.fromUser.id+'收到offer');
                        // console.log(dataJson);
                        let Msg = {
                            type:'msg',
                            typeString:'webrtc',
                            roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                            roomName: state.homeState.currentRoomInfo.roomName,
                            fromUser:state.homeState.userInfo,
                            toUser:dataJson.fromUser,
                            sessionId:state.homeState.userInfo.id+'-'+dataJson.fromUser.id,
                        };
                        // console.log(getPrepareConnectionState());
                        if(getPrepareConnectionState()) {
                            answerPeerConnection(Msg,dataJson.offer, document.getElementById('audioBox'));
                        }
                    }
                    if(dataJson.answer){
                        log('从 '+dataJson.fromUser.id+'收到answer');
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
                                );
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
                    // console.log(messagedata);
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
            let userInfoTmp ;
            if(dataJson.user && dataJson.user.numberOne){//如果dataJson中user有numberOne则使用dataJson.user，没有则使用state
                userInfoTmp = dataJson.user;
            }else{
                userInfoTmp = state.homeState.userInfo;
            }
            console.log(dataJson.data);
            //在这里获取的数据只有一个的时候就是老大,如果我是老大，我的每个儿子都有一个标识说明我是老大
            if(dataJson.data && Object.keys(dataJson.data).length === 1){
                log('第一个进来，初始化成老大');
                // console.log(Object.keys(dataJson.data)[0]);
                let userInfo =  dataJson.data[Object.keys(dataJson.data)[0]];
                userInfo.numberOne = 1;
                userInfoTmp = userInfo;
                let updateUserMsg = {
                    type:'update_user',
                    roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                    roomName: state.homeState.currentRoomInfo.roomName,
                    user:userInfo
                };
                store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                send(JSON.stringify(updateUserMsg),function () {
                    log('将老大信息更新到服务器');
                })
            }
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

            //获取最小seq的用户
            function getMinSeqUser(UserList) {
                console.log(UserList);
                // console.log(startSeq);
                let minSeq = 100000000;
                let minSeqUser = null;
                UserList.map(function (item) {
                    if(item.Children.length < item.maxChildren){
                        // console.log(item.seq+','+minSeq);
                        if(item.seq < minSeq){
                            minSeq = item.seq;
                            minSeqUser = item;
                            console.log(minSeqUser);
                        }
                    }
                });
                return minSeqUser;
            }
            // console.log(dataJson.data); //服务器返回最新的用户连接情况
            // let intval=null;
            // console.log(userInfoTmp);
            if(dataJson.data && Object.keys(dataJson.data).length > 1){
                let UserList = [],userIdList=[],objUser;
                // console.log(dataJson.user);
                for(let item in dataJson.data) {
                    if(dataJson.data[item].id != state.homeState.userInfo.id){
                        UserList.push(dataJson.data[item]);
                        userIdList.push(item);
                    }else{
                        //将自己从服务器获取的最新userInfo设置到本地
                        userInfoTmp = dataJson.data[item];
                        console.log(userInfoTmp);
                        // userInfoTmp.seq = dataJson.data[item].seq;
                        store.dispatch({type:CONSTANT.USERINFO,val:userInfoTmp});
                    }
                }
                store.dispatch({type:CONSTANT.USERIDLIST,val:userIdList});//将连接备选人存入redux
                if(userInfoTmp.numberOne === 2){//user是消息传过来的用户信息，也就是最新的本人消息
                    log('我是新的预备老大 .');
                    userInfoTmp.numberOne = 2;
                    store.dispatch({type:CONSTANT.USERINFO,val:userInfoTmp});
                    UserList.map(function (item) {
                        console.log(item);
                        if(item.numberOne && item.numberOne == 1){//这里为2的情况就是服务器获取的新老大的数据没有来得及更新
                            objUser = item;
                            objUser.yes = true; //yes表示新老大必须接受连接
                        }
                    });
                }else if(userInfoTmp.numberOne === 3){//user是消息传过来的用户信息，也就是最新的本人消息
                    log('我是新的其他孩子');
                    userInfoTmp.numberOne = 3;
                    store.dispatch({type:CONSTANT.USERINFO,val:userInfoTmp});
                    UserList.map(function (item) {
                        console.log(item);
                        if(item.numberOne && item.numberOne == 1){//这里为2的情况就是服务器获取的新老大的数据没有来得及更新
                            objUser = item;
                            objUser.yes = true; //yes表示新老大必须接受连接
                        }
                    });
                }else{
                    objUser = getMinSeqUser(UserList);
                    // if(objUser.numberOne == 1){
                    //     console.log('我是老大的孩子')
                    // }else if(objUser.numberOne == 2 || objUser.numberOne == 3){
                    //     console.log('我不是老大的孙子');
                    // }else if(!objUser.numberOne){
                    //     console.log('我不是老大的孩子');
                    // }else{
                    //     console.log('未知');
                    // }
                }

                console.log(objUser); //显示目标用户
                console.log(userIdList[0]); //显示目标用户
                if(!objUser){
                    console.error('未获取到目标用户信息');
                    // return;
                }else{
                    //如果目标用户是老大，则设置预备老大和老大其他孩子标识
                    if(objUser.numberOne && objUser.numberOne == 1){
                        // console.log(userInfoTmp);
                        if(objUser.Children.length === 0){//初始化时判断孩子的的长度来决定谁是预备老大.
                            log('我是初始化预备老大');
                            if(!userInfoTmp.numberOne){
                                userInfoTmp.numberOne = 2;
                            }
                        }else{
                            log('我是其他孩子');
                            if(userInfoTmp.numberOne == 2){//如果是老大断线重连的情况，已经确定预备老大
                                userInfoTmp.numberOne = 2;
                            }else if(userInfoTmp.numberOne == 3){
                                userInfoTmp.numberOne = 3;
                            }else{}
                        }
                        store.dispatch({type:CONSTANT.USERINFO,val:userInfoTmp});
                        let updateUserMsg = {
                            type:'update_user',
                            roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                            roomName: state.homeState.currentRoomInfo.roomName,
                            user:userInfoTmp
                        };
                        send(JSON.stringify(updateUserMsg),function () {
                            if( userInfoTmp.numberOne === 2 ){
                                log('我是新的预备老大');
                            }else if(userInfoTmp.numberOne === 3){
                                log('我是新的其他孩子');
                            }

                        })
                    }
                    let preOfferMsg = {
                        type:'msg',
                        typeString:'preOffer',
                        ToUserOnly:objUser.id,
                        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                        roomName: state.homeState.currentRoomInfo.roomName,
                        fromUser:userInfoTmp,
                        toUser:objUser
                    };
                    // console.log(preOfferMsg);
                    send(JSON.stringify(preOfferMsg),function () {
                        log('发送准备连接（pre-offer）消息给 ' + objUser.id);
                    });
                }
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
//2断的情况，根本没考虑。预备老大掉线了没有找出新的预备老大
//1,2,3,4,5 断2，上2，再断1，再上1，断5，上5，（1,2,3）（4,5）
//死循环可能的原因之一：就是每次连老大的时候老大都会去通知最后一个掉线，结果最后一个掉线的又重连，然后又找到老大，一直这样循环

function log(message) {
    console.log(state.homeState.userInfo.id+'==='+message);
    //送到服务器后台
    let msg = {
        type:'log',
        log:message,
        user:state.homeState.userInfo
    };
    send(JSON.stringify(msg),function () {

    })
}
import {
    answerPeerConnection, getPrepareConnectionState, microphoneStatus, offerPeerConnection, onAnswer,
    onCandidate, onLeave, setGetRoomUserListCallback, getRoomUserListCallback, startOnline, applyToBeFirst,
    getRoomInfo, getRoomUserList, openMicrophone, closeMicrophone, initVariableAudio, startMyCam,
    initServerUserInfo, amISendPreOffer, delSendListById
} from "../webrtc/webRtcAudio";
import {
    getRoomUserListVideo, startMyCamVideo, startOnlineVideo, offerPeerConnectionVideo, answerPeerConnectionVideo,
    setCallbackVideo, callbackVideo, getPrepareConnectionStateVideo, onAnswerVideo, onCandidateVideo, onLeaveVideo,
    initVariableVideo, getRoomInfoVideo, hasDownStream, amISendPreOfferVideo, delSendListByIdVideo,
    startMyCamVideoWithCallback
} from "../webrtc/webRtcVideo";
import store,{CONSTANT} from "../reducer/reducer";
import { blockIpApi } from "./apiInfo";
import {
    updataFirstUserAvatar, getNewAllRoomList, log, successlog, keyerror,
    setRoomInfoByRoomInfo, limitFetch, enterRoom, updateTotalClientsByRoomid, ajustUserOrder, updateUserInfo,
    by, upDateRoomListByDelRoomId, getNewLimit, clearOnMicrophoneUsers, sendSesult, setRoomInfo, delayGetRoomUsers
} from "./comFunctions";
import {
    addToNormalQuitUsers, addUnexpectedUsers, removeToNormalQuitUsers,
    removeUnexpectedUsers
} from "../webrtc/webRtcBase";

let state = store.getState();
store.subscribe(function () {
    state = store.getState()
});


if (!window.WebSocket) {
    window.WebSocket = window.MozWebSocket;
}
// let WS = null,lockReconnect = false ,wsUrl = 'ws://192.168.6.3:5555' ;
// let WS = null,lockReconnect = false ,wsUrl = 'wss://192.168.6.3:443/wss' ;
// let WS = null,lockReconnect = false ,wsUrl = 'wss://a701.xtell.cn:443/wss' ;
let WS = null,lockReconnect = false ,wsUrl = 'wss://www.xtell.cn:443/wss' ;

if (window.WebSocket) {
    createWebSocket(wsUrl);
} else {
    alert("您的电脑不支持webSocket,请更换版本更高的浏览器");
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
        console.log('%c调用重连函数','color:blue');
        createWebSocket(wsUrl);
        lockReconnect = false;
    }, 1000);
}

let heartCheck = {
    timeout: 180000,//30s
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
                keyerror('server close ws');
                WS.close();//如果onclose会执行reconnect，我们执行ws.close()就行了.如果直接执行reconnect 会触发onclose导致重连两次
            }, self.timeout)
        }, this.timeout)
    },
};

function initEventHandle(WS) {
    WS.onclose = function () {
        // log('webSocket关闭');
        reconnect(wsUrl);
    };
    WS.onerror = function () {
        reconnect(wsUrl);
    };
    WS.onopen = function () {
        //心跳检测重置
        log('webSocket连接成功');
        heartCheck.reset().start();
        let roomInfo = state.homeState.currentRoomInfo;
        // console.log(roomInfo);
        if(roomInfo && roomInfo.roomId){
            //进入房间
            enterRoom(roomInfo.roomId);
        }
    };
    WS.onmessage = onmessage;
}



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

/**
 * 设置ws服务器房间信息
 * */


let sempher = 0,//表示申请连接的锁
    isPlaying = false,//表示是否正在播放视频
    isPlayingMusic = false;//表示是否正在播放音乐
/**
 * 重置isPlaying
 * */
function resetIsplaying() {
    if(isPlaying)
        isPlaying=false;
    if(isPlayingMusic){
        isPlayingMusic = false;
        let vodVideo = document.getElementById('play-audio');
        vodVideo.src = '';
    }
}
function onmessage(response){
    // console.log(response);
    // heartCheck.reset().start();//需要优化的地方，撤掉心跳消息，用这个就OK
    if(!response) return ;
    //如果收到的数据是'a'则表示收到的是心跳消息
    if(response.data === 'a'){
        heartCheck.reset().start();
        return;
    }
    if(JSON.parse(response.data).type){
        console.log(JSON.parse(response.data).type,response.data.length);
    }else{
        let data = JSON.parse(response.data);
        // console.log(JSON.parse(response.data),response.data.length);
        if(data.totalSent){
            window.localStorage.setItem('serverData',JSON.stringify(data));
        }
    }
    if(response.check){
        heartCheck.reset().start();
        return;
    }
    let dataJson;
    try{
        dataJson = JSON.parse(response.data);
    }catch (e){
        return;
    }

    let allRoomListTmp = [];
    /**
     * 播放视频函数
     * video表示需要播放的video标签
     * videoSrc表示视频连接
     * */
    function playVideo(videoDom,videoSrc){
        if(!videoDom){
            console.log('vodVideo不存在');
            return;
        }
        videoDom.src = videoSrc;
        videoDom.autoplay=true;
        videoDom.controls=true;
        isPlaying = true;
    }
    let roomInfo = state.homeState.currentRoomInfo || {},
        userData = state.homeState.roomMicrophoneUser || [],
        userInfo = state.homeState.userInfo || {};
    switch(dataJson.type){
        case 'msg':
            if(dataJson.data === '消息成功发出') {
                console.log(dataJson);
                break;//如果是发送给自己的消息则直接过滤
            }
            switch(dataJson.typeString){
                case 'preOffer':
                    log('从'+dataJson.fromUser.name+'收到准备连接申请','onmessage-preOffer','websocket.js');
                    // console.log(state.homeState.userInfo);
                    // console.log(dataJson.fromUser);
                    // let preAnswerMsg,userInfoTmp = state.homeState.userInfo;
                    // userInfo = state.homeState.userInfo;
                    console.log(userInfo.Children);
                    // console.log(dataJson.toUser.yes+','+state.homeState.userInfo.Children.length +','+ state.homeState.userInfo.maxChildren);
                    if(sempher < 0) {
                        sendSesult(dataJson.fromUser,false);
                        return;
                    }
                    sempher = sempher - 1;
                    //如果房间模式时1或3，并且downStream不存在则失败
                    // let roomInfo = state.homeState.currentRoomInfo;
                    // console.error('sempher:'+sempher);
                    // console.error(roomInfo.mode,hasDownStream(),roomInfo.king,userInfo.id);
                    //视频模式下如果我不是king（直播的人，则拒绝连接）
                    if((roomInfo.mode == 1 || roomInfo.mode == 3) && (!hasDownStream() && roomInfo.king != userInfo.id)){
                        sempher = sempher + 1;
                        keyerror('%c'+dataJson.fromUser.name+'申请连我失败failed:roomMode,'+roomInfo.mode+',hasDownStream:'+hasDownStream(),'color:red');
                        // console.log(roomInfo.mode,hasDownStream(),roomInfo.king,userInfo.id);
                        sendSesult(dataJson.fromUser,false);
                        return;
                    }
                    if(userInfo.Children.length < userInfo.maxChildren){
                        if(amISendPreOffer(dataJson.fromUser.id) || amISendPreOfferVideo(dataJson.fromUser.id) || userInfo.parentNode == dataJson.fromUser.id){
                            console.log(userInfo.parentNode,dataJson.fromUser.id);
                            sendSesult(dataJson.fromUser,false);
                        }else{
                            if(getPrepareConnectionState()){
                                //先占位
                                let isExist = false;
                                userInfo.Children.map(function (item) {
                                    if(item == dataJson.fromUser.id){
                                        isExist = true;
                                    }
                                });
                                if(!isExist){
                                    userInfo.Children.push(dataJson.fromUser.id);//占位符这里的时间差
                                    // userInfoTmp.seq = dataJson.toUser.seq;//将我的seq设置给本地state
                                    store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                                }
                                sendSesult(dataJson.fromUser,true);
                            }else{
                                sendSesult(dataJson.fromUser,false);
                            }
                        }
                    }else{
                        sendSesult(dataJson.fromUser,false);
                    }
                    sempher = sempher + 1;
                    break;
                case 'preAnswer':
                    log('收到 '+dataJson.fromUser.name + '的申请答复， 结果：'+ dataJson.status,'onmessage-preAnswer','websocket.js');
                    // console.log(dataJson);
                    // let roomInfo = state.homeState.currentRoomInfo;
                    if(dataJson.status === 'ok'){
                        //这里发offer
                        let Msg = {
                            type:'msg',
                            typeString:'webrtc',
                            ToUserOnly:dataJson.fromUser.id,
                            roomId: roomInfo.roomId,		//房间唯一标识符
                            // roomName: roomInfo.roomName,
                            fromUser:state.homeState.userInfo,
                            toUser:dataJson.fromUser,
                            sessionId:state.homeState.userInfo.id+'-'+dataJson.fromUser.id
                        };
                        // console.log(dataJson.fromUser);
                        setTimeout(function () {/*intval = */
                            let roomMode = state.homeState.currentRoomInfo.mode;
                            if(getPrepareConnectionState() &&  roomMode == 0){
                                successlog('audio-已发offer给 '+dataJson.fromUser.name);
                                offerPeerConnection(Msg,document.getElementById('audioBox'));
                            }else if(roomMode == 1){
                                successlog('video-已发offer给 '+dataJson.fromUser.name);
                                offerPeerConnectionVideo(Msg,'myVideo',false);
                            }else if(roomMode == 3){
                                if(!roomInfo.secondKing && dataJson.fromUser.Children.length<=1){
                                    offerPeerConnectionVideo(Msg,'firstVideo',false);//按顺序进时这里需要改为true
                                }else{
                                    offerPeerConnectionVideo(Msg,'firstVideo',false);
                                }
                                successlog('video-已发offer给 '+dataJson.fromUser.name);
                            }else {
                                console.error('未知的房间模式或状态：'+ roomMode +',' + getPrepareConnectionState());
                                //告知来者我这边连接失败
                            }
                        },500);
                    }else if(dataJson.status === 'failed'){
                        delSendListByIdVideo(dataJson.fromUser.id);
                        getRoomInfo(roomInfo.roomId);
                    }else{
                        log('未知的状态：'+dataJson.status,'onmessage-preAnswer','websocket.js');
                    }
                    break;
                case '上麦':
                    log('收到上麦消息','onmessage-上麦','websocket.js');
                    // let userData = state.homeState.roomMicrophoneUser;
                    console.log(userData);
                    if(state.homeState.userInfo.id != dataJson.user.id){
                        userData.push(dataJson.user);
                        store.dispatch({type:CONSTANT.ROOMMICROPHONEUSER,val:userData});
                    }
                    if(userData[0].id === state.homeState.userInfo.id){
                        if(!microphoneStatus){
                            openMicrophone();
                        }
                    }
                    if(userData.length === 1){//只需要第一个人放麦时更换头像，其他的禁麦和离麦会处理
                        //更换第一个用户的头像，如果与在麦人ID一致，则不需要重复获取
                        updataFirstUserAvatar(userData[0]);
                    }
                    break;
                case '离麦':
                    log('收到离麦消息','onmessage-离麦','websocket.js');
                    // let userInfo = state.homeState.userInfo;
                    if(dataJson.user.id == userInfo.id){
                        if(microphoneStatus && userInfo.level > 3){
                            closeMicrophone();
                        }
                    }
                    // let userData = state.homeState.roomMicrophoneUser;
                    // console.log(state.homeState.roomMicrophoneUser);
                    let tmp = userData.filter(function(item){
                        return item.id !== dataJson.user.id;
                    });
                    store.dispatch({type:CONSTANT.ROOMMICROPHONEUSER,val:tmp});
                    if(tmp[0] && tmp[0].id === userInfo.id){//有人离麦后如果我是第一个了则我开麦
                        if(!microphoneStatus){
                            openMicrophone();
                        }
                    }
                    console.log(tmp[0]);
                    updataFirstUserAvatar(tmp[0]);
                    break;
                case '禁麦':
                    // let userData = state.homeState.roomMicrophoneUser;
                    //如果我是第一位，则需要关麦
                    if(userData[0].id === state.homeState.userInfo.id){
                        closeMicrophone();
                    }
                    userData = userData.slice(1);
                    store.dispatch({type:CONSTANT.ROOMMICROPHONEUSER,val:userData});
                    if(userData[0] && userData[0].id === state.homeState.userInfo.id){
                        if(!microphoneStatus){
                            openMicrophone();
                        }
                    }
                    updataFirstUserAvatar(userData[0]);
                    break;
                case 'microphoneMode'://改变麦序
                    store.dispatch({type:CONSTANT.MICROPHONEMODE,val:dataJson.microphoneMode});
                    if(dataJson.microphoneMode == 1){
                        clearOnMicrophoneUsers();
                        if(microphoneStatus){
                            closeMicrophone();
                        }
                    }
                    if(dataJson.microphoneMode == 2){
                        clearOnMicrophoneUsers();
                        if(state.homeState.userInfo.level >= 4) {
                            if(microphoneStatus){
                                closeMicrophone();
                            }
                        }
                    }
                    if(dataJson.microphoneMode == 3){
                        if(state.homeState.userInfo.level >= 4) {
                            if(microphoneStatus){
                                closeMicrophone();
                            }
                        }
                    }
                    break;
                case 'changeMicOrder':
                    let micUsers = state.homeState.roomMicrophoneUser,newMicUsers;
                    if(dataJson.data !== '消息成功发出'){
                        newMicUsers = ajustUserOrder(micUsers,dataJson.orderInfo);
                        store.dispatch({type:CONSTANT.ROOMMICROPHONEUSER,val:newMicUsers});
                        if(userInfo.id == dataJson.user.id){
                            // let roomInfo = state.homeState.currentRoomInfo;
                            roomInfo.onMicrophoneUsers = newMicUsers;
                            roomInfo.microphoneMode = 3;
                            let setRoomMsg = {
                                type:'set_room_info',
                                roomId: roomInfo.roomId,		//房间唯一标识符
                                // roomName: roomInfo.roomName,
                                user:state.homeState.userInfo,
                                data:roomInfo
                            };
                            send(JSON.stringify(setRoomMsg),function(){
                                console.log('更新服务器onMicrophoneUsers信息');
                            });
                        }else{
                            console.log(newMicUsers[0]);
                            console.log(microphoneStatus);
                            console.log(userInfo.id);
                            if(newMicUsers && newMicUsers[0].id === userInfo.id){
                                if(!microphoneStatus){//如果不希望调整麦序时第一位自动开麦，则注释这里即可
                                    openMicrophone();
                                }
                            }else{
                                if(userInfo.level > 4 && microphoneStatus){
                                    closeMicrophone();
                                }
                            }
                            if(userInfo.limit && userInfo.limit.toString().indexOf('3') !== -1){
                                if(microphoneStatus){
                                    closeMicrophone();
                                }
                            }
                        }
                    }
                    break;
                case 'changeRoomOrder':
                    console.log('收到changeRoomOrder消息');
                    console.log(dataJson);
                    let allRoomList = state.homeState.allRoomList,
                        // roomInfo = state.homeState.userInfo,
                        newRoomList = dataJson.newRoomList;
                    // console.log(dataJson);
                    if(dataJson.data !== '消息成功发出') {
                        allRoomList = allRoomList.map(function (item) {
                            if (item.childNode.length !== 0) {
                                item.childNode.map(function (cItem) {
                                    if (cItem.roomId == dataJson.orderInfo.roomId) {
                                        item.childNode = newRoomList;
                                    }
                                });
                            }
                            return item;
                        });
                        console.log(allRoomList);
                        store.dispatch({type: CONSTANT.ALLROOMLIST, val: allRoomList});
                        if (state.homeState.userInfo.id == dataJson.user.id) {
                            //实际只需要更新房间的order
                            newRoomList.map(function (item) {
                                setRoomInfoByRoomInfo(item);
                            });
                        }
                    }
                    break;
                case 'audioSourceInput':
                    let audioInputUsers = state.homeState.microphoneInputUsers;
                    if(dataJson.inputSource){
                        if(!audioInputUsers[dataJson.user.id]){
                            audioInputUsers[dataJson.user.id] = true;
                            store.dispatch({type:CONSTANT.MICROPHONEINPUTUSERS,val:audioInputUsers});
                            // console.log(audioInputUsers);
                        }
                    }else {
                        if(audioInputUsers[dataJson.user.id]){
                            delete audioInputUsers[dataJson.user.id];
                            store.dispatch({type:CONSTANT.MICROPHONEINPUTUSERS,val:audioInputUsers});
                            // console.log(audioInputUsers);
                        }
                    }
                    break;
                case 'applyToBebarley':
                    successlog('收到连麦申请:'+dataJson.user.id);
                    // let roomInfo = state.homeState.currentRoomInfo;
                    if(!roomInfo.secondKing && dataJson.user.id !== state.homeState.userInfo.id){
                        console.log('连麦者不存在，可同意连麦');
                        let preBarleyListsBox = document.getElementById('preBarleyLists');
                        preBarleyListsBox.style.zIndex = Number(dataJson.user.id);
                        preBarleyListsBox.innerText = '同意 '+dataJson.user.name;
                        preBarleyListsBox.style.visibility = 'visible';
                    }
                    break;
                case 'agreeToBebarley':
                    successlog('收到同意连麦的消息');
                    onLeaveVideo(state.homeState.userInfo);//在ondisconnect里面会调用
                    initVariableVideo();
                    let myVideoTag = document.getElementById('secondVideo');
                    // if(!getPrepareConnectionStateVideo()){
                    //     startMyCamVideo(myVideoTag,true);
                    // }
                    let user = dataJson.user;
                    user.Children = user.Children.filter(function (item) {
                        return item !== user.id;
                    });
                    let Msg = {
                        type:'msg',
                        typeString:'webrtc',
                        ToUserOnly:dataJson.user.id,
                        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                        // roomName: state.homeState.currentRoomInfo.roomName,
                        fromUser:state.homeState.userInfo,
                        toUser:user,
                        secondKing:true,
                        sessionId:state.homeState.userInfo.id+'-'+dataJson.user.id
                    };
                    console.log(Msg);
                    startMyCamVideoWithCallback(myVideoTag,true,Msg);
                    // setTimeout(function () {
                    //     offerPeerConnectionVideo(Msg,'firstVideo',true);
                    // },2000);
                    break;
                case 'reconnectVideo':
                    // let userInfo = state.homeState.userInfo;
                    if(dataJson.user.id !== userInfo.id && userInfo.id !== state.homeState.currentRoomInfo.king){
                        // addToNormalQuitUsers(dataJson.user.id);
                        onLeaveVideo(userInfo);
                        initVariableVideo();
                        initServerUserInfo();
                        console.log(dataJson.user.parentNode,userInfo.parentNode);
                        // if(dataJson.user.parentNode !== userInfo.parentNode){
                        setTimeout(function () {
                            getRoomInfoVideo(state.homeState.currentRoomInfo.roomId);
                        },2500);
                        // }
                    }
                    break;
             /*   case 'webrtc':

                    break;*/
                case 'moveToRoom':
                    let roomStatueTmp = state.homeState.roomStatus,
                        // userInfo = state.homeState.userInfo,
                        rId;
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
                    console.log(dataJson.objRoomInfo.roomId +','+ state.homeState.currentRoomInfo.roomId);
                    if(dataJson.objRoomInfo.roomId != state.homeState.currentRoomInfo.roomId){
                        //当不是目标用户时返回null
                        if(dataJson.user.id != state.homeState.userInfo.id) return;
                        console.log('enter');
                        let Msg = {
                            type:'leave_room',
                            roomId:state.homeState.currentRoomInfo.roomId,
                            // roomName:state.homeState.currentRoomInfo.roomName,
                            user:userInfo
                        };
                        send(JSON.stringify(Msg),function(){
                            store.dispatch({type:CONSTANT.NUMBERONE,val:0});
                            if(getPrepareConnectionState()){
                                onLeave(state.homeState.userInfo);
                            }
                            if(getPrepareConnectionStateVideo()){
                                onLeaveVideo(state.homeState.userInfo);
                            }
                            userInfo.Children = [];
                            Msg = {
                                type:'enter_room',
                                roomId:dataJson.objRoomInfo.roomId,
                                // roomName:dataJson.objRoomInfo.roomName,
                                user:userInfo
                            };
                            send(JSON.stringify(Msg),function(){
                                log('即将进入getRoomInfo','onmessage-moveToRoom','websocket.js');
                                getRoomInfo(dataJson.objRoomInfo.roomId);
                            });
                        });
                    }else{
                        if(dataJson.data === '消息成功发出'){
                            //
                        }
                    }
                    break;
                case 'uLimit':
                    console.log(dataJson);
                    console.log(state.homeState.userInfo);
                    if(dataJson.objUserId == state.homeState.userInfo.id){
                        //设置state.homeState.userInfo
                        let userInfoTmp = state.homeState.userInfo;
                        userInfoTmp.limit = getNewLimit(userInfoTmp.limit,dataJson.limit);
                        store.dispatch({type:CONSTANT.USERINFO,val:userInfoTmp});
                        updateUserInfo(userInfoTmp);
                        //http请求修改数据
                        let args = 'action=update&table=xuser&cond=id='+dataJson.objUserId+'&Limit='+userInfoTmp.limit;
                        limitFetch(args);
                        if(userInfoTmp.limit.toString().indexOf('3') !== -1){
                            if(state.homeState.microphoneOpen){
                                closeMicrophone();
                            }
                        }
                    }
                    break;
                case 'rLimit':
                    if(dataJson.objRoomId == state.homeState.currentRoomInfo.roomId){
                        //设置state.homeState.userInfo
                        let currentRoomInfoTmp = state.homeState.currentRoomInfo;
                        console.log(currentRoomInfoTmp);
                        currentRoomInfoTmp.limited = getNewLimit(currentRoomInfoTmp.limited,dataJson.limit);
                        store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:currentRoomInfoTmp});
                        //可能需要更新allRoomList中的user
                        setRoomInfo(currentRoomInfoTmp);
                        let args = 'action=update&table=room&cond=id='+dataJson.objRoomId+'&limited='+currentRoomInfoTmp.limited;
                        limitFetch(args);
                        if(currentRoomInfoTmp.limited.toString().indexOf('3') !== -1){
                            if(state.homeState.microphoneOpen){
                                closeMicrophone();
                            }
                        }
                    }
                    break;
                case 'uPower':
                    console.log(dataJson);
                    console.log(state.homeState.userInfo);
                    //提升权限只通知本人
                    if(dataJson.objUserId == state.homeState.userInfo.id){
                        //设置state.homeState.userInfo
                        let userInfoTmp = state.homeState.userInfo,
                            allRoomList = state.homeState.allRoomList;
                        userInfoTmp.level = dataJson.level;
                        store.dispatch({type:CONSTANT.USERINFO,val:userInfoTmp});
                        updateUserInfo(userInfoTmp);
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
                        // console.log(allRoomList);]
                        store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomList});
                    }
                    break;
                case 'vodSrc':
                    log('收到vodSrc:'+dataJson.vodSrc,'onmessage-vodSrc','websocket.js');
                    //收到vodSrc后自动播放
                    //如果是youku的视频
                    if(dataJson.webSite === 'youku'){
                        store.dispatch({type:CONSTANT.ISYOUKU,val:true})
                    }
                    if(!isPlaying){
                        let vodVideo = document.getElementById('vodVideo') || document.getElementById('play-audio');
                        //这里可能需要延时一小会
                        playVideo(vodVideo,dataJson.vodSrc);
                    }
                    break;
                case 'playMusic':
                    let videoTag = document.getElementById('play-audio');
                    if(videoTag){
                        videoTag.src = dataJson.musicSrc;
                        videoTag.autoplay = true;
                        isPlayingMusic = true;
                    }
                    break;
                case 'playAudio':
                    console.log('receive audio msg:');
                    let audioTag ;
                    if(dataJson.audiotype === 'applause'){
                        audioTag = document.getElementById('applause-audio');
                        audioTag.src = './sounds/applause.mp3';
                    }else if(dataJson.audiotype === 'cheer'){
                        audioTag = document.getElementById('cheer-audio');
                        audioTag.src = './sounds/cheer.mp3';
                    }
                    audioTag.autoplay = true;
                    break;
                case 'changeRoomMode':
                    sempher = 0;//重置preOffer的锁
                    isPlaying = false;//重置点播模式的播放标志
                    isPlayingMusic = false;//重置音乐播放的播放标志
                    log('收到改变房间模式消息：' + dataJson.mode + ',' + dataJson.player, 'onmessage-changeRoomMode', 'websocket.js');
                    let currentRoomInfo = state.homeState.currentRoomInfo;
                    onLeave(state.homeState.userInfo);
                    onLeaveVideo(state.homeState.userInfo);
                    //初始化服务器userInfo
                    initServerUserInfo();
                    //初始化原有模式的变量
                    if (currentRoomInfo.mode == '0' && (dataJson.mode == '1' || dataJson.mode == '3')) {
                        if (getPrepareConnectionState()) {
                            initVariableAudio();
                        }
                    }
                    if((currentRoomInfo.mode == '1' || currentRoomInfo.mode == '3') && dataJson.mode == '0'){
                        if (getPrepareConnectionStateVideo()) {
                            initVariableVideo();
                        }
                        // if(dataJson.user.id == state.homeState.userInfo.id){
                        //     startMyCam(document.getElementById('audioBox'));
                        // }
                    }
                    // console.log(currentRoomInfo);
                    // console.log(dataJson);
                    currentRoomInfo.mode = dataJson.mode;
                    currentRoomInfo.king = '';
                    currentRoomInfo.secondKing = '';
                    if(dataJson.user.id == state.homeState.userInfo.id){
                        if(dataJson.mode != 0 && dataJson.player){
                            currentRoomInfo.player = dataJson.player;
                            getRoomInfoVideo(currentRoomInfo.roomId);
                        }else if(dataJson.mode == 0){
                            if(!getPrepareConnectionState()){
                                successlog('audio模式，我是king，我要获取micStream');
                                startMyCam(document.getElementById('audioBox'));
                            }
                        }
                    }else{
                        //如果是0，即语音模式,则需要去找别人连接
                        if(dataJson.mode == 0){
                            if(dataJson.user.id != state.homeState.userInfo.id){
                                if(!getPrepareConnectionState()) {
                                    let videoBox = document.getElementById('audioBox');
                                    startMyCam(videoBox);
                                }
                                setTimeout(function () {
                                    getRoomInfo(currentRoomInfo.roomId);
                                },Math.ceil(Math.random() * 2000)+2000);
                            }
                            //这里不能直接getRoomInfo，不然会各自连成很多小的圈子
                        }else{
                            setTimeout(function () {
                                // console.log('timer 500:'+new Date().getTime());
                                // alert('viewer');
                                getRoomInfoVideo(currentRoomInfo.roomId)
                            },Math.ceil(Math.random() * 2000)+3000);
                        }
                    }
                    store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:currentRoomInfo});
                    if(state.homeState.microphoneMode != 1){
                        console.log(state.homeState.microphoneMode);
                        store.dispatch({type:CONSTANT.MICROPHONEMODE,val:1});
                    }
                    break;
                case 'blockIp':
                    console.log('收到blockIp消息');
                    //直接请求封Ip接口即可
                    fetch(blockIpApi).then(res=>{console.log('您已被禁止')}).catch(e=>console.error(e));
                    break;
                case 'updateContents':
                    // let roomInfo = state.homeState.currentRoomInfo;
                    roomInfo.contents = dataJson.roomContents;
                    store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfo});
                    break;
                case 'withdraw':
                    messagedata = messagedata.filter(function (item) {
                        if(item.timeStamp && item.timeStamp.toString() == dataJson.timeStamp){
                            // console.log(item.timeStamp.toString() === dataJson.timeStamp);
                            return;
                        }else{
                            return item;
                        }
                    });
                    break;
                case 'disconnect':
                    if (state.homeState.userInfo.numberOne == 2){//如果我是新预备老大，则我不用离开
                        return;
                    }else {
                        if(getPrepareConnectionState()){
                            onLeave(state.homeState.userInfo);
                        }
                        if(getPrepareConnectionStateVideo()){
                            onLeaveVideo(state.homeState.userInfo);
                        }
                        return;
                    }
                    break;
                case 'childReconnect':
                    // let userInfo = state.homeState.userInfo;
                    let toChildrenMsg = {
                        type:'msg',
                        typeString:'childReconnect',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        user:userInfo,
                        newKing:dataJson.newKing
                    };
                    if(getPrepareConnectionState()){
                        onLeave(userInfo);
                    }
                    if(getPrepareConnectionStateVideo()){
                        onLeaveVideo(userInfo);
                    }
                    if(userInfo.Children && userInfo.Children.length !== 0){
                        userInfo.Children.map(function (uId) {
                            if(uId === dataJson.newKing)return;
                            toChildrenMsg.ToUserOnly = uId;
                            send(JSON.stringify(toChildrenMsg),function () {});
                        })
                    }
                    getRoomInfoVideo(state.homeState.currentRoomInfo.roomId);
                    break;
                case 'webrtc':
                    if(dataJson.data !== '消息成功发出'){
                        if(dataJson.toUser && dataJson.toUser.id == state.homeState.userInfo.id ){
                            if(dataJson.offer){
                                // log('从'+ dataJson.fromUser.id+'收到offer','onmessage-webrtc','websocket.js');
                                successlog('从'+ dataJson.fromUser.name+'收到offer');
                                // console.log(dataJson);
                                let Msg = {
                                    type:'msg',
                                    typeString:'webrtc',
                                    roomId: roomInfo.roomId,		//房间唯一标识符
                                    // roomName: roomInfo.roomName,
                                    fromUser:state.homeState.userInfo,
                                    toUser:dataJson.fromUser,
                                    sessionId:state.homeState.userInfo.id+'-'+dataJson.fromUser.id,
                                };
                                if(dataJson.secondKing){
                                    Msg.secondKing = true;
                                }
                                if(getPrepareConnectionState() && roomInfo.mode == 0){
                                    answerPeerConnection(Msg,dataJson.offer, document.getElementById('audioBox'));
                                }else if(roomInfo.mode == 1){
                                    if(getPrepareConnectionStateVideo()){
                                        answerPeerConnectionVideo(Msg,dataJson.offer,'myVideo',true);
                                    }else{
                                        answerPeerConnectionVideo(Msg,dataJson.offer,'myVideo',false);
                                    }
                                }else if(roomInfo.mode == 3){
                                    if(getPrepareConnectionStateVideo()){
                                        if(dataJson.secondKing){
                                            answerPeerConnectionVideo(Msg,dataJson.offer,'secondVideo',true);
                                        }else{
                                            answerPeerConnectionVideo(Msg,dataJson.offer,'secondVideo',false);//顺序进入房间需改为true
                                        }
                                    }else{
                                        console.log('本地流未获取，连接人是观众');
                                        answerPeerConnectionVideo(Msg,dataJson.offer,'liveCanvas',false);
                                    }

                                }else {
                                    console.error('未知的房间模式或状态：'+ roomInfo.mode +',' + getPrepareConnectionStateVideo()+','+getPrepareConnectionState());
                                }
                            }
                            if(dataJson.answer){
                                // log('从 '+dataJson.fromUser.id+'收到answer','onmessage-webrtc','websocket.js');
                                successlog('从'+ dataJson.fromUser.name+'收到answer');
                                if(roomInfo.mode == 0){
                                    onAnswer(dataJson.answer,dataJson.sessionId,dataJson.fromUser.id);
                                }else if(roomInfo.mode == 1 || roomInfo.mode == 3){
                                    onAnswerVideo(dataJson.answer,dataJson.sessionId,dataJson.fromUser.id);
                                }else {
                                    console.error('onAnswer error');
                                }
                            }
                            if(dataJson.candidate){
                                console.log('recive candidate and setCandidate');
                                // onCandidate(dataJson.candidate,dataJson.sessionId);
                                if(roomInfo.mode == 0){
                                    onCandidate(dataJson.candidate,dataJson.sessionId);
                                }else if(roomInfo.mode == 1 || roomInfo.mode == 3){
                                    onCandidateVideo(dataJson.candidate,dataJson.sessionId);
                                }else {
                                    console.error('candidate error');
                                }
                            }
                        }
                    }
                    break;
                default:
                    if(dataJson.user && dataJson.data !== '消息成功发出'){
                        messagedata.push({
                            userId:dataJson.user.id,
                            userName: dataJson.user.name,
                            time: getDateString(),
                            data: dataJson.data,
                            timeStamp: dataJson.timeStamp
                        });
                    }
                    break;

            }
            break;
        case 'enter_room':
            // console.log(dataJson);
            removeToNormalQuitUsers(dataJson.user.id);
            removeUnexpectedUsers(dataJson.user.id);
            if(response.data === '房间不存在'){
                alert('房间不存在需要创建房间');
                console.log('并进入房间');
            }
            //如果进入房间的人是自己，则更新本地的userInfo
            if(dataJson.user.id == state.homeState.userInfo.id){
                store.dispatch({type:CONSTANT.USERINFO,val:dataJson.user});
            }
            //有人进入房间时需要更新AllRoomList
            allRoomListTmp = state.homeState.allRoomList;
            // console.log(dataJson);
            updateAllRoomListUserInfoByRoomId(dataJson.user,dataJson.roomId);
            //更新（增加）当前房间人数
            // let roomInfoEnter = state.homeState.currentRoomInfo;
            // roomInfoEnter.totalClients+=1;
            // store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfoEnter});
            // console.log(dataJson);
            messagedata.push({userName:dataJson.user.name,
                time:getDateString(),
                data:'<p>'+ dataJson.user.name + '已进入房间'+'</p>'});
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
            delSendListById(dataJson.user.id);
            delSendListByIdVideo(dataJson.user.id);
            addToNormalQuitUsers(dataJson.user.id);
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
            // 更新（减少）在线人数;
            // if(roomInfo.totalClients>0){
            //     console.log('leave-room:reducer totalClients');
            //     roomInfo.totalClients-=1;
            //     store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfo});
            // }
            //如果是连麦者，则更新服务器的secondKing
            if (roomInfo.secondKing == dataJson.user.id && roomInfo.king == state.homeState.userInfo.id){
                roomInfo.secondKing = '';
                setRoomInfo(roomInfo);
                store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfo});
            }
            //如果在麦序，则在麦序中删除
            let micUsers = state.homeState.roomMicrophoneUser;
            // console.log(micUsers);
            micUsers = micUsers.filter(function (item) {
                if(item.id == dataJson.user.id){
                    console.log(item);
                }
                return item.id != dataJson.user.id;
            });
            // console.warn(micUsers);
            if(roomInfo.onMicrophoneUsers.length !== micUsers.length){
                roomInfo.onMicrophoneUsers = micUsers;
                setRoomInfo(roomInfo);
            }
            store.dispatch({type:CONSTANT.ROOMMICROPHONEUSER,val:micUsers});
           /* if(micUsers[dataJson.user.id]){
                delete micUsers[dataJson.user.id];
            }*/
            messagedata.push({userName:dataJson.user.name,
                time:getDateString(),
                data:'<p>'+ dataJson.user.name + '已离开房间'+'</p>'});
            //如果在我的音源列表，则删除
            let audioInputUsers = state.homeState.microphoneInputUsers;
            if(audioInputUsers[dataJson.user.id]){
                delete audioInputUsers[dataJson.user.id];
                store.dispatch({type:CONSTANT.MICROPHONEINPUTUSERS,val:audioInputUsers});
                // console.log(audioInputUsers);
            }

            //异常状态掉线捕捉
            if(dataJson.user.status){
                successlog(dataJson.user.name+'异常掉线,'+dataJson.user.status);
                // if(roomInfoTmp.mode == '0'){
                //     onLeave(dataJson.user);
                // }else{
                //     onLeaveVideo(dataJson.user);
                // }
            }
            break;
        case 'get_room_users':
            if(dataJson.action === 'getMesh'){
                console.log('getMesh');
                window.localStorage.setItem('users',JSON.stringify(dataJson.data));
                window.localStorage.setItem('king',roomInfo.king);
                return;
            }
            // log('收到get_room_users消息');
            let UserInfoList = [], userIdList = [];
            console.log(dataJson.data);
            if(dataJson.data && dataJson.data[userInfo.id]){
                userInfo = dataJson.data[userInfo.id];
                if(Object.keys(dataJson.data).length === 1){//如果这个房间只有自己一个，那将自己的在线状态改为true
                    userInfo.isOnline = true;
                    //clearOnMicrophoneUsers();
                }
                if(userInfo.status){//如果我的状态是异常状态，则删除我的异常状态
                    delete userInfo.status;
                    delete userInfo.statusTime;
                }
                store.dispatch({type:CONSTANT.USERINFO,val:userInfo});//将从服务器获取的最新userInfo更新到本地
            }
            if(dataJson.data && Object.keys(dataJson.data).length > 1) {
                // console.log(dataJson.user);
                for (let item in dataJson.data) {
                    // console.log('userStatus:'+dataJson.data[item].status);
                    if(item != userInfo.id && !dataJson.data[item].status && dataJson.data[item].isOnline){//status是服务器发给前端的，代表异常状态的用户Unexpected close
                        UserInfoList.push(dataJson.data[item]);
                        userIdList.push(item);
                    }else{
                        userInfo = dataJson.data[item];
                        // console.log(userInfo);
                    }
                }
                // console.log(UserInfoList);
                store.dispatch({type:CONSTANT.USERINFOLIST,val:UserInfoList});//将userInfoList存入redux
                store.dispatch({type:CONSTANT.USERIDLIST,val:userIdList});//将连接备选人存入redux
                // console.log(userInfo,callbackVideo);
                if(callbackVideo !== null){
                    let callbackTmp = callbackVideo;
                    setCallbackVideo(null);
                    callbackTmp();
                }
                if(getRoomUserListCallback !== null){
                    let callbackTmp = getRoomUserListCallback;
                    setGetRoomUserListCallback(null);
                    callbackTmp();
                }
                //更新当前房间的人数
                roomInfo.totalClients = Object.keys(dataJson.data).length;
                updateTotalClientsByRoomid(roomInfo.roomId,roomInfo.totalClients);
                store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfo});
            }
           //更新左侧列表
            allRoomListTmp = state.homeState.allRoomList;
            // console.log(allRoomListTmp);
            allRoomListTmp.map(function (item) {
                if(item.childNode && item.childNode.length !== 0){
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

            break;
        case 'get_room_info':
            log('收到get_room_info消息','onmessage-get_room_info','websocket.js');
            // console.log(state.homeState.currentRoomInfo);
            console.log(dataJson.data);
            // alert(dataJson.data.advertisementFileId,dataJson.data.avatarFileId);
            let roomInfoTmp = dataJson.data;
            // console.error(roomInfo.mode);
            store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfoTmp});
            store.dispatch({type:CONSTANT.ROOMMICROPHONEUSER,val:roomInfoTmp.onMicrophoneUsers});
            //这里如果我已经在播放，则不需要重新播放了
            if(!isPlaying && roomInfoTmp.videoSrc){
                console.log(roomInfoTmp.videoSrc);
                let vodVideo = document.getElementById('vodVideo');
                playVideo(vodVideo,roomInfoTmp.videoSrc);
            }
            if(!isPlayingMusic && roomInfoTmp.musicSrc){
                console.log(roomInfoTmp.musicSrc);
                let vodVideo = document.getElementById('play-audio');
                vodVideo.src = roomInfoTmp.musicSrc;
                vodVideo.autoplay = true;
                isPlayingMusic = true;
            }
            if(!roomInfoTmp.microphoneMode){
                store.dispatch({type:CONSTANT.MICROPHONEMODE,val:1});//如果房间麦序模式为空则默认为1,自由模式
            }else if(state.homeState.microphoneMode !== roomInfoTmp.microphoneMode){
                store.dispatch({type:CONSTANT.MICROPHONEMODE,val:roomInfoTmp.microphoneMode});
            }else {
                //啥都不做
            }
            if (roomInfoTmp.mode == 0){
                initVariableVideo();
            }else{
                initVariableAudio();
            }
            // console.error("king:"+roomInfo.king+','+new Date().getTime());
            if(roomInfoTmp.king && roomInfoTmp.king != state.homeState.userInfo.id){
                store.dispatch({type:CONSTANT.NUMBERONE,val:roomInfoTmp.king});
                if(state.homeState.currentRoomInfo.mode == 0){
                    log('king已存在，我要入网:'+state.homeState.currentRoomInfo.mode,'onmessage-get_room_info','websocket.js');
                    getRoomUserList(startOnline);
                }else if(state.homeState.currentRoomInfo.mode == 3){
                    /*Object.keys(roomInfo).map(function (item) {
                        console.log(item+','+roomInfo[item]);
                    });*/
                    if(roomInfoTmp.secondKing){
                        log('连麦者已存在，我要入网:'+state.homeState.currentRoomInfo.mode,'onmessage-get_room_info','websocket.js');
                        startMyCamVideo(null,false);
                    }
                    getRoomUserListVideo(startOnlineVideo);
                }else{
                    // alert('already:'+roomInfo.king);
                    log('king已存在，我要入网:'+state.homeState.currentRoomInfo.mode,'onmessage-get_room_info','websocket.js');
                    startMyCamVideo(null,false);
                    getRoomUserListVideo(startOnlineVideo);
                }
            }else{
                //申请成为老大
                // alert('applyToBeFirst:'+roomInfo.king);
                log('没有king，我要申请成为新的king','onmessage-get_room_info','websocket.js');
                applyToBeFirst();
                //如果房间总人数为1，并且麦序列表长度不为0，则清空麦序列表。用于解决最后在线的人异常掉线后，程序没有做清除处理
                if(roomInfoTmp.totalClients === 1 && roomInfoTmp.onMicrophoneUsers.length !== 0){
                    clearOnMicrophoneUsers();
                }
            }
            break;
        case 'declare_king':
            // console.log(dataJson);
            if(dataJson.result === 'ok'){
                log('我成为了新的王：','onmessage-declare_king','websocket.js');
                // let roomInfo = state.homeState.currentRoomInfo,
                //     userInfo = state.homeState.userInfo;
                // console.log(state.homeState.userInfo);
                roomInfo.king = userInfo.id;
                userInfo.isOnline = true;
                updateUserInfo(userInfo);
                store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfo});
                store.dispatch({type:CONSTANT.NUMBERONE,val:dataJson.user.id});
                // console.log(state.homeState.currentRoomInfo.mode);
                if(roomInfo.mode == 1){
                    //直播模式,更新服务器player
                    console.log('直播模式，等待人连接');
                    //从语音模式房间进来的时候children会有，则需要置空,是否需要更新到服务器，且看rtc连接成功后是否会更新
                    userInfo.Children = [];
                    store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                    let myVideoTag = document.getElementById('myVideo');
                    startMyCamVideo(myVideoTag,true);
                }
                if(roomInfo.mode == 3){
                    //直播模式,更新服务器player
                    console.log('连麦直播模式，等待人连接');
                    //从语音模式房间进来的时候children会有，则需要置空,是否需要更新到服务器，且看rtc连接成功后是否会更新
                    userInfo.Children = [];
                    // roomInfo.king = userInfo.id;
                    store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                    // store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfo});
                    let myVideoTag = document.getElementById('firstVideo');
                    startMyCamVideo(myVideoTag,true);
                }
            }else{
                log('我没有成为王，我要getRoomInfo','onmessage-declare_king','websocket.js');
                getRoomInfo(state.homeState.currentRoomInfo.roomId);
            }
            break;
        case 'reset_king':
           console.log('reset_king:');
           console.log(dataJson);
            break;
        case 'get_rooms':
            // console.log(dataJson.data);
            let dataTmp = [],
                i=0;
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
                });
                item.childNode.sort(by('order'));
            });
            // console.log(dataTmp);
            // console.log(ids);
            if(dataTmp.length === 0)return;
            let allRoomList = state.homeState.allRoomList;
            if(!allRoomList){
                store.dispatch({type:CONSTANT.ALLROOMLIST,val:dataTmp});
            }else{
                //将两个roomList作对比，不一样的增加进现有的就可以
                getNewAllRoomList(dataTmp);
            }
            // store.dispatch({type:CONSTANT.CURRENTROOMINFO,
            //     val:dataTmp[0].childNode[0]});
            // store.dispatch({type:CONSTANT.LASTROOMINFO,
            //     val:dataTmp[0].childNode[0]});
            //getUserListforAllRoomList(dataTmp);
            // console.log(dataTmp);
            //if(roomInfo.)
            break;
        case 'set_room_info':
            console.log(dataJson);
            break;
        case 'create_room':
            console.log(dataJson);
            break;
        case 'delete_room':
            console.log(dataJson);
            upDateRoomListByDelRoomId(dataJson.roomId);
            // console.log(dataJson.data);
            //更新allRoomList
            break;
        case 'get_count':
            // console.log(dataJson);
            window.localStorage.setItem('serverData',JSON.stringify(dataJson));
            break;
        default:
            if(dataJson.result === 'ok'){
                if(dataJson.data === '房间人数更新'){
                    // console.log(dataJson.roomId,dataJson.totalClients);
                    updateTotalClientsByRoomid(dataJson.roomId,dataJson.totalClients);
                }else if(dataJson.data === '有房间被建立'){
                    console.log(dataJson);
                }else if(dataJson.data === '有房间被删除'){
                    console.log(dataJson);
                }else if(dataJson.data === '异常掉线'){
                    console.log(dataJson);
                    if(roomInfo.roomId === dataJson.roomId){
                        addUnexpectedUsers(dataJson.userId);
                        delayGetRoomUsers(dataJson.roomId);
                    }
                    if(userInfo.id === dataJson.userId){
                        console.log('%c收到自己掉线的消息，需要重新进入房间','color:purple');
                        enterRoom(roomInfo.roomId);
                    }
                }else{
                    console.error(dataJson);
                }
            }
            break;
    }
    store.dispatch({type:CONSTANT.MESSAGEDATA,val:messagedata});
    scrollToBottom();
}

/**
 * 根据用户信息和房间ID更新room-list列表
 * */
function updateAllRoomListUserInfoByRoomId(userInfo,roomId) {
    console.log('updateAllRoomListUserInfoByRoomId，'+roomId);
    if(!roomId)return;
    let allRoomListTmp = state.homeState.allRoomList;
    // console.log(dataJson);
    allRoomListTmp.map(function (item) {
        if(item.childNode.length !== 0){
            item.childNode.map(function (item) {
                if(item.roomId == roomId.toString()){
                    let flag = true;//flag表示是否可以插入用户
                    if(item.childNode){
                        item.childNode.map(function (uItem) {
                            if(uItem.id == userInfo.id){
                                //如果用户存在列表则不让插入
                                flag = false;
                            }
                        })
                    }
                    if(flag){
                        item.childNode.push({
                            name:userInfo.name,
                            id:userInfo.id,
                            level:userInfo.level,
                            sex:userInfo.sex,
                            avatar:userInfo.avatar
                        });
                    }
                }else {
                    if(item.childNode){
                        item.childNode = item.childNode.filter(function (uItem) {
                            //删除其他房间中的该用户
                            return uItem.id != userInfo.id;
                        })
                    }
                }
            });
        }
    });
    store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
}


// function log(message) {
//     console.log(state.homeState.userInfo.id+'==='+message);
//     //送到服务器后台
//     let msg = {
//         type:'log',
//         log:message,
//         user:state.homeState.userInfo
//     };
//     // send(JSON.stringify(msg),function () {
//     //
//     // })
// }

export default WS;

//

export {send, heartCheck, updateAllRoomListUserInfoByRoomId, resetIsplaying};
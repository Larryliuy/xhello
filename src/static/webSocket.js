import './pageClose.js';
import './media.js';
import {
    answerPeerConnection, getPrepareConnectionState, microphoneStatus, offerPeerConnection, onAnswer,
    onCandidate, onLeave, setGetRoomUserListCallback, getRoomUserListCallback, startOnline, applyToBeFirst,
    getRoomInfo, getRoomUserList, openMicrophone, closeMicrophone, initVariableAudio, startMyCam, updateServerUserInfo
} from "../webrtc/webRtcAudio";
import {
    getRoomUserListVideo, startMyCamVideo, startOnlineVideo, offerPeerConnectionVideo, answerPeerConnectionVideo,
    setCallbackVideo, callbackVideo, getPrepareConnectionStateVideo, onAnswerVideo, onCandidateVideo, onLeaveVideo,
    setRoomInfo, initVariableVideo, getRoomInfoVideo
} from "../webrtc/webRtcVideo";
import { ajustUserOrder } from '../static/comFunctions';
import store,{CONSTANT} from "../reducer/reducer";
import {blockIpApi, getImgApi} from "./apiInfo";

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
        // console.log('调用重连函数');
        createWebSocket(wsUrl);
        lockReconnect = false;
    }, 1000);
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

/**
 * 设置ws服务器房间信息
 * */


let sempher = 0,//表示申请连接的锁
    isPlaying = false;//表示是否正在播放视频
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

    /**
     * 清空麦序列表函数
     */
    function clearOnMicrophoneUsers() {//清空麦序列表函数
        let onMicrophoneUsers = state.homeState.roomMicrophoneUser,
            userInfo = state.homeState.userInfo;
        if(onMicrophoneUsers.length !== 0){
            if(onMicrophoneUsers[0].id === userInfo.id){//如果我是第一位并且我是开麦的，则关闭麦
                if(microphoneStatus && userInfo.level > 3){
                    closeMicrophone();
                }
            }
            store.dispatch({type:CONSTANT.ROOMMICROPHONEUSER,val:[]});
            //更新服务器的onMicrophoneUser
            let roomInfo = state.homeState.currentRoomInfo;
            roomInfo.onMicrophoneUsers = [];
            let setRoomMsg = {
                type:'set_room_info',
                roomId: roomInfo.roomId,		//房间唯一标识符
                roomName: roomInfo.roomName,
                user:state.homeState.userInfo,
                data:roomInfo
            };
            send(JSON.stringify(setRoomMsg),function(){
                console.log('更新(清空)服务器onMicrophoneUsers信息');
            });
        }
    }
    switch(dataJson.type){
        case 'msg':
            if(dataJson.typeString === 'preOffer'){
                log('从'+dataJson.fromUser.id+'收到准备连接申请');
                // console.log(state.homeState.userInfo);
                // console.log(dataJson.fromUser);
                let preAnswerMsg,userInfoTmp = state.homeState.userInfo;
                // console.log(dataJson.toUser.yes+','+state.homeState.userInfo.Children.length +','+ state.homeState.userInfo.maxChildren);
                if(sempher < 0) {
                    sendFailed();
                    return;
                }
                sempher = sempher - 1;
                if(userInfoTmp.Children.length < userInfoTmp.maxChildren){
                    //先占位
                    userInfoTmp.Children.push(dataJson.fromUser.id);//占位符这里的时间差
                    sempher = sempher + 1;
                    // userInfoTmp.seq = dataJson.toUser.seq;//将我的seq设置给本地state
                    store.dispatch({type:CONSTANT.USERINFO,val:userInfoTmp});
                    sendOK();
                }else{
                    sempher = sempher + 1;
                    sendFailed();
                }
                function sendFailed() {
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
                    });
                }
                function sendOK() {
                    preAnswerMsg = {
                        type:'msg',
                        typeString:'preAnswer',
                        ToUserOnly:dataJson.fromUser.id,
                        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                        roomName: state.homeState.currentRoomInfo.roomName,
                        fromUser:userInfoTmp,
                        status:'ok'
                    };
                    // console.log(userInfoTmp);
                    send(JSON.stringify(preAnswerMsg),function () {
                        log('发送连接申请的回复结果给 '+dataJson.fromUser.id+',结果：申请成功');
                    })
                }
                return;
            }
            if(dataJson.typeString === 'preAnswer'){
                log('收到 '+dataJson.fromUser.id + '的申请答复， 结果：'+ dataJson.status);
                // console.log(dataJson);
                let roomInfo = state.homeState.currentRoomInfo;
                if(dataJson.status === 'ok'){
                    //这里发offer
                    let Msg = {
                        type:'msg',
                        typeString:'webrtc',
                        ToUserOnly:dataJson.fromUser.id,
                        roomId: roomInfo.roomId,		//房间唯一标识符
                        roomName: roomInfo.roomName,
                        fromUser:state.homeState.userInfo,
                        toUser:dataJson.fromUser,
                        sessionId:state.homeState.userInfo.id+'-'+dataJson.fromUser.id
                    };
                    // console.log(dataJson.fromUser);
                    setTimeout(function () {/*intval = */
                        let roomMode = state.homeState.currentRoomInfo.mode;
                        if(getPrepareConnectionState() &&  roomMode == 0){
                            offerPeerConnection(Msg,document.getElementById('audioBox'));
                        }else if(roomMode == 1){
                            offerPeerConnectionVideo(Msg,'myVideo',false);
                        }else if(roomMode == 3){
                            if(!roomInfo.secondKing && dataJson.fromUser.Children.length<=1){
                                offerPeerConnectionVideo(Msg,'firstVideo',false);//按顺序进时这里需要改为true
                            }else{
                                offerPeerConnectionVideo(Msg,'firstVideo',false);
                            }
                        }else {
                            console.error('未知的房间模式或状态：'+ roomMode +',' + getPrepareConnectionState());
                        }
                    },500);
                }else if(dataJson.status === 'failed'){
                    getRoomInfo(roomInfo.roomId);
                }else{
                    log('未知的状态：'+dataJson.status);
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
                    if(getPrepareConnectionState()){
                        onLeave(state.homeState.userInfo);
                    }
                    if(getPrepareConnectionStateVideo()){
                        onLeaveVideo(state.homeState.userInfo);
                    }
                    return;
                }
            }
            // console.log(dataJson);
            if(dataJson.typeString === '放麦'){
                log('收到放麦消息');
                let userData = state.homeState.roomMicrophoneUser;
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
                    if(userData[0].fileId){
                        //根据请求获取用户头像
                        fetch(getImgApi+userData[0].fileId+".dat")
                            .then(res=>{/*console.log(res)*/return res.text()})
                            .then(data=>{
                               store.dispatch({type:CONSTANT.FIRSTUSERAVATAR,val:data});
                            })
                            .catch(e=>console.error(e))
                    }
                }
                return;
            }
            if(dataJson.typeString === '离麦'){
                log('收到离麦消息');
                let userInfo = state.homeState.userInfo;
                if(dataJson.user.id == userInfo.id){
                    if(microphoneStatus && userInfo.level > 3){
                        closeMicrophone();
                    }
                }
                let userData = state.homeState.roomMicrophoneUser;
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
                //更换第一个用户的头像
                if(userData[0] && userData[0].fileId){
                    //根据请求获取用户头像
                    fetch(getImgApi+userData[0].fileId+".dat")
                        .then(res=>{/*console.log(res)*/return res.text()})
                        .then(data=>{
                            store.dispatch({type:CONSTANT.FIRSTUSERAVATAR,val:data});
                        })
                        .catch(e=>console.error(e))
                }else{
                    store.dispatch({type:CONSTANT.FIRSTUSERAVATAR,val:'./images/avatar.png'});
                }
                return;
            }
            if(dataJson.typeString === '禁麦'){
                // console.log('禁麦');
                let userData = state.homeState.roomMicrophoneUser;
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
                //更换第一个用户的头像
                if(userData[0] && userData[0].fileId){
                    //根据请求获取用户头像
                    fetch(getImgApi+userData[0].fileId+".dat")
                        .then(res=>{/*console.log(res)*/return res.text()})
                        .then(data=>{
                            store.dispatch({type:CONSTANT.FIRSTUSERAVATAR,val:data});
                        })
                        .catch(e=>console.error(e))
                }else{
                    store.dispatch({type:CONSTANT.FIRSTUSERAVATAR,val:'./images/avatar.png'});
                }
                return;
            }
            if(dataJson.typeString === 'microphoneMode'){//麦序模式改变
                store.dispatch({type:CONSTANT.MICROPHONEMODE,val:dataJson.microphoneMode});
                if(dataJson.microphoneMode == 1){
                    clearOnMicrophoneUsers();
                    if(!microphoneStatus){
                        openMicrophone();
                    }
                }
                if(dataJson.microphoneMode == 2){
                    clearOnMicrophoneUsers();
                    if(state.homeState.userInfo.level < 4) {
                        if(!microphoneStatus){
                            openMicrophone();
                        }
                    }else{
                        if(microphoneStatus){
                            closeMicrophone();
                        }
                    }
                }
                if(dataJson.microphoneMode == 3){
                    if(state.homeState.userInfo.level < 4) {
                        //如果我是关麦状态，没有要强行打开麦
                        // if(!microphoneStatus){
                        //     openMicrophone();
                        // }
                    }else{
                        if(microphoneStatus){
                            closeMicrophone();
                        }
                    }
                }
                return;
            }
            if(dataJson.typeString === 'changeMicOrder'){
                let micUsers = state.homeState.roomMicrophoneUser,newMicUsers;
                newMicUsers = ajustUserOrder(micUsers,dataJson.orderInfo);
                store.dispatch({type:CONSTANT.ROOMMICROPHONEUSER,val:newMicUsers});
                if(state.homeState.userInfo.id == dataJson.user.id){
                    let roomInfo = state.homeState.currentRoomInfo;
                    roomInfo.onMicrophoneUsers = newMicUsers;
                    let setRoomMsg = {
                        type:'set_room_info',
                        roomId: roomInfo.roomId,		//房间唯一标识符
                        roomName: roomInfo.roomName,
                        user:state.homeState.userInfo,
                        data:roomInfo
                    };
                    send(JSON.stringify(setRoomMsg),function(){
                        console.log('更新服务器onMicrophoneUsers信息');
                    });
                }
                return;
            }
            if(dataJson.typeString === 'changeRoomOrder'){
                console.log('收到changeRoomOrder消息');
                let allRoomList = state.homeState.allRoomList,
                    roomInfo = state.homeState.userInfo,
                    newRoomList = dataJson.newRoomList;
                console.log(dataJson);
                allRoomList = allRoomList.map(function (item) {
                    if(item.childNode.length !== 0){
                        item.childNode.map(function (cItem) {
                            if(cItem.roomId == dataJson.orderInfo.roomId){
                                item.childNode = newRoomList;
                            }
                        });
                    }
                    return item;
                });
                console.log(allRoomList);
                store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomList});
                if(state.homeState.userInfo.id == dataJson.user.id){
                    let setRoomMsg = {
                        type:'update_room_info',
                        roomId: roomInfo.roomId,		//房间唯一标识符
                        roomName: roomInfo.roomName,
                        user:state.homeState.userInfo,
                        data:newRoomList
                    };
                    send(JSON.stringify(setRoomMsg),function(){
                        console.log('update_room_info更新服务器changeRoomOrder信息');
                    });
                }
                return;
            }
            if(dataJson.typeString === 'audioSourceInput'){
                console.log('收到audioSourceInput消息');
                // console.log(dataJson);
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
                return;
            }
            if(dataJson.typeString === 'applyToBebarley'){
                console.log('收到连麦者申请:'+dataJson.user.id);
                let roomInfo = state.homeState.currentRoomInfo;
                if(!roomInfo.secondKing && dataJson.user.id !== state.homeState.userInfo.id){
                    console.log('连麦者不存在，可同意连麦');
                    let preBarleyListsBox = document.getElementById('preBarleyLists');
                    preBarleyListsBox.style.zIndex = Number(dataJson.user.id);
                    preBarleyListsBox.innerText = '同意 '+dataJson.user.name;
                    preBarleyListsBox.style.visibility = 'visible';
                }
                return;
            }
            if(dataJson.typeString === 'agreeToBebarley'){
                console.log('收到同意连麦的消息');
                onLeaveVideo(state.homeState.userInfo);
                let myVideoTag = document.getElementById('secondVideo');
                startMyCamVideo(myVideoTag,true);
                let user = dataJson.user;
                user.Children = user.Children.filter(function (item) {
                    return item !== user.id;
                });
                let Msg = {
                    type:'msg',
                    typeString:'webrtc',
                    ToUserOnly:dataJson.user.id,
                    roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                    roomName: state.homeState.currentRoomInfo.roomName,
                    fromUser:state.homeState.userInfo,
                    toUser:user,
                    secondKing:true,
                    sessionId:state.homeState.userInfo.id+'-'+dataJson.user.id
                };
                console.log(Msg);
                setTimeout(function () {
                    offerPeerConnectionVideo(Msg,'firstVideo',true);
                },1000);
                return;
            }
            if(dataJson.typeString === 'reconnectVideo'){
                console.log(state.homeState.currentRoomInfo.king);
                if(dataJson.user.id !== state.homeState.userInfo.id && dataJson.user.id !== state.homeState.currentRoomInfo.king){
                    getRoomInfoVideo(state.homeState.currentRoomInfo.roomId);
                }
                return;
            }
            if(dataJson.typeString === 'webrtc' && dataJson.data !== '消息成功发出' ){
                // console.log(dataJson);
                let roomInfo = state.homeState.currentRoomInfo;
                if(dataJson.toUser && dataJson.toUser.id == state.homeState.userInfo.id ){
                    if(dataJson.offer){
                        log('从'+ dataJson.fromUser.id+'收到offer');
                        // console.log(dataJson);
                        let Msg = {
                            type:'msg',
                            typeString:'webrtc',
                            roomId: roomInfo.roomId,		//房间唯一标识符
                            roomName: roomInfo.roomName,
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
                                /*if(state.homeState.userInfo.Children.length <=1){
                                    // console.log('孩子节点数小于等于1,连接人是连麦者');
                                    // console.log(dataJson);
                                    if(dataJson.secondKing){
                                        answerPeerConnectionVideo(Msg,dataJson.offer,'secondVideo',true);
                                    }else{
                                        answerPeerConnectionVideo(Msg,dataJson.offer,'secondVideo',false);//顺序进入房间需改为true
                                    }
                                }else{
                                    console.log('孩子节点数大于1,连接人不是连麦者');
                                    answerPeerConnectionVideo(Msg,dataJson.offer,'liveCanvas',false);
                                }*/
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
                            console.error('未知的房间模式或状态：'+ roomInfo.mode +',' + getPrepareConnectionStateVideo());
                        }
                    }
                    if(dataJson.answer){
                        log('从 '+dataJson.fromUser.id+'收到answer');
                        if(roomInfo.mode == 0){
                            onAnswer(dataJson.answer,dataJson.sessionId,dataJson.fromUser.id);
                        }else if(roomInfo.mode == 1 || roomInfo.mode == 3){
                            onAnswerVideo(dataJson.answer,dataJson.sessionId,dataJson.fromUser.id);
                        }else {
                            console.error('onAnswer error');
                        }
                    }
                    if(dataJson.candidate){
                        // console.log('recive candidate and setCandidate');
                        onCandidate(dataJson.candidate,dataJson.sessionId);
                        if(roomInfo.mode == 0){
                            onCandidate(dataJson.candidate,dataJson.sessionId);
                        }else if(roomInfo.mode == 1 || roomInfo.mode == 3){
                            onCandidateVideo(dataJson.candidate,dataJson.sessionId);
                        }else {
                            console.error('candidate error');
                        }
                    }
                }
                return;
            }

            //移动到我所在房间
            if(dataJson.typeString === 'moveToRoom'){
                let roomStatueTmp = state.homeState.roomStatus,
                    userInfo = state.homeState.userInfo,
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
                console.log(dataJson.objRoomInfo.roomId +','+ state.homeState.currentRoomInfo.roomId)
                if(dataJson.objRoomInfo.roomId != state.homeState.currentRoomInfo.roomId){
                    //当不是目标用户时返回null
                    if(dataJson.user.id != state.homeState.userInfo.id) return;
                    console.log('enter');
                    let Msg = {
                        type:'leave_room',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
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
                            roomName:dataJson.objRoomInfo.roomName,
                            user:userInfo
                        };
                        send(JSON.stringify(Msg),function(){
                            log('即将进入getRoomInfo');
                            getRoomInfo(dataJson.objRoomInfo.roomId);
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
            if(dataJson.typeString === 'vodSrc'){
                log('收到vodSrc:'+dataJson.vodSrc);
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
                return;
            }
            if(dataJson.typeString === 'playMusic'){
                let videoTag = document.getElementById('play-audio');
                if(videoTag){
                    videoTag.src = dataJson.musicSrc;
                    videoTag.autoplay = true;
                }
            }
            if(dataJson.typeString === 'changeRoomMode'){
                log('收到改变房间模式消息：'+dataJson.mode+','+dataJson.player);
                let currentRoomInfo = state.homeState.currentRoomInfo;
                //初始化服务器userInfo
                updateServerUserInfo();
                //初始化原有模式的变量
                if(getPrepareConnectionState()){
                    onLeave(state.homeState.userInfo);
                    initVariableAudio();
                }
                if(getPrepareConnectionStateVideo()){
                    onLeaveVideo(state.homeState.userInfo);
                    initVariableVideo();
                }
                console.log(currentRoomInfo);
                console.log(dataJson);
                currentRoomInfo.mode = dataJson.mode;
                currentRoomInfo.king = '';
                currentRoomInfo.secondKing = '';
                if(dataJson.user.id == state.homeState.userInfo.id && dataJson.player){
                    if(dataJson.mode != 0){
                        currentRoomInfo.player = dataJson.player;
                        getRoomInfoVideo(currentRoomInfo.roomId);
                    }
                }else{
                    //如果是0，即语音模式,则需要去找别人连接
                    if(dataJson.mode == 0){
                        let videoBox = document.getElementById('audioBox');
                        startMyCam(videoBox);
                        getRoomInfo(currentRoomInfo.roomId);
                        //这里不能直接getRoomInfo，不然会各自连成很多小的圈子
                    }else{
                        getRoomInfoVideo(currentRoomInfo.roomId)
                    }
                }
                store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:currentRoomInfo});
                if(state.homeState.microphoneMode != 1){
                    console.log(state.homeState.microphoneMode);
                    store.dispatch({type:CONSTANT.MICROPHONEMODE,val:1});
                }

                return;
            }
            //消息撤回
            if(dataJson.typeString === 'withdraw'){
                /*console.log(data);
                console.log(dataJson);*/
                // let messageData = state.homeState.messageData;
                messagedata = messagedata.filter(function (item) {
                    if(item.timeStamp && item.timeStamp.toString() == dataJson.timeStamp){
                        // console.log(item.timeStamp.toString() === dataJson.timeStamp);
                        return;
                    }else{
                        return item;
                    }
                });
                // return;
            }
            //封ip消息
            if (dataJson.typeString === 'blockIp'){
                console.log('收到blockIp消息');
                //直接请求封Ip接口即可
                fetch(blockIpApi).then(res=>{console.log('您已被禁止')}).catch(e=>console.error(e));
                return;
            }
            if(dataJson.typeString === 'updateContents'){
                let roomInfo = state.homeState.currentRoomInfo;
                roomInfo.contents = dataJson.roomContents;
                store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfo});
                return;
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
            //如果进入房间的人是自己，则更新本地的userInfo
            if(dataJson.user.id == state.homeState.userInfo.id){
                store.dispatch({type:CONSTANT.USERINFO,val:dataJson.user});
            }
            //有人进入房间时需要更新AllRoomList
            allRoomListTmp = state.homeState.allRoomList;
            // console.log(dataJson);
            allRoomListTmp.map(function (item) {
                if(item.childNode.length !== 0){
                    item.childNode.map(function (item) {
                        if(item.roomId == dataJson.roomId.toString()){
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
            //更新（增加）当前房间人数
            let roomInfoEnter = state.homeState.currentRoomInfo;
            roomInfoEnter.totalClients+=1;
            store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfoEnter});
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
            let roomInfoTmp = state.homeState.currentRoomInfo;
            if(roomInfoTmp.totalClients>0){
                console.log('leave-room:reducer totalClients');
                roomInfoTmp.totalClients-=1;
                store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfoTmp});
            }
            //如果是连麦者，则更新服务器的secondKing
            if (roomInfoTmp.secondKing == dataJson.user.id && roomInfoTmp.king == state.homeState.userInfo.id){
                roomInfoTmp.secondKing = '';
                setRoomInfo(roomInfoTmp);
                store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfoTmp});
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
            if(roomInfoTmp.onMicrophoneUsers.length !== micUsers.length){
                roomInfoTmp.onMicrophoneUsers = micUsers;
                setRoomInfo(roomInfoTmp);
            }
            store.dispatch({type:CONSTANT.ROOMMICROPHONEUSER,val:micUsers});
           /* if(micUsers[dataJson.user.id]){
                delete micUsers[dataJson.user.id];
            }*/
            messagedata.push({userName:dataJson.user.name,
                time:getDateString(),
                data:'<p>'+ dataJson.user.name + '已离开房间'+'</p>'});
            break;

        case 'get_room_users':
            log('收到get_room_users消息');
            let UserInfoList = [], userIdList = [], userInfo = state.homeState.userInfo;
            console.log(dataJson.data);
            if(dataJson.data && dataJson.data[userInfo.id]){
                userInfo = dataJson.data[userInfo.id];
                store.dispatch({type:CONSTANT.USERINFO,val:userInfo});//将从服务器获取的最新userInfo更新到本地
            }
            if(dataJson.data && Object.keys(dataJson.data).length > 1) {
                // console.log(dataJson.user);
                for (let item in dataJson.data) {
                    if(item != userInfo.id ){
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
            }


           //更新左侧列表
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

            break;
        case 'get_room_info':
            log('收到get_room_info消息');
            // console.log(state.homeState.currentRoomInfo);
            console.log(dataJson.data);
            // alert(dataJson.data.advertisementFileId,dataJson.data.avatarFileId);
            let roomInfo = dataJson.data;
            store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfo});
            store.dispatch({type:CONSTANT.ROOMMICROPHONEUSER,val:roomInfo.onMicrophoneUsers});
            //这里如果我已经在播放，则不需要重新播放了
            if(!isPlaying && roomInfo.videoSrc){
                console.log(roomInfo.videoSrc);
                let vodVideo = document.getElementById('vodVideo');
                playVideo(vodVideo,roomInfo.videoSrc);
            }
            if(!roomInfo.microphoneMode){
                store.dispatch({type:CONSTANT.MICROPHONEMODE,val:1});//如果房间麦序模式为空则默认为1,自由模式
            }else if(state.homeState.microphoneMode !== roomInfo.microphoneMode){
                store.dispatch({type:CONSTANT.MICROPHONEMODE,val:roomInfo.microphoneMode});
            }else {
                //啥都不做
            }
            if (roomInfo.mode == 0){
                initVariableVideo();
            }else{
                initVariableAudio();
            }
            if(roomInfo.king && roomInfo.king != state.homeState.userInfo.id){
                store.dispatch({type:CONSTANT.NUMBERONE,val:roomInfo.king});
                if(state.homeState.currentRoomInfo.mode == 0){
                    log('king已存在，我要入网:'+state.homeState.currentRoomInfo.mode);
                    getRoomUserList(startOnline);
                }else if(state.homeState.currentRoomInfo.mode == 3){
                    /*Object.keys(roomInfo).map(function (item) {
                        console.log(item+','+roomInfo[item]);
                    });*/
                    if(roomInfo.secondKing){
                        log('连麦者已存在，我要入网:'+state.homeState.currentRoomInfo.mode);
                        startMyCamVideo(null,false);
                    }
                    getRoomUserListVideo(startOnlineVideo);
                }else{
                    log('king已存在，我要入网:'+state.homeState.currentRoomInfo.mode);
                    startMyCamVideo(null,false);
                    getRoomUserListVideo(startOnlineVideo);
                }
            }else{
                //申请成为老大
                log('没有king，我要申请成为新的king');
                applyToBeFirst();
            }
            break;
        case 'declare_king':
            // console.log(dataJson);
            if(dataJson.result === 'ok'){
                log('我成为了新的王：');
                let roomInfo = state.homeState.currentRoomInfo,
                    userInfo = state.homeState.userInfo;
                // console.log(state.homeState.userInfo);
                roomInfo.king = userInfo.id;
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
                log('我没有成为王，我要getRoomInfo');
                getRoomInfo(state.homeState.currentRoomInfo.roomId);
            }
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
}

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
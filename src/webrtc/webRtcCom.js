import WS, {getDateString, getSendData, send} from "../static/webSocket";
import store, {CONSTANT} from "../reducer/reducer";
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
});

let  micphoneStream, prepareState = false, rtcSessionList=[], pcMeshChain=[], remoteVidoeDom,Msg;
//创建web audio实例,声明web Audio生成的stream
let myMicSource, myVideo,firstCandidate = 0;
//stun服务器
let stun_server = {
    urls: 'stun:turn.xtell.cn:3479'
};
// or TURN服务器
let turn_server = {
    urls: 'turn:turn.xtell.cn:3478',
    credential: 'webrtc',
    username: 'webrtc'
};

let iceServers = [stun_server, turn_server];
let rtcPeerConfig = {
    iceTransports: 'all',
    iceServers: iceServers
};
// let configuration = rtcPeerConfig;
// if (hasRTCPeerConnection()) {
//     yourConnection = new RTCPeerConnection(rtcPeerConfig);
// } else {
//     alert("Sorry, your browser does not support WebRTC.");
// }
function getPrepareConnectionState(){
    return prepareState;
}
//获取本地音频流
function startMyCam(videoBox){
    if (hasUserMedia()) {
        navigator.getUserMedia({ video: false, audio: true }, function(myStream) {
            // myWASource = audioCtx.createMediaStreamSource(myStream);
            // mixedOutput  = audioCtx.createMediaStreamDestination();
            // myWASource.connect(mixedOutput);
            // myLocalStream = mixedOutput.stream;
            micphoneStream = myStream;
            //将自己的音轨存入全局state
            // console.log(micphoneStream.getAudioTracks());
            store.dispatch({type:CONSTANT.MYAUDIOTRACK,val:micphoneStream.getAudioTracks()});
            // console.log(myLocalStream);
            myVideo = document.createElement('video');
            myVideo.src = window.URL.createObjectURL(micphoneStream);
            myVideo.addEventListener('canplay', function(){
                myVideo.muted = true;		//mute local video to avoid echo by myself.
            });
            myVideo.addEventListener('play', function(){
                myVideo.muted = true;		//mute local video to avoid echo by myself.
            });
            myVideo.style.width='1px';
            myVideo.style.height='1px';
            myVideo.autoplay=true;
            myVideo.controls=true;
            videoBox.appendChild(myVideo);
            prepareState = true;
        }, function(error){
            console.log(error);
        });
    }
}



function preparePeerConnection(wbMsg,sessionId,micphoneStream,remoteVidoeId,type) {
    log("进入preparePeerConnection函数!");
    let newConnection;
    if (hasRTCPeerConnection()) {
        // console.log('prepareState:'+prepareState);
        if(!prepareState)return;

        newConnection = new RTCPeerConnection(rtcPeerConfig);

        // console.log(localstream);
        if(!micphoneStream)return;
        //准备连接时先设置自己的stream到video
        // console.log(localStream);
        let webAudio,mixedOutput,moMicOutputStream;
        try{
            webAudio = new (window.AudioContext || window.webkitAudioContext)();// Failed to construct 'AudioContext': The number of hardware contexts provided (6) is greater than or equal to the maximum bound (6)
        }catch (e){
            console.error(e);
        }
        if(!webAudio){log('webAudio创建失败');console.log(webAudio);return;}
        myMicSource = webAudio.createMediaStreamSource(micphoneStream);
        mixedOutput  = webAudio.createMediaStreamDestination();
        moMicOutputStream = webAudio.createMediaStreamDestination();
        myMicSource.connect(mixedOutput);

        newConnection.addStream(mixedOutput.stream);
        newConnection.onaddstream = function (e) {
            remoteVidoeDom = document.querySelector('#'+remoteVidoeId);
            remoteVidoeDom.src = window.URL.createObjectURL(e.stream);
            log('触发onaddstream');
            mixerAudio(e.stream,newConnection,true);
        };
        // Setup ice handling
        newConnection.onicecandidate = function (event) {
            //	console.log("yourConnection.onicecandidate!");
            if (event.candidate) {
                let Msg = wbMsg;
                // console.log(Msg);
                if(Msg.offer) delete Msg.offer;//删除回传的offer
                if(Msg.answer) delete Msg.answer;//删除回传的answer
                Msg.candidate = event.candidate;
                send(JSON.stringify(Msg),function () {
                    log("发送 candidate 给 "+Msg.toUser.id);
                })
            }
        };
        newConnection.oniceconnectionstatechange = function(event) {
            // console.log(type);
            let userInfo = state.homeState.userInfo, updateUserMsg;
            let objItem ;
            rtcSessionList.map(function (item) {
                if(item.toUserId == wbMsg.toUser.id) {
                    objItem = item;
                }
            });
            console.log(wbMsg);
            // console.log(rtcSessionList);
            // console.log(objItem);
            switch(newConnection.iceConnectionState) {
                case "connected":
                    rtcSessionList.map(function (item) {
                        if(item.toUserId == wbMsg.toUser.id) {
                            item.pcState = 'connected';
                            item.pcStateTime = new Date().getTime()/1000;
                        }
                    });
                    // The connection has become fully connected
                    // 处理成功的情况
                    log(' 与 '+ wbMsg.toUser.id + ' 连接成功');
                    // console.log(state.homeState.userInfo);
                    if(type === 'offer'){
                        userInfo.parentNode = wbMsg.toUser.id;
                    }else{
                        let exist = false;//表示是否有占位符
                        for(let i = 0; i < userInfo.Children.length; i++){
                            if(userInfo.Children[i] == wbMsg.toUser.id){
                                exist = true;
                                break;
                            }
                        }
                        if(!exist){//只要他有占位就不用添加了
                            userInfo.Children.push(wbMsg.toUser.id);
                        }
                    }
                    updateUserMsg = {
                        type:'update_user',
                        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                        roomName: state.homeState.currentRoomInfo.roomName,
                        user:userInfo
                    };
                    console.log(updateUserMsg);
                    if(!userInfo.seq)return;
                    store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                    send(JSON.stringify(updateUserMsg),function () {
                        log('发送update_user消息到服务器');
                    });
                    break;
                case "disconnected":
                    // console.log("disconnected");
                    if(objItem){
                        objItem.ondisconnected();
                    }
                    return;
                case "failed":
                    if(objItem){
                        objItem.ondisconnected();
                    }
                    // One or more transports has terminated unexpectedly or in an error
                    break;
                case "closed":
                    // The connection has been closed,本人关闭或被动通知后关闭会触发（即调用peerConnection.close()）,通知后台我已关闭连接
                    if(objItem){
                        objItem.ondisconnected();
                    }
                    break;
                default:
                    // console.log('default:'+newConnection.iceConnectionState);
                    break;
            }

        };
        // console.log(wbMsg);
        return {
            toUser:wbMsg.toUser,
            type:type,
            pc:newConnection,
            pcState:'connecting',
            pcStateTime:new Date().getTime()/1000,
            myMicSource:myMicSource,
            wa:webAudio,
            mixer:mixedOutput,
            noMicMixer:moMicOutputStream,
            pcOutStream:null,
            ondisconnected:function () {
            log('进入ondisconnected');
            if(this.pcState === 'disconnected')return;
            let preState = this.pcState;
            let preStateTime = this.pcStateTime;
                this.pcStateTime = new Date().getTime()/1000;
                this.pcState = 'disconnected';
                // this.wa.close();
                // this.pcOutStream = null;
                // this.mixer = null;
                // this.pc.close();

                onLeave(this.toUser);

                let userInfo = state.homeState.userInfo;
                if(this.type === 'answer' ){
                    //占位符干掉,通知服务器，更新自己
                    // console.log(this.toUser);
                    // console.log(wbMsg.fromUser);
                    let _this = this;
                    // console.log('下面的userInfo可能会没有seq值');
                    // console.log(userInfo);
                    console.log('seq:'+userInfo.seq);
                    userInfo.Children = userInfo.Children.filter(function (item) {
                        return _this.toUser.id != item;
                    });
                    // console.log(userInfo);
                }else{
                    //父亲掉线
                    userInfo = state.homeState.userInfo;
                    userInfo.parentNode = '';
                    firstCandidate = 0;
                    getRoomInfo();
                    /*console.log(this.pcStateTime - preStateTime);
                    if(preState === 'connected' && (this.pcStateTime - preStateTime) >= 60){
                        firstCandidate = 0;
                        getRoomUserList(startOnline);
                    }else{
                        // startOnline();
                        getRoomInfo();
                    }*/
                }
                let updateUserMsg = {
                    type:'update_user',
                    roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                    roomName: state.homeState.currentRoomInfo.roomName,
                    user:userInfo
                };
                console.log(updateUserMsg);
                if(!userInfo.seq)return;
                send(JSON.stringify(updateUserMsg),function () {
                    log('把 '+ wbMsg.toUser.id +' 的断线消息发送到服务器');
                });

            },
            onclosemicrophone:function () {
                log('进入onclosemicrophone');
                this.myMicSource.disconnect(this.mixer);
                // console.log(this.mixer.stream);
                // console.log(this.noMicMixer.stream);
                //在这里关闭麦克风音源
                // this.pc.removeStream(this.mixer.stream);
                // this.pc.addStream(this.noMicMixer.stream);
                // let newMixer = this.wa.createMediaStreamDestination(),
                //     newLocalStream = newMixer.stream,
                //     remoteVidoeDom;
                // this.mixer = newMixer;
                // this.pc.addStream(newLocalStream);
                // console.log(this.pcOutStream);
                // mixerAudio(this.pcOutStream,this.pc,false);
                // remoteVidoeDom = document.querySelector('#'+this.remoteVideoId);
                // remoteVidoeDom.src = window.URL.createObjectURL(this.pcOutStream);
            },
            onopenmicrophone:function () {
                log('进入onopenmicrophone');
                this.myMicSource.connect(this.mixer);
                // console.log(this.mixer.stream);
                // console.log(this.noMicMixer.stream);
                // this.pc.removeStream(this.noMicMixer.stream);
                // this.pc.addStream(this.mixer.stream);
                //这里开启麦克风音源
                // this.pc.removeStream(this.mixer.stream);
                // let newMixer = this.wa.createMediaStreamDestination(),
                //     myMicSource = this.wa.createMediaStreamSource(micphoneStream),
                //     newLocalStream ,remoteVidoeDom;
                // myMicSource.connect(newMixer);
                // newLocalStream = newMixer.stream;
                // this.mixer = newMixer;
                // this.pc.addStream(newLocalStream);
                // mixerAudio(this.pcOutStream,this.pc,false);
                // remoteVidoeDom = document.querySelector('#'+this.remoteVideoId);
                // remoteVidoeDom.src = window.URL.createObjectURL(this.pcOutStream);
            }};
    }else{
        alert("NO WEBRTC"); return;
    }

}

function offerPeerConnection(wbMsg,videoBox) {
    let videoId = "video_" + wbMsg.toUser.id;
    let theirVideo = document.createElement('video');
    // theirVideo.src = window.URL.createObjectURL(stream);
    theirVideo.style.width='1px';
    theirVideo.style.height='1px';
    theirVideo.autoplay= true;
    theirVideo.controls=true;
    theirVideo.id=videoId;
    videoBox.appendChild(theirVideo);
    log('进入offerPeerConnection');
    let xpc = preparePeerConnection(wbMsg,wbMsg.sessionId, micphoneStream, videoId,'offer');
    // console.log(xpc);
    if(!xpc)return;
    let rtcSession = {
        sessionId:wbMsg.sessionId,
        fromUserId:wbMsg.fromUser.id,
        toUserId:wbMsg.toUser.id,
        status:'offer',
        remoteVideoId:videoId,
        pc:xpc.pc,
        wa:xpc.wa,
        myMicSource:xpc.myMicSource,
        mixer:xpc.mixer,
        noMicMixer:xpc.noMicMixer,
        pcState:xpc.pcState,
        pcStateTime:xpc.pcStateTime,
        type:xpc.type,
        ondisconnected:xpc.ondisconnected,
        onclosemicrophone:xpc.onclosemicrophone,
        onopenmicrophone:xpc.onopenmicrophone,
        toUser:xpc.toUser,
        pcOutStream:xpc.pcOutStream
    };
    // let isExiat = false;//标记rtcSession是否存在
    rtcSessionList = rtcSessionList.filter(function (item) {
        if(item.sessionId == wbMsg.sessionId){
            // isExiat = true;
            removeInstance(item);
        }
        return item.sessionId != wbMsg.sessionId;
    });
    rtcSessionList.push(rtcSession);
    xpc.pc.createOffer(function (offer) {
        Msg = wbMsg;
        Msg.offer = offer;
        if(Msg.answer) delete Msg.answer;
        if(Msg.candidate) delete Msg.candidate;
        // console.log(Msg);
        send(JSON.stringify(Msg),function () {
            log('已发送offer给'+ Msg.toUser.id);
            xpc.pc.setLocalDescription(offer);
        });
    }, function (error) {
        alert("An error has occurred 1.");
    });
}
function answerPeerConnection(wbMsg,offer,videoBox) {
    log('进入answerPeerConnection');
    let videoId = "video_" + wbMsg.toUser.id;
    let theirVideo = document.createElement('video');
    // theirVideo.src = window.URL.createObjectURL(stream);
    theirVideo.style.width='1px';
    theirVideo.style.height='1px';
    theirVideo.autoplay= true;
    theirVideo.controls=true;
    theirVideo.id=videoId;
    videoBox.appendChild(theirVideo);
    let xpc = preparePeerConnection(wbMsg,wbMsg.sessionId, micphoneStream, videoId,'answer');
    // console.log(pc);//到这里没问题
    if(!xpc)return;
    let rtcSession = {
        sessionId:wbMsg.sessionId,
        fromUserId:state.homeState.userInfo.id,
        toUserId:wbMsg.toUser.id,
        status:'answer',
        remoteVideoId:videoId,
        pc:xpc.pc,
        wa:xpc.wa,
        myMicSource:xpc.myMicSource,
        mixer:xpc.mixer,
        noMicMixer:xpc.noMicMixer,
        pcState:xpc.pcState,
        pcStateTime:xpc.pcStateTime,
        type:xpc.type,
        ondisconnected:xpc.ondisconnected,
        onclosemicrophone:xpc.onclosemicrophone,
        onopenmicrophone:xpc.onopenmicrophone,
        toUser:xpc.toUser,
        pcOutStream:xpc.pcOutStream
    };
    rtcSessionList = rtcSessionList.filter(function (item) {
        if(item.sessionId == wbMsg.sessionId){
            // isExiat = true;
            removeInstance(item);
        }
        return item.sessionId != wbMsg.sessionId;
    });
    rtcSessionList.push(rtcSession);
    // console.log(pcMeshChain);
    xpc.pc.setRemoteDescription(new RTCSessionDescription(offer));
    xpc.pc.createAnswer(function (answer) {
        Msg = wbMsg;
        Msg.answer = answer;
        if(Msg.offer) delete Msg.offer;//删除其中的offer
        if(Msg.candidate) delete Msg.candidate;//删除其中的candidate
        // console.log(Msg);
        send(JSON.stringify(Msg),function () {
            log('发送answer给 ' + Msg.toUser.id);
            xpc.pc.setLocalDescription(answer);
        });
    }, function (error) {
        alert("An error has occurred 1.");
    });
}

function onAnswer(answer,sessionId,toUserId) {
    log('进入onAnswer');
    // console.log(rtcSessionList);
    let tmpStr = sessionId.split('-')[1]+'-'+sessionId.split('-')[0];
    rtcSessionList.map(function (item) {
        if(item.sessionId == tmpStr){
            try{
                // console.log(answer);
                item.pc.setRemoteDescription(new RTCSessionDescription(answer));
            }catch (e){
                console.error(e);
            }
        }
    });
}

function onCandidate(candidate,sessionId) {
	// console.log("onCandidate:"+candidate);
//     console.log("Adding candidate for " + g_username);
    let tmpStr = sessionId.split('-')[1]+'-'+sessionId.split('-')[0];
    // console.log(sessionId);
    // console.log(tmpStr);
    // console.log(rtcSessionList);
    rtcSessionList.map(function (item) {
        if(item.sessionId == tmpStr){
            if(item.pc){
                item.pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            // console.log(item.pc);
        }
    });
}

//混音函数，收到远程音频流时用于混音
function mixerAudio(stream,pc,type) {
    rtcSessionList.map(function (item) {
        if(item.pc != pc){
            if(item.wa){
                let awTmpStream = item.wa.createMediaStreamSource(stream);
                awTmpStream.connect(item.mixer);
                awTmpStream.connect(item.noMicMixer);
            }else{
                log('item.wa不存在')
            }
        }else{
            if(type){//type是false表示不是接受到addstream时的调用
                item.pcOutStream = stream;
            }
            rtcSessionList.map(function (item1) {
                if(item1 != item){
                    // console.log(item1);
                    if(item1.pcOutStream){
                        if(item.wa){
                            let awTmpStream = item.wa.createMediaStreamSource(item1.pcOutStream);
                            awTmpStream.connect(item.mixer);
                            awTmpStream.connect(item.noMicMixer);
                        }else{
                            log('item.wa不存在');
                        }
                    }else{
                        // console.log(item1.pcOutStream);//这里的pcOutStream偶尔会没有，这是因为item1这个连接还在建立过程中，当他建立成功的时候还会到这个onaddStream来添加
                        console.log('pcOutStream is not exist');
                    }
                }
            })
        }
    });
    console.log(rtcSessionList);
}

//关闭麦克风
function closeMicrophone() {
    log('进入closeMicrophone');
    rtcSessionList.map(function (item) {
        item.onclosemicrophone();
    });
}
//开启麦克风
function openMicrophone() {
    log('进入openMicrophone');
    rtcSessionList.map(function (item) {
        item.onopenmicrophone();
    })
}


function hasUserMedia() {
    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
    return !!navigator.getUserMedia;
}

function hasRTCPeerConnection() {
    window.RTCPeerConnection = window.RTCPeerConnection ||
        window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    window.RTCSessionDescription = window.RTCSessionDescription ||
        window.webkitRTCSessionDescription ||
        window.mozRTCSessionDescription;
    window.RTCIceCandidate = window.RTCIceCandidate ||
        window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
    return !!window.RTCPeerConnection;
}

function onLeave(userInfo) {
    log('进入onLeave!'+userInfo.id);
    // if(userInfo.id == state.homeState.userInfo.id){
    //     rtcSessionList = rtcSessionList.filter(function (item) {
    //         // console.log(item);
    //         if(item.fromUserId == userInfo.id){
    //             removeInstance(item);
    //             // log('my peerConnection closed');
    //             log("我断开连接");
    //         }
    //         return item.fromUserId != userInfo.id;
    //     })
    // }else{
    rtcSessionList = rtcSessionList.filter(function (item) {
        // console.log(item);
        if(item.toUserId == userInfo.id){
            removeInstance(item);
            // log('child peerConnection closed');
            log('与'+userInfo.id+"断开连接");
        }
        return item.toUserId != userInfo.id;
    });
    // }
    // console.log(rtcSessionList);
}

//此函数用于清除rtcSessionList里面符合条件的item对象（包括pc，wa，mixer，pcOutStream）;
function removeInstance(item){
    if(item.pc){
        item.pc.close();//这里是直接close还是setRemoteDescription为空，需要确认
        item.pc = null;
    }
    if(item.wa){
        item.wa.close();
        item.wa = null;
    }
    if(item.mixer){
        item.mixer = null;
    }
    if(item.pcOutStream) {
        item.pcOutStream = null;
    }
}

export {
    startMyCam,
    onAnswer,
    onCandidate,
    offerPeerConnection,
    answerPeerConnection,
    onLeave,
    getPrepareConnectionState,
    micphoneStream,
    applyToBeFirst,
    getRoomUserList,
    startOnline,
    setGetRoomUserListCallback,
    getRoomUserListCallback,
    getRoomInfo,
    closeMicrophone,
    openMicrophone
};


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
let getRoomUserListCallback = null;

function setGetRoomUserListCallback(callback) {
    getRoomUserListCallback = callback;
}

//获取最小seq的用户（候选人）
function getCandidate(UserList,min) {
    let minSeq = 100000000;
    let minSeqUser = null;
    UserList.map(function (item) {
        if(item.Children.length < item.maxChildren){
            // console.log(item.seq+','+minSeq);
            if(item.seq > min && item.seq < minSeq && state.homeState.userInfo.id != item.id){
                minSeq = item.seq;
                minSeqUser = item;
                console.log(minSeqUser);
            }
        }
    });
    return {minSeqUser:minSeqUser,nextCandidate:minSeq};
}

function getRoomUserList(callback) {
// WS.send(JSON.stringify(enterMsg));
    setTimeout(function () {
        let getUsersInfo = {
            type:'get_room_users',
            roomId:state.homeState.currentRoomInfo.roomId,
            roomName:state.homeState.currentRoomInfo.roomName,
            user:state.homeState.userInfo,
        };
        send(JSON.stringify(getUsersInfo),function(){
            getRoomUserListCallback = callback;
        });
    },500);

}
function applyToBeFirst(){
    let beFirstMsg = {
        type:'declare_king',
        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
        roomName: state.homeState.currentRoomInfo.roomName,
        user:state.homeState.userInfo
    };
    send(JSON.stringify(beFirstMsg),function () {
        log('发送称王的消息到服务器');
    });
}
function getRoomInfo(){
    let beFirstMsg = {
        type:'get_room_info',
        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
        roomName: state.homeState.currentRoomInfo.roomName,
        user:state.homeState.userInfo
    };
    send(JSON.stringify(beFirstMsg),function () {
        log('发送getRoomInfo消息到服务器');
    });
}

function startOnline() {
    if(state.homeState.numberOne == state.homeState.userInfo.id){
        console.log('我已经是王了，不需要连别人');
        return;
    }
    console.log('firstCandidate:'+firstCandidate);
    let objUser = getCandidate(state.homeState.userInfoList,firstCandidate);
    // console.log(state.homeState.userInfoList);
    console.log(objUser);
    if(!objUser.minSeqUser){console.error('目标用户不存在');return;}//目标用户不存在直接返回
    let preOfferMsg = {
        type:'msg',
        typeString:'preOffer',
        ToUserOnly:objUser.minSeqUser.id,
        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
        roomName: state.homeState.currentRoomInfo.roomName,
        fromUser: state.homeState.userInfo,
        toUser:objUser.minSeqUser
    };
    console.log(preOfferMsg);
    send(JSON.stringify(preOfferMsg),function () {
        log('发送准备连接（pre-offer）消息给 ' + objUser.minSeqUser.id);
    });
    console.log('nextCandidate:'+objUser.nextCandidate);
    firstCandidate = objUser.nextCandidate;

        /*if(userInfoTmp.numberOne === 2){//user是消息传过来的用户信息，也就是最新的本人消息
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

         }
     }*/
}
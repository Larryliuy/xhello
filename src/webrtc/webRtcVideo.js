/**
 * webRTC与web audio函数库
 */

import { send } from "../static/webSocket";
import store, {CONSTANT} from "../reducer/reducer";
import {getRoomInfo, startMyCam, getPrepareConnectionState} from "./webRtcAudio";
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
});

let localStream = null, /** 本地音视频流*/
    prepareState = false, /** 麦克风获取是否准备好（本地音频流是否获取到）*/
    rtcSessionList=[], /** 本地peerConnection连接对象组*/
    remoteVidoeDom = null, /** 远程video标签Dom*/
    Msg = {}, /** 发送消息*/
    secondKing ='', /** 连麦者ID*/
    barleyAudioTrack, /** 连麦者音轨*/
    downStream = null, /** 我收到的远程流（作为offer方）*/
    firstCandidate = 0, /** 第一候选人的seq*/
    microphoneStatus = false, /** 麦克风是否开启，true表示开着，false表示关着*/
    callbackVideo = null,/** 获取房间列表的回调函数*/
    stun_server = {
        urls: 'stun:turn.xtell.cn:3479'
    },/** stun服务器*/
    turn_server = {
        urls: 'turn:turn.xtell.cn:3478',
        credential: 'webrtc',
        username: 'webrtc'
    },/** TURN服务器*/
    iceServers = [stun_server, turn_server],/** ice服务器*/
    rtcPeerConfig = {
        iceTransports: 'all',
        iceServers: iceServers
    };/** 创建peerConnection对象时的服务器配置*/

/**
 * 获取准备连接状态
 * @returns {boolean} true表示已准备（摄像头麦克风获取正常,webRtc 正在或已经连接）
 */
function getPrepareConnectionStateVideo(){
    return prepareState;
}

/**
 * 获取本地音频流
 * @param videoBox 用于将video或audio标签包裹的容易Dom对象
 */
function startMyCamVideo(myVideoTag,isKing){
    if (hasUserMedia()) {
        let streamConf;
        if (isKing){
            streamConf = { video: true, audio: true };
            navigator.getUserMedia(streamConf, function(myStream) {
                if(isKing){
                    localStream = myStream;
                    console.log(localStream);
                }
                if(myVideoTag){//只有当我是offer的时候myVideoTag才会为空
                    myVideoTag.src = window.URL.createObjectURL(localStream);
                    myVideoTag.addEventListener('canplay', function(){
                        myVideoTag.muted = true;		//mute local video to avoid echo by myself.
                    });
                    myVideoTag.addEventListener('play', function(){
                        myVideoTag.muted = true;		//mute local video to avoid echo by myself.
                    });
                    myVideoTag.autoplay=true;
                    // myVideoTag.controls=true;
                }
                prepareState = true;
                drawVideoToCanvas();
            }, function(error){
                console.log(error);
                alert('摄像头或麦克风设备未找到!');
            });
        }else{
            streamConf = { video: false, audio: true };
            let audioTag = document.createElement('audio');
        }
    }
}

/**
 * 准备连接函数，连接之前的准备工作
 * @param wbMsg 用于发送消息给websocket服务器的消息信息（主要使用里面的user信息）
 * @param sessionId  与每个用户连接的唯一id，一个连接一个SessionId
 * @param localStream 麦克风的音频流
 * @param remoteVidoeId 用于播放远程音频的Dom对象id
 * @param type offer表示我是发起连接的人（孩子），answer表示我被申请连接的人（父亲）
 * @returns {{toUser: *, type: *, pc: RTCPeerConnection, pcState: string, pcStateTime: number, myMicSource: MediaStreamAudioSourceNode | *, wa: *, mixer: *, noMicMixer: *, pcOutStream: null, ondisconnected: ondisconnected, onclosemicrophone: onclosemicrophone, onopenmicrophone: onopenmicrophone}}
 * toUser：连接的用户信息；
 * type：身份（offer，answer）；
 * pc：peerConnection对象；
 * pcState: peerConnection连接状态，connecting表示正在连接，connected表示已连接，disconnected表示已断开连接
 * pcStateTime: peerConnection连接状态改变时的时间戳
 * myMicSource：我的麦克风音源
 * pcOutStream：用于存储peerConnection远程接受到的音频流，作为自己的输出流
 */
function preparePeerConnectionVideo(wbMsg,sessionId,localStream,vidoeId,type,isKing) {
    log("进入preparePeerConnection函数!");
    let newConnection,webAudio;
    if (hasRTCPeerConnection()) {
        if(type === 'answer'){//直播模式下，我是发起offer的人不需要获取视频流
            if(!prepareState && isKing){
                console.error('king麦克风音视频流未获取');
                return;
            }
        }
        newConnection = new RTCPeerConnection(rtcPeerConfig);
        if(type === 'answer'){
            if(localStream && localStream.active){
                console.log('我是主播，将我的音视频流添加到pc');
                console.log(localStream);
                console.log(downStream);
                if(downStream){//直播模式第二个人这里已经有了，
                    if(isKing){
                        newConnection.addStream(localStream);
                    }else{
                        newConnection.addStream(downStream);
                    }
                }else{
                    newConnection.addStream(localStream);
                }
            }else{
                if(downStream){
                    newConnection.addStream(downStream);
                    console.log('将down流添加进pc');
                }else{
                    console.log('上级流为空');
                }
            }
        }else {
            console.log(localStream);
            console.log(isKing);
            if(vidoeId === 'firstVideo' && localStream && isKing){
                newConnection.addStream(localStream);
            }else{
                console.log('我不是连麦者，添加音，视频tag stream到addStream');
                let canvas = document.getElementById('liveCanvas') || document.getElementById('myCanvas');
                // let myAudio = document.getElementById('myAudio');
                let myAudio = document.createElement('audio');
                //createMediaElementSource
                webAudio = new (window.AudioContext || window.webkitAudioContext)();
                let audioSourceNode = webAudio.createMediaElementSource(myAudio);
                let webAudioOutput  = webAudio.createMediaStreamDestination();
                audioSourceNode.connect(webAudioOutput);
                if(canvas){
                    canvas.width = 1;
                    canvas.height = 1;
                    let stream = canvas.captureStream();//火狐报错NS_ERROR_NOT_INITIALIZED
                    newConnection.addStream(stream);
                }
                newConnection.addStream(webAudioOutput.stream);
                if(!prepareState){//添加stream后证明已经开始连接了
                    prepareState = true;
                }
            }
        }
        // newConnection.addStream(localStream);
        newConnection.onaddstream = function (e) {
            // console.log('进入onaddstream');
            if(type === 'offer'){
                if(isKing){
                    log('触发onaddstream,我是offer,并且我是连麦者,播放');
                    remoteVidoeDom = document.querySelector('#'+vidoeId);
                    remoteVidoeDom.src = window.URL.createObjectURL(e.stream);
                    remoteVidoeDom.autoplay=true;
                    // remoteVidoeDom.controls=true;
                    if(vidoeId === 'firstVideo'){
                       let firstVideo = document.getElementById('firstVideo');
                        firstVideo.style.width = '45%';
                        firstVideo.style.height = '85%';
                        // let liveCanvas = document.querySelector('#liveCanvas');
                        // if(liveCanvas){
                        //     liveCanvas.width = 1;
                        //     liveCanvas.height = 1;
                        // }
                    }
                }else {
                    log('触发onaddstream,我是offer,观众,播放');
                    //video播放
                    console.log(e.stream.getAudioTracks());
                    remoteVidoeDom = document.querySelector('#'+vidoeId);
                    remoteVidoeDom.src = window.URL.createObjectURL(e.stream);
                    remoteVidoeDom.style.width = '80%';
                    remoteVidoeDom.style.height = '80%';
                    remoteVidoeDom.autoplay=true;
                    // remoteVidoeDom.controls=true;
                    // let liveCanvas = document.querySelector('#liveCanvas');
                    // if(liveCanvas){
                    //     liveCanvas.width = '1px';
                    //     liveCanvas.height = '1px';
                    // }
                    downStream = e.stream;
                }
                //并将收到的流作为输出流
                // rtcSessionList.map(function (item) {
                //     if(item.pc === newConnection){
                //         item.reciveStream = e.stream;
                //         // console.log(item.reciveStream);
                //     }
                // })
            }else{
                if(vidoeId === 'secondVideo' && localStream && isKing){
                    console.log('触发onaddstream,接受到连麦者stream，播放');
                    remoteVidoeDom = document.querySelector('#'+vidoeId);
                    remoteVidoeDom.src = window.URL.createObjectURL(e.stream);
                    remoteVidoeDom.autoplay=true;
                    // remoteVidoeDom.controls=true;
                    //接受到连麦者的stream后，将整个canvas流赋值给downStream
                    let canvas = document.getElementById('liveCanvas');
                    downStream = canvas.captureStream();
                    //将连麦者的音轨存起来
                    barleyAudioTrack = e.stream.getAudioTracks();
                    console.log(downStream);
                }else{
                    console.log('触发onaddstream,接受到观众Stream，不播放');
                }
            }
            // mixerAudio(e.stream,newConnection,true);
        };
        // Setup ice handling
        newConnection.onicecandidate = function (event) {
            // console.log('进入onicecandidate');
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
            // console.log(userInfo);
            // console.log(wbMsg);
            rtcSessionList.map(function (item) {
                if(item.toUserId == wbMsg.toUser.id) {
                    objItem = item;
                }
            });
            switch(newConnection.iceConnectionState) {
                case "connected":
                    rtcSessionList.map(function (item) {
                        if(item.toUserId == wbMsg.toUser.id) {
                            item.pcState = 'connected';
                            item.pcStateTime = new Date().getTime()/1000;
                            if(type === 'offer'){
                                console.log(item);
                                if(item.myMicStream){
                                    let myTrack = item.myMicStream.getAudioTracks();
                                    console.log(myTrack);
                                    if(myTrack[0]){
                                        item.myMicStream.removeTrack(myTrack[0]);
                                    }
                                }
                            }
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
                        //如果是连麦主播，则需要将混音加入downStream,mixerAudio
                        if(vidoeId === 'secondVideo' && localStream && isKing){
                            mixerAudio();
                        }
                    }
                    updateUserMsg = {
                        type:'update_user',
                        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                        roomName: state.homeState.currentRoomInfo.roomName,
                        user:userInfo
                    };
                    // console.log(updateUserMsg);
                    if(!userInfo.seq){
                        console.log(userInfo);
                        return;
                    }
                    //如果是连麦者则更新set_room_info的secondKing
                    if(vidoeId === 'firstVideo' && localStream && isKing){
                        secondKing = userInfo.id;
                        // console.error('secondKing:'+secondKing);
                        let roomInfo = state.homeState.currentRoomInfo;
                        roomInfo.secondKing = userInfo.id;
                        store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfo});
                        //更变自己的最大连接数
                        userInfo.maxChildren = 0;
                        setRoomInfo(roomInfo);
                        //通知房间中的其他人重新连接
                        let msg = {

                        }
                    }
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
                    //切换房间时，需要设置回原来的最大连接数
                    userInfo.maxChildren = 2;
                    store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                    break;
                default:
                    // console.log('default:'+newConnection.iceConnectionState);
                    break;
            }

        };
        return {
            toUser:wbMsg.toUser,
            type:type,
            isKing:isKing,
            webAudio:webAudio,
            pc:newConnection,
            pcState:'connecting',
            pcStateTime:new Date().getTime()/1000,
            myMicStream:localStream,
            reciveStream:null,
            pcOutStream:null,
            ondisconnected:function () {
                if(this.pcState === 'disconnected')return;
                this.pcStateTime = new Date().getTime()/1000;
                this.pcState = 'disconnected';

                onLeaveVideo(this.toUser);

                let userInfo = state.homeState.userInfo;
                if(type === 'answer'){
                    console.log('子流ondisconnected');
                    firstCandidate = 0;
                    let _this = this;
                    console.log('seq:'+userInfo.seq);
                    userInfo.Children = userInfo.Children.filter(function (item) {
                        return _this.toUser.id != item;
                    });
                    //如果断的是连麦者，则需要更新服务器secondKing
                    if(this.isKing){
                        let roomInfo = state.homeState.currentRoomInfo;
                        roomInfo.secondKing = '';
                        setRoomInfo(roomInfo);
                    }
                }else {
                    console.log('父流ondisconnected');
                    firstCandidate = 0;
                    // console.log(downStream);
                    // console.log(state.homeState.currentRoomInfo.king);
                    if(isKing || state.homeState.currentRoomInfo.king === userInfo.parentNode || state.homeState.numberOne === 0){
                        console.log('king已断开');
                        //king断开，secondKing也需要置空
                        let roomInfo = state.homeState.currentRoomInfo;
                        roomInfo.secondKing = '';
                        setRoomInfo(roomInfo);
                        //发消息给房间的所有人，king断开
                        return;
                    }
                    if(downStream && downStream.active){
                        downStream = null;
                        userInfo.parentNode = '';
                        getRoomInfoVideo(state.homeState.currentRoomInfo.roomId);
                    }else{
                        console.log('downStream.active为false');
                        //改变视频界面提示没有视频
                    }
                }
                let updateUserMsg = {
                    type:'update_user',
                    roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                    roomName: state.homeState.currentRoomInfo.roomName,
                    user:userInfo
                };
                if(!userInfo.seq)return;
                store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                send(JSON.stringify(updateUserMsg),function () {
                    log('把 '+ wbMsg.toUser.id +' 的断线消息发送到服务器');
                });
            }
            };
    }else{
        alert("NO WEBRTC"); return;
    }

}

/**
 * 此函数用于发起offer时调用
 * @param wbMsg 用于发送消息给websocket服务器的消息信息（主要使用里面的user信息）
 * @param videoBox 用于将video或audio标签包裹的容易Dom对象
 */
function offerPeerConnectionVideo(wbMsg,videoTag,isKing) {
    log('进入offerPeerConnection');
    let xpc = preparePeerConnectionVideo(wbMsg,wbMsg.sessionId, localStream, videoTag,'offer',isKing);
    // console.log(xpc);
    if(!xpc)return;
    let rtcSession = {
        sessionId:wbMsg.sessionId,
        fromUserId:wbMsg.fromUser.id,
        toUserId:wbMsg.toUser.id,
        status:'offer',
        videoTag:videoTag,
        pc:xpc.pc,
        pcState:xpc.pcState,
        pcStateTime:xpc.pcStateTime,
        myMicStream:xpc.myMicStream,
        ondisconnected:xpc.ondisconnected,
        type:xpc.type,
        webAudio:xpc.webAudio,
        isKing:xpc.isKing,
        toUser:xpc.toUser,
        reciveStream:xpc.reciveStream,
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
function answerPeerConnectionVideo(wbMsg,offer,videoId,isKing) {
    log('进入answerPeerConnection');
    let xpc = preparePeerConnectionVideo(wbMsg,wbMsg.sessionId, localStream, videoId,'answer',isKing);
    // console.log(pc);//到这里没问题
    if(!xpc)return;
    let rtcSession = {
        sessionId:wbMsg.sessionId,
        fromUserId:state.homeState.userInfo.id,
        toUserId:wbMsg.toUser.id,
        status:'answer',
        remoteVideoId:videoId,
        pc:xpc.pc,
        pcState:xpc.pcState,
        pcStateTime:xpc.pcStateTime,
        myMicStream:xpc.myMicStream,
        ondisconnected:xpc.ondisconnected,
        type:xpc.type,
        isKing:xpc.isKing,
        webAudio:xpc.webAudio,
        toUser:xpc.toUser,
        reciveStream:xpc.reciveStream,
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

function onAnswerVideo(answer,sessionId,toUserId) {
    log('进入onAnswer');
    console.log(rtcSessionList);
    let tmpStr = sessionId.split('-')[1]+'-'+sessionId.split('-')[0];
    rtcSessionList.map(function (item) {
        if(item.sessionId == tmpStr){
            try{
                item.pc.setRemoteDescription(new RTCSessionDescription(answer));
            }catch (e){
                console.error(e);
            }
        }
    });
}

function onCandidateVideo(candidate,sessionId) {
    let tmpStr = sessionId.split('-')[1]+'-'+sessionId.split('-')[0];
    rtcSessionList.map(function (item) {
        if(item.sessionId == tmpStr){
            if(item.pc){
                item.pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            // console.log(item.pc);
        }
    });
}


/**
 * 判断是否支持getUserMedia，即是否支持获取摄像头，麦克风
 * @returns {boolean} 返回值为true表示支持，false表示不支持
 */
function hasUserMedia() {
    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
    return !!navigator.getUserMedia;
}

/**
 * 判断是否支持RTCPeerConnection
 * @returns {boolean} 返回值为true表示支持，false表示不支持
 */
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
/**
 * peerConnection断开时调用的函数，用于清楚断开连接的rtcSession对象
 * @param userInfo 表示断开连接的用户信息对象
 */
function onLeaveVideo(userInfo) {
    log('进入onLeave!'+userInfo.id);
    rtcSessionList = rtcSessionList.filter(function (item) {
        // console.log(item);
        if(item.toUserId == userInfo.id || item.fromUserId == userInfo.id){
            removeInstance(item);
            // log('child peerConnection closed');
            log('与'+userInfo.id+"断开连接");
        }
        return item.toUserId != userInfo.id;
    });
    // }
    // console.log(rtcSessionList);
}

/**
 * 此函数用于清除rtcSessionList里面符合条件的item对象（包括pc，wa，mixer，pcOutStream）;
 * @param item 表示rtcSession对象
 */
function removeInstance(item){
    if(item.pc){
        item.pc.close();
        item.pc = null;
    }
    if(item.pcOutStream) {
        item.pcOutStream = null;
    }
    if(item.webAudio){
        item.webAudio.close();
    }
    //这里是否需要清除audio和video标签
}

/**
 * 打印函数，本地打印并发送到服务器
 * @param message 表示打印的消息
 */
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

/**
 * 设置获取房间用户列表回调函数的函数
 * @param callback 回调函数
 */
function setCallbackVideo(callback) {
    callbackVideo = callback;
}

/**
 * 获取最小seq的用户（候选人）
 * @param UserList 用户列表
 * @param min 指定开始搜索的最小seq
 * @returns {{minSeqUser: *, nextCandidate: number}}
 * minSeqUser 最小的seq用户
 * nextCandidate下次开始搜索的seq
 */
function getCandidate(UserList,min) {
    console.log(UserList);
    let minSeq = 100000000;
    let minSeqUser = null;
    UserList.map(function (item) {
        if(item.Children.length < item.maxChildren){
            console.log(item.seq+','+minSeq+','+ min);
            if(item.seq > min && item.seq < minSeq && state.homeState.userInfo.id != item.id){
                minSeq = item.seq;
                minSeqUser = item;
                // console.log(minSeqUser);
            }else{
                if(item.seq === min){
                    minSeq = item.seq+1;
                    minSeqUser = item;
                }
            }
        }
    });
    return minSeq === 100000000? {minSeqUser:minSeqUser,nextCandidate:0}:{minSeqUser:minSeqUser,nextCandidate:minSeq};
}

/**
 * 获取房间用户列表信息函数
 * @param callback 获取用户列表信息后需要立即执行的回调函数
 */
function getRoomUserListVideo(callback) {
    setTimeout(function () {
        let getUsersInfo = {
            type:'get_room_users',
            roomId:state.homeState.currentRoomInfo.roomId,
            roomName:state.homeState.currentRoomInfo.roomName,
            user:state.homeState.userInfo,
        };
        send(JSON.stringify(getUsersInfo),function(){
            callbackVideo = callback;
        });
    },500);
}

/**
 * 申请成为王的函数
 */
function applyToBeFirstVideo(){
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

/**
 * 获取房间信息函数
 */
function getRoomInfoVideo(roomId){
    let beFirstMsg = {
        type:'get_room_info',
        roomId: roomId,		//房间唯一标识符
        // roomName: state.homeState.currentRoomInfo.roomName,
        user:state.homeState.userInfo
    };
    // console.log(beFirstMsg);//这个消息发过去就挂了
    send(JSON.stringify(beFirstMsg),function () {
        log('发送getRoomInfo消息到服务器');
    });
}

/**
 * 入网函数（开始入网）
 */
let isContinueCounts = 0;
function startOnlineVideo() {
    if(state.homeState.numberOne == state.homeState.userInfo.id){
        console.log('我已经是王了，不需要连别人');
        return;
    }
    if(!prepareState){//如果我这边没有准备好，则重新获取下音视频流
        // let myVideoTag = document.getElementById('myVideo');
        startMyCamVideo(null,false);
    }
    let objUser = getCandidate(state.homeState.userInfoList,firstCandidate);
    console.log(state.homeState.userInfoList);
    console.log(objUser);
    if(!objUser.minSeqUser){
        console.error('目标用户不存在');
        //目标用户不存在继续获取房间用户信息
        // getRoomUserListVideo(startOnlineVideo);
        // if(isContinueCounts<10){
        //     getRoomUserListVideo(startOnlineVideo);
        //     isContinueCounts++;
        // }
        return;
    }
    let preOfferMsg = {
        type:'msg',
        typeString:'preOffer',
        ToUserOnly:objUser.minSeqUser.id,
        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
        roomName: state.homeState.currentRoomInfo.roomName,
        fromUser: state.homeState.userInfo,
        toUser:objUser.minSeqUser
    };
    // console.log(preOfferMsg);
    if(!prepareState){
        setTimeout(function () {
            send(JSON.stringify(preOfferMsg),function () {
                log('发送准备连接（pre-offer）消息给 ' + objUser.minSeqUser.id);
            });
        },300);
    }else {
        send(JSON.stringify(preOfferMsg),function () {
            log('发送准备连接（pre-offer）消息给 ' + objUser.minSeqUser.id);
        });
    }
    console.log('nextCandidate:'+objUser.nextCandidate);
    firstCandidate = objUser.nextCandidate;
}

function setRoomInfo(roomInfo) {
    let setRoomMsg = {
        type:'set_room_info',
        roomId:state.homeState.currentRoomInfo.roomId,
        roomName:state.homeState.currentRoomInfo.roomName,
        user:state.homeState.userInfo,
        data:roomInfo
    };
    send(JSON.stringify(setRoomMsg),function () {
        console.log('发送set roomInfo消息服务器:');
    });
}

function mixerAudio() {
    //将连麦者与主播的音频混音，然后加入addStream
    if(localStream){
        let localAudioTrack = localStream.getAudioTracks();
        if(downStream){
            downStream.addTrack(localAudioTrack[0]);
            downStream.addTrack(barleyAudioTrack[0]);
        }
    }
}

function hasSecondking() {
    return !!secondKing;
}

/**
 * 初始化webTrcVideo变量
 * */
function initVariableVideo() {
    localStream = null;
    prepareState = false;
    rtcSessionList=[];
    remoteVidoeDom = null;
    Msg = {};
    secondKing ='';
    barleyAudioTrack;
    downStream = null;
    firstCandidate = 0;
    microphoneStatus = false;
    callbackVideo = null;
}

/**
 * 将video视频实时绘到canvas上
 * */
let intval1 = null,intval2 = null;
function drawVideoToCanvas() {
    let firstVideo = document.getElementById("firstVideo");
    let secondVideo = document.getElementById("secondVideo");
    let canvas = document.getElementById("liveCanvas");
    if(!canvas)return;
    let canvasCtx = canvas.getContext('2d');
    firstVideo.addEventListener('play', function() {
        intval1 = window.setInterval(function() {
            canvasCtx.drawImage(firstVideo, 0, 0, 150, 150);
        }, 20);
    }, false);
    secondVideo.addEventListener('play', function() {
        intval2 = window.setInterval(function() {
            canvasCtx.drawImage(secondVideo, 150, 0, 150, 150);
        }, 20);
    }, false);
}

/**
 * 关闭视频模式函数
 * */
function closeVideoMode() {
    //关闭视频模式
    let videoBox = document.getElementById('audioBox');
    if(!getPrepareConnectionState()){
        console.log('重新获取startMyCam');
        startMyCam(videoBox);
    }
    getRoomInfo(state.homeState.currentRoomInfo.roomId);

    let roomInfoTmp = state.homeState.currentRoomInfo;
    roomInfoTmp.mode = 0;
    roomInfoTmp.microphoneMode = 1;//重置为默认的自由模式(是否需要重置)
    roomInfoTmp.player = 0;
    roomInfoTmp.videoSrc = '';
    store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfoTmp});
    //发消息给其他用户调整房间模式
    let sendMsg = {
        type:'msg',
        typeString:'changeRoomMode',
        roomId:roomInfoTmp.roomId,
        roomName:roomInfoTmp.roomName,
        user:state.homeState.userInfo,
        mode:0
    };
    send(JSON.stringify(sendMsg),function () {
        console.log('发送关闭视频模式消息成功');
        //ws 发送set_room_info
        let setRoomMsg = {
            type:'set_room_info',
            roomId: roomInfoTmp.roomId,		//房间唯一标识符
            roomName: roomInfoTmp.roomName,
            user:state.homeState.userInfo,
            data:roomInfoTmp
        };
        send(JSON.stringify(setRoomMsg),function () {
            console.log('发送改变房间模式消息给服务器');
            getRoomInfoVideo(roomInfoTmp.roomId);
        })
    })
}

/**
 * 刷新直播
 * */
function refreshVideo() {
    onLeaveVideo(state.homeState.userInfo);
    getRoomInfoVideo(state.homeState.currentRoomInfo.roomId);
}
//播放音乐,混入自己的mixOutputStream

export {
    startMyCamVideo,
    onAnswerVideo,
    onCandidateVideo,
    offerPeerConnectionVideo,
    answerPeerConnectionVideo,
    onLeaveVideo,
    getPrepareConnectionStateVideo,
    localStream,
    applyToBeFirstVideo,
    getRoomUserListVideo,
    startOnlineVideo,
    setCallbackVideo,
    callbackVideo,
    getRoomInfoVideo,
    microphoneStatus,
    setRoomInfo,
    closeVideoMode,
    refreshVideo,
    initVariableVideo
};
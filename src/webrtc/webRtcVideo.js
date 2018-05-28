/**
 * webRTC与web audio函数库
 */

import { send } from '../static/webSocket';
import store, {CONSTANT} from '../reducer/reducer';
import {getRoomInfo, startMyCam, getPrepareConnectionState} from './webRtcAudio';
import {CONFIG_CONSTANTS, successlog, log, keyerror, updateUserInfo, setRoomInfo} from '../static/comFunctions';
import { iceServers } from './iceServer';
import {message} from 'antd/lib/index';
import {emptyNormalQuitUsers, emptyUnexpectedUsers, getNormalQuitUsers, getUnexpectedUsers} from './webRtcBase';
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
});

let localStream = null, /** 本地音视频流*/
    prepareState = false, /** 麦克风获取是否准备好（本地音频流是否获取到）*/
    rtcSessionList=[], /** 本地peerConnection连接对象组*/
    remoteVidoeDom = null, /** 远程video标签Dom*/
    Msg = {}, /** 发送消息*/
    barleyAudioTrack, /** 连麦者音轨*/
    downStream = null, /** 我收到的远程流（作为offer方）*/
    firstCandidate = 0, /** 第一候选人的seq*/
    microphoneStatus = false, /** 麦克风是否开启，true表示开着，false表示关着*/
    callbackVideo = null,/** 获取房间列表的回调函数*/
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
                    successlog('video-我是直播者，已获取音视频流Video');
                }
                if(myVideoTag){//只有当我是offer的时候myVideoTag才会为空
                    // myVideoTag.src = window.URL.createObjectURL(localStream);
                    myVideoTag.srcObject = localStream;
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
        }/*else{
            streamConf = { video: false, audio: true };
            let audioTag = document.createElement('audio');
        }*/
    }else{
        alert('您的浏览器不支持音视频获取');
    }
}
/**
 * 获取本地音频流
 * @param videoBox 用于将video或audio标签包裹的容易Dom对象
 */
function startMyCamVideoWithCallback(myVideoTag,isKing,msg){
    if (hasUserMedia()) {
        let streamConf;
        if (isKing){
            streamConf = { video: true, audio: true };
            navigator.getUserMedia(streamConf, function(myStream) {
                if(isKing){
                    localStream = myStream;
                    console.log(localStream);
                    successlog('video-我是连麦者，已获取音视频流Video');
                }
                if(myVideoTag){//只有当我是offer的时候myVideoTag才会为空
                    // myVideoTag.src = window.URL.createObjectURL(localStream);
                    myVideoTag.srcObject = localStream;
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
                offerPeerConnectionVideo(msg,'firstVideo',true);
                // drawVideoToCanvas();
            }, function(error){
                console.log(error);
                alert('摄像头或麦克风设备未找到!');
            });
        }/*else{
            streamConf = { video: false, audio: true };
            let audioTag = document.createElement('audio');
        }*/
    }else{
        alert('您的浏览器不支持音视频获取');
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
    // log('进入preparePeerConnection函数!','preparePeerConnectionVideo','webRtcVideo.js');
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
                console.log('我不是连麦者，添加音视频tag stream到addStream');
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
                    console.log(e.stream.getAudioTracks());
                    log('触发onaddstream,我是offer,并且我是连麦者,播放','onaddstream','webRtcVideo.js');
                    remoteVidoeDom = document.querySelector('#'+vidoeId);
                    // remoteVidoeDom.src = window.URL.createObjectURL(e.stream);
                    remoteVidoeDom.srcObject = e.stream;
                    remoteVidoeDom.autoplay=true;
                    // remoteVidoeDom.controls=true;
                    if(vidoeId === 'firstVideo'){
                       let firstVideo = document.getElementById('firstVideo');
                        firstVideo.style.width = '45%';
                        firstVideo.style.height = '80%';
                        firstVideo.style.maxWidth = '';
                        firstVideo.style.maxHeight = '';
                        //之前的连麦者的secondVideo需要隐藏
                        let secondVideo = document.getElementById('secondVideo');
                        secondVideo.style.width = '45%';
                        secondVideo.style.height = '80%';
                        secondVideo.srcObject = localStream;
                    }
                }else {
                    log('触发onaddstream,我是offer,观众,播放','onaddstream','webRtcVideo.js');
                    //video播放
                    console.log(e.stream.getAudioTracks());
                    if(e.stream.getAudioTracks().length > 0){
                        successlog('我已获取主播音频流');
                        window.localStorage.setItem('audio','ok');
                    }
                    if(e.stream.getVideoTracks().length > 0){
                        successlog('我已获取主播视频流');
                        window.localStorage.setItem('video','ok');
                    }
                    remoteVidoeDom = document.querySelector('#'+vidoeId);
                    // remoteVidoeDom.src = window.URL.createObjectURL(e.stream);
                    try{
                        remoteVidoeDom.srcObject = e.stream;
                    }catch (e){
                        remoteVidoeDom.src = window.URL.createObjectURL(e.stream);
                    }
                    if(state.homeState.currentRoomInfo.secondKing) {
                        console.log('双人');
                        remoteVidoeDom.style.width = '80%';
                        remoteVidoeDom.style.height = '80%';
                        remoteVidoeDom.style.maxWidth = '';
                        remoteVidoeDom.style.maxHeight = '';
                        //之前的连麦者的secondVideo需要隐藏
                        let secondVideo = document.getElementById('secondVideo');
                        secondVideo.style.width = '1px';
                        secondVideo.style.height = '1px';
                        //secondVideo.srcObject = '';
                    }else{
                        console.log('单人');
                        remoteVidoeDom.style.maxWidth = '480px';
                        remoteVidoeDom.style.maxHeight = '320px';
                    }
                    // let secondVideo = document.getElementById('secondVideo');
                    // secondVideo.style.width = '1px';
                    // secondVideo.style.height = '1px';
                    remoteVidoeDom.autoplay=true;
                    downStream = e.stream;
                }
            }else{
                if(vidoeId === 'secondVideo' && localStream && isKing){
                    //将连麦者的音轨存起来
                    barleyAudioTrack = e.stream.getAudioTracks();
                    console.log(e.stream);
                    console.log('触发onaddstream,接受到连麦者stream，播放');
                    remoteVidoeDom = document.querySelector('#'+vidoeId);
                    // remoteVidoeDom.src = window.URL.createObjectURL(e.stream);
                    remoteVidoeDom.srcObject = e.stream;
                    remoteVidoeDom.autoplay=true;
                    // remoteVidoeDom.controls=true;
                    //接受到连麦者的stream后，将整个canvas流赋值给downStream
                    let canvas = document.getElementById('liveCanvas');
                    downStream = canvas.captureStream();
                    //********** test专用
                    // let audioTagTmp = document.createElement('auido');
                    // audioTagTmp.src = URL.createObjectURL(e.stream);
                    // audioTagTmp.src = URL.createObjectURL(barleyAudioTrack);
                    // document.body.appendChild(audioTagTmp);
                    //**********
                    console.log('%c获取downStream','color:red');
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
                    // log('发送 candidate 给 '+Msg.toUser.id,'onicecandidate','webRtcVideo.js');
                    // successlog('video-发送 candidate 给 '+Msg.toUser.name);
                });
            }else{
                successlog('video-发送 candidate 给 '+Msg.toUser.name);
            }
        };
        newConnection.oniceconnectionstatechange = function(event) {
            console.log(event);
            let userInfo = state.homeState.userInfo;
            let objItem ;
            // console.log(userInfo);
            // console.log(wbMsg);
            rtcSessionList.map(function (item) {
                if(item.toUserId == wbMsg.toUser.id) {
                    objItem = item;
                }
            });
            switch(newConnection.iceConnectionState) {
                case 'connected':
                    rtcSessionList.map(function (item) {
                        if(item.toUserId == wbMsg.toUser.id) {
                            item.pcState = 'connected';
                            item.pcStateTime = new Date().getTime()/1000;
                            if(type === 'offer'){
                                // console.log(item);
                                if(item.myMicStream && !isKing){
                                    console.error('error');
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
                    // log(' 与 '+ wbMsg.toUser.id + ' 连接成功','oniceconnectionstatechange-connected','webRtcVideo.js');
                    // console.log(state.homeState.userInfo);
                    successlog('video- 与 '+ wbMsg.toUser.name + ' 连接成功');
                    delSendListByIdVideo(wbMsg.toUser.id);
                    // removeToNormalQuitUsers(wbMsg.toUser.id);
                    if(type === 'offer'){
                        userInfo.parentNode = wbMsg.toUser.id;
                        userInfo.isOnline = true;
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
                            setTimeout(function () {
                                mixerAudio(false);
                            },1000);
                            //连麦成功时将连麦者作为自己的唯一孩子(目的是为了删除其他孩子);
                            userInfo.Children = [];
                            userInfo.Children.push(wbMsg.toUser.id);
                        }
                        store.dispatch({type:CONSTANT.ISANSWER,val:true});
                    }
                    // updateUserMsg = {
                    //     type:'update_user',
                    //     roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                    //     // roomName: state.homeState.currentRoomInfo.roomName,
                    //     user:userInfo
                    // };
                    // console.log(updateUserMsg);
                    if(!userInfo.seq){
                        console.log(userInfo);
                        return;
                    }
                    //如果是连麦者则更新set_room_info的secondKing
                    if(vidoeId === 'firstVideo' && localStream && isKing){
                        // secondKing = userInfo.id;
                        // console.error('secondKing:'+secondKing);
                        let roomInfo = state.homeState.currentRoomInfo;
                        roomInfo.secondKing = userInfo.id;
                        store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfo});
                        //更变自己的最大连接数
                        userInfo.maxChildren = 0;
                        setRoomInfo(roomInfo);
                        //通知房间中的其他人重新连接
                        let msg = {
                            type:'msg',
                            typeString:'reconnectVideo',
                            roomId: roomInfo.roomId,		//房间唯一标识符
                            // roomName: roomInfo.roomName,
                            user:userInfo
                        };
                        // setTimeout(function () {
                        send(JSON.stringify(msg),function () {
                            console.log('通知其他用户重新连接');
                        });
                        // },1000);
                    }
                    store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                    // send(JSON.stringify(updateUserMsg),function () {
                    //     log('发送update_user消息到服务器','oniceconnectionstatechange-connected','webRtcVideo.js');
                    // });
                    updateUserInfo(userInfo);
                    break;
                case 'disconnected':
                    // console.log('disconnected');
                    if(type==='offer'){
                        console.log('NormalQuitUsers:',getNormalQuitUsers());
                        if(getNormalQuitUsers()[wbMsg.toUser.id]){
                            if(objItem) {
                                keyerror('您与'+wbMsg.toUser.name+'进入disconnected状态,收到了他的onLeave消息');
                                objItem.ondisconnected('disconnected');
                            }
                        }else{
                            // message.warn('您的网络不稳定');
                            // if(getUnexpectedUsers(wbMsg.toUser.id)){
                            //     keyerror(wbMsg.toUser.name+'的网络不稳定,已断开连接,重新入网');
                            //     objItem && objItem.ondisconnected('disconnected');
                            // }else{
                            //     keyerror('您与'+wbMsg.toUser.name+'网络连接不稳定或者连接已非正常断开,iceRestart');
                            //     iceRestartVideo(wbMsg.toUser);
                            // }
                            UnexpectedHandleForDisconnected(wbMsg.toUser,objItem);
                            //如果我是连麦者，需要设置回原来的最大连接数
                            if(isKing){
                                console.log('%c重置最大连接数了','color:yellow');
                                userInfo.maxChildren = CONFIG_CONSTANTS.MAXCHILDREN;
                                store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                                updateUserInfo(userInfo);
                            }
                        }
                    }else{
                        if(getNormalQuitUsers()[wbMsg.toUser.id]){
                            if(objItem) {
                                keyerror('您与'+wbMsg.toUser.name+'进入disconnected状态,收到了他的onLeave消息');
                                objItem.ondisconnected('disconnected');
                            }
                        }else{
                            console.log('%c'+wbMsg.toUser.name+ '非正常掉线,pcState:');
                            console.log(objItem);
                        }
                    }
                    return;
                case 'failed':
                    if(objItem){
                        objItem.ondisconnected('failed');
                    }
                    // One or more transports has terminated unexpectedly or in an error
                    break;
                case 'closed':
                    // The connection has been closed,本人关闭或被动通知后关闭会触发（即调用peerConnection.close()）,通知后台我已关闭连接
                    if(objItem){
                        if(type === 'offer'){
                            objItem.ondisconnected('closed');
                            //切换房间时，需要设置回原来的最大连接数
                            console.log(userInfo);
                            userInfo.maxChildren = CONFIG_CONSTANTS.MAXCHILDREN;
                            store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                            updateUserInfo(userInfo);
                        }else{
                            if(objItem.pcState !== 'connecting'){
                                objItem.ondisconnected('closed');
                            }
                        }
                    }
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
            ondisconnected:function (status) {
                log('video-进入ondisconnected,status:'+status,'ondisconnected','webRtcVideo.js');
                if(this.pcState === 'disconnected')return;
                this.pcStateTime = new Date().getTime()/1000;
                this.pcState = 'disconnected';
                console.log(this.toUser);
                onLeaveVideo(this.toUser);
                delSendListByIdVideo(this.toUser.id);
                let userInfo = state.homeState.userInfo;
                if(this.type === 'answer'){
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
                    // userInfo.isOnline = false;
                    console.log('父流ondisconnected');
                    firstCandidate = 0;
                    // console.log(downStream);
                    // console.log(state.homeState.currentRoomInfo.king);
                    if(this.isKing || state.homeState.currentRoomInfo.king === userInfo.parentNode || state.homeState.numberOne === 0){
                        console.log('king已断开');
                        //king断开，secondKing也需要置空
                        let roomInfo = state.homeState.currentRoomInfo;
                        roomInfo.secondKing = '';
                        setRoomInfo(roomInfo);
                        //发消息给房间的所有人，king断开
                        return;
                    }
                    if(downStream && downStream.active){
                        console.log('%c置空downStream','color:red');
                        downStream = null; //在这里被置空了
                        userInfo.parentNode = '';
                        getRoomInfoVideo(state.homeState.currentRoomInfo.roomId);
                    }else{
                        console.log('downStream.active为false');
                        //改变视频界面提示没有视频
                    }
                }
                // let updateUserMsg = {
                //     type:'update_user',
                //     roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                //     // roomName: state.homeState.currentRoomInfo.roomName,
                //     user:userInfo
                // };
                if(!userInfo.seq)return;
                store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                // send(JSON.stringify(updateUserMsg),function () {
                //     log('把 '+ wbMsg.toUser.id +' 的断线消息发送到服务器','ondisconnected','webRtcVideo.js');
                // });
                updateUserInfo(userInfo);
            }
            };
    }else{
        alert('NO WEBRTC'); return;
    }

}


/**
 * ICE reStart 当当前连接不稳定的时候，需要restart ice
 * */
function iceRestartVideo(toUser) {
    console.log('进入iceRestartVideo');
    let roomInfo = state.homeState.currentRoomInfo,
        offerOptionsTmp = {offerToReceiveAudio:1,offerToReceiveVideo:1};
    let restartMsg = {
        type:'msg',
        typeString:'webrtc',
        ToUserOnly:toUser.id,
        roomId: roomInfo.roomId,		//房间唯一标识符
        // roomName: roomInfo.roomName,
        fromUser:state.homeState.userInfo,
        toUser:toUser,
        sessionId:state.homeState.userInfo.id+'-'+toUser.id
    };
    rtcSessionList.map(function (item) {
        if(item.toUserId === toUser.id){
            offerOptionsTmp.iceRestart = true;
            item.pc.createOffer(offerOptionsTmp)
                .then(
                    function (offer) {
                        restartMsg.offer = offer;
                        send(JSON.stringify(restartMsg),function () {
                            item.pc.setLocalDescription(offer);
                        });
                    },
                    onCreateOfferError
                );
        }
    });
}

/**
 * 关闭网页或异常掉线 disconnected处理函数,需要延时处理，原因是webRtc是p2p，对方掉线时，wenRtc通知我这边比websocket通知的会快，所以需要延时。
 * */
function UnexpectedHandleForDisconnected(toUser,objItem) {
    setTimeout(function () {
        console.log('UnexpectedUsers',getUnexpectedUsers());
        if(getUnexpectedUsers()[toUser.id]){
            keyerror(toUser.name+'的网络不稳定,已断开连接,重新入网');
            objItem && objItem.ondisconnected('disconnected');
        }else{
            keyerror('您与'+toUser.name+'网络连接不稳定或者连接已非正常断开,iceRestart');
            // iceRestartVideo(toUser);
        }
    },300);

}

/**
 * 此函数用于发起offer时调用
 * @param wbMsg 用于发送消息给websocket服务器的消息信息（主要使用里面的user信息）
 * @param videoBox 用于将video或audio标签包裹的容易Dom对象
 */
function offerPeerConnectionVideo(wbMsg,videoTag,isKing) {
    // log('进入offerPeerConnection','offerPeerConnectionVideo','webRtcVideo.js');
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
    xpc.pc.createOffer(
        onCreateOfferSuccess,
        onCreateOfferError
    );
    function onCreateOfferSuccess(offer) {
        Msg = wbMsg;
        Msg.offer = offer;
        if(Msg.answer) delete Msg.answer;
        if(Msg.candidate) delete Msg.candidate;
        send(JSON.stringify(Msg),function () {
            // successlog('video-已发送offer给'+ Msg.toUser.name);
            xpc.pc.setLocalDescription(offer);
        });
    }
}

/**
 * createOffer异常处理函数
 * */
function onCreateOfferError(error) {
    keyerror('video-create offer error,'+error.toString());
    alert('video-An error has occurred 1.'+error.toString());
}
function answerPeerConnectionVideo(wbMsg,offer,videoId,isKing) {
    // log('进入answerPeerConnection','answerPeerConnectionVideo','webRtcVideo.js');
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
            // log('发送answer给 ' + Msg.toUser.id,'answerPeerConnectionVideo','webRtcVideo.js');
            successlog('video-已发送answer给'+ Msg.toUser.name);
            xpc.pc.setLocalDescription(answer);
        });
    }, function (error) {
        alert('An error has occurred 1.'+error.toString());
    });
}

function onAnswerVideo(answer,sessionId) {
    log('进入onAnswer','onAnswerVideo','webRtcVideo.js');
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
    // log('进入onCandidateVideo','onCandidateVideo','webRtcVideo.js');
    let tmpStr = sessionId.split('-')[1]+'-'+sessionId.split('-')[0];
    rtcSessionList.map(function (item) {
        if(item.sessionId == tmpStr){
            if(item.pc){
                // successlog('video-收到 '+item.toUser.name+'的candidate，并添加candidate到pc');
                item.pc.addIceCandidate(new RTCIceCandidate(candidate));
            }else{
                keyerror('video-pc不存在,toUser:'+item.toUser.name);
            }
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
    log('进入onLeaveVideo!'+userInfo.id,'onLeaveVideo','webRtcVideo.js');
    if(userInfo.id === state.homeState.userInfo.id){
        successlog('Video-模式，断开自己的连接');
        rtcSessionList.map(function (item) {
            // console.log(item);
            if(item.fromUserId == userInfo.id){
                removeInstance(item);
            }
        });
        rtcSessionList=[];//自己断开连接的时候清除自己的所有连接
    }else{
        rtcSessionList.map(function (item) {
            // console.log(item);
            if(item.toUserId == userInfo.id && (item.pcState === 'connected')){
                successlog('Video模式,断开与'+userInfo.name+'的连接');
                removeInstance(item);
                delRtcSessionVideo(item.toUserId);
                delSendListByIdVideo(item.toUserId);
            }
        });
    }
}


/**
 * 根据toUserId删除RTCSession
 * */
function delRtcSessionVideo(toUserId) {
    console.log('%ctoUserId:'+toUserId,'color:red');
    rtcSessionList = rtcSessionList.filter(function (item) {
        return item.toUserId != toUserId;
    });
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
            // roomName:state.homeState.currentRoomInfo.roomName,
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
// function applyToBeFirstVideo(){
//     let beFirstMsg = {
//         type:'declare_king',
//         roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
//         // roomName: state.homeState.currentRoomInfo.roomName,
//         user:state.homeState.userInfo
//     };
//     send(JSON.stringify(beFirstMsg),function () {
//         log('发送称王的消息到服务器','applyToBeFirstVideo','webRtcVideo.js');
//     });
// }

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
        log('video-发送getRoomInfo消息到服务器','getRoomInfoVideo','webRtcVideo.js');
    });
}

/**
 * 入网函数（开始入网）
 */
let sendList = {};
function startOnlineVideo() {
    let userInfo = state.homeState.userInfo;
    let roomInfo = state.homeState.currentRoomInfo;
    if(state.homeState.numberOne == userInfo.id){
        console.log('我已经是王了，不需要连别人');
        return;
    }
    let objUser = getCandidate(state.homeState.userInfoList,firstCandidate);
    console.log(state.homeState.userInfoList);
    console.log(objUser);
    if(!objUser.minSeqUser){
        console.error('目标用户不存在');
        firstCandidate = 0;
        setTimeout(function () {
            getRoomUserListVideo(startOnlineVideo);
        },5000);
        return;
    }
    sendList[objUser.minSeqUser.id] = true;//表示已经发送preOffer了
    let preOfferMsg = {
        type:'msg',
        typeString:'preOffer',
        ToUserOnly:objUser.minSeqUser.id,
        roomId: roomInfo.roomId,		//房间唯一标识符
        // roomName: state.homeState.currentRoomInfo.roomName,
        fromUser: userInfo,
        toUser:objUser.minSeqUser
    };
    // console.log(preOfferMsg);
    if(roomInfo.mode != '1'&& roomInfo.mode != '3'){
        keyerror('video-当前房间模式非视频模式');
        return;
    }
    if(!prepareState){
        setTimeout(function () {
            send(JSON.stringify(preOfferMsg),function () {
                log('发送准备连接（pre-offer）消息给 ' + objUser.minSeqUser.id,'startOnlineVideo','webRtcVideo.js');
            });
        },300);
    }else {
        send(JSON.stringify(preOfferMsg),function () {
            log('发送准备连接（pre-offer）消息给 ' + objUser.minSeqUser.id,'startOnlineVideo','webRtcVideo.js');
        });
    }
    console.log('nextCandidate:'+objUser.nextCandidate);
    firstCandidate = objUser.nextCandidate;
}

/**
 * 设置收到申请的列表
 * */
function amISendPreOfferVideo(userId) {
    successlog('video-我是否已经发送preOffer给'+userId+'?:'+sendList[userId]);
    return sendList[userId];
}

/**
 * 根据userId删除sendList中的user
 * */
function delSendListByIdVideo(userId) {
    if(sendList[userId]){
        delete sendList[userId];
    }
}

/**
 * 主播与连麦者的音轨混音
 * */
function mixerAudio(isSecond) {
    //将连麦者与主播的音频混音，然后加入addStream
    if(localStream){
        let localAudioTrack = localStream.getAudioTracks();
        if(downStream){
            console.log(localAudioTrack);
            if(localAudioTrack.length !== 0){
                downStream.addTrack(localAudioTrack[0]);
            }
            console.log(barleyAudioTrack);
            if(barleyAudioTrack.length !== 0){
                downStream.addTrack(barleyAudioTrack[0]);
            }else{
                console.error('error:barleyAudioTrack is not exist');
                if(!isSecond){
                    setTimeout(function () {
                        keyerror('error:barleyAudioTrack is not exist,mixerBarleyAudio by seconds');
                        mixerAudio(true);
                    },1000);
                }else{
                    message.warn('连麦失败，请通知连麦者重新申请连麦');
                }
            }
        }
    }
}

// function hasSecondking() {
//     return !!secondKing;
// }

/**
 * 初始化webTrcVideo变量
 * */
function initVariableVideo() {
    localStream = null;
    downStream = null;
    prepareState = false;
    rtcSessionList=[];
    remoteVidoeDom = null;
    Msg = {};
    sendList={};
    // secondKing = '';
    barleyAudioTrack=null;
    firstCandidate = 0;
    microphoneStatus = false;
    callbackVideo = null;
    emptyNormalQuitUsers();
    emptyUnexpectedUsers();
    store.dispatch({type:CONSTANT.ISANSWER,val:false});
    let userTmp = state.homeState.userInfo;
    userTmp.isOnline = false;
    store.dispatch({type:CONSTANT.USERINFO,val:userTmp});
    window.localStorage.setItem('audio','');
    window.localStorage.setItem('video','');
}

/**
 * 将video视频实时绘到canvas上
 * */
// let intval1 = null,intval2 = null;
function drawVideoToCanvas() {
    let firstVideo = document.getElementById('firstVideo');
    let secondVideo = document.getElementById('secondVideo');
    let canvas = document.getElementById('liveCanvas');
    if(!canvas)return;
    let canvasCtx = canvas.getContext('2d');
    firstVideo.addEventListener('play', function() {
        window.setInterval(function() {
            canvasCtx.drawImage(firstVideo, 0, 0, 150, 150);
        }, 20);
    }, false);
    secondVideo.addEventListener('play', function() {
        window.setInterval(function() {
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
    roomInfoTmp.secondKing = '';
    // roomInfoTmp.onLine = true;//此方法能行通，但是效率很低
    store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfoTmp});
    //发消息给其他用户调整房间模式
    let sendMsg = {
        type:'msg',
        typeString:'changeRoomMode',
        roomId:roomInfoTmp.roomId,
        // roomName:roomInfoTmp.roomName,
        user:state.homeState.userInfo,
        action:'closeVideo',
        mode:0
    };
    send(JSON.stringify(sendMsg),function () {
        console.log('发送关闭视频模式消息成功');
        //ws 发送set_room_info
        let setRoomMsg = {
            type:'set_room_info',
            roomId: roomInfoTmp.roomId,		//房间唯一标识符
            // roomName: roomInfoTmp.roomName,
            user:state.homeState.userInfo,
            data:roomInfoTmp
        };
        send(JSON.stringify(setRoomMsg),function () {
            console.log('发送改变房间模式消息给服务器');
            // getRoomInfoVideo(roomInfoTmp.roomId);
            message.success('关闭成功，如需再次开启直播，请等待10~20秒',10);
        });
    });
}

/**
 * 刷新直播
 * */
function refreshVideo() {
    onLeaveVideo(state.homeState.userInfo);
    initVariableVideo();
    setTimeout(function () {
        getRoomInfoVideo(state.homeState.currentRoomInfo.roomId);
    },400);

}
//播放音乐,混入自己的mixOutputStream

/**
 * 判断是否有downStream
 * */
function hasDownStream() {
    return !!downStream;
}
/**
 * 判断是否有localStream
 * */
// function hasLocalStream() {
//     return !!localStream;
// }

export {
    startMyCamVideo,
    startMyCamVideoWithCallback,
    onAnswerVideo,
    onCandidateVideo,
    offerPeerConnectionVideo,
    answerPeerConnectionVideo,
    onLeaveVideo,
    getPrepareConnectionStateVideo,
    localStream,
    hasDownStream,
    iceRestartVideo,
    getRoomUserListVideo,
    startOnlineVideo,
    setCallbackVideo,
    callbackVideo,
    getRoomInfoVideo,
    microphoneStatus,
    closeVideoMode,
    refreshVideo,
    initVariableVideo,
    amISendPreOfferVideo,
    delSendListByIdVideo
};

/**
 * webRTC与web audio函数库
 */

import { send } from "../static/webSocket";
import store, {CONSTANT} from "../reducer/reducer";
import { CONFIG_CONSTANTS, log, successlog, keyerror } from '../static/comFunctions';
import { iceServers } from './iceServer';
import { message } from 'antd';
import {emptyNormalQuitUsers, getNormalQuitUsers} from "./webRtcBase";
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
});

let micphoneStream = null, /** 麦克风音频流*/
    micphoneSource = null,
    webAudio = null,/**临时webAudio，用于处理audio tag音源*/
    audioSourceNode = null,/**临时audioSourceNode，audio tag音源的wa节点*/
    webAudioOutput = null,/**临时webAudioOutput，用于输出audio tag音源*/
    myWebAudio = new (window.AudioContext || window.webkitAudioContext)(), /**用于处理本地麦克风对应的webaudio*/
    myAnalyser = myWebAudio.createAnalyser(), /** 本地麦克风的AnalyserNode*/
    prepareState = false, /** 麦克风获取是否准备好（本地音频流是否获取到）*/
    rtcSessionList=[], /** 本地peerConnection连接对象组*/
    remoteVidoeDom = null, /** 远程video标签Dom*/
    Msg = {}, /** 发送消息*/
    myMicSource = null, /** 我的麦克风音源*/
    myVideo = null, /** 我的video标签Dom*/
    firstCandidate = 0, /** 第一候选人的seq*/
    microphoneStatus = false, /** 麦克风是否开启，true表示开着，false表示关着*/
    getRoomUserListCallback = null,/** 获取房间列表的回调函数*/
    offerOptions = {offerToReceiveAudio:1,offerToReceiveVideo:0},/**createOffer的options*/
    rtcPeerConfig = {
        iceTransports: 'all',
        iceServers: iceServers
    };/** 创建peerConnection对象时的服务器配置*/

/**
 * 获取准备连接状态
 * @returns {boolean}
 */
function getPrepareConnectionState(){
    return prepareState;
}

/**
 * 获取麦克风音源大小
 * @param analyser  AnalyserNode
 * @returns {number} 返回值为麦克风的音源大小
 */
function getVoiceSize (analyser) {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    const data = dataArray.slice(100, 1000);
    const sum = data.reduce((a, b) => a + b);
    return sum
}
let intval = null;
/**
 *超过一定时间没有音源输入，则清除定时器
 */

// let setTimer = setTimeout(function () {//有声音输入的时候重置这个，延时器(属于优化阶段了)
//     clearInterval(intval);
// },1000*60*60);
let msg = {
        type:'msg',
        typeString:'audioSourceInput'
    };
function sourceConnectAnalyser(stream) {//观察者模式
    micphoneSource = myWebAudio.createMediaStreamSource(stream);
    micphoneSource.connect(myAnalyser);//连接到本地webAudio的AnalyserNode
    myAnalyser.fftSize = 2048;
    intval = setInterval(function () {
        // console.log(getVoiceSize(myAnalyser),state.homeState.microphoneOpen,state.homeState.microphoneInput);
        msg.roomId = state.homeState.currentRoomInfo.roomId;
        msg.user = state.homeState.userInfo;
        if(getVoiceSize(myAnalyser)>100 && state.homeState.microphoneOpen){
            // if(!state.homeState.microphoneInput){
                // console.log('有音源输入');
                store.dispatch({type:CONSTANT.MICROPHONEINPUT,val:true});
                msg.inputSource = true;
                send(JSON.stringify(msg),function () {
                    // console.log('发送audioSourceInput消息：true');
                })
            // }
        }else {
            // console.log('没有音源输入');
            // if(!state.homeState.microphoneInput) {
            store.dispatch({type: CONSTANT.MICROPHONEINPUT, val: false});
            msg.inputSource = false;
            send(JSON.stringify(msg),function () {
                // console.log('发送audioSourceInput消息：false');
            })
            // }
        }
    },1000);
}


/**
 * 获取本地音频流
 * @param videoBox 用于将video或audio标签包裹的容易Dom对象
 */
function startMyCam(videoBox){
    if (hasUserMedia()) {
        navigator.getUserMedia({ video: false, audio: true }, function(myStream) {
            micphoneStream = myStream;
            prepareState = true;
            successlog('audio-已获取音频流Audio');
            sourceConnectAnalyser(micphoneStream);
            // console.error('prepareState is true');
            //将自己的音轨存入全局state
            // store.dispatch({type:CONSTANT.MYAUDIOTRACK,val:micphoneStream.getAudioTracks()});
            // console.log(micphoneStream);
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
        }, function(error){
            console.error(error);
            successlog('获取麦克风失败,添加audio tag流作为本地音频流，即我说不了话');
            //createMediaElementSource
            if(!webAudio){
                let myAudio = document.createElement('audio');
                webAudio = new (window.AudioContext || window.webkitAudioContext)();
                audioSourceNode = webAudio.createMediaElementSource(myAudio);
                webAudioOutput  = webAudio.createMediaStreamDestination();
                audioSourceNode.connect(webAudioOutput);
            }
            micphoneStream = webAudioOutput.stream;
            prepareState = true;
        });
    }else{
        successlog('您的浏览器不支持音视频获取,hasUserMedia:false');
        alert('您的浏览器不支持音视频获取');
    }
}

/**
 * 准备连接函数，连接之前的准备工作
 * @param wbMsg 用于发送消息给websocket服务器的消息信息（主要使用里面的user信息）
 * @param sessionId  与每个用户连接的唯一id，一个连接一个SessionId
 * @param micphoneStream 麦克风的音频流
 * @param remoteVidoeId 用于播放远程音频的Dom对象id
 * @param type offer表示我是发起连接的人（孩子），answer表示我被申请连接的人（父亲）
 * @returns {{toUser: *, type: *, pc: RTCPeerConnection, pcState: string, pcStateTime: number, myMicSource: MediaStreamAudioSourceNode | *, wa: *, mixer: *, noMicMixer: *, pcOutStream: null, ondisconnected: ondisconnected, onclosemicrophone: onclosemicrophone, onopenmicrophone: onopenmicrophone}}
 * toUser：连接的用户信息；
 * type：身份（offer，answer）；
 * pc：peerConnection对象；
 * pcState: peerConnection连接状态，connecting表示正在连接，connected表示已连接，disconnected表示已断开连接
 * pcStateTime: peerConnection连接状态改变时的时间戳
 * myMicSource：我的麦克风音源
 * wa：web audio对象
 * mixer：带麦克风混音后的输出
 * noMicMixer：不带麦克风混音后的输出
 * pcOutStream：用于存储peerConnection远程接受到的音频流，作为自己的输出流
 * ondisconnected：掉线后触发的事件函数
 * onclosemicrophone：关闭麦克风事件函数
 * onopenmicrophone：开启麦克风事件函数
 */
function preparePeerConnection(wbMsg,sessionId,micphoneStream,remoteVidoeId,type) {
    log("进入preparePeerConnection函数!",'preparePeerConnection','webRtcAudio.js');
    let newConnection;
    if (hasRTCPeerConnection()) {
        // console.log('prepareState:'+prepareState);
        if(!prepareState){
            successlog('audio-prepareState未准备（音频流）:'+prepareState);
            return;
        }

        newConnection = new RTCPeerConnection(rtcPeerConfig);

        if(!micphoneStream){
            successlog('audio-micphoneStream不存在:'+micphoneStream);
            return;
        }
        //准备连接时先设置自己的stream到video
        // console.log(localStream);
        let webAudio,mixedOutput,moMicOutputStream;
        try{
            webAudio = new (window.AudioContext || window.webkitAudioContext)();// Failed to construct 'AudioContext': The number of hardware contexts provided (6) is greater than or equal to the maximum bound (6)
        }catch (e){
            console.error(e);
        }
        if(!webAudio){
            log('webAudio创建失败','preparePeerConnection','webRtcAudio.js');
            keyerror('创建webAudio失败：'+wbMsg.toUser.name);
            // console.log(webAudio);
            return;
        }
        myMicSource = webAudio.createMediaStreamSource(micphoneStream);
        mixedOutput  = webAudio.createMediaStreamDestination();
        moMicOutputStream = webAudio.createMediaStreamDestination();
        if(state.homeState.microphoneOpen){
            myMicSource.connect(mixedOutput);
        }
        // myMicSource.disconnect(mixedOutput);
        newConnection.addStream(mixedOutput.stream);
        newConnection.onaddstream = function (e) {
            remoteVidoeDom = document.querySelector('#'+remoteVidoeId);
            remoteVidoeDom.src = window.URL.createObjectURL(e.stream);
            log('触发onaddstream','onaddstream','webRtcAudio.js');
            mixerAudio(e.stream,newConnection,true);
        };
        // Setup ice handling
        newConnection.onicecandidate = function (event) {
            //	console.log("yourConnection.onicecandidate!");
            if (event.candidate) {
                let Msg = wbMsg;
                if(Msg.offer) delete Msg.offer;//删除回传的offer
                if(Msg.answer) delete Msg.answer;//删除回传的answer
                Msg.candidate = event.candidate;
                send(JSON.stringify(Msg),function () {
                })
            }else{
                //all the candidate have been sent
                log("发送 candidate 给 "+Msg.toUser.name,'onicecandidate','webRtcAudio.js');
                // checkPeerConnectionStatus(Msg.toUser.id,type);//这里
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
                    // log(' 与 '+ wbMsg.toUser.name + ' 连接成功','oniceconnectionstatechange-connected','webRtcAudio.js');
                    successlog('audio- 与 '+ wbMsg.toUser.name + ' 连接成功');
                    delSendListById(wbMsg.toUser.id);
                    // console.log(state.homeState.userInfo);
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
                    }
                    updateUserMsg = {
                        type:'update_user',
                        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                        roomName: state.homeState.currentRoomInfo.roomName,
                        user:userInfo
                    };
                    // console.log(updateUserMsg);
                    if(!userInfo.seq)return;
                    store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                    send(JSON.stringify(updateUserMsg),function () {
                        log('发送update_user消息到服务器','oniceconnectionstatechange-connected','webRtcAudio.js');
                    });
                    break;
                case "disconnected":
                    console.log("disconnected:"+wbMsg.toUser.name);
                    // 重启ICE
                    if(type === 'offer'){
                        if(getNormalQuitUsers()[wbMsg.toUser.id]){
                            if(objItem) {
                                keyerror('您与'+wbMsg.toUser.name+'进入disconnected状态,收到了他的onLeave消息');
                                objItem.ondisconnected('disconnected');
                            }
                        }else{
                            message.warn('您的网络不稳定');
                            keyerror('您与'+wbMsg.toUser.name+'网络连接不稳定或者连接已非正常断开,iceRestart');
                            iceRestart(wbMsg.toUser);
                        }
                    }else{
                        if(getNormalQuitUsers()[wbMsg.toUser.id]){
                            if(objItem) {
                                keyerror('您与'+wbMsg.toUser.name+'进入disconnected状态,收到了他的onLeave消息');
                                objItem.ondisconnected('disconnected');
                            }
                        }
                    }
                    break;
                case "failed":
                    console.log("failed:"+wbMsg.toUser.name);
                    if(objItem){
                        objItem.ondisconnected('failed');
                    }
                    // One or more transports has terminated unexpectedly or in an error
                    break;
                case "closed":
                    console.log("closed:"+wbMsg.toUser.name);
                    // The connection has been closed,本人关闭或被动通知后关闭会触发（即调用peerConnection.close()）,通知后台我已关闭连接
                    if(objItem){
                        console.log(objItem);
                        objItem.ondisconnected('closed');
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
            ondisconnected:function (status) {
            // log('进入ondisconnected','ondisconnected','webRtcAudio.js');
                successlog('进入ondisconnected，'+status);
            if(this.pcState === 'disconnected')return;
            let preState = this.pcState;
            let preStateTime = this.pcStateTime;
                this.pcStateTime = new Date().getTime()/1000;
                this.pcState = 'disconnected';

                // if(status !== 'closed'){//不是调用pc.close()才会需要onLeave
                //     successlog('closed:'+this.toUser.name);
                onLeave(this.toUser);
                delSendListById(wbMsg.toUser.id);
                // }
                let userInfo = state.homeState.userInfo;
                if(this.type === 'answer'){
                    let _this = this;
                    console.log('seq:'+userInfo.seq);
                    userInfo.Children = userInfo.Children.filter(function (item) {
                        return _this.toUser.id != item;
                    });
                    // console.log(userInfo);
                }else{
                    //父亲掉线
                    // userInfo = state.homeState.userInfo;
                    userInfo.parentNode = '';
                    firstCandidate = 0;
                    getRoomInfo(state.homeState.currentRoomInfo.roomId);
                }
                let updateUserMsg = {
                    type:'update_user',
                    roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                    roomName: state.homeState.currentRoomInfo.roomName,
                    user:userInfo
                };
                // console.log(updateUserMsg);
                if(!userInfo.seq)return;
                send(JSON.stringify(updateUserMsg),function () {
                    log('把 '+ wbMsg.toUser.name +' 的断线消息发送到服务器','ondisconnected','webRtcAudio.js');
                    console.log(state.homeState.roomMicrophoneUser);
                });

            },
            onclosemicrophone:function () {
                log('进入onclosemicrophone','onclosemicrophone','webRtcAudio.js');
                try{
                    this.myMicSource.disconnect(this.mixer);
                }catch (e){
                    console.log(e);
                }
            },
            onopenmicrophone:function () {
                log('进入onopenmicrophone','onopenmicrophone','webRtcAudio.js');
                try{
                    this.myMicSource.connect(this.mixer);
                }catch (e){
                    console.log(e);
                }
            },
            onAddMusic:function () {
                //这里添加播放音乐的流(本地或网络)，然后混入mixer
            }};
    }else{
        alert("NO WEBRTC"); return;
    }
}

/**
 * ICE reStart 当当前连接不稳定的时候，需要restart ice
 * */
function iceRestart(toUser) {
    console.log('进入iceRestart');
    let roomInfo = state.homeState.currentRoomInfo,
        offerOptionsTmp = {offerToReceiveAudio:1,offerToReceiveVideo:0};
    let restartMsg = {
        type:'msg',
        typeString:'webrtc',
        ToUserOnly:toUser.id,
        roomId: roomInfo.roomId,		//房间唯一标识符
        roomName: roomInfo.roomName,
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
 * 此函数用于发起offer时调用
 * @param wbMsg 用于发送消息给websocket服务器的消息信息（主要使用里面的user信息）
 * @param videoBox 用于将video或audio标签包裹的容易Dom对象
 */
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
    // log('进入offerPeerConnection','offerPeerConnection','webRtcAudio.js');
    // successlog('给['+wbMsg.toUser.name+']发Offer');
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
            successlog('audio-offerPeerconnecttion-removeInstance:',item.pc);
            removeInstance(item);
        }
        return item.sessionId != wbMsg.sessionId;
    });
    rtcSessionList.push(rtcSession);
    xpc.pc.createOffer(offerOptions)
        .then(
            onCreateOfferSuccess,
            onCreateOfferError
        );
    function onCreateOfferSuccess(offer) {
        Msg = wbMsg;
        Msg.offer = offer;
        if(Msg.answer) delete Msg.answer;
        if(Msg.candidate) delete Msg.candidate;
        send(JSON.stringify(Msg),function () {
            xpc.pc.setLocalDescription(offer);
        });
    }
}
/**
 * createOffer异常处理函数
 * */
function onCreateOfferError(error) {
    keyerror('audio-create offer error,'+error.toString());
    alert("audio-An error has occurred 1."+error.toString());
}
function answerPeerConnection(wbMsg,offer,videoBox) {
    // log('进入answerPeerConnection','answerPeerConnection','webRtcAudio.js');
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
            // log('发送answer给 ' + Msg.toUser.name,'answerPeerConnection','webRtcAudio.js');
            xpc.pc.setLocalDescription(answer);
            successlog('audio-给 '+wbMsg.toUser.name+'发answer');
        });
    }, function (error) {
        alert("An error has occurred 1.");
        keyerror('createAnswer error,'+error.toString());
    });
}

function onAnswer(answer,sessionId,toUserId) {
    log('进入onAnswer','onAnswer','webRtcAudio.js');
    // console.log(rtcSessionList);
    let tmpStr = sessionId.split('-')[1]+'-'+sessionId.split('-')[0];
    rtcSessionList.map(function (item) {
        if(item.sessionId == tmpStr){
            try{
                item.pc.setRemoteDescription(new RTCSessionDescription(answer));
            }catch (e){
                // console.error(e);
                keyerror('onAnswer-setRemoteDescription error,'+e.toString());
            }
        }
    });
}

function onCandidate(candidate,sessionId) {
	// console.log("onCandidate:"+candidate);
//     console.log("Adding candidate for " + g_username);
    let tmpStr = sessionId.split('-')[1]+'-'+sessionId.split('-')[0];
    rtcSessionList.map(function (item) {
        if(item.sessionId == tmpStr){
            if(item.pc){
                // successlog('audio-收到 '+item.toUser.name+'的candidate，并添加candidate到pc');
                item.pc.addIceCandidate(new RTCIceCandidate(candidate));
            }else{
                keyerror('audio-pc不存在,toUser:'+item.toUser.name);
            }
        }
    });
}

/**
 * 用于混音
 * @param stream 远程音频流
 * @param pc peerConnection对象
 * @param type offer表示调用者不是混音节点，answer表示调用者是混音节点
 */
function mixerAudio(stream,pc,type) {
    log('进入mixerAudio','mixerAudio','webRtcAudio.js');
    rtcSessionList.map(function (item) {
        if(item.pc != pc){
            if(item.wa){
                let awTmpStream = item.wa.createMediaStreamSource(stream);
                awTmpStream.connect(item.mixer);
                // awTmpStream.connect(item.noMicMixer);
            }else{
                // log('item.wa不存在','mixerAudio','webRtcAudio.js')
                keyerror('item.wa不存在,toUser:'+item.toUser.name);
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
                            // awTmpStream.connect(item.noMicMixer);
                        }else{
                            // log('item.wa不存在','mixerAudio','webRtcAudio.js');
                            keyerror('item.wa不存在,toUser:'+item1.toUser.name);
                        }
                    }else{
                        // console.log(item1.pcOutStream);//这里的pcOutStream偶尔会没有，这是因为item1这个连接还在建立过程中，当他建立成功的时候还会到这个onaddStream来添加
                        // console.error('pcOutStream is not exist! and pcStatus:'+item.pcState);
                        keyerror('pcOutStream is not exist! and pcStatus:'+item1.pcState+',toUser:'+item1.toUser.name);
                        //如果pcOutStream不存在，过1s再尝试混音
                        mixerBysecond(stream,pc,type,item1.toUser);
                    }
                }
            })
        }
    });
    // console.log(rtcSessionList);
}

/**
 * 用于混音
 * @param stream 远程音频流
 * @param pc peerConnection对象
 * @param type offer表示调用者不是混音节点，answer表示调用者是混音节点
 */
let mixerCount = 0;
function mixerAudioByAppointUser(stream,pc,type,toUser) {
    // successlog('mixerAudioByAppointUser:'+toUser.name);
    rtcSessionList.map(function (item) {
        if(item.pc == pc){
            if(type){//type是false表示不是接受到addstream时的调用
                item.pcOutStream = stream;
            }
            rtcSessionList.map(function (item1) {
                // console.log(item1);
                if(item1 != item && toUser.id === item1.toUserId){
                    // console.log(item1);
                    if(item1.pcOutStream){
                        if(item.wa){
                            let awTmpStream = item.wa.createMediaStreamSource(item1.pcOutStream);
                            awTmpStream.connect(item.mixer);
                            // awTmpStream.connect(item.noMicMixer);
                            successlog('已与'+toUser.name+'完成混音');
                            mixerCount = 0;
                        }else{
                            // log('item.wa不存在','mixerAudio','webRtcAudio.js');
                            keyerror('item.wa不存在,toUser:'+item.toUser.name);
                        }
                    }else{
                        // console.log(item1.pcOutStream);//这里的pcOutStream偶尔会没有，这是因为item1这个连接还在建立过程中，当他建立成功的时候还会到这个onaddStream来添加
                        // console.error('pcOutStream is not exist! and pcStatus:'+item.pcState);
                        keyerror('mixerAudioByAppointUser--pcOutStream is not exist! and pcStatus:'+item1.pcState+',toUser:'+item1.toUser.name);
                        //如果pcOutStream不存在，过1s再尝试混音
                        if(mixerCount < 10){
                            mixerBysecond(stream,pc,type,item1.toUser);
                            mixerCount++;
                        }else{
                            item1.ondisconnected();
                            keyerror('mixerAudioByAppointUser大于10次，断开与他的连接:'+item1.pcState+',toUser:'+item1.toUser.name);
                        }
                    }
                }/*else{
                    keyerror('mixerAudioByAppointUser--未找到指定用户的连接：'+toUser.name);
                }*/
            })
        }/*else{//这个else如果延迟混音成功还是有人听不到语音，则再增加这个else做测试
            if(item.wa){
                let awTmpStream = item.wa.createMediaStreamSource(stream);
                awTmpStream.connect(item.mixer);
                // awTmpStream.connect(item.noMicMixer);
            }else{
                // log('item.wa不存在','mixerAudio','webRtcAudio.js')
                keyerror('item.wa不存在,toUser:'+item.toUser.name);
            }
        }*/
    });
    // console.log(rtcSessionList);
}

/**
 * 等待一秒再混音
 * */
function mixerBysecond(stream,pc,type,toUser) {
    setTimeout(function () {
        mixerAudioByAppointUser(stream,pc,type,toUser);
    },1000);
}

/**
 * 关闭麦克风函数
 */
function closeMicrophone() {
    if(rtcSessionList.length !== 0){
        rtcSessionList.map(function (item) {
            item.onclosemicrophone();
        });
    }else{
        console.error('没有人连接,rtcSessionList长度为0');
    }
    microphoneStatus = false;
    store.dispatch({type:CONSTANT.MICROPHONEOPEN,val:false});
}

/**
 * 开启麦克风函数
 */
function openMicrophone() {
    // console.log(rtcSessionList);
    if(rtcSessionList.length !== 0){
        rtcSessionList.map(function (item) {
            item.onopenmicrophone();
        });
    }else{
        console.error('没有人连接,rtcSessionList长度为0');
    }
    microphoneStatus = true;
    store.dispatch({type:CONSTANT.MICROPHONEOPEN,val:true});
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
 * peerConnection断开时调用的函数，用于清除断开连接的rtcSession对象
 * @param userInfo 表示断开连接的用户信息对象
 */
function onLeave(userInfo) {
    log(userInfo.name+'进入onLeave!','onLeave','webRtcAudio.js');
    if(userInfo.id === state.homeState.userInfo.id){
        successlog('audio-断开自己的连接');
        rtcSessionList.map(function (item) {
            // console.log(item);
            if(item.fromUserId == userInfo.id){
                removeInstance(item);
            }
        });
        rtcSessionList=[];//自己断开连接的时候清除自己的所有连接
    }else{
        successlog('audio-断开与'+userInfo.name+'的连接');
        rtcSessionList.map(function (item) {
            // console.log(item);
            if(item.toUserId == userInfo.id){
                removeInstance(item);
                delRtcSession(item.toUserId);
                delSendListById(item.toUserId);
            }
        });
    }
}

/**
 * 用于检测pc是否连接成功,成功不做任何事，失败直接kill
 * */
function checkPeerConnectionStatus(toUserId,type) {
    //3秒后如果还是在连接中，则answer清除rtsSession,offer清除并重新连接
    setTimeout(function () {
        rtcSessionList.map(function (item) {
            // console.log(item);
            if(item.toUserId == toUserId){
                if(item.pcState === 'connecting'){
                    successlog('发送candidate5秒后仍未连接成功,checkPeerConnectionStatus');
                    removeInstance(item);
                    delRtcSession(toUserId);
                    //是否需要重新连接
                    if(type === 'offer'){
                        // 重新去连接(入网)
                        console.error('连接超时,重新入网');
                        getRoomInfo(state.homeState.currentRoomInfo.roomId);
                    }
                }
            }
        });
    },10000)
}

/**
 * 根据toUserId删除RTCSession
 * */
function delRtcSession(toUserId) {
    console.log("%ctoUserId:"+toUserId,'color:red');
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
    //这里是否需要清除audio和video标签
}


/**
 * 设置获取房间用户列表回调函数的函数
 * @param callback 回调函数
 */
function setGetRoomUserListCallback(callback) {
    getRoomUserListCallback = callback;
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
    let minSeq = 100000000;
    let minSeqUser = null;
    UserList.map(function (item) {
        if(item.Children.length < item.maxChildren){
            // console.log(item.seq+','+minSeq);
            if(item.seq > min && item.seq < minSeq && state.homeState.userInfo.id != item.id){
                minSeq = item.seq;
                minSeqUser = item;
                // console.log(minSeqUser);
            }
        }
    });
    return {minSeqUser:minSeqUser,nextCandidate:minSeq};
}

/**
 * 获取房间用户列表信息函数
 * @param callback 获取用户列表信息后需要立即执行的回调函数
 */
function getRoomUserList(callback) {
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

/**
 * 申请成为王的函数
 */
function applyToBeFirst(){
    let beFirstMsg = {
        type:'declare_king',
        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
        roomName: state.homeState.currentRoomInfo.roomName,
        user:state.homeState.userInfo
    };
    send(JSON.stringify(beFirstMsg),function () {
        log('发送称王的消息到服务器','applyToBeFirst','webRtcAudio.js');
    });
}

function initVariableAudio() {
    successlog('audio-已初始化语音模式变量');
    // micphoneStream = null;
    // micphoneSource = null;
    // if(myWebAudio)myWebAudio.close();
    // myWebAudio = new (window.AudioContext || window.webkitAudioContext)();
    // myAnalyser = myWebAudio.createAnalyser();
    // prepareState = false;
    rtcSessionList=[];
    remoteVidoeDom = null;
    Msg = {};
    sendList={};
    // myMicSource = null;
    myVideo = null;
    firstCandidate = 0;
    microphoneStatus = false;
    getRoomUserListCallback = null;
    emptyNormalQuitUsers();
    // store.dispatch({type:CONSTANT.MICROPHONEINPUT,val:false});
    store.dispatch({type:CONSTANT.MICROPHONEOPEN,val:false});
    store.dispatch({type:CONSTANT.MICROPHONEINPUTUSERS,val:{}});
    let userTmp = state.homeState.userInfo,
        roomInfo = state.homeState.currentRoomInfo;
    if(roomInfo && roomInfo.childNode instanceof Array && roomInfo.childNode.length === 1){
        userTmp.isOnline = true;
    }else{
        userTmp.isOnline = false;
    }
    store.dispatch({type:CONSTANT.USERINFO,val:userTmp});
    // clearInterval(intval);
}

/**
 * 获取房间信息函数
 */
function getRoomInfo(roomId){
    let beFirstMsg = {
        type:'get_room_info',
        roomId: roomId,		//房间唯一标识符
        // roomName: state.homeState.currentRoomInfo.roomName,
        user:state.homeState.userInfo
    };
    // console.log(beFirstMsg);//这个消息发过去就挂了
    send(JSON.stringify(beFirstMsg),function () {
        log('发送getRoomInfo消息到服务器','getRoomInfo','webRtcAudio.js');
    });
}

/**
 * 入网函数（开始入网）
 */
let count = 0,sendList = {};
function startOnline() {
    let userInfo = state.homeState.userInfo;
    if(state.homeState.numberOne == userInfo.id){
        console.log('我已经是王了，不需要连别人');
        return;
    }
    // console.log('firstCandidate:'+firstCandidate);
    let objUser = getCandidate(state.homeState.userInfoList,firstCandidate);
    // console.log(state.homeState.userInfoList);
    // console.log(objUser);
    if(!objUser.minSeqUser){
        console.log('%c目标用户不存在','color:red');
        //目标用户不存在,继续用户用户列表并返回
        if(count<10){
            setTimeout(function () {
                getRoomUserList(startOnline);
                count++;
            },1000);

        }else{
            count = 0;
        }
        return;
    }
    //如果此人正在跟我连，则直接返回
    if(userInfo.Children.length !== 0){
        let isExist = false;
        userInfo.Children.map(function (item) {
            if(item === objUser.minSeqUser.id){
                isExist = true;
            }
        });
        if(isExist){
            console.error('对方正在跟我连接，不用去申请连他');
            firstCandidate = objUser.nextCandidate;
            getRoomUserList(startOnline);
            return;
        }
    }
    //如果没有音轨，则继续去获取
    if(!micphoneStream || (micphoneStream && micphoneStream.getAudioTracks().length === 0)){
        successlog('audio-未获取音频流，需要重新去获取再入网');
        if(count < 10){
            startMyCam(document.getElementById('audioBox'));
            setTimeout(function () {
                getRoomUserList(startOnline);
            },1000);
            count++;
        }else{
            alert('没有获取到您的麦克风，请检查您的设备状况');
        }
        return;
    }
    count = 0;
    sendList[objUser.minSeqUser.id] = true;//表示已经发送preOffer了
    let preOfferMsg = {
        type:'msg',
        typeString:'preOffer',
        ToUserOnly:objUser.minSeqUser.id,
        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
        roomName: state.homeState.currentRoomInfo.roomName,
        fromUser: userInfo,
        toUser:objUser.minSeqUser
    };
    if(!prepareState){
        setTimeout(function () {
            send(JSON.stringify(preOfferMsg),function () {
                log('发送准备连接（pre-offer）消息给 ' + objUser.minSeqUser.id,'startOnline','webRtcAudio.js');
            });
        },500);
    }else {
        send(JSON.stringify(preOfferMsg),function () {
            log('发送准备连接（pre-offer）消息给 ' + objUser.minSeqUser.id,'startOnline','webRtcAudio.js');
        });
    }
    console.log('nextCandidate:'+objUser.nextCandidate);
    firstCandidate = objUser.nextCandidate;
}

/**
 * 设置收到申请的列表
 * */
function amISendPreOffer(userId) {
    log('audio-我是否已经发送preOffer给'+userId+'?:'+sendList[userId]);
    return sendList[userId];
}

/**
 * 根据userId删除sendList中的user
 * */
function delSendListById(userId) {
    if(sendList[userId]){
        delete sendList[userId];
    }
}


/**
 * 初始化用户信息函数
 * */
function updateServerUserInfo() {
    let userInfo = state.homeState.userInfo;
    userInfo.Children = [];
    userInfo.maxChildren = CONFIG_CONSTANTS.MAXCHILDREN;
    console.log(userInfo);
    let updateUserMsg = {
        type:'update_user',
        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
        roomName: state.homeState.currentRoomInfo.roomName,
        user:userInfo
    };
    // console.log(updateUserMsg);
    if(!userInfo.seq)return;
    store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
    send(JSON.stringify(updateUserMsg),function () {
        log('发送update_user消息到服务器','updateServerUserInfo','webRtcAudio.js');
    });
}

//播放音乐,混入自己的mixOutputStream
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
    openMicrophone,
    microphoneStatus,
    initVariableAudio,
    updateServerUserInfo,
    amISendPreOffer,
    delSendListById
};

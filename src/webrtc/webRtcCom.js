import WS, {getDateString, getSendData, send} from "../static/webSocket";
import store, {CONSTANT} from "../reducer/reducer";
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
});

let  micphoneStream, prepareState = false, rtcSessionList=[], pcMeshChain=[], remoteVidoeDom,Msg;
//创建web audio实例,声明web Audio生成的stream
let audioCtx = new (window.AudioContext || window.webkitAudioContext)(),myWASource, myVideo;
let secondExist = false;//用户标记预备老大是否存在
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
            console.log(micphoneStream.getAudioTracks());
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
        let webAudio,mixedOutput,localStream;
        try{
            webAudio = new (window.AudioContext || window.webkitAudioContext)();// Failed to construct 'AudioContext': The number of hardware contexts provided (6) is greater than or equal to the maximum bound (6)
        }catch (e){
            console.error(e);
            // webAudio.close();
            // webAudio = new (window.AudioContext || window.webkitAudioContext)();
        }
        if(!webAudio){log('webAudio创建失败');console.log(webAudio);return;}
        myWASource = webAudio.createMediaStreamSource(micphoneStream);
        mixedOutput  = webAudio.createMediaStreamDestination();
        myWASource.connect(mixedOutput);
        localStream = mixedOutput.stream;

        newConnection.addStream(localStream);
        newConnection.onaddstream = function (e) {
            remoteVidoeDom = document.querySelector('#'+remoteVidoeId);
            remoteVidoeDom.src = window.URL.createObjectURL(e.stream);
            log('触发onaddstream');
            rtcSessionList.map(function (item) {
                if(item.pc != newConnection){
                    if(item.wa){
                        let awTmpStream = item.wa.createMediaStreamSource(e.stream);
                        awTmpStream.connect(item.mixer);
                    }else{
                        log('item.wa不存在')
                    }
                }else{
                    item.pcOutStream = e.stream;
                    // setTimeout(function () {//防止pcOutStream还未产生
                        rtcSessionList.map(function (item1) {
                            if(item1 != item){
                                // console.log(item1);
                                if(item1.pcOutStream){
                                    if(item.wa){
                                        let awTmpStream = item.wa.createMediaStreamSource(item1.pcOutStream);
                                        awTmpStream.connect(item.mixer);
                                    }else{
                                        log('item.wa不存在')
                                    }
                                }else{
                                    console.log(item1.pcOutStream);//这里的pcOutStream偶尔会没有，这是因为item1这个连接还在建立过程中，当他建立成功的时候还会到这个onaddStream来添加
                                    console.error('pcOutStream is not exist');
                                }
                            }
                        })
                    // },100);

                }
            });
        };
        // console.log("newConnection.onicecandidate");
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
            let userInfo = state.homeState.userInfo, updateUserMsg,numberOne = state.homeState.numberOne;
            // console.log(userInfo);
            // console.log(wbMsg.fromUser);
            // console.log(newConnection.iceConnectionState);
            switch(newConnection.iceConnectionState ) {
                case "connected":
                    // The connection has become fully connected
                    // 处理成功的情况
                    log(' 与 '+ wbMsg.toUser.id + ' 连接成功');
                    // console.log(state.homeState.userInfo);
                    if(type === 'offer'){
                        userInfo.parentNode = wbMsg.toUser.id;
                    }else{
                        let zero = false;//表示是否有占位符
                        for(let i = 0; i < userInfo.Children.length; i++){
                            if(userInfo.Children[i] == 0){
                                userInfo.Children[i] = wbMsg.toUser.id;
                                zero = true;
                                break;
                            }
                        }
                        if(!zero){//如果孩子中没有占位，并执行到这里，说明有儿子连过来
                            userInfo.Children.push(wbMsg.toUser.id);
                        }
                    }
                    store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                    updateUserMsg = {
                        type:'update_user',
                        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                        roomName: state.homeState.currentRoomInfo.roomName,
                        user:userInfo
                    };
                    if(!userInfo.seq)return;
                    send(JSON.stringify(updateUserMsg),function () {
                        log('发送update_user消息到服务器');
                        secondExist = false;//每次连接成功后，重置标记位
                    });
                    break;
                case "disconnected":
                    // console.log("disconnected");
                    log(wbMsg.toUser.id+'与我断开连接 ' );
                    // console.log(userInfo);
                    if(type === 'offer'){
                        userInfo.parentNode = '';
                        //父连接断时，重新去找新的节点连接
                        log('父节点 '+ wbMsg.toUser.id +'关闭了');
                        if(wbMsg.toUser.id == userInfo.id)return;
                        if(userInfo.numberOne === 2){
                            //老大断线时,如果我是老大第一个儿子，将自己设置为老大，并直接返回
                            // store.dispatch({type:CONSTANT.NUMBERONE,val:1});
                            userInfo.numberOne = 1;
                            updateUserMsg = {
                                type:'update_user',
                                roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                                roomName: state.homeState.currentRoomInfo.roomName,
                                user:userInfo
                            };
                            if(!userInfo.seq)return;
                            send(JSON.stringify(updateUserMsg),function () {
                                if(userInfo.numberOne === 1){
                                    log('我是新的预备老大,并发送到服务器');
                                }else{
                                    console.log('send updateUserList to server');
                                }
                                //这里应该做一个完成的标志，
                            });
                            // store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                            //新老大诞生后，新的2，3在这里是否需要设置1-2-（3,4），1断的情况
                            return;
                        }else if(userInfo.numberOne === 3){
                            //如果是老大的其他儿子，选第一个作为预备老大，并发送连新老大的消息
                            if(!isSecondExist()){
                                log('设置新的预备老大');
                                userInfo.numberOne = 2;
                                secondExist = true;
                            }else{
                                log('设置新的其他孩子');
                                userInfo.numberOne = 3;
                            }
                            updateUserMsg = {
                                type:'update_user',
                                roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                                roomName: state.homeState.currentRoomInfo.roomName,
                                user:userInfo
                            };
                            if(!userInfo.seq)return;
                            send(JSON.stringify(updateUserMsg),function () {
                                if(userInfo.numberOne === 2){
                                    log('我是新的预备老大,并发送到服务器');
                                }else if(userInfo.numberOne === 3){
                                    log('我是新的其他孩子，并发送到服务器');
                                }else{}
                            });

                            let getUsersInfo = {
                                type:'get_room_users',
                                roomId:state.homeState.currentRoomInfo.roomId,
                                roomName:state.homeState.currentRoomInfo.roomName,
                                user:userInfo
                            };
                            console.log(getUsersInfo);
                            setTimeout(function () {
                                send(JSON.stringify(getUsersInfo),function(){
                                    log('新儿子发送getRoomUsers消息');
                                });
                            },500);
                            return;
                        }else{
                            let getUsersInfo = {
                                type:'get_room_users',
                                roomId:state.homeState.currentRoomInfo.roomId,
                                roomName:state.homeState.currentRoomInfo.roomName,
                                user:userInfo
                            };
                            // console.log(getUsersInfo);
                            // setTimeout(function () {
                                send(JSON.stringify(getUsersInfo),function(){
                                    console.log('不是儿子节点发送getRoomUsers消息');
                                });
                            // },100);
                        }

                    }else{
                        //第一时间更新服务器孩子信息
                        // console.log(wbMsg.toUser);
                        userInfo.Children = userInfo.Children.filter(function (item) {
                            return wbMsg.toUser.id != item;
                        });
                        updateUserMsg = {
                            type:'update_user',
                            roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                            roomName: state.homeState.currentRoomInfo.roomName,
                            user:userInfo
                        };
                        if(!userInfo.seq)return;
                        send(JSON.stringify(updateUserMsg),function () {
                            log('把孩子 '+ wbMsg.toUser.id +' 的断线消息发送到服务器');
                            // console.log(wbMsg.toUser);
                            onLeave(wbMsg.toUser);
                        });
                        //在这里确定是老二掉线(还是其他孩子掉线)了，重新设置新老大的第一个儿子为新的老二,并更新到服务器
                        if(userInfo.numberOne === 1){
                            let newPreHead = userInfo.Children[0];
                            if(!newPreHead)return;
                            if(newPreHead == wbMsg.toUser.id){
                                if(userInfo.Children[1]){
                                    newPreHead = userInfo.Children[1];
                                }else{
                                    return;
                                }
                            }
                            log('设置新的预备老大：'+newPreHead);
                            //循环给儿子发消息，告知谁是预备老大
                            let msg = {
                                type:'msg',
                                roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                                roomName: state.homeState.currentRoomInfo.roomName,
                                typeString:'setNewPreHead',
                                fromUser:userInfo,
                                // ToUserOnly:newPreHead
                            };
                            userInfo.Children.map(function (item) {
                                msg.ToUserOnly = item;
                                msg.head = newPreHead;
                                send(JSON.stringify(msg),function () {
                                    log('将预备老大'+ newPreHead +'的信息发送给孩子'+item);
                                })
                            });
                        }

                        //给儿子们发消息去重新找节点连接,这里有一种可能是，peerConnection断掉了，websocket没有断掉,这种可能性是否需要处理待商榷
                        log('孩子 '+ wbMsg.toUser.id +' 关闭了');
                        //断掉pc，清理webaudio
                    }
                    store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                case "failed":
                    // One or more transports has terminated unexpectedly or in an error
                    // console.log('failed to '+Msg.toUser.id);
                    // console.log(Msg);
                    // console.log(event);
                    break;
                case "closed":
                    // The connection has been closed,本人关闭或被动通知后关闭会触发（即调用peerConnection.close()）,通知后台我已关闭连接
                    if(type === 'offer'){
                        log('关闭连接');
                        setTimeout(function () {
                            let getUsersInfo = {
                                type:'get_room_users',
                                roomId:state.homeState.currentRoomInfo.roomId,
                                roomName:state.homeState.currentRoomInfo.roomName,
                                // user:userInfo //被关闭重新连接时不带userInfo
                            };
                            console.log(getUsersInfo);
                            send(JSON.stringify(getUsersInfo),function(){
                                log('连接被关闭，getRoomUsers去重新找连接');
                            });
                        },100);
                    }

                    break;
                default:
                    // console.log('default:'+newConnection.iceConnectionState);
                    break;
            }

        };
        return {pc:newConnection,wa:webAudio,mixer:mixedOutput,pcOutStream:null};
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
    console.log(xpc);
    if(!xpc)return;
    let rtcsession = {
        sessionId:wbMsg.sessionId,
        fromUserId:wbMsg.fromUser.id,
        toUserId:wbMsg.toUser.id,
        status:'called',
        remoteVideoId:videoId,
        pc:xpc.pc,
        wa:xpc.wa,
        mixer:xpc.mixer,
        pcOutStream:xpc.pcOutStream
    };
    let isExiat = false;//标记rtcSession是否存在
    rtcSessionList.map(function (item) {
        if(item.sessionId == wbMsg.sessionId){
            isExiat = true;
        }
    });
    if(!isExiat){
        rtcSessionList.push(rtcsession);
    }
    xpc.pc.createOffer(function (offer) {
        Msg = wbMsg;
        Msg.offer = offer;
        if(Msg.answer) delete Msg.answer;
        if(Msg.candidate) delete Msg.candidate;
        // console.log(Msg);
        send(JSON.stringify(Msg),function () {
            log('发送offer给'+ Msg.toUser.id);
            xpc.pc.setLocalDescription(offer);
        });
    }, function (error) {
        alert("An error has occurred 1.");
    });
};
function answerPeerConnection(wbMsg,offer,videoBox) {
    log('进入answerPeerConnection');
    let videoId = "video_" + wbMsg.toUser.id;
    let theirVideo = document.createElement('video');
    // theirVideo.src = window.URL.createObjectURL(stream);
    theirVideo.style.width='100px';
    theirVideo.style.height='60px';
    theirVideo.autoplay= true;
    theirVideo.controls=true;
    theirVideo.id=videoId;
    videoBox.appendChild(theirVideo);
    let xpc = preparePeerConnection(wbMsg,wbMsg.sessionId, micphoneStream, videoId,'answer');
    // console.log(pc);//到这里没问题
    if(!xpc)return;
    let rtcSession = {
        sessionId:wbMsg.sessionId,
        fromUser:state.homeState.userInfo.id,
        toUser:wbMsg.toUser.id,
        status:'answered',
        remoteVideoId:videoId,
        pc:xpc.pc,
        wa:xpc.wa,
        mixer:xpc.mixer,
        pcOutStream:xpc.pcOutStream
    };
    let isExiat = false;//标记rtcSession是否存在
    rtcSessionList.map(function (item) {
        if(item.sessionId == wbMsg.sessionId){
            isExiat = true;
        }
    });
    if(!isExiat) {
        rtcSessionList.push(rtcSession);
        // let obj = {};
        // obj[wbMsg.toUser.id] = [];
        // pcMeshChain[wbMsg.toUser.id] = [];
        // pcMeshChain[wbMsg.toUser.id].push(obj);
        // console.log('push Mesh');
    }
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
};

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
                // setTimeout(function () {
                //     item.pc.setRemoteDescription(new RTCSessionDescription(answer));
                // },500);
                console.error(e);
            }
        }
    });
};

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
};


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
    if(userInfo.id == state.homeState.userInfo.id){
        rtcSessionList = rtcSessionList.filter(function (item) {
            // console.log(item);
            if(item.fromUser == userInfo.id){
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
                item = null;
                log('my peerConnection closed');
                log("我断开连接");
            }
            return item.toUser != userInfo.id;
        })
    }else{
        rtcSessionList = rtcSessionList.filter(function (item) {
            console.log(item);
            if(item.toUser == userInfo.id){
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
                log('child peerConnection closed');
                log('孩子'+userInfo.id+"断开连接");
            }
            return item.toUser != userInfo.id;
        })
    }
    console.log(rtcSessionList);
};

//通过服务器的最新程状态判断预备老大是否存在
function setSecondExist(boolean) {
    secondExist = boolean;
}
function isSecondExist(){
    if(secondExist){
        return true;
    }else{
        return false;
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
    setSecondExist
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
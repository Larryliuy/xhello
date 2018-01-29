import WS, {getDateString, getSendData, send} from "../static/webSocket";
import store, {CONSTANT} from "../reducer/reducer";
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
});

let  micphoneStream, prepareState = false, rtcSessionList=[], pcMeshChain=[], remoteVidoeDom,Msg;
//创建web audio实例,声明web Audio生成的stream
let audioCtx = new (window.AudioContext || window.webkitAudioContext)(),myWASource, remoteStream, myVideo;
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
    console.log("PreparePeerConnection and create a peerConnection!");
    let newConnection;
    if (hasRTCPeerConnection()) {
        // console.log('prepareState:'+prepareState);
        if(!prepareState)return;

        newConnection = new RTCPeerConnection(rtcPeerConfig);

        // console.log(localstream);
        if(!micphoneStream)return;
        //准备连接时先设置自己的stream到video
        // console.log(localStream);

        let webAudio = new (window.AudioContext || window.webkitAudioContext)();
        myWASource = webAudio.createMediaStreamSource(micphoneStream);
        let mixedOutput  = webAudio.createMediaStreamDestination();
        myWASource.connect(mixedOutput);
        let localStream = mixedOutput.stream;

        newConnection.addStream(localStream);
        newConnection.onaddstream = function (e) {
            remoteVidoeDom = document.querySelector('#'+remoteVidoeId);
            remoteVidoeDom.src = window.URL.createObjectURL(e.stream);
            // console.log(e.stream);
            rtcSessionList.map(function (item) {
                if(item.pc != newConnection){
                    let awTmpStream = item.wa.createMediaStreamSource(e.stream);
                    awTmpStream.connect(item.mixer);
                }else{
                    item.pcOutStream = e.stream;
                    rtcSessionList.map(function (item1) {
                        if(item1 != item){
                            let awTmpStream = item.wa.createMediaStreamSource(item1.pcOutStream);
                            awTmpStream.connect(item.mixer);
                        }
                    })
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
                console.log("Sending local candidate to "+Msg.toUser.id);
                if(Msg.offer) delete Msg.offer;//删除回传的offer
                if(Msg.answer) delete Msg.answer;//删除回传的answer
                Msg.candidate = event.candidate;
                send(JSON.stringify(Msg),function () {
                    // console.log('sendCandidate');
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
                    console.log('connected : connect to '+ wbMsg.toUser.id + '  success');
                    // console.log(state.homeState.userInfo);
                    if(type === 'offer'){
                        userInfo.parentNode = wbMsg.toUser.id;
                    }else{
                        for(let i = 0; i < userInfo.Children.length; i++){
                            if(userInfo.Children[i] == 0){
                                userInfo.Children[i] = wbMsg.toUser.id;
                            }
                        }
                        // userInfo.Children.push(wbMsg.toUser.id);
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
                        console.log('send updateUserList to server');
                        secondExist = false;//每次连接成功后，重置标记位
                    });
                    break;
                case "disconnected":
                    console.log("disconnected");
                    console.log('Disconnect with '+ wbMsg.toUser.id );
                    console.log(userInfo);
                    if(type === 'offer'){
                        userInfo.parentNode = '';
                        //父连接断时，重新去找新的节点连接
                        console.log('parent '+ wbMsg.toUser.id +' close');
                        if(wbMsg.toUser.id == userInfo.id)return;
                        if(userInfo.numberOne === 2){
                            //如果我是老大第一个儿子，将自己设置为老大，并直接返回
                            store.dispatch({type:CONSTANT.NUMBERONE,val:1});
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
                                    console.log('---I am the new header,send the new head to server');
                                }else{
                                    console.log('send updateUserList to server');
                                }
                                //这里应该做一个完成的标志，
                            });
                            // store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                            return;
                        }else if(userInfo.numberOne === 3){
                            //如果是老大的其他儿子，选第一个作为预备老大，并发送连新老大的消息
                            if(!secondExist){
                                console.log('---set new pre-head');
                                userInfo.numberOne = 2;
                                secondExist = true;
                            }else{
                                console.log('---set new other child');
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
                                    console.log('---I am the new pre-head,send the new head to server');
                                }else{
                                    console.log('---I am the new other child,send the new head to serve');
                                }
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
                                    console.log('---delay 1 seconds to get-room-users');
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
                            console.log(getUsersInfo);
                            send(JSON.stringify(getUsersInfo),function(){

                            });
                        }

                    }else{
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
                            console.log('send updateUserList to server');
                        });
                        //给儿子们发消息去重新找节点连接,这里有一种可能是，peerConnection断掉了，websocket没有断掉,这种可能性是否需要处理待商榷
                        console.log('children '+ wbMsg.toUser.id +' close');
                    }
                    store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
                case "failed":
                    // One or more transports has terminated unexpectedly or in an error
                    console.log('failed');
                    console.log(Msg);
                    // console.log(event);
                    break;
                case "closed":
                    // The connection has been closed,本人关闭或被动通知后关闭会触发（即调用peerConnection.close()）,通知后台我已关闭连接
                    console.log('closed');
                    let getUsersInfo = {
                        type:'get_room_users',
                        roomId:state.homeState.currentRoomInfo.roomId,
                        roomName:state.homeState.currentRoomInfo.roomName,
                        // user:userInfo //被关闭重新连接时不带userInfo
                    };
                    console.log(getUsersInfo);
                    send(JSON.stringify(getUsersInfo),function(){

                    });
                    break;
                default:
                    console.log('default:'+newConnection.iceConnectionState);
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
    console.log('offerPeerConnection');
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
            console.log('sendOffer to '+ Msg.toUser.id);
            xpc.pc.setLocalDescription(offer);
        });
    }, function (error) {
        alert("An error has occurred 1.");
    });
};
function answerPeerConnection(wbMsg,offer,videoBox) {
    console.log('answerPeerConnection');
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
            console.log('sendAnswer to ' + Msg.toUser.id);
            xpc.pc.setLocalDescription(answer);
        });
    }, function (error) {
        alert("An error has occurred 1.");
    });
};

function onAnswer(answer,sessionId,toUserId) {
    // console.log(sessionId);
    // console.log(rtcSessionList);
    let tmpStr = sessionId.split('-')[1]+'-'+sessionId.split('-')[0];
    rtcSessionList.map(function (item) {
        if(item.sessionId == tmpStr){
            item.pc.setRemoteDescription(new RTCSessionDescription(answer));
            //toUserId为父连接id，发送给服务器，更新userList

            // let obj = {};
            // obj[state.homeState.userInfo.id] = [];
            // if(pcMeshChain[toUserId]){
            //     pcMeshChain[toUserId].push(obj);
            //     console.log('push '+ toUserId +' to Mesh ');
            // }
            // console.log(pcMeshChain);
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
            item.pc.addIceCandidate(new RTCIceCandidate(candidate));
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

function onLeave() {
    let userInfo = state.homeState.userInfo;
    console.log(userInfo.name+" onLeave!");
    console.log(rtcSessionList);
    rtcSessionList.map(function (item) {
        // console.log(item);
        if(item.fromUserId == userInfo.id){
            item.pc.close();
            console.log('peerConnection closed');
        }
    })
};
export { startMyCam, onAnswer, onCandidate, offerPeerConnection, answerPeerConnection, onLeave, getPrepareConnectionState, micphoneStream};
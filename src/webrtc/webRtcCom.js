import WS, {getDateString, getSendData, send} from "../static/wsInstace";
import store, {CONSTANT} from "../reducer/reducer";
let state = store.getState(),wbMsg;
store.subscribe(function () {
    state = store.getState();
});

let  micphoneStream, prepareState = false, rtcSessionList=[], pcMeshChain=[], remoteVidoeDom,Msg;
//创建web audio实例,声明web Audio生成的stream
let audioCtx = new (window.AudioContext || window.webkitAudioContext)(),myWASource, remoteStream, myVideo;

let stun_server = {
    urls: 'stun:turn.xtell.cn:3479'
};

// or TURN
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
    console.log("PreparePeerConnection!");
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
        console.log("newConnection.onicecandidate");
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
            console.log(type);
            let userInfo = state.homeState.userInfo, updateUserMsg;
            console.log(userInfo);
            console.log(wbMsg.fromUser);
            if (newConnection.iceConnectionState === "failed" ||
                newConnection.iceConnectionState === "disconnected" ||
                newConnection.iceConnectionState === "closed"){
                //处理失败情况,根据失败的原因去重新连接,getRoomUser,主动断开的情况，连接失败的情况
                console.log(wbMsg);
                console.log(state.homeState.userInfo);
                if(type === 'offer'){
                    userInfo.parentNode = '';
                    //重新去找新的节点连接
                }else{
                    userInfo.Children = userInfo.Children.filter(function (item) {
                        return wbMsg.toUser.id != item;
                    });
                    //给儿子们发消息去重新找节点连接
                }
            }else{
                // 处理成功的情况
                console.log(wbMsg);
                console.log(state.homeState.userInfo);
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
            })
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
        // let obj = {};
        // obj[state.homeState.userInfo.id]=[];
        // pcMeshChain.push(obj);
        // console.log('push Mesh offer');
    }
    // console.log(pcMeshChain);
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

function onLeave(userInfo) {
    console.log(userInfo.name+" onLeave!");
    rtcSessionList.map(function (item) {
        if(item.fromUser.id == userInfo.id){
            item.pc.close();
            // item.pc.onicecandidate = null;
            // item.pc.onaddstream = null;
        }
    })
};
export { startMyCam, onAnswer, onCandidate, offerPeerConnection, answerPeerConnection, onLeave, getPrepareConnectionState, micphoneStream};
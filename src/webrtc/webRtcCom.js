import WS, {getDateString, getSendData, send} from "../static/wsInstace";
import store from "../reducer/reducer";
let state = store.getState(),wbMsg;
store.subscribe(function () {
    state = store.getState();
});

let  micphoneStream, prepareState = false, rtcSessionList=[], pcMeshChain=[], remoteVidoeDom,Msg;
//创建web audio实例,声明web Audio生成的stream
let audioCtx = new (window.AudioContext || window.webkitAudioContext)(),myWASource,mixedOutput, downStream, upStream, myVideo;

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
        mixedOutput  = webAudio.createMediaStreamDestination();
        myWASource.connect(mixedOutput);
        let localStream = mixedOutput.stream;

        newConnection.addStream(localStream);
        newConnection.onaddstream = function (e) {
            remoteVidoeDom = document.querySelector('#'+remoteVidoeId);
            remoteVidoeDom.src = window.URL.createObjectURL(e.stream);
            // console.log(e.stream);
            console.log(type);
            // if(type === 'answer'){
            //     console.log("onaddstream triggered! downStream is received");
            //     //这里downStream可能需要数组
            //     downStream= audioCtx.createMediaStreamSource(e.stream);
            //     downStream.connect(mixedOutput);
            //     myLocalStream = mixedOutput.stream;
            //     newConnection.addStream(myLocalStream);
            //     console.log(newConnection);
            //     console.log(this);
            //     remoteVidoeDom = document.querySelector('#'+remoteVidoeId);
            //     remoteVidoeDom.src = window.URL.createObjectURL(mixedOutput.stream);
            // }else{
            //     console.log("onaddstream triggered! upStream is received");
            //     //不是被呼叫端只接受stream,不混音
            //     remoteVidoeDom = document.querySelector('#'+remoteVidoeId);
            //     remoteVidoeDom.src = window.URL.createObjectURL(e.stream);
            // }
            // myVideo.src = window.URL.createObjectURL(myLocalStream);
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
        return {pc:newConnection,wa:webAudio};
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
        wa:xpc.wa
    };
    let isExiat = false;//标记rtcSession是否存在
    rtcSessionList.map(function (item) {
        if(item.sessionId == wbMsg.sessionId){
            isExiat = true;
        }
    });
    if(!isExiat){
        rtcSessionList.push(rtcsession);
        let obj = {};
        obj[state.homeState.userInfo.id]=[];
        pcMeshChain.push(obj);
        console.log('push Mesh offer');
    }
    console.log(pcMeshChain);
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
        wa:xpc.wa
    };
    let isExiat = false;//标记rtcSession是否存在
    rtcSessionList.map(function (item) {
        if(item.sessionId == wbMsg.sessionId){
            isExiat = true;
        }
    });
    if(!isExiat) {
        rtcSessionList.push(rtcSession);
        let obj = {};
        obj[wbMsg.toUser.id] = [];
        pcMeshChain[wbMsg.toUser.id] = [];
        pcMeshChain[wbMsg.toUser.id].push(obj);
        console.log('push Mesh');
    }
    console.log(pcMeshChain);
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
            let obj = {};
            obj[state.homeState.userInfo.id] = [];
            if(pcMeshChain[toUserId]){
                pcMeshChain[toUserId].push(obj);
                console.log('push '+ toUserId +' to Mesh ');
            }
            console.log(pcMeshChain);
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
    console.log("onLeave!");
    // connectedUser = null;
    // theirVideo.src = null;
    // yourConnection.close();
    // yourConnection.onicecandidate = null;
    // yourConnection.onaddstream = null;
};
export { startMyCam, onAnswer, onCandidate, offerPeerConnection, answerPeerConnection, onLeave, getPrepareConnectionState, micphoneStream};
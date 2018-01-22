import WS, {getDateString, getSendData, send} from "../static/wsInstace";
import store from "../reducer/reducer";
let state = store.getState(),wbMsg;
store.subscribe(function () {
    state = store.getState();
    // wbMsg = {
    //     type:'msg',
    //     typeString:'webrtc',
    //     roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
    //     roomName: state.homeState.currentRoomInfo.roomName,
    //     fromUser:state.homeState.userInfo,
    // };
});

let  myLocalStream, prepareState = false, rtcSessionList=[], remoteVidoeDom, Msg;
// let MyVideo = document.getElementById('myVideo');
// let theirVideo = document.getElementById('theirVideo');

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
        navigator.getUserMedia({ video: true, audio: true }, function(myStream) {
            myLocalStream = myStream;
            console.log(myLocalStream);
            let myVideo = document.createElement('video');
            myVideo.src = window.URL.createObjectURL(myLocalStream);
            myVideo.addEventListener('canplay', function(){
                myVideo.muted = true;		//mute local video to avoid echo by myself.
            });
            myVideo.addEventListener('play', function(){
                myVideo.muted = true;		//mute local video to av    oid echo by myself.
            });
            myVideo.style.width='100px';
            myVideo.style.height='60px';
            myVideo.autoplay=true;
            myVideo.controls=true;
            videoBox.appendChild(myVideo);
            prepareState = true;
        }, function(error){
            console.log(error);
        });
    }
}

function preparePeerConnection(wbMsg,sessionId,localstream,remoteVidoeId) {
    console.log("PreparePeerConnection!");
    let newConnection;
    if (hasRTCPeerConnection()) {
        // console.log('prepareState:'+prepareState);
        if(!prepareState)return;
        newConnection = new RTCPeerConnection(rtcPeerConfig);
        // console.log(localstream);
        if(!localstream)return;
        newConnection.addStream(localstream);
        newConnection.onaddstream = function (e) {
            console.log("onaddstream triggered! remote video stream is received");
            console.log(e.stream);
            remoteVidoeDom = document.querySelector('#'+remoteVidoeId);
            remoteVidoeDom.src = window.URL.createObjectURL(e.stream);
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
                if(Msg.answer) delete Msg.answer;//删除回传的offer
                Msg.candidate = event.candidate;
                send(JSON.stringify(Msg),function () {
                    // console.log('sendCandidate');
                })
            }
        };
        return newConnection;
    }else{
        alert("NO WEBRTC"); return;
    }

}

function offerPeerConnection(wbMsg,videoBox) {
    let videoId = "video_" + wbMsg.toUser.id;
    let theirVideo = document.createElement('video');
    // theirVideo.src = window.URL.createObjectURL(stream);
    theirVideo.style.width='100px';
    theirVideo.style.height='60px';
    theirVideo.autoplay= true;
    theirVideo.controls=true;
    theirVideo.id=videoId;
    videoBox.appendChild(theirVideo);
    console.log('offerPeerConnection');
    let pc = preparePeerConnection(wbMsg,wbMsg.sessionId, myLocalStream, videoId);
    console.log(pc);
    if(!pc)return;
    let rtcsession = {
        sessionId:wbMsg.sessionId,
        fromUserId:wbMsg.fromUser.id,
        toUserId:wbMsg.toUser.id,
        status:'called',
        remoteVideoId:videoId,
        pc:pc
    };
    let isExiat = false;
    rtcSessionList.map(function (item) {
        if(item.sessionId == wbMsg.sessionId){
            isExiat = true;
        }
    });
    if(!isExiat){
        rtcSessionList.push(rtcsession);
    }
    pc.createOffer(function (offer) {
        Msg = wbMsg;
        Msg.offer = offer;
        if(Msg.answer) delete Msg.answer;
        if(Msg.candidate) delete Msg.candidate;
        // console.log(Msg);
        send(JSON.stringify(Msg),function () {
            console.log('sendOffer to '+ Msg.toUser.id);
            pc.setLocalDescription(offer);
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
    let pc = preparePeerConnection(wbMsg,wbMsg.sessionId, myLocalStream, videoId);
    console.log(pc);//到这里没问题
    if(!pc)return;
    let rtcSession = {
        sessionId:wbMsg.sessionId,
        fromUser:state.homeState.userInfo.id,
        toUser:wbMsg.toUser.id,
        status:'answered',
        remoteVideoId:videoId,
        pc:pc
    };
    let isExiat = false;
    rtcSessionList.map(function (item) {
        if(item.sessionId == wbMsg.sessionId){
            isExiat = true;
        }
    });
    if(!isExiat) {
        rtcSessionList.push(rtcSession);
    }
    console.log(rtcSession);
    pc.setRemoteDescription(new RTCSessionDescription(offer));
    pc.createAnswer(function (answer) {
        Msg = wbMsg;
        Msg.answer = answer;
        if(Msg.offer) delete Msg.offer;//删除其中的offer
        if(Msg.candidate) delete Msg.candidate;//删除其中的candidate
        console.log(Msg);
        send(JSON.stringify(Msg),function () {
            console.log('sendAnswer to ' + Msg.toUser.id);
            pc.setLocalDescription(answer);
        });
    }, function (error) {
        alert("An error has occurred 1.");
    });
};

function onAnswer(answer,sessionId) {
    console.log(sessionId);
    console.log(rtcSessionList);
    let tmpStr = sessionId.split('-')[1]+'-'+sessionId.split('-')[0];
    rtcSessionList.map(function (item) {
        if(item.sessionId == tmpStr){
            item.pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log(item.pc);
            // prepareState = false;
        }
    });
};

function onCandidate(candidate,sessionId) {
	// console.log("onCandidate:"+candidate);
//     console.log("Adding candidate for " + g_username);
    let tmpStr = sessionId.split('-')[1]+'-'+sessionId.split('-')[0];
    console.log(sessionId);
    console.log(tmpStr);
    console.log(rtcSessionList);
    rtcSessionList.map(function (item) {
        if(item.sessionId == tmpStr){
            item.pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log(item.pc);
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
export { startMyCam, onAnswer, onCandidate, offerPeerConnection, answerPeerConnection, onLeave, getPrepareConnectionState};
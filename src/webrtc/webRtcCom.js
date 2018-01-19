import WS, {getDateString, getSendData, send} from "../static/wsInstace";
import store from "../reducer/reducer";
let state = store.getState(),wbMsg;
store.subscribe(function () {
    state = store.getState()
    wbMsg = {
        type:'msg',
        typeString:'webrtc',
        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
        roomName: state.homeState.currentRoomInfo.roomName,
        user:state.homeState.userInfo
    };
});

let yourConnection, myLocalStream,prepareState = false,rtcSessionList=[];
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
if (hasRTCPeerConnection()) {
    yourConnection = new RTCPeerConnection(rtcPeerConfig);
} else {
    alert("Sorry, your browser does not support WebRTC.");
}
function getPrepareConnectionState(){
    return prepareState;
}

function prepareConnection(videoBox) {
    console.log("PrepareConnection!");
    if (hasUserMedia()) {
        navigator.getUserMedia({ video: false, audio: true }, function(myStream) {
            myLocalStream = myStream;
            // console.log(videoBox);
            if(videoBox){
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
                // setupPeerConnection(myLocalStream,wbMsg,videoBox);
                console.log(yourConnection);
                yourConnection.addStream(myLocalStream);
                yourConnection.onaddstream = function (e) {
                    console.log("onaddstream triggered!");
                    // 创建video标签并加入videoBox
                    let theirVideo = document.createElement('video');
                    theirVideo.src = window.URL.createObjectURL(e.stream);
                    theirVideo.style.width='100px';
                    theirVideo.style.height='60px';
                    theirVideo.autoplay= true;
                    theirVideo.controls=true;
                    videoBox.appendChild(theirVideo)
                    // }
                };

                // Setup ice handling
                yourConnection.onicecandidate = function (event) {
                    //	console.log("yourConnection.onicecandidate!");
                    if (event.candidate) {
                        // console.log("Sending candidate");
                        let Msg = wbMsg;
                        Msg.candidate = event.candidate;
                        // console.log(Msg);
                        send(JSON.stringify(Msg),function () {
                            // console.log('sendCandidate');
                        })
                    }
                };
                prepareState = true;
            }

        }, function (error) {
            console.log(error);
        });
    } else {
        alert("Sorry, your browser does not support WebRTC.");
    }
}

function startPeerConnection(user,wbMsg) {
    // console.log("startPeerConnection!");
    yourConnection.createOffer(function (offer) {
        let Msg = wbMsg;
        Msg.offer = offer;
        console.log(Msg);
        send(JSON.stringify(Msg),function () {
            console.log('startPeerConnection');
            yourConnection.setLocalDescription(offer);
        });
    }, function (error) {
        alert("An error has occurred 1.");
    });
};

function onOffer(offer) {
    console.log(offer);
    //alert("offer from " + name);
    yourConnection.setRemoteDescription(new RTCSessionDescription(offer));
    yourConnection.createAnswer(function (answer) {
        yourConnection.setLocalDescription(answer);
        let Msg = wbMsg;
        Msg.anwser = answer;
        send(JSON.stringify(Msg),function () {
            console.log('sendAnswer');
            console.log(yourConnection);
        });
    }, function (error) {
        console.log(error);
        alert("An error has occurred 2.");
    });

};

function onAnswer(answer) {
    console.log("onAnswer!");
    if(yourConnection.remoteDescription && yourConnection.remoteDescription.type === 'answer')return;
    yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log(yourConnection);
};

function onCandidate(candidate) {
	console.log("onCandidate:"+candidate);
//     console.log("Adding candidate for " + g_username);
    yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
//     yourConnection.addIceCandidate(new RTCIceCandidate({
//         sdpMLineIndex: candidate.label,
//         candidate: candidate.candidate
//     }));
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
    yourConnection.close();
    yourConnection.onicecandidate = null;
    yourConnection.onaddstream = null;
};
export {yourConnection, prepareConnection, onAnswer,  onCandidate, onOffer, startPeerConnection, onLeave, getPrepareConnectionState};
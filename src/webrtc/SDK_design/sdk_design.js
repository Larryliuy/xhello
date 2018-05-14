
(function (window) {
    // declare
    var XRTC = function () {
        return;
    };
    XRTC.prototype.localStream = null;//本地音/视频流
    XRTC.prototype.webAudio = null;//本地WebAudio对象
    XRTC.prototype.webAudioOutput = null;//本地WebAudio输出对象
    XRTC.prototype.audioSourceNode = null;//本地WebAudio 的audioSourceNode对象
    XRTC.prototype.status = null;
    XRTC.prototype.sessionList = [];//多人会议时的pc对象列表
    XRTC.prototype.mode = {}; //获取本地音视频配置
    XRTC.prototype.offerOptions = {};//pc对象参数
    XRTC.prototype.rtcPeerConfig = {
        iceServers: [],
        bundlePolicy:'max-bundle',
        rtcpMuxPolicy: 'require',
        tcpCandidatePolicy: 'disable',
        iceTransports: 'all'
    };
    /**
     * @api {window.XRTC.init} init init
     * @apiName init
     * @apiGroup XRTC
     * @apiVersion 0.1.0
     * @apiDescription 初始化函数init
     * @apiParam {json} [config] 初始化时的配置 .
     * @apiParamExample {String} 用法示例：
     *      var config = {
     *          mode:2,
     *          localVideo:dom,
     *          remoteVideo:dom
     *      };
     *      window.XRTC.init(config)
     * */
    XRTC.prototype.init = function (config) {
        if(!config){
            //如果没有传配置文件，默认设置音频模式
            this.setMode(1,null);
        }else{
            if(config.mode === 1){
                this.setMode(1,null);
            }else{
                if(config.mode === 2 && config.localVideo && config.remoteVideo){
                    this.setMode(2,config.localVideo,config.remoteVideo);
                }else if(config.mode === 3 && config.localVideo){
                    this.setMode(3,config.localVideo);
                }else{
                    if(config.localVideo){
                        console.error('unkonw mode');
                    }else{
                        console.error('videoTag is null');
                    }
                }
            }
        }
        //默认iceServer
        var iceServer = [
            {urls:'stun:stun.freeswitch.org'},
            {
                urls: 'turn:13.250.13.83:3478?transport=udp',
                credential: 'YzYNCouZM1mhqhmseWk6',
                username: 'YzYNCouZM1mhqhmseWk6'
            }];
        this.setIceServers(iceServer);
    };
    /**
     * @api {window.XRTC.setIceServers} setIceServers setIceServers
     * @apiName setIceServers
     * @apiVersion 0.1.0
     * @apiDescription 设置ice服务器
     * @apiGroup XRTC
     * @apiParam {Array} iceServers stun与turn服务器对象数组
     * @apiParamExample {String} 用法示例：
     *      var iceServer = [
     *          {url:'stun:stun.xxx.org'},
     *          {urls:'turn:turn.xxx.org',username:'xxx',credential:'xxx'}
     *      ];
     *      window.XRTC.setIceServers(iceServer)
     * */
    XRTC.prototype.setIceServers = function (iceServers) {
        this.rtcPeerConfig.iceServers = iceServers;
    };
    // setMode function,1 instead of audio,2 instead of video,default 1
    /**
     * @api {window.XRTC.setMode} setMode setMode
     * @apiName setMode
     * @apiVersion 0.1.0
     * @apiDescription 设置音视频模式
     * @apiGroup XRTC
     * @apiParam {Number} mode  音视频模式 1 表示音频,2 音视频,3 表示桌面共享（只限firefox）
     * @apiParam {Dom} [localVideoTag] 本地视频播放容器
     * @apiParam {Dom} [remoteVideoTag] 远程视频播放容器
     * @apiParamExample {String} 用法示例：
     *      window.XRTC.setMode(1,null) //音频模式
     *      window.XRTC.setMode(2,localVideo,remoteVideo) //视频模式
     *      window.XRTC.setMode(3,localVideo) //屏幕共享模式（只限firefox）
     * */
    XRTC.prototype.setMode = function (mode,localVideoTag,remoteVideoTag) {
        this.mode = {};
        if(mode === 1){
            this.mode.id = 1;
            this.mode.avMode = { video:false, audio:true };
            this.mode.offerOptions = { offerToReceiveAudio:1,offerToReceiveVideo:0 };
            this.mode.viewBox = document.createElement('div');
            document.body.appendChild(this.mode.viewBox);
        }else if(mode === 2){
            if(!localVideoTag || !remoteVideoTag){
                console.error('视频播放容器不存在');
                return;
            }
            this.mode.id = 2;
            this.mode.avMode = { video:true, audio:true };
            this.mode.offerOptions = { offerToReceiveAudio:1,offerToReceiveVideo:1 };
            this.mode.localVideoTag = localVideoTag;
            this.mode.remoteVideoTag = remoteVideoTag;
        }else if(mode === 3){
            if(!localVideoTag){
                console.error('屏幕共享容器不存在');
                return;
            }
            this.mode.id = 3;
            this.mode.avMode = { video: {
                    mediaSource: 'screen',
                    width:{max:'1920'},
                    height:{max:'1080'},
                    frameRate:{max:'10'}
                },audio:true };
            this.mode.offerOptions = { offerToReceiveAudio:1,offerToReceiveVideo:1 };
            this.mode.localVideoTag = localVideoTag;
        }else{
            console.error('error mode:'+mode);
        }
        console.log(this.mode);
    };
    /**
     * @api {window.XRTC.getStream} getStream getStream
     * @apiName getStream
     * @apiVersion 0.1.0
     * @apiDescription 根据设置的模式获取音频还是音视频
     * @apiGroup XRTC
     * @apiParam {Function} successCallback 成功的回调函数
     * @apiParam {Function} errorCallback 失败的回调函数
     * @apiParamExample {String} 用法示例：
     *      window.XRTC.getStream(function(stream){
     *              console.log(stream);
     *          },function(reason){
     *              console.log(reason);
     *          })
     * @apiSuccess {MediaStream} stream 获取到的媒体流
     * @apiSuccess {String} streamType 获取到的媒体流类型,micStream为麦克风音频流，tagStream为audio tag标签的音频流
     * @apiError {String} reason 失败的原因
     * */
    XRTC.prototype.getStream = function (successCallback,errorCallback) {
        console.log('getStream');
        var _this = this;
        if (this.hasUserMedia()) {
            console.log(this.mode.avMode);
            navigator.getUserMedia(this.mode.avMode, function(stream) {
                this.localStream = stream;
                var audioTag;
                if(_this.mode.id === 1){
                    audioTag = document.createElement('audio');
                    audioTag.srcObject = stream;
                    audioTag.addEventListener('canplay', function(){
                        audioTag.muted = true;		//mute local video to avoid echo by myself.
                    });
                    audioTag.addEventListener('play', function(){
                        audioTag.muted = true;		//mute local video to avoid echo by myself.
                    });
                    audioTag.style.width='1px';
                    audioTag.style.height='1px';
                    audioTag.autoplay=true;
                    // audioTag.controls=true;
                    _this.mode.viewBox.appendChild(audioTag);
                }else{
                    console.log(_this.mode.localVideoTag);
                    if(_this.mode.localVideoTag === 'undefined'){
                        console.log('localVideo is null');
                        return;
                    }
                    _this.mode.localVideoTag.srcObject = stream;
                    _this.mode.localVideoTag.addEventListener('canplay', function(){
                        _this.mode.localVideoTag.muted = true;		//mute local video to avoid echo by myself.
                    });
                    _this.mode.localVideoTag.addEventListener('play', function(){
                        _this.mode.localVideoTag.muted = true;		//mute local video to avoid echo by myself.
                    });
                    _this.mode.localVideoTag.autoplay = true;
                }
                successCallback(stream,'micStream');
            }, function(wraning){
                console.warn('获取麦克风失败:'+wraning.toString());
                if(wraning.name === 'PERMISSION_DENIED'){
                    // alert('用户已拒绝授权');
                    errorCallback('用户已拒绝授权:'+wraning.name || wraning);
                }else{
                    if(!_this.webAudio){
                        var myAudio = document.createElement('audio');
                        _this.webAudio = new (window.AudioContext || window.webkitAudioContext)();
                        _this.audioSourceNode = webAudio.createMediaElementSource(myAudio);
                        _this.webAudioOutput  = webAudio.createMediaStreamDestination();
                        _this.audioSourceNode.connect(webAudioOutput);
                    }
                    _this.localStream = webAudioOutput.stream;
                    successCallback(webAudioOutput.stream,'tagStream');
                }
            });
        }else{
            // console.error('浏览器不支持:'+error);
            errorCallback('浏览器不支持:'+error.toString());
        }
    };
    /**
     * @api {window.XRTC.createPc} createPc createPc
     * @apiName createPc
     * @apiVersion 0.1.0
     * @apiDescription 创建peerConnection对象
     * @apiGroup XRTC
     * @apiParam {String} role 角色，只有offer（call一方）与answer（answer一方）
     * @apiParam {String} toUser 指定用户
     * @apiParam {Function} successCallback 成功的回调函数
     * @apiParam {Function} errorCallback 失败的回调函数
     * @apiParamExample {String} 用法示例：
     *      window.XRTC.createPc('offer','123',function(xpc,candidate){
     *              console.log(response);
     *              if(xpc){
     *                  console.log(xpc); //handle the xpc
     *              }
     *              if(candidate){
     *                  console.log(candidate);//handle the candidate
     *              }
     *          },function(response){
     *              console.log(response);
     *          })
     * @apiSuccess {json} xpc 创建peerConnection成功后返回的xpc对象及一系列属性
     * @apiSuccess {String} condidate onicecandidate函数响应产生的candidate
     * @apiError {json} reason 失败的原因 {status：'failed',reason:reason}
     * */
    XRTC.prototype.createPc = function (role,toUser,successCallback,errorCallback) {
        console.log('createPc');
        var newConnection,
            _this = this,
            result = null;
        var webAudio,mixedOutput,micSourceNode;
        this.getStream(function (stream,streamType) {
            if(streamType === 'micStream'){
                console.log('microphone Stream');
            }else{
                console.log('audio tag Stream');
            }
            if (_this.hasRTCPeerConnection()) {
                newConnection = new RTCPeerConnection(_this.rtcPeerConfig);
                try{
                    webAudio = new (window.AudioContext || window.webkitAudioContext)();// Failed to construct 'AudioContext': The number of hardware contexts provided (6) is greater than or equal to the maximum bound (6)
                }catch (e){
                    console.error(e);
                    result = {status:'failed',reason:e.toString()};
                    errorCallback(result);
                    return;
                }
                if(!webAudio){
                    console.log('创建webAudio失败：'+toUser.name);
                    result = {status:'failed',reason:'create webAudio failed'};
                    errorCallback(result);
                    return;
                }
                if(_this.mode.id === 1){
                    micSourceNode = webAudio.createMediaStreamSource(stream);
                    mixedOutput  = webAudio.createMediaStreamDestination();
                    micSourceNode.connect(mixedOutput);
                    newConnection.addStream(mixedOutput.stream);
                }else{
                    newConnection.addStream(stream);
                }
                newConnection.onaddstream =  function (e) {
                    if(_this.mode.id === 1){
                        var audioTag = document.createElement('audio');
                        audioTag.srcObject = e.stream;
                        console.log(e.stream);
                        _this.mode.viewBox.appendChild(audioTag);
                        _this.mixerAudio(e.stream,newConnection,true);
                    }else if(_this.mode.id === 2){
                        console.log(e.stream.getAudioTracks());
                        console.log(e.stream.getVideoTracks());
                        _this.mode.remoteVideoTag.srcObject = e.stream;
                        _this.mode.remoteVideoTag.autoplay = true;
                        _this.mode.remoteVideoTag.controls=true;
                    }else if(_this.mode.id === 3){
                        _this.mode.localVideoTag.srcObject = e.stream;
                        _this.mode.localVideoTag.autoplay = true;
                        _this.mode.localVideoTag.controls = true;
                    }else{
                        console.log('mode is error');
                    }
                };
                newConnection.onicecandidate = function (e) {
                    if (e.candidate) {
                        //给userInfo发送e.candidate
                        successCallback(null,e.candidate);
                    }else{
                        successCallback(null,'over');
                    }
                };
                newConnection.oniceconnectionstatechange = function (e) {
                    console.log('connectionState:'+newConnection.iceConnectionState);
                    // console.log(_this.sessionList);
                    var objSession;
                    _this.sessionList.map(function (session) {
                        if(session.pc === newConnection){
                            objSession = session;
                        }
                    });
                    switch(newConnection.iceConnectionState) {
                        case 'connected':
                            if(objSession){
                                objSession.pcStatus = 'connected';
                                objSession.pcStatusTime = new Date().getTime();
                                console.log('%c connected success','color:green');
                            }
                            break;
                        case 'disconnected':
                            objSession && (objSession.ondisconnected('disconnected'));
                            break;
                        case 'failed':
                            objSession && (objSession.ondisconnected('failed'));
                            break;
                        case 'closed':
                            objSession && (objSession.ondisconnected('closed'));
                            break;
                        default:
                            break;
                    }
                };
                newConnection.onicegatheringstatechange = function (e) {
                    console.log('gatheringState:'+newConnection.iceGatheringState);
                };
                newConnection.onsignalingstatechange = function (e) {
                    console.log('signalingState:'+newConnection.signalingState);
                };
                result =  {
                    status:'ok',
                    toUser:toUser,
                    streamType:streamType === 'micStream'?'microphone Stream':'audio tag Stream',
                    localStream:stream,
                    pc:newConnection,
                    role:role,
                    wa:webAudio,
                    micSourceNode:micSourceNode,
                    pcStatus:'connecting',
                    pcStatusTime:new Date().getTime(),
                    mixedOutput:mixedOutput,
                    inputStream:null,
                    ondisconnected:function (type) {
                        console.log('enter ondisconnected,type:'+type);
                        if(type === 'failed' || type === 'closed'){
                            this.pc.close();
                            this.wa.close();
                            this.mixedOutput = null;
                            this.inputStream = null;
                            this.localStream = null;
                        }else{
                            var oldPcStatustime = this.pcStatusTime;
                            this.pcStatusTime = new Date().getTime();
                            if(this.pcStatusTime - oldPcStatustime < 5000 && this.pcStatus === 'connected'){
                                this.pcStatus = type;
                                console.log('进入iceRestart');
                            }else{
                                this.pc.close();
                                this.wa.close();
                                this.mixedOutput = null;
                                this.inputStream = null;
                                this.localStream = null;
                            }
                        }
                    },
                    onclosemicrophone:function () {
                        console.log('onclosemicrophone');
                        try{
                            this.micSourceNode.disconnect(this.mixedOutput);
                        }catch (e){
                            console.log(e);
                        }
                    },
                    onopenmicrophone:function () {
                        console.log('onopenmicrophone');
                        try{
                            this.micSourceNode.connect(this.mixedOutput);
                        }catch (e){
                            console.log(e);
                        }
                    }
                };
                successCallback(result,null);
            }else{
                console.error('no support');
                result = {status:'failed',reason:'no support webRtc'};
                errorCallback(result);
            }

        },function (error) {
            console.error(error.toString());
            errorCallback(result);
            result = {status:'failed',reason:error.toString()};
        });
    };
    /**
     * @api {window.XRTC.call} call call
     * @apiName call
     * @apiVersion 0.1.0
     * @apiDescription 呼叫指定用户
     * @apiGroup XRTC
     * @apiParam {String} toUser 指定的用户
     * @apiParam {Function} successCallback 成功的回调函数
     * @apiParam {Function} errorCallback 失败的回调函数
     * @apiParamExample {String} 用法示例：
     *      window.XRTC.call(toUser,function(response){
     *              console.log(response);
     *              if(response.type === 'offer'){
     *                  //send offer to remote(server)
     *              }else if(response.type === 'candidate'){
     *                  //send candidate to remote(server)
     *              }else{
     *                  if(response.type === 'over'){
     *                      //candidate is over
     *                  }
     *              }
     *          },function(response){
     *              console.log(response);
     *          })
     * @apiSuccess {json} response  格式：{type:'offer',value:offer},
     * type有3中类型：1，'offer'表示创建成功的offer（sdp），2.'candidate'表示产生的candidate，3，'over'表示candidate产生完毕
     * @apiError {String} reason 失败的原因
     * */
    XRTC.prototype.call = function(toUser,successCallback,errorCallback) {
        console.log('call');
        var _this = this;
        // if(this.mode.id === 1){
        this.createPc('offer',toUser,function (xpc,candidate) {
            if(xpc){
                if(xpc.status !== 'ok'){
                    errorCallback(xpc.reason);
                    return;
                }
                var session = {
                    toUser:toUser,
                    role:xpc.role,
                    localStream:xpc.localStream,
                    streamType:xpc.streamType,
                    pc:xpc.pc,
                    wa:xpc.wa,
                    micSourceNode:xpc.micSourceNode,
                    mixedOutput:xpc.mixedOutput,
                    pcStatus:xpc.pcStatus,
                    pcStatusTime:xpc.pcStatusTime,
                    inputStream:xpc.inputStream,
                    ondisconnected:xpc.ondisconnected,
                    onclosemicrophone:xpc.onclosemicrophone,
                    onopenmicrophone:xpc.onopenmicrophone
                };
                _this.sessionList = _this.sessionList.filter(function (item) {
                    if(item.toUser == toUser){
                        _this.removeInstance(item);
                    }
                    return item.toUser !== toUser;
                });
                _this.sessionList.push(session);
                session.pc.createOffer(_this.mode.offerOptions)
                    .then(
                        onCreateOfferSuccess,
                        onCreateError
                    );
                function onCreateOfferSuccess(offer) {
                    //发送offer给对方toUser
                    session.pc.setLocalDescription(offer);
                    successCallback({type:'offer',value:offer});
                }
                function onCreateError(error) {
                    console.error('create error,'+error.toString());
                    errorCallback(error.toString)
                }
            }else{
                if(candidate){
                    successCallback({type:candidate === 'over'?'over':'candidate',value:candidate});
                }
            }
        },function (error) {
            errorCallback(error.toString)
        });
        // }
    };
    /**
     * @api {window.XRTC.answer} answer answer
     * @apiName answer
     * @apiVersion 0.1.0
     * @apiDescription 回应对方的连接
     * @apiGroup XRTC
     * @apiParam {String} toUser 指定用户
     * @apiParam {String} offersdp 收到的对方的sdp
     * @apiParam {Function} successCallback  成功的回调函数
     * @apiParam {Function} errorCallback  失败的回调函数
     * @apiParamExample {String} 用法示例：
     *      window.XRTC.answer(toUser,offersdp,function(response){
     *              console.log(response);
     *              if(response.type === 'offer'){
     *                  //send offer to remote(server)
     *              }else if(response.type === 'candidate'){
     *                  //send candidate to remote(server)
     *              }else{
     *                  if(response.type === 'over'){
     *                      //candidate is over
     *                  }
     *              }
     *          },function(response){
     *              console.log(response);
     *              if(response.type === 'error'){
     *                  console.log(response.reason);
     *              }
     *          })
     * @apiSuccess {json} response 格式：{type:'answer',value:answer},
     * type有3中类型：1，‘answer’表示创建成功的offer（sdp），2.‘candidate’表示产生的candidate，3，‘over’表示candidate产生完毕
     * @apiError {String} reason 失败的原因
     * */
    XRTC.prototype.answer = function(toUser,offersdp,successCallback,errorCallback) {
        var _this = this;
        if(!offersdp){
            errorCallback({type:'error',value:'offer sdp is null'});
            return;
        }
        this.createPc('answer',toUser,function (xpc,candidate) {
            if(xpc){
                if(xpc.status !== 'ok'){
                    errorCallback({type:'error',value:xpc.reason});
                    return;
                }
                var session = {
                    toUser:toUser,
                    role:xpc.role,
                    localStream:xpc.localStream,
                    streamType:xpc.streamType,
                    pc:xpc.pc,
                    wa:xpc.wa,
                    micSourceNode:xpc.micSourceNode,
                    mixedOutput:xpc.mixedOutput,
                    pcStatus:xpc.pcStatus,
                    pcStatusTime:xpc.pcStatusTime,
                    inputStream:xpc.inputStream,
                    ondisconnected:xpc.ondisconnected,
                    onclosemicrophone:xpc.onclosemicrophone,
                    onopenmicrophone:xpc.onopenmicrophone
                };
                _this.sessionList = _this.sessionList.filter(function (item) {
                    if(item.toUser == toUser){
                        _this.removeInstance(item);
                    }
                    return item.toUser !== toUser;
                });
                _this.sessionList.push(session);
                console.log(offersdp);
                session.pc.setRemoteDescription(new RTCSessionDescription(offersdp));
                console.log(session.pc);
                session.pc.createAnswer(_this.mode.offerOptions)
                    .then(
                        onCreateAnswerSuccess,
                        onCreateError
                    );
                function onCreateAnswerSuccess(answer) {
                    //发送answer给对方toUser
                    session.pc.setLocalDescription(answer);
                    successCallback({type:'answer',value:answer});
                }
                function onCreateError(error) {
                    errorCallback({type:'error',value:error.toString()});
                    console.error('create error,'+error.toString());
                }
            }else{
                if(candidate){
                    successCallback({type:candidate === 'over'?'over':'candidate',value:candidate});
                }
            }
        },function (error) {
            errorCallback({type:'error',value:error.toString()})
        });
    };
    /**
     * @api {window.XRTC.onCandidates} onCandidates onCandidates
     * @apiName onCandidates
     * @apiVersion 0.1.0
     * @apiDescription 收到对方的candidate时调用
     * @apiGroup XRTC
     * @apiParam {String} toUser 指定用户
     * @apiParam {json} candidate 指定用户的candidate
     * @apiParamExample {String} 用法示例：
     *      XRTC.onCandidates('123',candidate)
     * */
    XRTC.prototype.onCandidates = function (toUser,candidate) {
        // console.log(toUser,candidate);
        this.sessionList.map(function (session) {
            if(session.toUser === toUser){
                // console.log(session);
                if(session.pc){
                    session.pc.addIceCandidate(new RTCIceCandidate(candidate));
                    // if(!session.pc.remoteDescription.type){
                    //     session.remoteCandidates = (session.remoteCandidates?session.remoteCandidates:[]);
                    //     session.remoteCandidates.push(candidate);
                    // }else{
                    //     session.pc.addIceCandidate(new RTCIceCandidate(candidate));
                    // }
                }else{
                    console.error('error');
                }
            }
        })
    };

    /**
     * @api {window.XRTC.onAnswer} onAnswer onAnswer
     * @apiName onAnswer
     * @apiVersion 0.1.0
     * @apiDescription 收到对方的answer sdp时调用
     * @apiGroup XRTC
     * @apiParam {String} toUser  指定用户
     * @apiParam {String} answer 指定用户的answer
     * @apiParamExample {String} 用法示例：
     *      XRTC.onAnswer('123',answerSdp)
     * */
    XRTC.prototype.onAnswer = function (toUser,answer) {
        this.sessionList.map(function (session) {
            if(session.toUser === toUser){
                if(session.pc){
                    session.pc.setRemoteDescription(new RTCSessionDescription(answer));
                }else{
                    console.error('error');
                }
            }
        })
    };
    /**
     * @api {window.XRTC.mixerAudio} mixerAudio mixerAudio
     * @apiName mixerAudio
     * @apiVersion 0.1.0
     * @apiGroup XRTC
     * @apiDescription 混音函数，A连B，C也连B，B属于混音节点，此函数的功能是让A与B也互通
     * @apiParam {MediaStream} stream 远程的音频流
     * @param {PeerConnection} pc peerConnection对象
     * @param {Boolean} isOnAddStream true 表示是onAddStream调用，false则相反
     * @apiParamExample {String} 用法示例：
     *      window.XRTC.mixerAudio(stream,pc,type)
     */
    XRTC.prototype.mixerAudio = function(stream,pc,isOnAddStream) {
        var _this = this;
        this.sessionList.map(function (item) {
            if(item.pc != pc){
                if(item.wa){
                    var awTmpStream = item.wa.createMediaStreamSource(stream);
                    awTmpStream.connect(item.mixedOutput);
                }else{
                    // keyerror('item.wa不存在,toUser:'+item.toUser.name);
                }
            }else{
                if(isOnAddStream){//type是false表示不是接受到addstream时的调用
                    item.inputStream = stream;
                }
                _this.sessionList.map(function (item1) {
                    if(item1 != item){
                        if(item1.inputStream){
                            if(item.wa){
                                var awTmpStream = item.wa.createMediaStreamSource(item1.inputStream);
                                awTmpStream.connect(item.mixedOutput);
                            }else{
                                // keyerror('item.wa不存在,toUser:'+item1.toUser.name);
                            }
                        }else{
                            // keyerror('inputStream is not exist! and pcStatus:'+item1.pcStatus+',toUser:'+item1.toUser.name);
                            //如果pcOutStream不存在，过1s再尝试混音
                            _this.mixerAudioByAppointUser(stream,pc,isOnAddStream,item1.toUser);
                        }
                    }
                })
            }
        });
    };

    /**
     * 混合指定用户的stream
     * */
    XRTC.prototype.mixerCount = 0;
    XRTC.prototype.mixerAudioByAppointUser = function (stream,pc,isOnAddStream,toUser) {
        var _this = this;
        setTimeout(function () {
            _this.sessionList.map(function (item) {
                if(item.pc == pc){
                    if(isOnAddStream){//type是false表示不是接受到addstream时的调用
                        item.inputStream = stream;
                    }
                    _this.sessionList.map(function (item1) {
                        // console.log(item1);
                        if(item1 != item && toUser === item1.toUser){
                            // console.log(item1);
                            if(item1.inputStream){
                                if(item.wa){
                                    var awTmpStream = item.wa.createMediaStreamSource(item1.inputStream);
                                    awTmpStream.connect(item.mixer);
                                    _this.mixerCount = 0;
                                }else{
                                    console.log('item.wa不存在,toUser:'+item.toUser);
                                }
                            }else{
                                console.log('mixerAudioByAppointUser--inputStream is not exist! and pcStatus:'+item1.pcStatus+',toUser:'+item1.toUser);
                                //如果pcOutStream不存在，过1s再尝试混音
                                if(_this.mixerCount < 10){
                                    _this.mixerAudioByAppointUser(stream,pc,isOnAddStream,item1.toUser);
                                    _this.mixerCount++;
                                }else{
                                    item1.ondisconnected();
                                    console.log('mixerAudioByAppointUser大于10次，断开与他的连接:'+item1.pcStatus+',toUser:'+item1.toUser);
                                }
                            }
                        }
                    })
                }
            });
        },1000);
    };

    /**
     * @api {window.XRTC.removeInstance} removeInstance removeInstance
     * @apiName removeInstance
     * @apiVersion 0.1.0
     * @apiGroup XRTC
     * @apiDescription 此函数用于清除会话示例，释放资源(webAudio peerConnection)
     * @apiParam {json} session 会话实例
     */
    XRTC.prototype.removeInstance = function (session){
        if(session.pc){
            session.pc.close();
            session.pc = null;
        }
        if(session.wa){
            session.wa.close();
            session.wa = null;
        }
        if(session.mixedOutput){
            session.mixedOutput = null;
        }
        if(session.inputStream) {
            session.inputStream = null;
        }
        //这里是否需要清除audio和video标签
    };

    /**
     * 判断是否支持getUserMedia，即是否支持获取摄像头，麦克风
     * @returns {boolean} 返回值为true表示支持，false表示不支持
     */
    XRTC.prototype.hasUserMedia = function () {
        navigator.getUserMedia = navigator.getUserMedia ||
            navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
            navigator.msGetUserMedia;
        return !!navigator.getUserMedia;
    };

    /**
     * 判断是否支持RTCPeerConnection
     * @returns {boolean} 返回值为true表示支持，false表示不支持
     */
    XRTC.prototype.hasRTCPeerConnection = function () {
        window.RTCPeerConnection = window.RTCPeerConnection ||
            window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
        window.RTCSessionDescription = window.RTCSessionDescription ||
            window.webkitRTCSessionDescription ||
            window.mozRTCSessionDescription;
        window.RTCIceCandidate = window.RTCIceCandidate ||
            window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
        return !!window.RTCPeerConnection;
    };
    /** define namespace XRTC*/
    window.XRTC = new XRTC();
})(window, undefined);
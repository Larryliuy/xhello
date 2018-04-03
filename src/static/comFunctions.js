/**
 * 整体说明，可变变量使用let定义，需要se6及以上才可以直接使用
 */

import { generalApi, getImgApi } from "./apiInfo";
import store, {CONSTANT} from "../reducer/reducer";
import { message } from 'antd';
import {send, updateAllRoomListUserInfoByRoomId} from "./webSocket";
import {setRoomInfo} from "../webrtc/webRtcVideo";
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
});
/**
 * 用于生产随机字符串的数组
 * @param randomFlag 是否随机
 * @param min 生成随机字符串的最小位数
 * @param max 生成随机字符串的最大位数
 * @returns {string} 返回生成的随机数
 */
function randomWord(randomFlag, min, max){
    let str = "",
        range = min,
        pos,
        arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    // 随机产生
    if(randomFlag){
        range = Math.round(Math.random() * (max-min)) + min;
    }
    for(let i=0; i<range; i++){
        pos = Math.round(Math.random() * (arr.length-1));
        str += arr[pos];
    }
    return str;
}

/**
 * 用于截取uri参数
 * @param str URL 问号‘?’后面的字符串
 * @param name key=value的key值
 * @returns {*}
 * @constructor
 */
function GetQueryString(str,name) {
    // console.log(str,name);
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    let r = str.match(reg);
    // console.log(r);
    if (r != null) return decodeURI(r[2]);
    return null;
}

/**
 * 用于调整麦序的函数，不属于通用型函数
 * @param onMicusers 数组列表
 * @param orderInfo 需要调整的用户信息，type === 'up'表示向上移动，type === 'down'表示向下移动
 * @returns {*} 返回值是调整之后的新数组
 */

function ajustUserOrder(onMicusers,orderInfo) {
    let userTpm,onMicusersTpm = onMicusers;
    console.log(onMicusersTpm);
    console.log(onMicusersTpm[0]);
    if(orderInfo.type === 'up'){
        for(let i = 0,len = onMicusers.length; i < len; i++){
            if(onMicusersTpm[i].id == orderInfo.userId){
                console.log('index:'+i);
                userTpm = onMicusersTpm[i];
                onMicusersTpm[i] = onMicusersTpm[i-1];
                onMicusersTpm[i-1] = userTpm;
                break;
            }
        }
    }else if(orderInfo.type === 'down'){
        for(let i = 0,len = onMicusers.length; i < len; i++){
            if(onMicusersTpm[i].id == orderInfo.userId){
                console.log('index:'+i);
                userTpm = onMicusersTpm[i];
                onMicusersTpm[i] = onMicusersTpm[i+1];
                onMicusersTpm[i+1] = userTpm;
                break;
            }
        }
    }else{
        console.error('orderInfo.type错误:'+orderInfo.type);
    }
    return onMicusersTpm;
}

/**
 * 用于调整房间顺序的函数，不属于通用型函数
 * @param onMicusers 数组列表
 * @param orderInfo 需要调整的用户信息，type === 'up'表示向上移动，type === 'down'表示向下移动
 * @returns {*} 返回值是调整之后的新数组
 */

function ajustRoomOrder(roomList,orderInfo) {
    let roomTpm,newRoomList = roomList;
    console.log(newRoomList);
    console.log(newRoomList[0]);
    if(orderInfo.type === 'up'){
        for(let i = 0,len = roomList.length; i < len; i++){
            if(newRoomList[i].roomId == orderInfo.roomId){
                console.log('index:'+i);
                roomTpm = newRoomList[i];
                roomTpm.order = Number(roomTpm.order)-1;//更改order值
                newRoomList[i] = newRoomList[i-1];
                newRoomList[i].order = Number(newRoomList[i].order)+1;//更改order值
                newRoomList[i-1] = roomTpm;
                break;
            }
        }
    }else if(orderInfo.type === 'down'){
        for(let i = 0,len = roomList.length; i < len; i++){
            if(newRoomList[i].roomId == orderInfo.roomId){
                console.log('index:'+i);
                roomTpm = newRoomList[i];
                roomTpm.order = Number(roomTpm.order)+1;//更改order值
                newRoomList[i] = newRoomList[i+1];
                newRoomList[i].order = Number(newRoomList[i].order)-1;//更改order值
                newRoomList[i+1] = roomTpm;
                break;
            }
        }
    }else{
        console.error('orderInfo.type错误:'+orderInfo.type);
    }
    return newRoomList;
}

/**
 * 更新麦序位置的头像
 * */

function updataFirstUserAvatar(userInfo) {
    //更换第一个用户的头像
    if(userInfo && userInfo.fileId){
        //根据请求获取用户头像
        fetch(getImgApi+userInfo.fileId+".dat")
            .then(res=>{/*console.log(res)*/return res.text()})
            .then(data=>{
                store.dispatch({type:CONSTANT.FIRSTUSERAVATAR,val:data});
            })
            .catch(e=>console.error(e))
    }else{
        store.dispatch({type:CONSTANT.FIRSTUSERAVATAR,val:'./images/avatar.png'});
    }
}
/**
 *用于QQ登录获取openId的回调函数
 */
function callback(user)
{
    console.log(user);
}

/**
 * 根据性别sex与级别level获取图标名称
 * */
function getUserIconSrc(sex,level) {
    let src = '';
    switch(level){
        case 1:
        /*if(sex === 1){
            src = 'p_man.png';
        }else{
            src = 'p_female.png';
        }
        break;*/
        case 2:
            if(sex === 1){
                src = 'p_man.png';
            }else{
                src = 'p_female.png';
            }
            break;
        case 3:
            if(sex === 1){
                src = 'admin_man1.png';
            }else{
                src = 'admin_female1.png';
            }
            break;
        case 4:
            if(sex === 1){
                src = 'admin_man2.png';
            }else{
                src = 'admin_female2.png';
            }
            break;
        case 5:
            if(sex === 1){
                src = 'vip_man1.png';
            }else{
                src = 'vip_female1.png';
            }
            break;
        case 6:
            if(sex === 1){
                src = 'vip_man2.png';
            }else{
                src = 'vip_female2.png';
            }
            break;
        case 7:
            if(sex === 1){
                src = 'c_man.png';
            }else{
                src = 'c_female.png';
            }
            break;
    }
    // console.log(src);
    return "./images/icons/"+src;
}

/**
 * 创建房间
 * */

function createRoom(roomInfo) {
    let createMsg = roomInfo;
    createMsg.type = 'create_room';
    // createMsg.roomId = data.data;
    //这里请求创建房间
    console.log(createMsg.roomId);
    send(JSON.stringify(createMsg),function () {
        //创建完成后获取最新的房间列表
        let getRoomsMsg = {
            type:'get_rooms',
            user:state.homeState.userInfo,
            data:''
        };
        send(JSON.stringify(getRoomsMsg),function () {
            setTimeout(function () {
                updateAllRoomListUserInfoByRoomId(state.homeState.userInfo,state.homeState.currentRoomInfo.roomId);
            },500);
        });
    });
}

/**
 * 根据房间ID更新房间信息
 * */
function updateRoomInfoById(roomId,roomName,roomColor,roomPassword) {
    console.log('updateAllRoomListRoomInfoByRoomId');
    let allRoomListTmp = state.homeState.allRoomList;
    // console.log(dataJson);
    let objRoomInfo = null;
    allRoomListTmp.map(function (item) {
        if(item.childNode.length !== 0){
            item.childNode.map(function (item) {
                if(item.roomId == roomId){
                    item.roomName = roomName;
                    item.color = roomColor;
                    item.password = roomPassword;
                    objRoomInfo = item;
                }
            });
        }
    });
    let setRoomMsg = {
        type:'set_room_info',
        roomId:roomId,
        user:state.homeState.userInfo,
        data:objRoomInfo
    };
    console.log(objRoomInfo);
    send(JSON.stringify(setRoomMsg),function () {
        console.log('发送set roomInfo消息服务器:');
    });
    // console.log(allRoomListTmp);
    store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
}


/**
 * http 根据roomId删除房间
 * */
function deleteRoomById(roomId) {
    let args = '?action=del&table=room&cond=id='+roomId;
    fetch(generalApi+args)
        .then(res=>res.json())
        .then(data=>{
            console.log(data);
            if(data.status === 'ok'){
                message.success('删除成功');
            }else{
                message.error('删除失败：'+data.msg);
            }
        })
        .catch(e=>console.error(e));
}

/**
 * 定时更新allRoomList
 * */
let timer = null;
function updateAllRoomListTimer() {
    let getRoomsMsg = {
        type:'get_rooms',
        user:state.homeState.userInfo,
        data:''
    };
    timer = setInterval(function () {
        console.log('timer update');
        send(JSON.stringify(getRoomsMsg),function () {
            // console.log('get_rooms');
        });
    },30000);
}

/**
 * 清除updateAllRoomListTimer的的timer
 * */

function removeTimer() {
    clearInterval(timer);
}

/**
 * 根据房间id列表获取个房间的用户列表
 * */
function getUserListforAllRoomList(roomList) {
    let allRoomList = roomList,
        userInfo = state.homeState.userInfo,roomInfo = state.homeState.currentRoomInfo;
    let getUsersMsg = {
        type:'get_room_users',
        user:userInfo,
    };
    allRoomList.map(function (item) {
        if (item.childNode && item.childNode.length !== 0){
            item.childNode.map(function (citem) {
                // if(citem.roomId !== roomInfo.roomId){
                getUsersMsg.roomId = citem.roomId;
                send(JSON.stringify(getUsersMsg),function(){});
                // }
            })
        }
    })
}

/**
 * 房间列表获取所有房间的用户总数
 * */
function getRoomUsersCount(rooms){
    // console.log(rooms);
    let count = 0;
    if(rooms && rooms.length !== 0){
        rooms.map(function (item) {
            if(item.childNode.length !== 0){
                count += item.childNode.length;
            }
        })
    }
    return count;
}

function getSingleRoomUserCounts(room) {
    let count = 0;
    if(room.childNode && room.childNode.length !== 0){
        count = room.childNode.length;
    }else{
        count = 0;
    }
    return count;
}

/**
 * 根据用户ID找到他所在的房间（位置）
 * */

function getLocationBtUserId(userId) {
    let result = {r:'',cr:'',u:''};
    let allRoomList = state.homeState.allRoomList;
    allRoomList.map(function (item) {
        if(item.childNode && item.childNode.length !== 0){
            item.childNode.map(function (citem) {
                if(citem.childNode && citem.childNode.length !== 0){
                    citem.childNode.map(function (uitem) {
                        if(uitem.id === userId){
                            result.u = uitem.id;
                            result.cr = citem.roomId;
                            result.r = item.roomId;
                            let roomStatueTmp = state.homeState.roomStatus;
                            roomStatueTmp['rc'+citem.roomId] = true;
                            roomStatueTmp['r'+item.roomId] = true;
                            store.dispatch({type:CONSTANT.ROOMSTATUS,val:roomStatueTmp});
                        }
                    })
                }
            })
        }
    });
    return result;
}

/**
 * 用于发送欢呼鼓掌音频
 * */
function sendCheerAudio(type) {
    let msg = {
        type:'msg',
        typeString:'playAudio',
        roomId:state.homeState.currentRoomInfo.roomId,
        user:state.homeState.userInfo
    };
    if(type === 'cheer'){
        msg.audiotype = 'cheer'
    }else if(type === 'applause'){
        msg.audiotype = 'applause'
    }
    send(JSON.stringify(msg),function () {
        console.log('send play music msg');
    })

}

/**
 * 将新的allRoomList做比较
 * */
function getNewAllRoomList(newRoomList) {
    let oldAllRoomList = state.homeState.allRoomList,
        newAllRoomList = state.homeState.allRoomList;
    newRoomList.map(function (item) {
        if (inRoomList(item.roomId, oldAllRoomList)) {
            item.childNode && item.childNode.map(function (cItem) {
                if (!incRoomList(cItem.roomId, item.roomId, oldAllRoomList)) {
                    newAllRoomList.map(function (xitem) {
                        if (item.roomId === xitem.roomId) {
                            xitem.childNode.push(cItem);
                        }
                    })
                }
            })
        } else {
            newAllRoomList.push(item);
        }
    });
    store.dispatch({type: CONSTANT.ALLROOMLIST, val: newAllRoomList});
}

/**
 * 判断是否在父房间列表
 * */
function inRoomList(roomId,rooms) {
    let result = false;
    rooms.map(function (item) {
        if(item.roomId === roomId){
            result = true;
        }
    });
    return result;
}


/**
 * 判断是否在子房间列表
 * */
function incRoomList(cRoomId,roomId,rooms) {
    let result = false;
    rooms.map(function (item) {
        if(item.roomId === roomId){
            item.childNode && item.childNode.map(function (cItem) {
                if(cRoomId === cItem.roomId){
                    result = true;
                }
            })
        }
    });
    return result;
}


/**
 * 离开房间
 * */
function leaveRoom(roomId) {
   alert(roomId);
    let msg = {
        type:'leave_room',
        roomId:roomId,
        user:state.homeState.userInfo
    };
    send(JSON.stringify(msg),function () {
    });
}

/**
 * 延时进入房间
 * */
function enterRoomDelay(roomId) {
    let msg = {
        type:'enter_room',
        roomId:roomId,
        user:state.homeState.userInfo
    };
    setTimeout(function () {
        send(JSON.stringify(msg),function () {
        });
    },500);

}

/**
 * 通用常量CONFIG_CONSTANTS
 * */
const CONFIG_CONSTANTS = {
    MAXCHILDREN : 2
};

/**
 * 用户情况抓取，比如浏览器代理，是否只是webSocket，webRTC，webAudio等,用户测试
 * */

function getUserInfo() {
    let info = {};
    //getUserMedia
    info.name = state.homeState.userInfo.name;
    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
    info.getUserMedia =  !!navigator.getUserMedia;
    //RTCPeerConnection
    window.RTCPeerConnection = window.RTCPeerConnection ||
        window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    window.RTCSessionDescription = window.RTCSessionDescription ||
        window.webkitRTCSessionDescription ||
        window.mozRTCSessionDescription;
    window.RTCIceCandidate = window.RTCIceCandidate ||
        window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
    info.RTCPeerConnection =  !!window.RTCPeerConnection+','+!!window.RTCSessionDescription+','+!!window.RTCIceCandidate;
    //webAudio
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    info.webAudio =  !!window.AudioContext;
    //webSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    info.WebSocket = !!window.WebSocket;
    //user-agent
    info.appName = navigator.appName;
    info.appVersion = navigator.appVersion;
    info.appCodeName = navigator.appCodeName;
    info.userAgent = navigator.userAgent;
    console.log(info);
    //浏览器信息
    /*let browser = getBrowserInfo();
    console.log(browser);
    let getArgs = '?action=get&table=userTestInfo&cond=userName=%22'+info.name+'%22=userMedia=%22'+info.getUserMedia+'%22=rtc=%22'+info.RTCPeerConnection
    +'%22=webSocket=%22'+info.WebSocket+'%22=webAudio=%22'+info.webAudio+'%22=appName=%22'+browser.type+'%22=userAgent=%22'+info.userAgent+'%22=appCodeName=%22'+browser.ver+'%22';
    let addArgs = '?action=add&table=userTestInfo&userName='+info.name+'&userMedia='+info.getUserMedia+'&rtc='+info.RTCPeerConnection
        +'&webSocket='+info.WebSocket+'&webAudio='+info.webAudio+'&appName='+browser.type+'&userAgent='+info.userAgent+'&appCodeName='+browser.ver;
    fetch(generalApi+getArgs)
        .then(res=>res.json())
        .then(data=>{
            console.log(data);
            if(data.data && data.data.length === 0){
                fetch(generalApi+addArgs)
                    .then(res=>res.json())
                    .then(data=>{
                        if(data.status === 'ok'){
                            console.log('添加成功');
                        }
                    })
                    .catch(e=>console.error(e));
            }
        })
        .catch(e=>console.error(e));*/
}

function getBrowserInfo(){
    var Sys={};
    var ua=navigator.userAgent.toLowerCase();
    var s;
    (s=ua.match(/msie ([\d.]+)/))?Sys.ie=s[1]:
        (s=ua.match(/firefox\/([\d.]+)/))?Sys.firefox=s[1]:
            (s=ua.match(/chrome\/([\d.]+)/))?Sys.chrome=s[1]:
                (s=ua.match(/opera.([\d.]+)/))?Sys.opera=s[1]:
                    (s=ua.match(/version\/([\d.]+).*safari/))?Sys.safari=s[1]:0;
    if(Sys.ie){//Js判断为IE浏览器
        return {
            'type':'ie',
            'ver':Sys.ie
        };
    }
    if(Sys.firefox){//Js判断为火狐(firefox)浏览器
        return {
            'type':'firefox',
            'ver':Sys.firefox
        };
    }
    if(Sys.chrome){//Js判断为谷歌chrome浏览器
        return {
            'type':'chrome',
            'ver':Sys.chrome
        };
    }
    if(Sys.opera){//Js判断为opera浏览器
        return {
            'type':'opera',
            'ver':Sys.opera
        };
    }
    if(Sys.safari){//Js判断为苹果safari浏览器
        return {
            'type':'safari',
            'ver':Sys.safari
        };
    }
    return {
        'type':'unknow',
        'ver':-1
    };
}

/**
 * 将log信息存到后台
 * */
function sendToServer(info) {
    let addArgs = '?action=add&table=userTestInfo&userName='+info.name+'&userLog='+info.msg;
    fetch(generalApi+addArgs)
        .then(res=>res.json())
        .then(data=>{
            if(data.status === 'ok'){
                // console.log('添加成功');
            }
        })
        .catch(e=>console.error(e));
}

/**
 * 打印函数，本地打印并发送到服务器
 * @param message 表示打印的消息
 * @param file 代码所在文件名
 */
let logInfos={},erroInfos={},logCount = 0,errorCount = 0;
function log(msg,funName,file) {
    // console.log(msg);
    // console.log('%c'+msg+'==='+state.homeState.userInfo.name+'==='+funName+'==='+file,'color:blue');
    console.log('%c'+state.homeState.userInfo.name+'==='+msg,'color:blue');
    let logInfo = {};
    logInfo.userName = state.homeState.userInfo.name;
    logInfo.message = msg;
    logInfo.caller = funName;
    logInfo.fileName = file;
    logInfo.time = new Date().getTime();
    logInfos[logCount] = logInfo;
    logCount++;
}
/**
 * 打印关键信息函数
 * */
function keylog(msg) {
    let info = {};
    info.name = state.homeState.userInfo.name;
    info.msg = msg;
    console.log('%c'+info.name+'==='+msg,'color:#df402a');
    sendToServer(info);
}
function error(msg,funName,file) {
    // console.error(state.homeState.userInfo.name+'==='+msg+'===caller:'+funName+'===file:'+file);
    console.error('%c'+state.homeState.userInfo.name+'==='+msg,'color:red');
    //送到服务器后台
    let errorInfo = {};
    errorInfo.userName = state.homeState.userInfo.name;
    errorInfo.message = msg;
    errorInfo.caller = funName;
    errorInfo.fileName = file;
    erroInfos[logCount] = errorInfo;
    errorCount++;
}
/**
 * 打印关键错误
 * */
function keyerror(msg) {
    console.error('%c'+state.homeState.userInfo.name+'==='+msg,'color:red');

}
export {
    randomWord, GetQueryString, ajustUserOrder, ajustRoomOrder, callback,
    getUserIconSrc, updataFirstUserAvatar, createRoom, updateRoomInfoById,
    deleteRoomById, updateAllRoomListTimer, getUserListforAllRoomList, removeTimer,
    getRoomUsersCount,getLocationBtUserId, sendCheerAudio, getSingleRoomUserCounts,
    getNewAllRoomList, getUserInfo, leaveRoom, enterRoomDelay, CONFIG_CONSTANTS,log,
    error, keylog, keyerror
}
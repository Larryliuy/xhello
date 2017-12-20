import './pageClose.js';
let WS = null;
if (!window.WebSocket) {
    window.WebSocket = window.MozWebSocket;
}
if (window.WebSocket) {
    WS = new WebSocket('ws://192.168.6.3:5555');
} else {
    alert("Your browser does not support Web Socket.");
}

export function instanceWS(){
    return new WebSocket('ws://192.168.6.3:5555');
}

export default WS;

//

const send = function (message, callback) {
    waitForConnection(function () {
        WS.send(message);
        if (typeof callback !== 'undefined') {
            callback();
        }
    }, 1000);
};

const waitForConnection = function (callback, interval) {
    if (WS.readyState === 1) {
        callback();
    } else {
        // optional: implement backoff for interval here
        setTimeout(function () {
            waitForConnection(callback, interval);
        }, interval);
    }
};
export {send};


//消息对象返回函数
export function getSendData(type,roomId,roomTitle,uId,uName,uLevel,uSex,user,data){
    return {
        type:type,
        roomId: roomId,		//房间唯一标识符
        roomName: roomTitle,
        userName: uName,
        userId: uId,
        userLevel:uLevel,
        userSex:uSex,
        user:user,
        data:data
    }
}

//消息时间以socket事件时间为准
export function getDateString(){
    let year,month,day,hour,minute,second;
    let weekString ='';
    let date =new Date();
    year = date.getFullYear();
    month = date.getMonth()+1;
    day = date.getDate();
    hour = date.getHours();
    minute = date.getMinutes();
    second = date.getSeconds();
    let week = date.getDay();
    switch(week){
        case 0:
            weekString = '星期天';
            break;
        case 1:
            weekString = '星期一';
            break;
        case 2:
            weekString = '星期二';
            break;
        case 3:
            weekString = '星期三';
            break;
        case 4:
            weekString = '星期四';
            break;
        case 5:
            weekString = '星期五';
            break;
        case 6:
            weekString = '星期六';
            break;
    }
    return year+'-'+month+'-'+day+' '+ hour +':'+ minute + ':' + second;
}
/*

window.CHAT = {
    socket:null,
    //退出，本例只是一个简单的刷新
    logout:function(){
        //this.socket.disconnect();
        location.reload();
    },
    //提交聊天消息内容
    submit:function(obj){
        if(obj){
            this.socket.emit('message', obj);
        }
        return false;
    },
    updateSysMsg:function (o,type) {

    },
    init:function(userInfo){

        //连接websocket后端服务器
        this.socket = io.connect('ws://192.168.6.3:5555');

        //告诉服务器端有用户登录
        this.socket.emit('login', userInfo);

        //监听新用户登录
        this.socket.on('login', function(o){
            CHAT.updateSysMsg(o, 'login');
        });

        //监听用户退出
        this.socket.on('logout', function(o){
            //离开不用通知
            // CHAT.updateSysMsg(o, 'logout');
        });

        //监听消息发送
        this.socket.on('message', function(obj){

        });
    }
};*/

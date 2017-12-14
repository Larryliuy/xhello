import '../libs/socket.io';
console.log('in socket');
const ws = io.connect('ws:localhost:3000');

export default ws;


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
        this.socket = io.connect('ws://localhost:3000');

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
};
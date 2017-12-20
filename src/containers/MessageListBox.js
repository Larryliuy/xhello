import React,{ Component } from 'react'
import MessageList from '../components/MessageList'
import WS,{ getDateString } from "../static/wsInstace";


import store,{ CONSTANT } from '../reducer/reducer';
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});

let uId = '',
    uName = '',
    uLevel = '',
    uSex = '';

// let _this = null;
class MessageListBox extends React.Component{
    constructor(props) {
        super(props);
        this.state={data:[]};
    }
    scrollToBottom(){
        setTimeout(function(){
            let mb = document.getElementById('messageBox');
            if(!mb) return;
            mb.scrollTop = mb.scrollHeight || 0;
            /*this.refs.messageBox.scrollTop = this.refs.messageBox.clientHeight;
            // window.scrollTo(0,this.refs.messageBox.clientHeight);
            console.log('hello:'+this.refs.messageBox.clientHeight);*/
        },100);
    }
    componentDidMount(){
        uId = state.homeState.userInfo.id;
        uName = state.homeState.userInfo.userName;
        uLevel = state.homeState.userInfo.level;
        uSex = state.homeState.userInfo.sex;

        let data = [{username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12',data:'321'},
            {username:'larry',time:'2017-12-11 13:12',data:'dsfs'},
            {username:'larry',time:'2017-12-11 13:12',data:'sdfd'},
            {username:'larry',time:'2017-12-11 13:12',data:'ddd'},
            {username:'larry',time:'2017-12-11 13:12',data:'dddd'},
            {username:'larry',time:'2017-12-11 13:12',data:'dsds'},
            {username:'larry',time:'2017-12-11 13:12',data:'dsdf'},
            {username:'larry',time:'2017-12-11 13:12',data:'dd'},
            {username:'larry',time:'2017-12-11 13:12',data:'dsf'},
            {username:'larry',time:'2017-12-11 13:12',data:'dd'},
            {username:'larry',time:'2017-12-11 13:12',data:'dsd'},
            {username:'larry',time:'2017-12-11 13:12',data:'d'},
            {username:'larry',time:'2017-12-11 13:12',data:'s'},
            {username:'larry',time:'2017-12-11 13:12',data:'sfds'}];
        let _this = this;
        this.setState({data:data});
        this.scrollToBottom();

        WS.onmessage = function(response){
            if(!response) return ;
            let dataJson = JSON.parse(response.data);
            // if(dataJson.result !== 'ok') return ;
            // console.log(dataJson);
            let allRoomListTmp = [];
            switch(dataJson.type){
                case 'msg':
                    console.log(dataJson);
                    if(dataJson.data === '消息成功发出'){
                        // console.log(_this.props.sendData);
                        data.push({userName:dataJson.userName,
                            time:getDateString(),
                            data:_this.props.sendData});
                    }else{
                        data.push({userName:dataJson.userName,
                            time:getDateString(),
                            data:dataJson.data});
                        // console.log(data);
                        // console.log(dataJson.data);
                    }
                    break;
                case 'enter_room':
                    console.log(response);
                    if(response.data === '房间不存在'){
                        alert('房间不存在需要创建房间');
                        console.log('并进入房间');
                    }
                    //有人进入房间时需要更新AllRoomList
                    allRoomListTmp = state.homeState.allRoomList;
                    allRoomListTmp.map(function (item) {
                        if(item.id === dataJson.roomId){
                            item.childNode.push({userName:dataJson.userName,
                                id:dataJson.userId,
                                level:dataJson.userLevel,
                                sex:dataJson.userSex,
                                avatar:dataJson.avatar
                            })
                        }
                    });
                    store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
                    // console.log(dataJson);
                    data.push({userName:dataJson.userName,
                        time:getDateString(),
                        data:'<p>'+ dataJson.userName + '已进入房间' +'</p>'});
                    break;
                case 'leave_room':
                    // console.log(dataJson);
                    //有人离开房间时需要更新AllRoomList
                    allRoomListTmp = state.homeState.allRoomList;
                    // console.log(allRoomListTmp);
                    allRoomListTmp.map(function (item) {
                        if(item.id === dataJson.roomId){
                            item.childNode = item.childNode.filter(function(item){
                                // console.log(item.id !== dataJson.userId);
                                return item.id !== dataJson.userId;
                            })
                        }
                    });
                    store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
                    // console.log(allRoomListTmp);
                    data.push({userName:dataJson.userName,
                        time:getDateString(),
                        data:'<p>'+ dataJson.userName + '已离开房间' +'</p>'});
                    break;
                case 'get_room_users':
                    // console.log(dataJson.data);
                    //有人离开房间时需要更新AllRoomList
                    allRoomListTmp = state.homeState.allRoomList;
                    // console.log(allRoomListTmp);
                    allRoomListTmp.map(function (item) {
                        if(item.id === dataJson.roomId){
                            // console.log(dataJson.data.length);
                            for(let i in dataJson.data){
                                // console.log(dataJson.data[i]);
                                //需要排除空数据，如果用户数据存在才加入列表
                                if(dataJson.data[i] && dataJson.data[i].id  !== uId){
                                    item.childNode.push(dataJson.data[i]);
                                }
                            }
                        }
                    });
                    store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
                    // console.log(allRoomListTmp);
                    break;
                case 'get_rooms':
                    console.log(dataJson);
                    break;
                default:
                    break;

            }

            _this.setState({data:data});
            _this.scrollToBottom();
        };
    }
    render(){
        return (<div className='message-box' id='messageBox'><MessageList data={this.state.data}/></div>)
    }
}


export default MessageListBox
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
        uName = state.homeState.userInfo.name;
        uLevel = state.homeState.userInfo.level;
        uSex = state.homeState.userInfo.sex;

        //data为消息数据
        let data = [{username:'larry',time:'2017-12-11 13:12',data:'sfds'}];
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
                    // console.log(dataJson);
                    if(dataJson.typeString === '放麦'){
                        let userData = state.homeState.roomMicrophoneUser;
                        // console.log(state.homeState.roomMicrophoneUser);
                        userData.push(dataJson.user);
                        store.dispatch({type:CONSTANT.ROOMMICROPHONEUSER,val:userData});
                        return;
                    }
                    if(dataJson.typeString === '离麦'){
                        let userData = state.homeState.roomMicrophoneUser;
                        // console.log(state.homeState.roomMicrophoneUser);
                        let tmp = userData.filter(function(item){
                            return item.id !== dataJson.user.id;
                        });
                        store.dispatch({type:CONSTANT.ROOMMICROPHONEUSER,val:tmp});
                        return;
                    }
                    if(dataJson.typeString === '禁麦'){
                        // console.log('禁麦');
                        return;
                    }
                    if(dataJson.typeString === 'withdraw'){
                        console.log(data);
                        console.log(dataJson);
                        data = data.filter(function (item) {
                            if(item.timeStamp && item.timeStamp.toString() === dataJson.timeStamp){
                                console.log(item.timeStamp.toString() === dataJson.timeStamp);
                                return;
                            }else{
                                return item;
                            }
                        });
                        // return;
                    }
                    // console.log(dataJson);
                    if (dataJson.typeString !== 'withdraw') {
                        if (dataJson.data === '消息成功发出') {
                            data.push({
                                userName: dataJson.user.name,
                                time: getDateString(),
                                data: _this.props.sendData,
                                timeStamp: dataJson.timeStamp
                            });
                        } else {
                        data.push({
                            userName: dataJson.user.name,
                            time: getDateString(),
                            data: dataJson.data,
                            timeStamp: dataJson.timeStamp
                        });
                        }
                    }
                    break;
                case 'enter_room':
                    // console.log(dataJson);
                    if(response.data === '房间不存在'){
                        alert('房间不存在需要创建房间');
                        console.log('并进入房间');
                    }
                    //有人进入房间时需要更新AllRoomList
                    allRoomListTmp = state.homeState.allRoomList;
                    allRoomListTmp.map(function (item) {
                        if(item.id === dataJson.roomId){
                            item.childNode.push({
                                name:dataJson.user.name,
                                id:dataJson.user.id,
                                level:dataJson.user.level,
                                sex:dataJson.user.sex,
                                avatar:dataJson.user.avatar
                            })
                        }
                    });
                    store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
                    // console.log(dataJson);
                    data.push({userName:dataJson.user.name,
                        time:getDateString(),
                        data:'<p>'+ dataJson.user.name + '已进入房间' +'</p>'});
                    break;
                case 'leave_room':
                    // console.log(dataJson);
                    //有人离开房间时需要更新AllRoomList
                    allRoomListTmp = state.homeState.allRoomList;
                    allRoomListTmp.map(function (item) {
                        if(item.id === dataJson.roomId){
                            item.childNode = item.childNode.filter(function(item){
                                return item.id !== dataJson.user.id;
                            })
                        }
                    });
                    store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
                    // console.log(allRoomListTmp);
                    data.push({userName:dataJson.user.name,
                        time:getDateString(),
                        data:'<p>'+ dataJson.user.name + '已离开房间' +'</p>'});
                    break;
                case 'get_room_users':
                    // console.log(dataJson.data);
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
                    // console.log(allRoomListTmp)
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
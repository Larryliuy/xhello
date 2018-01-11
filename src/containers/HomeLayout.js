import React,{Component} from 'react';
import { Layout, Icon ,message, Button } from 'antd';
const { Header, Content, Footer, Sider } = Layout;
import UEditorBox from './UEditorBox';
import MessageListBox from './MessageListBox';
import UserSearchBox from '../containers/UserSearchBox';
import store,{CONSTANT} from '../reducer/reducer';
import cookieUtil from '../libs/cookieUtil';
import ChannelListBox from './ChannelListBox';
import MicroPhoneBox from './MicroPhoneBox';
import AdvertisementBox from './AdvertisementBox';
import LivingBox from './LivingBox';
import HeaderTopBox from './HeaderTopBox';
import FooterBottomBox from './FooterBottomBox';
import RightClickPanelBox from './RightClickPanelBox';
import '../static/login.scss'

import WS, {getDateString, send} from "../static/wsInstace";

const layoutStyle = {
    width:'100%',
    height:'100%',
    color:'#222'
};
const sliderStyle = {
    width:'240px !important',
    maxWidth:'240px !important',
    backgroundColor:'#fff'
};

let state = store.getState();
store.subscribe(function () {
    state = store.getState()
});
let userId = 0,
    userName = '',
    sex=0,
    level=0;
if(decodeURI(window.location.href).indexOf('?{') !== -1){
    console.log(decodeURI(window.location.href));
    console.log(userId);
    userId = JSON.parse(decodeURI(window.location.href).substring(decodeURI(window.location.href).indexOf('?{')+1,decodeURI(window.location.href).length)).id
}else{
    location.replace('#/');
}
// console.log('href:'+userId);


class HomeLayout extends React.Component {
    constructor(props){
        super(props);
        this.state={sendData:'',sliderWidth:240};
    }
    componentWillMount(){
        console.log(state.homeState.userInfo);
        if(!state.homeState.userInfo.id){
            location.replace('#/');
        }
    }
    componentDidMount(){
        /*//QQ快捷登录
        let locationUrl = window.location.href,
            code,accessToken;
        /!*console.log(locationUrl);
        console.log(locationUrl);*!/
        if(locationUrl.indexOf('code=') !== -1){
            code = locationUrl.substring(locationUrl.indexOf('code=')+5);
            let getAccessTokenApi = 'grant_type=authorization_code&client_id=101454868&client_secret=4811cade40988ad7094119ef56f9a5bd&code=Authorization Code&redirect_uri=http%3a%2f%2fa701.xtell.cn%3a82%2fsoftwares%2fxtell_projects_dev%2f24_YUN_VIDEO%2fsrc%2fweb%2findex.html%23%2f'
            let args = 'grant_type=authorization_code&client_id=101454868&client_secret=4811cade40988ad7094119ef56f9a5bd&code='+code+'&redirect_uri=http%3a%2f%2fa701.xtell.cn%3a82%2fsoftwares%2fxtell_projects_dev%2f24_YUN_VIDEO%2fsrc%2fweb%2findex.html%23%2f'
            //获取access token值
            fetch(getAccessTokenApi,{
                method:'POST',
                headers:{
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body:args
            })
                .then((response) => {console.log(response);return response.text()})
                .then(data=>{
                    if(data.status === 'ok'){
                        accessToken = data.access_token;
                        args = 'access_token='+accessToken;
                        //根据accessToken获取openID
                        fetch('https://graph.qq.com/oauth2.0/me',{
                            method:'POST',
                            headers:{
                                'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            body:args
                        })
                            .then((response) => {console.log(response);return response.text()})
                            .then(data=>{
                                if(data.status === 'ok'){
                                    //这里获取client_id，openid，再根据获取到的参数请求获取用户信息
                                    let clientId = data.client_id,
                                        openId = data.openid,
                                        args = 'access_token='+accessToken+'&oauth_consumer_key='+clientId+'&openid='+openId;
                                    fetch('https://graph.qq.com/user/get_user_info',{
                                        method:'POST',
                                        headers:{
                                            'Content-Type': 'application/x-www-form-urlencoded'
                                        },
                                        body:args
                                    })
                                        .then((response) => {console.log(response);return response.text()})
                                        .then(data=>{
                                            //这里获取用户信息
                                            console.log(data);
                                            // _this.props.login(true,{name:data.nickname,level:7,id:clientId,sex:data.gender,limit:0,avatar:'http:/qzapp.qlogo.cn/qzapp/'+openId+'/'+clientId});
                                        })
                                        .catch(err=>{
                                            console.log(err);
                                        })

                                }else {
                                    message.error('用户名与密码不匹配');
                                    return;
                                }
                            })
                            .catch(err=>{
                                console.log(err);
                            });
                    }else {
                        message.error('用户名与密码不匹配');
                        return;
                    }
                })
                .catch(err=>{
                    console.log(err);
                });
        }*/
        //左右拖动
        let isChanging = false,
            _this = this,
            dragBar = document.getElementById('resizable');
        dragBar.onmousedown =  function(event){
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'ew-resize';
            isChanging = true;
            document.onmousemove = function(event){
                if(isChanging && event.clientX > 240 && event.clientX < winWidth/3){
                    _this.setState({sliderWidth:event.clientX});
                }
            };
            document.onmouseup = function(event){
                console.log('docup');
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'text';
                isChanging = false;
                document.onmousemove = null;
                document.onmouseup = null;
                // dragBar.onmousedown = null;
            };
        };
        dragBar.onmouseup = function(event){
            document.onmousemove = null;
        };
        //
        //data为消息数据
        let data = [{username:'larry',time:getDateString(),data:'欢迎欢迎'}];
        store.dispatch({type:CONSTANT.MESSAGEDATA,val:data});
        scrollToBottom();
        function scrollToBottom(){
            setTimeout(function(){
                let mb = document.getElementById('messageBox');
                if(!mb) return;
                mb.scrollTop = mb.scrollHeight || 0;
                /*this.refs.messageBox.scrollTop = this.refs.messageBox.clientHeight;
                // window.scrollTo(0,this.refs.messageBox.clientHeight);
                console.log('hello:'+this.refs.messageBox.clientHeight);*/
            },100);
        }
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
                    //移动到我所在房间
                    // console.log(dataJson);
                    if(dataJson.typeString === 'moveToRoom'){
                        let roomStatueTmp = state.homeState.roomStatus,rId;
                            allRoomListTmp = state.homeState.allRoomList;
                        allRoomListTmp.map(function (item) {
                            if(item.childNode){
                                item.childNode.map(function (cItem) {
                                    if(cItem.roomId == state.homeState.currentRoomInfo.roomId){
                                        rId = item.roomId;
                                        //打开目标房间的父房间
                                        roomStatueTmp['r'+rId] = true;
                                    }
                                })
                            }
                        });
                        //打开目标房间
                        roomStatueTmp['rc'+dataJson.objRoomInfo.roomId] = true;
                        store.dispatch({type:CONSTANT.ROOMSTATUS,val:roomStatueTmp});
                        if(dataJson.objRoomInfo.roomId != state.homeState.currentRoomInfo.roomId){
                            let Msg = {
                                type:'leave_room',
                                roomId:state.homeState.currentRoomInfo.roomId,
                                roomName:state.homeState.currentRoomInfo.roomName,
                                user:state.homeState.userInfo
                            };
                            send(JSON.stringify(Msg),function(){
                                Msg = {
                                    type:'enter_room',
                                    roomId:dataJson.objRoomInfo.roomId,
                                    roomName:dataJson.objRoomInfo.roomName,
                                    user:state.homeState.userInfo
                                };
                                send(JSON.stringify(Msg),function(){
                                });
                            });
                        }
                        return;
                    }
                    //调整用户限制
                    if(dataJson.typeString === 'uLimit'){
                        console.log(dataJson);
                        console.log(state.homeState.userInfo);

                        //***********************
                        if(dataJson.objUserId == state.homeState.userInfo.id){
                            //设置state.homeState.userInfo
                            let userInfoTmp = state.homeState.userInfo;
                            userInfoTmp.limit = dataJson.limit;
                            store.dispatch({type:CONSTANT.USERINFO,val:userInfoTmp});
                        }
                        return;
                    }
                    //调整房间限制
                    if(dataJson.typeString === 'rLimit'){
                        /*console.log(dataJson);
                        console.log(typeof dataJson.objRoomId+','+typeof state.homeState.currentRoomInfo.roomId);
                        console.log(dataJson.objRoomId===state.homeState.currentRoomInfo.roomId);*/
                        if(dataJson.objRoomId == state.homeState.currentRoomInfo.roomId){
                            //设置state.homeState.userInfo
                            let currentRoomInfoTmp = state.homeState.currentRoomInfo;
                            console.log(currentRoomInfoTmp);
                            currentRoomInfoTmp.limited = dataJson.limit;
                            store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:currentRoomInfoTmp});
                            //可能需要更新allRoomList中的user
                        }
                        return;
                    }
                    if(dataJson.typeString === 'uPower'){
                        console.log(dataJson);
                        console.log(state.homeState.userInfo);
                        //提升权限只通知本人
                        if(dataJson.objUserId == state.homeState.userInfo.id){
                            //设置state.homeState.userInfo
                            let userInfoTmp = state.homeState.userInfo,
                                allRoomList = state.homeState.allRoomList;
                            userInfoTmp.level = dataJson.level;
                            store.dispatch({type:CONSTANT.USERINFO,val:userInfoTmp});
                            //设置state.homeState.allRoomList
                            allRoomList.map(function (item1) {
                                item1.childNode.map(function (item) {
                                    // console.log(item.roomId+','+dataJson.roomId);
                                    if(item.roomId === dataJson.roomId){
                                        item.childNode.map(function (itm) {
                                            // console.log(itm.id+','+dataJson.objUserId);
                                            if(itm.id === dataJson.objUserId){
                                                itm.level = dataJson.level;
                                            }
                                        })
                                    }
                                })
                            });
                            // console.log(allRoomList);
                            store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomList});
                        }
                        return;
                    }
                    //消息撤回
                    if(dataJson.typeString === 'withdraw'){
                        /*console.log(data);
                        console.log(dataJson);*/
                        data = data.filter(function (item) {
                            if(item.timeStamp && item.timeStamp.toString() == dataJson.timeStamp){
                                // console.log(item.timeStamp.toString() === dataJson.timeStamp);
                                return;
                            }else{
                                return item;
                            }
                        });
                        // return;
                    }
                    // console.log(dataJson);
                    if (dataJson.typeString !== 'withdraw') {
                        console.log(dataJson);
                        if (dataJson.data === '消息成功发出') {
                            data.push({
                                userId:dataJson.user.id,
                                userName: dataJson.user.name,
                                time: getDateString(),
                                data: _this.state.sendData,
                                timeStamp: dataJson.timeStamp
                            });
                        } else {
                            data.push({
                                userId:dataJson.user.id,
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
                    // console.log(dataJson);
                    allRoomListTmp.map(function (item) {
                        if(item.childNode.length !== 0){
                            item.childNode.map(function (item) {
                                if(item.roomId === dataJson.roomId.toString()){
                                    let flag = true;//flag表示是否可以插入用户
                                    if(item.childNode){
                                        item.childNode.map(function (uItem) {
                                            if(uItem.id == dataJson.user.id){
                                                //如果用户存在列表则不让插入
                                                flag = false;
                                            }
                                        })
                                    }
                                    if(flag){
                                        item.childNode.push({
                                            name:dataJson.user.name,
                                            id:dataJson.user.id,
                                            level:dataJson.user.level,
                                            sex:dataJson.user.sex,
                                            avatar:dataJson.user.avatar
                                        });
                                    }
                                }
                            });
                        }
                    });
                    // console.log(allRoomListTmp);
                    store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
                    // console.log(dataJson);
                    data.push({userName:dataJson.user.name,
                        time:getDateString(),
                        data:'<p>'+ dataJson.user.name + '已进入房间'+ dataJson.roomName  +'</p>'});
                    break;
                case 'leave_room':
                    // console.log(dataJson);
                    //有人离开房间时需要更新AllRoomList
                    allRoomListTmp = state.homeState.allRoomList;
                    allRoomListTmp.map(function (item) {
                        if(item.childNode){
                            item.childNode.map(function (item) {
                                if(item.roomId === dataJson.roomId.toString()){
                                    item.childNode = item.childNode.filter(function(item){
                                        return item.id !== dataJson.user.id;
                                    })
                                }
                            });
                        }
                    });
                    store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
                    // console.log(allRoomListTmp);
                    data.push({userName:dataJson.user.name,
                        time:getDateString(),
                        data:'<p>'+ dataJson.user.name + '已离开房间'+ dataJson.roomName +'</p>'});
                    break;
                case 'get_room_users':
                    // console.log(dataJson.data);
                    allRoomListTmp = state.homeState.allRoomList;
                    // console.log(allRoomListTmp);
                    allRoomListTmp.map(function (item) {
                        if(item.childNode){
                            item.childNode.map(function (item) {
                                if(item.roomId === dataJson.roomId){
                                    // console.log(dataJson.data.length);
                                    for(let i in dataJson.data){
                                        // console.log(dataJson.data[i]);
                                        //需要排除空数据，如果用户数据存在才加入列表
                                        if(dataJson.data[i] && dataJson.data[i].id  !== state.homeState.userInfo.id){
                                            item.childNode.push(dataJson.data[i]);
                                        }
                                    }
                                }
                            });
                        }
                    });
                    // console.log(allRoomListTmp)
                    store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomListTmp});
                    // console.log(allRoomListTmp);
                    break;
                case 'get_rooms':
                    // console.log(dataJson.data);
                    let dataTmp = [],
                        i=0;
                    // let ids = [];
                    /*console.log(typeof dataTmp);
                    console.log(dataTmp instanceof Array);*/
                    dataJson.data.map(function (item) {
                        // ids.push(item.roomId);
                        if(item.parentId.toString() === '0'){
                            dataTmp[i] = item;
                            dataTmp[i++].childNode = [];
                        }else{
                            item.childNode=[];
                        }
                    });
                    dataTmp.map(function (item) {
                        dataJson.data.map(function (itm) {
                            if (item.roomId === itm.parentId) {
                                item.childNode.push(itm);
                            }
                        })
                    });

                    // console.log(dataTmp);
                    // console.log(ids);
                    if(dataTmp.length === 0)return;
                    store.dispatch({type:CONSTANT.ALLROOMLIST,val:dataTmp});
                    store.dispatch({type:CONSTANT.CURRENTROOMINFO,
                        val:dataTmp[0].childNode[0]});
                    store.dispatch({type:CONSTANT.LASTROOMINFO,
                        val:dataTmp[0].childNode[0]});

                    break;
                case 'create_room':
                    // console.log(dataJson);
                    // console.log(dataJson.data);
                    //更新allRoomList
                    /* let allRoomListTmp = state.homeState.allRoomList;
                     allRoomListTmp.map(function (item) {
                         if(item.parentId === 0){
                             item.push()
                         }
                     });*/
                    break;
                case 'delete_room':
                    // console.log(dataJson);
                    // console.log(dataJson.data);
                    //更新allRoomList
                    break;
                default:
                    break;
            }
            store.dispatch({type:CONSTANT.MESSAGEDATA,val:data});
            scrollToBottom();
        };
    }
    componentWillUnmount(){
        //解绑事件监听
        let dragBar = document.getElementById('resizable');
        dragBar.onmousedown = null;
        document.onmousemove = null;
        document.onmouseup = null;
        dragBar.onmousedown = null;

    }
    setSendData(value){
        this.setState({sendData:value});
    }
    render() {
        return (
            <Layout style={layoutStyle}>
                <Header style={{ backgroundColor:state.homeState.skinColor,padding: 0,textAlign:'center',borderBottom:'1px solid #ececec' }} >
                    <HeaderTopBox></HeaderTopBox>
                </Header>
                <Layout style={{backgroundColor:'#fff'}}>

                    <Sider width={this.state.sliderWidth} collapsible = {false} style={Object.assign({},sliderStyle,{borderRight: '1px solid #eee'})}>
                        <div id={'resizable'} className={'ui-resizable'}></div>
                        <div className={'channelContents'}>
                            <UserSearchBox></UserSearchBox>
                            <ChannelListBox></ChannelListBox>
                        </div>
                    </Sider>
                    <Content style={{ margin: '24px 16px 0',maxHeight: winHeight-150,overflowY:'hidden' }}>
                        <div className= 'content_show'>
                            {state.homeState.currentRoomInfo.mode == 0 && <MessageListBox sendData={this.state.sendData}></MessageListBox>}
                            {state.homeState.currentRoomInfo.mode == 1 && <LivingBox></LivingBox>}
                        </div>
                        <div className= 'text_area'>
                            {state.homeState.currentRoomInfo.mode == 0 && <UEditorBox setData={this.setSendData.bind(this)}></UEditorBox>}
                            {state.homeState.currentRoomInfo.mode== 1 && <AdvertisementBox></AdvertisementBox>}
                        </div>
                    </Content>
                    <Sider width={240} collapsible = {false} style={Object.assign({},sliderStyle,{borderLeft: '1px solid #eee'})}>
                        {/*麦序区域*/}
                        <div className='content-right-up'>
                            {state.homeState.currentRoomInfo.mode == 0 && <MicroPhoneBox></MicroPhoneBox>}
                            {state.homeState.currentRoomInfo.mode== 1 && <MessageListBox sendData={this.state.sendData}></MessageListBox>}
                        </div>
                        {/*广告区域*/}
                        <div className="ad-area" >
                            {state.homeState.currentRoomInfo.mode == 0 && <AdvertisementBox></AdvertisementBox>}
                            {state.homeState.currentRoomInfo.mode== 1 && <UEditorBox setData={this.setSendData.bind(this)}></UEditorBox>}
                        </div>
                    </Sider>
                </Layout>
                <Footer>
                    {/*底部功能区*/}
                    <FooterBottomBox userName={state.homeState.userInfo.name}></FooterBottomBox>
                </Footer>
                <RightClickPanelBox></RightClickPanelBox>
            </Layout>
        );
    }
}

export default HomeLayout;

// 系统屏幕尺寸（宽高）
const winWidth = window.innerWidth;
const winHeight = window.innerHeight;

window.onload = function(){

};
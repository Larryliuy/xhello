import React,{Component} from 'react';
import { Layout } from 'antd';
const { Header, Content, Footer, Sider } = Layout;
import UEditorBox from './UEditorBox';
import MessageListBox from './MessageListBox';
import UserSearchBox from '../containers/UserSearchBox';
import store,{CONSTANT} from '../reducer/reducer';
import ChannelListBox from './ChannelListBox';
import MicroPhoneBox from './MicroPhoneBox';
import AdvertisementBox from './AdvertisementBox';
import LivingBox from './LivingBox';
import LivingDoubleBox from './LivingDoubleBox';
import VideoOnDemand from '../components/VideoOnDemand';
import HeaderTopBox from './HeaderTopBox';
import FooterBottomBox from './FooterBottomBox';
import RightClickPanelBox from './RightClickPanelBox';
import '../static/login.scss'

import { send } from "../static/webSocket";
import {getPrepareConnectionState, startMyCam} from '../webrtc/webRtcAudio';
import {startMyCamVideo} from "../webrtc/webRtcVideo";
import {getUserInfo} from "../static/comFunctions";

let state = store.getState();
store.subscribe(function () {
    state = store.getState()
});

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

let intval = null;//定时器
let intval1 = null;//定时器
class HomeLayout extends React.Component {
    constructor(props){
        super(props);
        this.state={sendData:'',sliderWidth:240};
    }
    componentDidMount(){
        // 防止websock会空闲时断, 每10秒发送一个数据包,保持心跳
        setInterval(function () {
            let Msg = {
                roomId:state.homeState.currentRoomInfo.roomId,
                typeString:'heartBeat',
                check:1
            };
            send(JSON.stringify(Msg),function () {
            })
        },10000);

        //获取自己麦克音频流
        let videoBox = document.getElementById('audioBox');
        startMyCam(videoBox);
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
        //获取用户环境信息，仅用于测试
        // setTimeout(function () {
        //     getUserInfo();
        // },5000)
    }
    componentWillUnmount(){
        //解绑事件监听
        let dragBar = document.getElementById('resizable');
        dragBar.onmousedown = null;
        document.onmousemove = null;
        document.onmouseup = null;
        dragBar.onmousedown = null;
        window.onbeforeunload = null;
    }
    setSendData(value){
        store.dispatch({type:CONSTANT.SENDDATA,val:value});
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
                        <div id={'audioBox'}>
                        </div>
                        <div className= 'content_show'>
                            {state.homeState.currentRoomInfo.mode == 0 && <MessageListBox></MessageListBox>}
                            {state.homeState.currentRoomInfo.mode == 1 && <LivingBox></LivingBox>}
                            {state.homeState.currentRoomInfo.mode == 2 && <VideoOnDemand></VideoOnDemand>}
                            {state.homeState.currentRoomInfo.mode == 3 && <LivingDoubleBox></LivingDoubleBox>}
                        </div>
                        <div className= 'text_area'>
                            {state.homeState.currentRoomInfo.mode == 0 && <UEditorBox setData={this.setSendData.bind(this)}></UEditorBox>}
                            {state.homeState.currentRoomInfo.mode == 1 && <AdvertisementBox></AdvertisementBox>}
                            {state.homeState.currentRoomInfo.mode == 2 && <AdvertisementBox></AdvertisementBox>}
                            {state.homeState.currentRoomInfo.mode == 3 && <AdvertisementBox></AdvertisementBox>}
                        </div>
                    </Content>
                    <Sider width={240} collapsible = {false} style={Object.assign({},sliderStyle,{borderLeft: '1px solid #eee'})}>
                        {/*麦序区域*/}
                        <div className='content-right-up'>
                            {state.homeState.currentRoomInfo.mode == 0 && <MicroPhoneBox></MicroPhoneBox>}
                            {state.homeState.currentRoomInfo.mode == 1 && <MessageListBox></MessageListBox>}
                            {state.homeState.currentRoomInfo.mode == 2 && <MessageListBox></MessageListBox>}
                            {state.homeState.currentRoomInfo.mode == 3 && <MessageListBox></MessageListBox>}
                        </div>
                        {/*广告区域*/}
                        <div className="ad-area" >
                            {state.homeState.currentRoomInfo.mode == 0 && <AdvertisementBox></AdvertisementBox>}
                            {state.homeState.currentRoomInfo.mode == 1 && <UEditorBox setData={this.setSendData.bind(this)}></UEditorBox>}
                            {state.homeState.currentRoomInfo.mode == 2 && <UEditorBox setData={this.setSendData.bind(this)}></UEditorBox>}
                            {state.homeState.currentRoomInfo.mode == 3 && <UEditorBox setData={this.setSendData.bind(this)}></UEditorBox>}
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
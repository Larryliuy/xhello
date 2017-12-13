import React,{Component} from 'react';
import { Layout, Icon ,message, Button } from 'antd';
const { Header, Content, Footer, Sider } = Layout;
import UEditorBox from './UEditorBox'
import MessageListBox from './MessageListBox'
import UserSearchBox from '../containers/UserSearchBox';
import store,{CONSTANT} from '../reducer/reducer';
import cookieUtil from '../libs/cookieUtil';
import ChannelListBox from './ChannelListBox';
import MicroPhoneBox from './MicroPhoneBox';
import AdvertisementBox from './AdvertisementBox';
import LivingBox from './LivingBox';
import HeaderTopBox from './HeaderTopBox';
import FooterBottomBox from './FooterBottomBox';
import '../static/login.scss'
const layoutStyle = {
    width:'100%',
    height:'100%',
    color:'#222'
}
const sliderStyle = {
    width:'240px !important',
    maxWidth:'240px !important',
    backgroundColor:'#fff'
}

let state = store.getState();
store.subscribe(function () {
    state = store.getState()
});
let userId = 0,
    isInit = true;
if(decodeURI(window.location.href).indexOf('?{') !== -1){
    console.log(decodeURI(window.location.href))
    console.log(userId);
    userId = JSON.parse(decodeURI(window.location.href).substring(decodeURI(window.location.href).indexOf('?{')+1,decodeURI(window.location.href).length)).id
}
console.log('href:'+userId);


class HomeLayout extends React.Component {
    componentWillMount(){
        userId = JSON.parse(decodeURI(this.props.location.search.substring(1))).id;
        if(!userId){
            userId = JSON.parse(decodeURI(cookieUtil.get('userData'))).id || 0;
        }
        console.log(userId);
        if(userId){
            /*getFetchData('/task/list','userId='+userId,1);
            getFetchData('/task/assignList','assignUserId='+userId,2);*/
            // console.log('init:'+isInit)
            setTimeout(function () {
                isInit = false;
            },1000)
        }
    }
    constructor(props){
        super(props)
    }
    render() {
        return (
            <Layout style={layoutStyle}>
                <Header style={{ backgroundColor:state.homeState.skinColor,padding: 0,textAlign:'center',borderBottom:'1px solid #ececec' }} >
                    <HeaderTopBox></HeaderTopBox>
                </Header>
                <Layout style={{backgroundColor:'#fff'}}>

                    <Sider width={240} collapsible = {false} style={Object.assign({},sliderStyle,{borderRight: '1px solid #eee'})}>
                        {/*搜索框*/}
                        <UserSearchBox></UserSearchBox>
                        <ChannelListBox></ChannelListBox>
                    </Sider>
                    <Content style={{ margin: '24px 16px 0',maxHeight: winHeight-150,overflowY:'hidden' }}>
                        <div className= 'content_show'>
                            {!state.homeState.currentRoomInfo.living && <MessageListBox></MessageListBox>}
                            {state.homeState.currentRoomInfo.living && <LivingBox></LivingBox>}
                        </div>
                        <div className= 'text_area'>
                            <UEditorBox></UEditorBox>
                        </div>
                    </Content>
                    <Sider width={240} collapsible = {false} style={Object.assign({},sliderStyle,{borderLeft: '1px solid #eee'})}>
                        {/*麦序区域*/}
                        <div className='microphone_area'>
                            <MicroPhoneBox></MicroPhoneBox>
                        </div>
                        {/*广告区域*/}
                        <div className="ad-area" >
                            <AdvertisementBox></AdvertisementBox>
                        </div>
                    </Sider>
                </Layout>
                <Footer>
                    {/*底部功能区*/}
                    <FooterBottomBox userName={JSON.parse(decodeURI(this.props.location.search.substring(1))).name}></FooterBottomBox>
                </Footer>
            </Layout>
        );
    }
}

export default HomeLayout;

// 系统屏幕尺寸（宽高）
const winWidth = window.innerWidth;
const winHeight = window.innerHeight;
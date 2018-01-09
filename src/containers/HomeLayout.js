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

import WS,{ getDateString } from "../static/wsInstace";

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
    componentDidMount(){
        //QQ快捷登录
        //QQ快捷登录
        let locationUrl = window.location.href,
            code,accessToken;
        /*console.log(locationUrl);
        console.log(locationUrl);*/
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
        }
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
        // console.log(state.homeState.currentRoomInfo);
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
                            {!state.homeState.currentRoomInfo.living && <MessageListBox sendData={this.state.sendData}></MessageListBox>}
                            {state.homeState.currentRoomInfo.living && <LivingBox></LivingBox>}
                        </div>
                        <div className= 'text_area'>
                            {!state.homeState.currentRoomInfo.living && <UEditorBox setData={this.setSendData.bind(this)}></UEditorBox>}
                            {state.homeState.currentRoomInfo.living && <AdvertisementBox></AdvertisementBox>}
                        </div>
                    </Content>
                    <Sider width={240} collapsible = {false} style={Object.assign({},sliderStyle,{borderLeft: '1px solid #eee'})}>
                        {/*麦序区域*/}
                        <div className='content-right-up'>
                            {!state.homeState.currentRoomInfo.living && <MicroPhoneBox></MicroPhoneBox>}
                            {state.homeState.currentRoomInfo.living && <MessageListBox sendData={this.state.sendData}></MessageListBox>}
                        </div>
                        {/*广告区域*/}
                        <div className="ad-area" >
                            {!state.homeState.currentRoomInfo.living && <AdvertisementBox></AdvertisementBox>}
                            {state.homeState.currentRoomInfo.living && <UEditorBox setData={this.setSendData.bind(this)}></UEditorBox>}
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
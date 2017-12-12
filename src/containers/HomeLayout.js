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
import HeaderTopBox from './HeaderTopBox';
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
let arrData = [],
    assginArrData = [],
    tmpArrData = [],
    userId = 0,
    isInit = true;
if(decodeURI(window.location.href).indexOf('?{') !== -1){
    console.log(decodeURI(window.location.href))
    console.log(userId)
    userId = JSON.parse(decodeURI(window.location.href).substring(decodeURI(window.location.href).indexOf('?{')+1,decodeURI(window.location.href).length)).id
}
//fetch请求
function getFetchData(url,arg,acData) {
    if('fetch' in window){
        fetch(url,{
            method:'POST',
            // mode:'no-cors',
            credentials: "include",
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body:arg
        }).then((response)=>{console.log(response);return response.json()})
            .then((data)=>{
            console.log(data)
                if (acData == 1){
                    arrData = tmpArrData = data.result;
                    store.dispatch({type:CONSTANT.TASKKEY,val:{key:state.homeState.key,currentTask:state.homeState.currentTask,finished:0}})
                }else if(acData == 2){
                    assginArrData = data.result;
                    // console.log('fetch'+acData+':'+isInit)
                    if(!isInit){
                        assginArrData = tmpArrData = data.result;
                        store.dispatch({type:CONSTANT.TASKKEY,val:{key:state.homeState.key,currentTask:state.homeState.currentTask,finished:0}})
                    }
                }else {
                    message.error('错误类型');
                    return ;
                }
            }).catch(err=>console.log(err))
    }
}

console.log('href:'+userId)

export function updateData() {
    if(userId){
        getFetchData('/task/assignList','assignUserId='+userId,2); //2代表我分配的任务
    }
}

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
                            <MessageListBox></MessageListBox>
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
                <Footer className ='footer'>
                    {/*底部功能区*/}
                    <div>
                        <span style={{fontSize:13,marginRight:80,top:3}}>{JSON.parse(decodeURI(this.props.location.search.substring(1))).name}</span>
                    </div>
                    <div>
                        <span style={{cursor:'pointer'}}><Icon type="sound" /></span>
                        <span style={{marginLeft:10,top:3,cursor:'pointer'}}><Icon type="phone" /></span>
                    </div>
                    <div>
                        <span style={{marginLeft:80,top:3}}><Button type='primary'>点击开麦</Button></span>
                    </div>
                    <div>
                        <span style={{marginLeft:80,top:3,cursor:'pointer'}}>欢呼</span>
                        <span style={{marginLeft:10,top:3,cursor:'pointer'}}>鼓掌</span>
                    </div>
                    <div>
                        <span style={{cursor:'pointer'}}><Icon type="sound" />播放</span>
                    </div>
                </Footer>
            </Layout>
        );
    }
}

export default HomeLayout;

// 系统屏幕尺寸（宽高）
const winWidth = window.innerWidth;
const winHeight = window.innerHeight;
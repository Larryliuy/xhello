import React,{Component} from 'react';
import {Link} from 'react-router-dom'
import { Layout, Menu, Icon ,message, Input, Button, Breadcrumb } from 'antd';
const { Header, Content, Footer, Sider } = Layout;
const SubMenu = Menu.SubMenu;
const Search = Input.Search;
import ShowTime from '../components/ShowTime'
import store,{CONSTANT} from '../reducer/reducer';
import cookieUtil from '../libs/cookieUtil';
import ChannelListBox from './ChannelListBox'
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
if(decodeURI(window.location.href).indexOf('?') !== -1){
    console.log(decodeURI(window.location.href))
    console.log(userId)
    userId = JSON.parse(decodeURI(window.location.href).substring(decodeURI(window.location.href).indexOf('?')+1,decodeURI(window.location.href).length)).id
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
        console.log(userId)
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
    onClickHandle = (e) => {
        //如果每次要刷新工作状态在这里需要再次请求数据
        // console.log(e)
        if(e.key === '1'){
            getFetchData('/task/list','userId='+userId,1); //1代表我的任务
            // tmpArrData = arrData;
        } else if(e.key === '2'){
            getFetchData('/task/assignList','assignUserId='+userId,2); //2代表我分配的任务
            // tmpArrData = assginArrData;
        }
        store.dispatch({type:CONSTANT.TASKKEY,val:{key:e.key,currentTask:0,finished:state.homeState.finished}})
    };
    handleTask=(value)=>{
        console.log('arg:'+value)
        store.dispatch({type:CONSTANT.TASKKEY,val:{key:state.homeState.key,currentTask:value,finished:value.isComplete}})
    };
    onClickBtnHandle=(bool,key)=>{
        if(key === '1'){
            tmpArrData = arrData.filter(value=>value.isComplete == bool);
        }else if(key === '2'){
            tmpArrData = assginArrData.filter(value=>value.isComplete == bool);
        }else{
            message.error('错误参数：'+key);
            return;
        }
        store.dispatch({type:CONSTANT.TASKKEY,val:{key:state.homeState.key,currentTask:state.homeState.currentTask,finished:bool}})
    };
    loginOut=()=>{
        message.success('退出成功！');
        cookieUtil.unset('userName');
        cookieUtil.unset('password');
        cookieUtil.unset('userData');
    };
    render() {
        return (
            <Layout style={layoutStyle}>
                <Header style={{ padding: 0,textAlign:'center',borderBottom:'1px solid #ececec' }} >
                    <div className="logo" > <ShowTime/></div>
                    <h1>
                        中华人民共和国商务部直销查询信息管理系统
                    </h1>
                    <span style={{cursor:'pointer',position:'absolute',fontSize:16,right:60,top:3}}>
                        <Icon style={{color:'blue'}} type="appstore" />
                        </span>
                    <Link to='/' onClick={this.loginOut} style={{position:'absolute',top:5,right:30,cursor:'pointer'}}><Icon type="poweroff" style={{fontSize:18,color:'red'}}/></Link>
                </Header>
                <Layout style={{backgroundColor:'#fff'}}>

                    <Sider width={240} collapsible = {false} style={Object.assign({},sliderStyle,{borderRight: '1px solid #eee'})}>
                        {/*搜索框*/}
                        <div className="logo-slider" >
                            <Search placeholder="input search text"
                            onSearch={value => console.log(value)}
                            style={{ width: 200 }}/>
                        </div>
                        <ChannelListBox></ChannelListBox>
                    </Sider>
                    <Content style={{ margin: '24px 16px 0',maxHeight: winHeight-150 }}>
                        <div className= 'content_show'>

                        </div>
                        <div className= 'text_area'></div>
                    </Content>
                    <Sider width={240} collapsible = {false} style={Object.assign({},sliderStyle,{borderLeft: '1px solid #eee'})}>
                        {/*头像区域*/}
                        <div className="logo-area" >
                            头像区域
                        </div>
                        {/*麦序区域*/}
                        <div className='microphone_area'>
                            <Menu theme="" mode="inline"
                                  defaultSelectedKeys={['1']}
                                  onClick={(e)=>this.onClickHandle(e)}
                                  defaultOpenKeys={['task']}>
                                <SubMenu key='task'
                                         title={<span><Icon type="plus" /><span>工作</span></span>}>
                                    <Menu.Item key="1">
                                        <span className="nav-text">测试1</span>
                                    </Menu.Item>
                                    <Menu.Item key="2">
                                        <span className="nav-text">测试2</span>
                                    </Menu.Item>
                                </SubMenu>
                                <Menu.Item key="3"><Icon type="plus" /><span className="nav-text" onClick={(e)=>this.onClickHandle(e)}>我的审批</span></Menu.Item>
                                {/*/!*<Menu.Item key="4"><Icon type="upload" /><span className="nav-text">新增工作</span></Menu.Item>*/}
                                <Menu.Item key="4"><Icon type="plus" /><span className="nav-text">操作记录</span></Menu.Item>
                            </Menu>
                        </div>
                        {/*广告区域*/}
                        <div className="ad-area" >
                             广告区域
                        </div>
                    </Sider>
                </Layout>
                <Footer className ='footer'>
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
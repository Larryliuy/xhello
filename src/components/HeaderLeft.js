import React,{ Component } from 'react';
import { Icon, Popover, Input, Button, Modal } from 'antd';
import RoomManager from './RoomManager';
import store from "../reducer/reducer";

let state = store.getState();
store.subscribe(function () {
    state = store.getState()
});
const headLeftImg={
    verticalAlign:'sub',
    paddingRight:'5px',
    height:'18px'
};
function collectImgClick() {
    console.log("点击收藏")
}
class HeaderLeft extends Component{
    componentDidMount(){

    }
    state = { visible: false, planeVisible: false, userName:'',password:'' };
    showModal = () => {
        if(state.homeState.userInfo.level > 3){//二级管理员以下没有权限,直接返回
            message('您没有权限');
            return;
        }
        this.setState({
            visible: true,
        });
    };
    userNameChange(e){
        this.setState({
            userName:e.target.value
        })
    }
    passwordChange(e){
        this.setState({
            password:e.target.value
        })
    }
    handleCancel = () => {
        this.setState({
            visible: false,
        });
    };
    planeClickHandle(){
        this.setState({
            planeVisible: true,
        });
    };
    planeCancelHandle(){
        this.setState({
            planeVisible: false,
        });
    }
    planeOkHandle(){
        if(!this.state.userName || !this.state.password){
            Modal.info({title:'用户名和密码不能为空',zIndex:10000});
        }else{
            this.setState({
                planeVisible: false,
            });
            Modal.info({title:'链接地址',content:(<a>http://localhost:3006/#/?invited&userName={this.state.userName}</a>)})
        }
    }
    render(){
        const content = (<div style={{width:'200px'}}>
            <Input onChange={(e)=>this.userNameChange(e)} placeholder={'请输入用户名'}/>
            <br/>
            <br/>
            <Input type={'password'} onChange={e=>this.passwordChange(e)} placeholder={'请输入密码'}/>
            <br/>
            <br/>
            <span style={{display:'flex',justifyContent:'space-between'}}>
                <Button onClick={()=>this.planeCancelHandle()}>取消</Button>
                <Button type={'primary'} onClick={()=>this.planeOkHandle()}>确定</Button>
            </span>
        </div>);
        return (<div style={{paddingLeft:'10px',display:'inline-block',width:'100%',height:'100%',fontSize:'0px'}}>
                    <div style={{height:'50%',width:'100%',fontSize:'14px',textAlign:'left',lineHeight:'20px',cursor:'pointer'}}>
                        <Popover  placement="bottomLeft"
                                  content={ <div onClick={this.showModal} ><span className='menu-logo'><img src='./images/icons/menu.png' /> 主菜单</span></div>}   trigger="click">
                            <Icon style={{fontSize:'28px',color:'#fff'}} type="home" />
                        </Popover>
                        <label style={{paddingLeft:'10px'}}>{state.homeState.currentRoomInfo.roomName}</label>
                        <RoomManager handleCancel={() => this.handleCancel()}
                                     title={'房间管理'}
                                     visible={this.state.visible}></RoomManager>
                    </div>
                    <div style={{height:'50%',width:'100%',color:'white',fontSize:'14px',lineHeight:'24px'}}>
                        在线:
                        <label style={{paddingRight:'23px'}}>{state.homeState.currentRoomInfo.totalClients}</label>
                        <img onClick={collectImgClick}
                             style={headLeftImg}
                             src="./images/icons/star.png"
                             alt=""/>
                        <label style={{marginRight:'8px'}}>收藏</label>
                        <Popover placement="rightBottom"
                                 title={'生成连接'}
                                 content={content}
                                 visible={this.state.planeVisible}
                                 trigger="click">
                            <label onClick={()=>this.planeClickHandle()}><img style={headLeftImg} src="./images/icons/plane.png" alt=""/>飞机票</label>
                        </Popover>

                    </div>
                </div>)
    }
}

export default HeaderLeft


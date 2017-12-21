import React,{ Component } from 'react';
import { Icon, Popover } from 'antd';
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
    state = { visible: false };
    showModal = () => {
        this.setState({
            visible: true,
        });
    };
    handleCancel = () => {
        this.setState({
            visible: false,
        });
    };
    planeClickHandle(){
        alert('飞机');
    };
    render(){
        return (<div style={{paddingLeft:'10px',display:'inline-block',width:'100%',height:'100%',fontSize:'0px'}}>
                    <div style={{height:'50%',width:'100%',fontSize:'14px',textAlign:'left',lineHeight:'20px',cursor:'pointer'}}>
                        <Popover  placement="bottomLeft"
                                  content={ <div onClick={this.showModal} ><span className='menu-logo'><img src='./images/icons/menu.png' /> 主菜单</span></div>}   trigger="click">
                            <Icon style={{fontSize:'28px',color:'#fff'}} type="home" />
                        </Popover>
                        <label style={{paddingLeft:'10px'}}>{state.homeState.currentRoomInfo.title}</label>
                        <RoomManager handleCancel={() => this.handleCancel()} visible={this.state.visible}></RoomManager>
                    </div>
                    <div style={{height:'50%',width:'100%',color:'white',fontSize:'14px',lineHeight:'24px'}}>
                        在线:
                        <label style={{paddingRight:'23px'}}>{state.homeState.currentRoomInfo.online}</label>
                        <img onClick={collectImgClick}
                             style={headLeftImg}
                             src="./images/icons/star.png"
                             alt=""/>
                        <label style={{marginRight:'8px'}}>收藏</label>
                        <label onClick={this.planeClickHandle}><img style={headLeftImg} src="./images/icons/plane.png" alt=""/>飞机票</label>
                    </div>
                </div>)
    }
}

export default HeaderLeft


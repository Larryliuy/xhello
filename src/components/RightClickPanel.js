import React,{ Component } from 'react';
import { Card, Popover, List, Modal } from 'antd';
const confirm = Modal.confirm;
import CreateRoom from './CreateRoom';
import WS,{ getSendData, send } from  '../static/wsInstace.js';
import store from "../reducer/reducer";
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});



class RightClickPanel extends React.Component{
    constructor(props){
        super(props);
        this.state = {display:'none',operate:[],createRoom:false,roomType:1}
    }
    setCreateRoomVisible(){
        this.setState({createRoom:false})
    }
    componentWillMount(){
        // this.setState({operate:operateData});
    }
    mouseOverHandle(e){
        //鼠标进入选项时弹出相应的操作
        let _this = this;
        if(e.target.getAttribute('class').indexOf('ant-list-item') === 0){
            let text = e.target.firstChild.innerText || e.target.innerText;
            // console.log(text);
            //没有联级菜单的不显示
            if(text.indexOf('移动') === -1 && text.indexOf('房间') === -1 && text.indexOf('排序') === -1){
                this.props.listData.map(function(item){
                    if(item.title === text){
                        _this.setState({display:'block',operate:item.operate});
                    }
                });
            }else{
                _this.setState({display:'none'});
            }
        }
    }
    clickHandle(e){
        let _this = this;
        if(e.target.getAttribute('class').indexOf('ant-list-item') === 0) {
            let text = e.target.firstChild.innerText || e.target.innerText;
            console.log(text);
            switch(text){
                case '移动到本房间':
                    //移动时需要确认
                    alert(text);
                    break;
                case '封IP':
                    alert(text);
                    break;
                case '封ID':
                    alert(text);
                    break;
                case '禁止此人图片':
                    alert(text);
                    break;
                case '禁止此人语音':
                    alert(text);
                    break;
                case '禁止此人文字':
                    alert(text);
                    break;
                case '一级管理员':
                    alert(text);
                    break;
                case '二级管理员':
                    alert(text);
                    break;
                case '副房主':
                    alert(text);
                    break;
                case 'VIP':
                    alert(text);
                    break;
                case '会员':
                    alert(text);
                    break;
                case '撤销级别':
                alert(text);
                break;
                case '禁止图片':
                    alert(text);
                    break;
                case '禁止语音':
                    alert(text);
                    break;
                case '禁止文字':
                    alert(text);
                    break;
                case '创建同级别房间':
                    // alert(text);
                    _this.setState({createRoom:true});
                    break;
                case '创建子房间':
                    // alert(text);
                    _this.setState({createRoom:true});
                    _this.setState({roomType:2});
                    break;
                case '删除房间':
                    let roomId = state.homeState.location.obj;
                    if(roomId.indexOf('rc') !== -1){
                        if(parseInt(roomId)){
                            roomId = roomId.substring(0,roomId.indexOf('rc'));
                        }else{
                            roomId = roomId.substring(2);
                        }

                    }else if(roomId.indexOf('r') !== -1){
                        if(parseInt(roomId)){
                            roomId = roomId.substring(0,roomId.indexOf('r'));
                        }else{
                            roomId = roomId.substring(1);
                        }
                    }else{
                        return;
                    }
                    console.log(roomId);
                    confirm({
                        title:'删除房间会影响房间内用户，确认删除吗？',
                        // content: '',
                        okText: '确认',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk() {
                            console.log('OK');
                            let deleteMsg = {
                                type:'delete_room',
                                roomId:roomId,
                                user:state.homeState.userInfo
                            };
                            send(JSON.stringify(deleteMsg),function () {
                                //删除完成后获取最新的房间列表
                                let getRoomsMsg = {
                                    type:'get_rooms',
                                    user:state.homeState.userInfo,
                                    data:''
                                };
                                send(JSON.stringify(getRoomsMsg),function () {
                                    let enterMsg = getSendData(
                                        'enter_room',
                                        state.homeState.currentRoomInfo.roomId,
                                        state.homeState.currentRoomInfo.roomName,
                                        state.homeState.userInfo);
                                    // WS.send(JSON.stringify(enterMsg));
                                    send(JSON.stringify(enterMsg),function(){

                                    });
                                });
                            });
                        },
                        onCancel() {
                            console.log('Cancel');
                        },});
                    break;
                case '房间设置':
                    alert(text);
                    break;
                case '排序':
                    //选中获取元素id（即房间id），然后建一个临时AllRoomList用于更新排序列表，
                    // 点确定按钮更新到state.homeState.allRoomList.
                    alert(text);
                    break;
                default:
                    break;
            }
        }
    }
    render(){

        return (<div className={'right-click'}
                     onClick={e => this.clickHandle(e)}>

                    <Card bodyStyle={{padding:0}}>

                    <List
                        onMouseOver={e=>this.mouseOverHandle(e)}

                        className={'right-panel'}
                        size="small"
                        bordered
                        dataSource={this.props.listData}
                        renderItem={item => (<List.Item>{item.title}</List.Item>)}
                    /> </Card>
                    <Card bodyStyle={{padding:0,height:'100%',display:this.state.display}}>
                    <List
                        // onClick={e => this.clickHandle(e)}
                        className={'right-panel-item'}
                        size="small"
                        bordered
                        dataSource={this.state.operate}
                        renderItem={item => (<List.Item>{item}</List.Item>)}
                    /> </Card>
            {this.state.createRoom && <CreateRoom roomType={this.state.roomType} setVisible={this.setCreateRoomVisible.bind(this)}></CreateRoom>}

        </div>)
    }
}

export default RightClickPanel;
import React,{ Component } from 'react';
import { Modal, Input, Select  } from 'antd';
const Option = Select.Option;
import WS,{ upDateAllRoomList, send } from '../static/webSocket.js';
import { createRoom } from '../static/comFunctions';
import store, {CONSTANT} from '../reducer/reducer';
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});
class CreateRoom extends React.Component{
    constructor(props){
        super(props);
        this.state = {visible:true,color:'red',title:'',password:''};
    }

    handleOk(){
        let roomType = this.props.roomType,
            createMsg,
            parentId=0,
            roomList = state.homeState.allRoomList,
            order;//房间的排序值
        if(roomList.length === 0){
            order = 1;
        }else{
            order = Number(roomList[roomList.length-1].order)+1;
        }
        if(roomType === 2){ //创建子房间
            let objId = state.homeState.location.obj;
            parentId = parseInt(objId)? parseInt(objId):objId.substring(1);
            console.log(parentId);
            //获取order值
            roomList.map(function (item) {
                if(item.roomId == parentId){
                    if(item.childNode.length === 0){
                        order = 1;
                    }else{
                        order = Number(item.childNode[item.childNode.length-1].order)+1;
                    }
                }
            });
        }
        console.log(roomType+';'+parentId+';'+order);
        //在这里请求https，创建房间，将返回的房间ID传给websocket
        createMsg = {
            type:'create_room',
            parentId:parentId,
            roomName: this.state.title,
            userId:state.homeState.userInfo.id,
            userName:state.homeState.userInfo.name,
            color:this.state.color,
            password:this.state.password,
            order:order
        };
        // console.log(roomType);
        console.log(createMsg);
        createRoom(createMsg);
        // console.log(this.state);
        this.props.setVisible();
    }
    handleCancel(){
        this.props.setVisible();
    }
    onChangeHandle(e){
        console.log(e);
        this.setState({color:e});
    }
    onChangeTitleHandle(e){
        this.setState({title:e.target.value});
    }
    onChangePasswordHandle(e){
        this.setState({password:e.target.value});
    }
    render(){
        return (<div>
            <Modal className={'create-room'}
                title='新建房间'
                okText={'确定'}
                cancelText={'取消'}
                visible={this.state.visible}
                onOk={() => this.handleOk()}
                onCancel={() => this.handleCancel()}
            >
                <label><span>房间名称：</span><Input onChange={e=>this.onChangeTitleHandle(e)} className={'input-style'} placeholder={'请输入房间名称'}/></label>
                <br/>
                <br/>
                <label>
                    <span>房间颜色：</span>
                    <Select defaultValue={'red'}
                            onChange={e => this.onChangeHandle(e)}
                            className={'input-style'}
                            style={{backgroundColor:this.state.color}}
                    >
                        <Option value={'red'} style={{backgroundColor:'red'}}>红色</Option>
                        <Option value={'green'} style={{backgroundColor:'green'}}>绿色</Option>
                        <Option value={'blue'} style={{backgroundColor:'blue'}}>蓝色</Option>
                    </Select>
                </label>
                <br/>
                <br/>
                <label><span>房间密码：</span><Input type={'password'} onChange={e=>this.onChangePasswordHandle(e)}  className={'input-style'} placeholder={'请输入房间密码'}/></label>
            </Modal>
        </div>);
    }
}

export default CreateRoom;
import React,{ Component } from 'react';
import { Modal, Input, Select  } from 'antd';
const Option = Select.Option;
import WS,{ getSendData, send } from  '../static/wsInstace.js';
import store from "../reducer/reducer";
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
            parentId=0;
        if(roomType === 2){
            parentId = state.homeState.location.obj.substring(1);
        }
        console.log(roomType+';'+parentId);
        createMsg = {
            type:'create_room',
            parentId:parentId,
            roomName: this.state.title,
            userId:state.homeState.userInfo.id,
            userName:state.homeState.userInfo.name,
            color:this.state.color,
            password:this.state.password,
        };
        // console.log(roomType);
        console.log(createMsg);
        //这里请求创建房间
        send(JSON.stringify(createMsg),function () {
            //创建完成后获取最新的房间列表
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
                title="新建房间"
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
        </div>)
    }
}

export default CreateRoom;
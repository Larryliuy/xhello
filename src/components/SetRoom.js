import React,{ Component } from 'react';
import { Modal, Input, Select  } from 'antd';
const Option = Select.Option;
import store, {CONSTANT} from "../reducer/reducer";
import {message} from "antd/lib/index";
import {generalApi} from "../static/apiInfo";
import { updateRoomInfoById } from "../static/comFunctions";
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});
class SetRoom extends React.Component{
    constructor(props){
        super(props);
        this.state = {visible:true,color:'red',title:'',password:''};
    }

    componentDidMount(){
        let roomId = this.props.roomInfo.id,
            _this = this,
            allRoomListTmp = state.homeState.allRoomList;
        allRoomListTmp.map(function (item) {
            if(item.childNode){
                item.childNode.map(function (citem) {
                    if(roomId === citem.roomId){
                        console.log(citem.color+','+citem.password);
                        _this.setState({color:citem.color,password:citem.password,title:citem.roomName})
                    }
                })
            }
        })

    }
    handleOk(){
        let roomId = this.props.roomInfo.id,
            roomName = this.state.title,
            roomColor = this.state.color,
            roomPassword = this.state.password;
        console.log(roomId+';');
        //这里请求修改房间
        // console.log(this.state);
        let args = 'action=update&table=room&cond=id='+roomId+'&color='+roomColor+'&roomName='+roomName+'&password='+roomPassword;
        fetch(generalApi,{
            method:'POST',
            // credentials: "include",
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body:args//JSON.stringify(args)
        }).then((response) => {/*console.log(response);*/return response.json()})
            .then(data=>{
                if(data.status === 'ok'){
                    message.success('修改成功');
                    //需要更新allRoomList中房间信息,还有服务器中的房间列表
                    updateRoomInfoById(roomId,roomName,roomColor,roomPassword);
                }else {
                    message.error('修改失败:'+data.data);
                }

            }).catch(err=>{
            console.log(err);
        });
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
                title="设置房间"
                okText={'确定'}
                cancelText={'取消'}
                visible={this.state.visible}
                onOk={() => this.handleOk()}
                onCancel={() => this.handleCancel()}
            >
                <label><span>房间名称：</span><Input value={this.state.title} onChange={e=>this.onChangeTitleHandle(e)} className={'input-style'} placeholder={'请输入房间名称'}/></label>
                <br/>
                <br/>
                <label>
                    <span>房间颜色：</span>
                    <Select defaultValue={this.state.color}
                            onChange={e => this.onChangeHandle(e)}
                            className={'input-style'}
                            style={{backgroundColor:this.state.color}}
                    >
                        <Option value={'white'} style={{backgroundColor:'white'}}>白色</Option>
                        <Option value={'red'} style={{backgroundColor:'red'}}>红色</Option>
                        <Option value={'green'} style={{backgroundColor:'green'}}>绿色</Option>
                        <Option value={'blue'} style={{backgroundColor:'blue'}}>蓝色</Option>
                    </Select>
                </label>
                <br/>
                <br/>
                <label><span>房间密码：</span><Input value={this.state.password} type={'password'} onChange={e=>this.onChangePasswordHandle(e)}  className={'input-style'} placeholder={'请输入房间密码'}/></label>
            </Modal>
        </div>)
    }
}

export default SetRoom;
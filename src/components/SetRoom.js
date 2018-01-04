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
class SetRoom extends React.Component{
    constructor(props){
        super(props);
        this.state = {visible:true,color:'red',title:'',password:''};
    }

    handleOk(){
        let roomId = this.props.roomInfo.id,
            createMsg;
        console.log(roomId+';');
        //这里请求修改房间
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
                title="设置房间"
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
        </div>)
    }
}

export default SetRoom;
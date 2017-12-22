import React,{ Component } from 'react';
import { Modal, Input } from 'antd';

class VerifyPassword extends React.Component{
    constructor(props){
        super(props);
    }
    onChangeHandle(e){
        // console.log(e.target.value);
        this.props.setRoomPassword(e.target.value);
    }
    render(){
        return (<Modal
                    title="Basic Modal"
                    visible={this.props.visible}
                    onOk={this.props.handleOk}
                    onCancel={this.props.handleCancel}
                >
                    <Input onChange={e=>this.onChangeHandle(e)} placeholder={'请输入密码'}/>
                </Modal>)
    }
}

export default VerifyPassword;
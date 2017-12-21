import React,{ Component } from 'react';
import { Modal, Input, Select  } from 'antd';
const Option = Select.Option;
class CreateRoom extends React.Component{
    constructor(props){
        super(props);
        this.state = {visible:true,color:'red'};
    }

    handleOk(){
        //这里请求创建房间
        this.props.setVisible();
    }
    handleCancel(){
        this.props.setVisible();
    }
    onChangeHandle(e){
        console.log(e);
        this.setState({color:e});
    }
    render(){
        return (<div>
            <Modal className={'create-room'}
                title="新建房间"
                visible={this.state.visible}
                onOk={() => this.handleOk()}
                onCancel={() => this.handleCancel()}
            >
                <label><span>房间名称：</span><Input className={'input-style'} placeholder={'请输入房间名称'}/></label>
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
                <label><span>房间密码：</span><Input type={'password'} className={'input-style'} placeholder={'请输入房间密码'}/></label>
            </Modal>
        </div>)
    }
}

export default CreateRoom;
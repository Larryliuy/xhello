import React,{ Component } from 'react';
import { Modal,Row, Col, Select, Table, Button } from 'antd';
import UploadAvatar from './UploadAvatar';

class RoomManager extends React.Component{
    constructor(props){
        super(props);
        this.state={uploadModalVisible:false}
    }
    HandleOk = () => {
        this.setState({
            visible: false,
        });
    };
    handleClick(id){
        console.log(id);
        alert('撤销id为'+id+'的管理员成功');
    }
    uploadAvatarBtnHandle(){
        this.setState({uploadModalVisible:true});
    }
    uploadHandOk(){
        this.setState({uploadModalVisible: false});
    }
    uploadHandleCancel(){
        this.setState({uploadModalVisible: false});
    }
    render(){
        const columns = [{
            title: '身份',
            dataIndex: 'name',
            key: 'name',
            render: text => <img src={"./images/icons/"+'admin_man1.png'} />,
        }, {
            title: '房间名片',
            dataIndex: 'roomName',
            key: 'roomName',
        }, {
            title: '操作',
            key: 'action',
            render: (text, record) => (
                <span>
                  <Button size={'small'} type={'default'} onClick={() => this.handleClick(record.key)}>{'撤销'}</Button>
                </span>
            ),
            width:'80px',
        }];
        const data = [{
            key: '1',
            name: 'larry',
            roomName: 'larry',
            address: '',
        }, {
            key: '2',
            name: 'larry',
            roomName: 'larry',
            address: '',
        }, {
            key: '3',
            name: 'larry',
            roomName: 'larry',
            address: '',
        }, {
            key: '4',
            name: 'larry',
            roomName: 'larry',
            address: '',
        }, {
            key: '5',
            name: 'larry',
            roomName: 'larry',
            address: '',
        }, {
            key: '6',
            name: 'larry',
            roomName: 'larry',
            address: '',
        }];
        return (<div>
            <Modal
                title="房间管理"
                visible={this.props.visible}
                onOk={this.HandleOk}
                onCancel={this.props.handleCancel}
                okText="确认"
                cancelText="取消"
                bodyStyle = {{padding:'0px'}}
            >
                <Row>
                    <Col span={6}>
                        <div className='room-manage-dialog'>
                            <div className='room-manage-list'>
                                <div className="Dialog-room-avatar">
                                    <img src="./images/icons/menu.png" alt="logo"/>
                                    <div><button onClick={this.uploadAvatarBtnHandle.bind(this)}>更换头像</button></div>
                                </div>
                                <div className="manager-set">管理员设置</div>
                                <div className="blacklist-set">黑名单管理</div>
                            </div>
                        </div>
                    </Col>
                    <Col span={18} className={'room-manage-table'}>
                        <Table bordered
                               size={'small'}
                               columns={columns}
                               dataSource={data} />
                    </Col>
                </Row>
            </Modal>
            <UploadAvatar visible={this.state.uploadModalVisible}
                          handleOk={this.uploadHandOk.bind(this)}
                          handleCancel={this.uploadHandleCancel.bind(this)}>

            </UploadAvatar>
        </div>)
    }
}

export default RoomManager;
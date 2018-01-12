import React,{ Component } from 'react';
import { Modal,Row, Col, Select, Table, Button, List } from 'antd';
import UploadAvatar from './UploadAvatar';
import { generalApi } from "../static/apiInfo";
import {send} from "../static/wsInstace";
import {message} from "antd/lib/index";
import store, {CONSTANT} from "../reducer/reducer";

let state = store.getState();
store.subscribe(function () {
    state = store.getState();
});

class RoomManager extends React.Component{
    constructor(props){
        super(props);
        this.state={uploadModalVisible:false,tableColumns:[],tableData:[]}
    }
    componentDidMount(){
        const getUserIconSrc = (sex,level) =>{
            let src = '';
            switch(level){
                case 1:
                /*if(sex === 1){
                    src = 'p_man.png';
                }else{
                    src = 'p_female.png';
                }
                break;*/
                case 2:
                    if(sex === 1){
                        src = 'p_man.png';
                    }else{
                        src = 'p_female.png';
                    }
                    break;
                case 3:
                    if(sex === 1){
                        src = 'admin_man1.png';
                    }else{
                        src = 'admin_female1.png';
                    }
                    break;
                case 4:
                    if(sex === 1){
                        src = 'admin_man2.png';
                    }else{
                        src = 'admin_female2.png';
                    }
                    break;
                case 5:
                    if(sex === 1){
                        src = 'vip_man1.png';
                    }else{
                        src = 'vip_female1.png';
                    }
                    break;
                case 6:
                    if(sex === 1){
                        src = 'vip_man2.png';
                    }else{
                        src = 'vip_female2.png';
                    }
                    break;
                case 7:
                    if(sex === 1){
                        src = 'c_man.png';
                    }else{
                        src = 'c_female.png';
                    }
                    break;
            }
            // console.log(src);
            return "./images/icons/"+src;
        };

        let columns = [{
            title: '身份',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => {return <img src={getUserIconSrc(record.sex,record.type)} />},
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
        let datas = [{
            key: '1',
            name: 'larry',
            roomName: 'larry',
            type: 1,
            sex: 1,
        }, {
            key: '2',
            name: 'larry',
            roomName: 'larry',
            type: 2,
            sex: 2,
        }, {
            key: '3',
            name: 'larry',
            roomName: 'larry',
            type: 3,
            sex: 1,
        }, {
            key: '4',
            name: 'larry',
            roomName: 'larry',
            type: 4,
            sex: 2,
        }, {
            key: '5',
            name: 'larry5',
            roomName: 'larry',
            type: 2,
            sex: 1,
        }, {
            key: '6',
            name: 'larry',
            roomName: 'larry',
            type: 4,
            sex: 1,
        }];
        //请求获取管理员用户
        let args = '?action=get&table=xuser',_this=this;
        fetch(generalApi+args)
            .then(response=>{/*console.log(response);*/return response.json()})
            .then(data=>{
                // console.log(data);
                data.data.map(function (item) {
                    if(parseInt(item.Type) <= 4){
                        let adminUserInfo = {};
                        adminUserInfo.key = item.Id;
                        adminUserInfo.name = item.LoginName;
                        adminUserInfo.roomName = item.LoginName;
                        adminUserInfo.type = parseInt(item.Type);
                        adminUserInfo.sex = parseInt(item.Sex);
                        datas.push(adminUserInfo);
                    }
                });
                // console.log(datas);
                if(_this.refs.myRoomRef){
                    _this.setState({tableColumns:columns,tableData:datas});
                }
            })
            .catch(e=>console.log(e));
    }
    HandleOk = () => {
        this.setState({
            visible: false,
        });
    };

    handleClick(id){
        console.log(id);
        //提升用户等级时更新用户等级信息
        function updateByPower(level) {
            let allRoomList = state.homeState.allRoomList;
            allRoomList.map(function (item1) {
                item1.childNode.map(function (item) {
                    if(item.roomId === state.homeState.currentRoomInfo.roomId){
                        item.childNode.map(function (itm) {
                            if(itm.id === id.toString()){
                                itm.level = level;
                            }
                        })
                    }
                })
            });
            // console.log(allRoomList);
            store.dispatch({type:CONSTANT.ALLROOMLIST,val:allRoomList});
        }
        function limitFetch(args) {
            fetch(generalApi,{
                method:'POST',
                // credentials: "include",
                headers:{
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body:args//JSON.stringify(args)
            }).then((response) => {/*console.log(response);*/return response.text()})
                .then(data=>{
                    console.log(data);
                    let datatmp;
                    try {
                        datatmp = JSON.parse(data);
                        //JSON.parse没问题的情况
                        console.log(datatmp);
                        if(datatmp.status === 'ok'){
                            message.success('撤销成功');
                        }else {
                            message.error('撤销失败');
                        }
                    }catch (e){
                        //JSON.parse有问题的情况,手动截取返回信息中JSON字符串
                        datatmp = JSON.parse(data.substring(data.indexOf('{')));
                        console.log(datatmp);
                        if(datatmp.status === 'ok'){
                            message.success('撤销成功');
                        }else {
                            message.error('撤销失败');
                        }
                    }

                }).catch(err=>{
                console.log(err);
            });
        }
        //根据id获取用户所在房间
        let objRoomInfo={},objUserInfo={};
        state.homeState.allRoomList.map(function (item) {
            item.childNode.map(function (cItem) {
                if(cItem.childNode){
                    cItem.childNode.map(function (uItem) {
                        if(uItem.id === id.toString()){
                            objRoomInfo = cItem;
                            objUserInfo = uItem;
                        }
                    })
                }
            })
        });
        console.log(objRoomInfo);
        console.log(objUserInfo);
        //在这里请求撤销管理员操作，http与ws
        let Msg = {
            type:'msg',
            typeString:'uPower',
            roomId:objRoomInfo.roomId,
            roomName:objRoomInfo.roomName,
            objUserId:id,
            level:7
        };
        send(JSON.stringify(Msg),function(){
            updateByPower(7);
            //http请求修改数据
            let args = 'action=update&table=xuser&cond=id='+id+'&Type=7';
            limitFetch(args);
        });
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
    menuClickhandle(e){
        let text = e.target.innerText;
        console.log(text);
        if(text === '管理员设置'){
            //获取管理员数据，更新this.state.tableColumns与this.state.tableData
        }
        if(text === '黑名单管理'){
        }
    }
    render(){
        return (<div ref={'myRoomRef'}
        >
            <Modal
                title={this.props.title}
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
                                <List
                                    style={{paddingLeft:'11px',cursor:'pointer'}}
                                    onClick={e=>this.menuClickhandle(e)}
                                    size="small"
                                    bordered
                                    dataSource={['管理员设置','黑名单管理']}
                                    renderItem={item => (<List.Item>{item}</List.Item>)}
                                />
                            </div>
                        </div>
                    </Col>
                    <Col span={18} className={'room-manage-table'}>
                        <Table bordered
                               size={'small'}
                               pagination={{pageSize:5}}
                               columns={this.state.tableColumns}
                               dataSource={this.state.tableData} />
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
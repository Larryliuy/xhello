import React,{ Component } from 'react';
import { Modal,Row, Col, Select, Table, Button, List } from 'antd';
import UploadAvatar from './UploadAvatar';
import { generalApi } from "../static/apiInfo";
import {send} from "../static/webSocket";
import { getUserIconSrc } from "../static/comFunctions";
import {message} from "antd/lib/index";
import store, {CONSTANT} from "../reducer/reducer";

let state = store.getState();
store.subscribe(function () {
    state = store.getState();
});

class RoomManager extends React.Component{
    constructor(props){
        super(props);
        this.state={
            uploadModalVisible:false,
            clickMenu:'管理员设置',
            tableColumns:[],
            tableData:[]
        }
    }
    getColumns(type){
        let columns;
        if(type === '管理员设置'){
            columns = [{
                title: '身份',
                dataIndex: 'type',
                key: 'type',
                render: (text, record) => {return <img src={getUserIconSrc(record.sex,record.type)} />},
            }, {
                title: '用户名',
                dataIndex: 'name',
                key: 'name',
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
        }else if(type === '黑名单管理'){
            columns =  [{
                title: '用户名',
                dataIndex: 'userName',
                key: 'userName',
                // render: (text, record) => {return <span>record.name</span>},
            }, {
                title: '用户IP',
                dataIndex: 'userIp',
                key: 'userIp',
            }, {
                title: '操作',
                key: 'action',
                render: (text, record) => (
                    <span>
                      <Button size={'small'} type={'default'} onClick={() => this.removeBlackListHandle(record.key,record.userName,record.userIp)}>{'解封'}</Button>
                    </span>
                ),
                width:'80px',
            }];
        }else{
            console.error("未知的type:"+type);
        }
        this.setState({tableColumns:columns})
    }
    getDatas(type){
        let datas = [],args,_this=this;
        if(type === '管理员设置'){
            //请求获取管理员用户
            args = '?action=get&table=xuser&cond=Type<5';
            fetch(generalApi+args)
                .then(response=>{/*console.log(response);*/return response.json()})
                .then(data=>{
                    // console.log(data);
                    data.data.map(function (item) {
                        // if(parseInt(item.Type) <= 4){
                        let adminUserInfo = {};
                        adminUserInfo.key = item.Id;
                        adminUserInfo.name = item.LoginName;
                        // adminUserInfo.roomName = item.LoginName;
                        adminUserInfo.type = parseInt(item.Type);
                        adminUserInfo.sex = parseInt(item.Sex);
                        datas.push(adminUserInfo);
                        // }
                    });
                    // console.log(datas);
                    if(_this.refs.myRoomRef){
                        _this.setState({tableData:datas});
                    }
                })
                .catch(e=>console.log(e));
        }else if (type === '黑名单管理'){
            args = '?action=get&table=blacklist';
            fetch(generalApi+args)
                .then(response=>{/*console.log(response);*/return response.json()})
                .then(data=>{
                    // console.log(data);
                    data.data.map(function (item) {
                        let adminUserInfo = {};
                        adminUserInfo.key = item.id;
                        adminUserInfo.userName = item.username;
                        // adminUserInfo.roomName = item.LoginName;
                        adminUserInfo.userIp = item.userip;
                        datas.push(adminUserInfo);
                    });
                    // console.log(datas);
                    if(_this.refs.myRoomRef){
                        // console.log(datas);
                        _this.setState({tableData:datas});
                    }
                })
                .catch(e=>console.log(e));
        }else{
            console.error("未知的type:"+type);
        }
    }
    componentDidMount(){
        this.getColumns('管理员设置');
        this.getDatas('管理员设置');
    }
    HandleOk = () => {
        this.setState({
            visible: false,
        });
    };
    removeBlackListHandle(blackListId,userName,userIp){
        // console.log(blackListId,userName,userIp);
        let args = "?action=del&table=blacklist&cond=id="+blackListId;
        fetch(generalApi+args)
            .then(res=>{/*console.log(res.json());*/message.success('解封成功')})
            .catch(e=>console.error(e));
    }
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
        this.setState({clickMenu:text});
        if(text === '管理员设置'){
            //获取管理员数据，更新this.state.tableColumns与this.state.tableData
            // this.setState({clickMenu:text});
            this.getColumns('管理员设置');
            this.getDatas('管理员设置');
        }
        if(text === '黑名单管理'){
            this.getColumns('黑名单管理');
            this.getDatas('黑名单管理');
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
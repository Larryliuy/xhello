import React,{ Component } from 'react';
import { Modal, Input, Button, Table, message } from 'antd';
import { ajustRoomOrder } from '../static/comFunctions';
import store, {CONSTANT} from '../reducer/reducer';
import {send} from '../static/webSocket';
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});
class SortRoom extends React.Component{
    constructor(props){
        super(props);
        this.state = {visible:true,title:'',columns:[],roomData:[],objRoom:{}};
        this.onSelectHandle = this.onSelectHandle.bind(this);
    }

    componentDidMount(){
        let roomId = this.props.roomInfo.id,
            _this = this,
            roomDatas =[],
            allRoomListTmp = state.homeState.allRoomList;
        // console.log(allRoomListTmp);
        allRoomListTmp.map(function (item) {
            if(item.roomId == roomId && item.childNode.length !== 0){
                roomDatas = item.childNode;
            }
        });
        const columns = [{
            title: '序号',
            dataIndex: 'order',
            width:100
        }, {
            title: '房间名称',
            dataIndex: 'roomName',
            width: 250
        }];
        roomDatas.map(function (item) {
            item.key = item.roomId;
        });
        console.log(roomDatas);
        this.setState({columns:columns,roomData:roomDatas});

    }
    handleOk(){
        let roomId = this.props.roomInfo.id;
        console.log(roomId);
        //这里请求修改房间
        // console.log(this.state);
        // let args = 'action=update&table=room&cond=id='+roomId+'&color='+this.state.color+'&roomName='+this.state.title+'&password='+this.state.password;
        // fetch(generalApi,{
        //     method:'POST',
        //     // credentials: 'include',
        //     headers:{
        //         'Content-Type': 'application/x-www-form-urlencoded'
        //     },
        //     body:args//JSON.stringify(args)
        // }).then((response) => {/*console.log(response);*/return response.text()})
        //     .then(data=>{
        //         console.log(data);
        //         let datatmp;
        //         try {
        //             datatmp = JSON.parse(data);
        //             //JSON.parse没问题的情况
        //             console.log(datatmp);
        //             if(datatmp.status === 'ok'){
        //                 message.success('修改成功');
        //                 //需要更新allRoomList中房间信息,如需要其他用户也及时收到改变信息需要发送websock消息
        //             }else {
        //                 message.error('修改失败');
        //             }
        //         }catch (e){
        //             //JSON.parse有问题的情况,手动截取返回信息中JSON字符串
        //             datatmp = JSON.parse(data.substring(data.indexOf('{')));
        //             console.log(datatmp);
        //             if(datatmp.status === 'ok'){
        //                 message.success('修改成功');
        //                 //需要更新allRoomList中房间信息
        //             }else {
        //                 message.error('修改失败');
        //             }
        //         }
        //
        //     }).catch(err=>{
        //     console.log(err);
        // });
        this.props.setVisible();
    }
    handleCancel(){
        this.props.setVisible();
    }
    onSelectHandle(record,selected,selectedRows){
        console.log(record);
        this.setState({objRoom:record});
    }
    upRoomOrder(){
        console.log('点击向上移动');
        let roomList = this.state.roomData,
            orderInfo={roomId:this.state.objRoom.roomId,type:'up'},
            newRoomList;
        if(roomList[0].roomId == orderInfo.roomId){
            message.warning('已经是第一个了，不能再往上移了');
            return ;
        }
        newRoomList = ajustRoomOrder(roomList,orderInfo);
        this.setState({roomData:newRoomList});
        let roomInfo = state.homeState.currentRoomInfo;
        let msg = {
            type:'msg',
            typeString:'changeRoomOrder',
            roomId:roomInfo.roomId,
            // roomName:roomInfo.roomName,
            user:state.homeState.userInfo,
            orderInfo:orderInfo,
            newRoomList:newRoomList
        };
        send(JSON.stringify(msg),function () {
            console.log('发送changeRoomOrder消息');
        });
    }
    downRoomOrder(){
        console.log('点击向下移动');
        let roomList = this.state.roomData,
            orderInfo={roomId:this.state.objRoom.roomId,type:'down'},
            newRoomList;
        if(roomList[roomList.length-1].roomId == orderInfo.roomId){
            message.warning('已经是最后一个了，不能再往下移了');
            return ;
        }
        newRoomList = ajustRoomOrder(roomList,orderInfo);
        this.setState({roomData:newRoomList});
        //通知其他人更新房间列表并，更新数据库
        let roomInfo = state.homeState.currentRoomInfo;
        let msg = {
            type:'msg',
            typeString:'changeRoomOrder',
            roomId:roomInfo.roomId,
            // roomName:roomInfo.roomName,
            user:state.homeState.userInfo,
            orderInfo:orderInfo,
            newRoomList:newRoomList
        };
        send(JSON.stringify(msg),function () {
            console.log('发送changeRoomOrder消息');
        });
    }
    render(){

        return (<div>
            <Modal className={'sort-room'}
                title='调整子房间顺序'
                okText={'确定'}
                cancelText={'取消'}
                visible={this.state.visible}
                onOk={() => this.handleOk()}
                onCancel={() => this.handleCancel()}
            >
                <Table
                    bordered
                    columns={this.state.columns}
                    dataSource={this.state.roomData}
                    pagination = {false}
                    scroll={{ y: 200 }}
                    rowSelection={{type:'radio',onSelect:this.onSelectHandle}}
                />
                <br/>
                <div><span><Button onClick={()=>this.upRoomOrder()}>上移</Button></span><span><Button  onClick={()=>this.downRoomOrder()}>下移</Button></span></div>
            </Modal>
        </div>);
    }
}

export default SortRoom;
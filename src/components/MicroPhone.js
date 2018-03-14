import React,{ Component }  from 'react'
import { Select, List, Icon, Modal, message } from 'antd';
import store, {CONSTANT} from "../reducer/reducer";
import { send } from "../static/webSocket";
import { ajustUserOrder } from  '../static/comFunctions';
import {getImgApi} from "../static/apiInfo";
const Option = Select.Option;

let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});
class MicroPhone extends React.Component {
    componentDidMount(){
        setTimeout(function () {
            let userData = state.homeState.roomMicrophoneUser;
            //更换第一个用户的头像
            if(userData[0].fileId){
                //根据请求获取用户头像
                fetch(getImgApi+userData[0].fileId+".dat")
                    .then(res=>{/*console.log(res)*/return res.text()})
                    .then(data=>{
                        store.dispatch({type:CONSTANT.FIRSTUSERAVATAR,val:data});
                    })
                    .catch(e=>console.error(e))
            }
        },500);
    }
    handleChange(e){
        // let microphoneMode = 1;
        let Msg = {
            type:'msg',
            typeString:'microphoneMode',
            roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
            roomName: state.homeState.currentRoomInfo.roomName,
            user:state.homeState.userInfo
        };
        console.log(e);
        if(e === '自由模式'){
            Msg.microphoneMode = 1;
        }
        if(e === '主席模式'){
            Msg.microphoneMode = 2;
        }
        if(e === '麦序模式'){
            Msg.microphoneMode = 3;
        }
        send(JSON.stringify(Msg),function () {
            // console.log('microphoneMode changed and send to others');
            let roomInfo = state.homeState.currentRoomInfo;
            if(roomInfo.microphoneMode !==  Msg.microphoneMode){
                roomInfo.microphoneMode =  Msg.microphoneMode;
                let setRoomMsg = {
                    type:'set_room_info',
                    roomId: roomInfo.roomId,		//房间唯一标识符
                    roomName: roomInfo.roomName,
                    user:state.homeState.userInfo,
                    data:roomInfo
                };
                send(JSON.stringify(setRoomMsg),function(){
                    console.log('更新服务器microphoneMode信息');
                });
            }
        });
        store.dispatch({type:CONSTANT.MICROPHONEMODE,val:Msg.microphoneMode});
    }
    onClickHandle(e){
        console.log('onClick');
        if(state.homeState.microphoneMode != 3)return;//如果不是麦序模式，则直接返回
        let text = e.target.innerText;
        const powerArr = ['放麦','离麦','禁麦'];
        const tips = (text) =>{
            Modal.info({
                title:'系统提示',
                content: (
                    <div>
                        <p>{text}</p>
                    </div>
                ),
                onOk() {},
            });
        };
        //如果自己已经在排序，则给出提示并返回
        let filter = false;
        let roomInfo = state.homeState.currentRoomInfo,
            roomMicrophoneUser = state.homeState.roomMicrophoneUser;
        console.log(text);
        switch (text){
            case '放麦':
                if(text === '放麦') {
                    // console.log(roomMicrophoneUser);
                    // console.log(roomInfo);
                    roomMicrophoneUser.map(function (item) {
                        if (item.id === state.homeState.userInfo.id) {
                            filter = true;
                            tips('您已经在排序了，请耐性等待');
                        }
                    });
                    if (!filter) {
                        console.log('MIC:');
                        roomMicrophoneUser.push(state.homeState.userInfo);
                    }
                }
                break;
            case '禁麦':
                //管理员才可禁麦
                if(state.homeState.userInfo.level > 3){
                    tips('只有管理才可以禁麦！');
                    return;
                }
                if(roomMicrophoneUser.length === 0){
                    tips('麦序上没有人');
                    return;
                }
                if(roomInfo.onMicrophoneUsers[0]){
                    roomMicrophoneUser = roomMicrophoneUser.slice(1);//将第一个上麦的人kill掉
                }
                break;
            case '离麦':
                filter = true;
                if(roomMicrophoneUser.length === 0){
                    tips('您不在麦序');
                    return;
                }
                // console.log(state.homeState.roomMicrophoneUser);
                roomMicrophoneUser.map(function(item){
                    // console.log(typeof item.id+','+typeof state.homeState.userInfo.id);
                    if(item.id === state.homeState.userInfo.id){
                        filter = false;
                    }
                    return item;
                });
                roomMicrophoneUser = roomMicrophoneUser.filter(function(item){
                    return item.id !== state.homeState.userInfo.id;
                });
                if(filter){
                    tips('您不在麦序');
                }
                break;
        }
        if(filter) return;
        roomInfo.onMicrophoneUsers = roomMicrophoneUser;
        let setRoomMsg = {
            type:'set_room_info',
            roomId: roomInfo.roomId,		//房间唯一标识符
            roomName: roomInfo.roomName,
            user:state.homeState.userInfo,
            data:roomInfo
        };
        send(JSON.stringify(setRoomMsg),function(){
            console.log('更新服务器onMicrophoneUsers信息');
        });
        let micrpMsg = {
            type:'msg',
            typeString:text,
            roomId: roomInfo.roomId,		//房间唯一标识符
            roomName: roomInfo.roomName,
            user:state.homeState.userInfo
        };
        // console.log(micrpMsg);
        send(JSON.stringify(micrpMsg),function(){console.log('发送 '+text+' 消息')});
    }
    getMicModeText() {
        // console.log('进入getMicModeText');
        let micMode = state.homeState.microphoneMode,result;
        if(micMode == 1){
            result = '自由模式';
        }else if(micMode == 2){
            result = '主席模式';
        }else if(micMode == 3){
            result = '麦序模式';
        }else{
            result = '自由模式';//错误情况
        }
        // console.log(result);
        return result;
    }
    upMicrophoneOrder(e){
        if(state.homeState.userInfo.level > 3){
            message.info('您没有权限');
            return;
        }
        let onMicUsers = state.homeState.roomMicrophoneUser;
        console.log(onMicUsers);
        console.log(onMicUsers[0]);
        if(onMicUsers.length <= 1 || onMicUsers[0].id == e.target.dataset.uid ){
            message.info('已经是第一了，无需上移');
            return;
        }
        // let newOnMicUsers = upUserOrder(onMicUsers,e.target.dataset.uid);
        //发消息给其他人
        let orderInfo = {type:'up',userId:e.target.dataset.uid};
        let msg = {
            type:'msg',
            typeString:'changeMicOrder',
            roomId:state.homeState.currentRoomInfo.roomId,
            roomName:state.homeState.currentRoomInfo.roomName,
            user:state.homeState.userInfo,
            orderInfo:orderInfo
        };
        send(JSON.stringify(msg),function () {
            console.log('发送调整麦序消息');
        })
    }
    downMicrophoneOrder(e){
        if(state.homeState.userInfo.level > 3){
            message.info('您没有权限');
            return;
        }
        let onMicUsers = state.homeState.roomMicrophoneUser;
        console.log(onMicUsers);
        if(onMicUsers[onMicUsers.length-1].id == e.target.dataset.uid){
            message.info('已经是最后一个，无需上移');
            return;
        }
        //发消息给其他人
        let orderInfo = {type:'down',userId:e.target.dataset.uid};
        let msg = {
            type:'msg',
            typeString:'changeMicOrder',
            roomId:state.homeState.currentRoomInfo.roomId,
            roomName:state.homeState.currentRoomInfo.roomName,
            user:state.homeState.userInfo,
            orderInfo:orderInfo
        };
        send(JSON.stringify(msg),function () {
            console.log('发送调整麦序消息');
        })
    }
    render(){
        return (<div className='microphone-a'>
            {/*头像区域*/}
            <div className="avatar-area" >
                <img src={state.homeState.firstUserAvatar?state.homeState.firstUserAvatar:'./images/avatar.png'} />
                <p className='user-name'>
                    {state.homeState.roomMicrophoneUser[0]?state.homeState.roomMicrophoneUser[0].name:'暂无人员'}
                    </p>
            </div>
            <div className='online-total'>上麦总人数：{state.homeState.roomMicrophoneUser.length}</div>
            <div className='microphone'>
                <Select size={'small'}
                        disabled={(state.homeState.userInfo.level < 4) ? false : true}
                        defaultValue={'自由模式'}
                        value={this.getMicModeText()}
                        onChange={e => {this.handleChange(e)}}>
                    <Option value="自由模式">自由模式</Option>
                    <Option value="主席模式">主席模式</Option>
                    <Option value="麦序模式">麦序模式</Option>
                </Select>
                <span onClick={e=>this.onClickHandle(e)}> <span className={state.homeState.microphoneMode != 3 ? 'disabled':''}>放麦</span> |</span>
                <span onClick={e=>this.onClickHandle(e)}> <span className={state.homeState.microphoneMode != 3 ? 'disabled':''}>禁麦</span> |</span>
                <span onClick={e=>this.onClickHandle(e)}> <span className={state.homeState.microphoneMode != 3 ? 'disabled':''}>离麦</span></span>
            </div>
            <div className='microphone-list'>
                <List
                    size='small'
                    dataSource={state.homeState.roomMicrophoneUser}
                    renderItem={item => (<List.Item>
                        <span className={'microphone-user-span'}>
                            <span><Icon className='list-icon' type="user" />{item.name}</span>
                            <span>
                                <span onClick={e=>this.upMicrophoneOrder(e)} title={'向上移'} className={'arrow-up-span'}><Icon data-uid={item.id}  type="arrow-up" /></span>
                                <span onClick={e=>this.downMicrophoneOrder(e)} title={'向下移'} className={'arrow-down-span'}><Icon data-uid={item.id} type="arrow-down" /></span>
                            </span>
                        </span>
                    </List.Item>)}
                />
            </div>
        </div>)
    }
}

export default MicroPhone;
import React,{ Component }  from 'react'
import { Select, List, Icon,Modal } from 'antd';
import store, {CONSTANT} from "../reducer/reducer";
import WS, {getDateString, getSendData, send} from "../static/webSocket";
import { prepareConnection, onAnswer,  onCandidate, onOffer, startPeerConnection } from  '../webrtc/webRtcCom';
const Option = Select.Option;

let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});
class MicroPhone extends React.Component {
    handleChange(e){
        let mode = 1;
        let Msg = {
            type:'msg',
            typeString:'microphoneMode',
            roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
            roomName: state.homeState.currentRoomInfo.roomName,
            user:state.homeState.userInfo
        };
        console.log(e);
        if(e === '自由模式'){
            Msg.mode = 1;
        }
        if(e === '主席模式'){
            Msg.mode = 2;
        }
        if(e === '麦序模式'){
            Msg.mode = 3;
        }
        send(JSON.stringify(Msg),function () {
            console.log('microphoneMode changed and send to others');
        });
        store.dispatch({type:CONSTANT.MICROPHONEMODE,val:mode});
    }
    onClickHandle(e){
        if(state.homeState.microphoneMode != 3)return;//如果不是麦序模式，则直接返回
        let text = e.target.innerHTML;
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
        powerArr.map(function(item){
            if(text.indexOf(item) !== -1){
                //如果自己已经在排序，则给出提示并返回
                let filter = false;
                if(item === '放麦'){
                    state.homeState.roomMicrophoneUser.map(function(item){
                        if(item.id === state.homeState.userInfo.id){
                            filter = true;
                            tips('您已经在排序了，请耐性等待');
                        }
                    });
                    let Msg = {
                        type:'msg',
                        typeString:'webrtc',
                        roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                        roomName: state.homeState.currentRoomInfo.roomName,
                        user:state.homeState.userInfo
                    };
                }
                if(item === '禁麦'){
                    //管理员才可禁麦
                }
                if(item === '离麦'){
                    filter = true;
                    if(state.homeState.roomMicrophoneUser.length === 0){
                        tips('您不在麦序');
                        return;
                    }
                    // console.log(state.homeState.roomMicrophoneUser);
                    state.homeState.roomMicrophoneUser.map(function(item){
                        // console.log(typeof item.id+','+typeof state.homeState.userInfo.id);
                        if(item.id === state.homeState.userInfo.id){
                            filter = false;
                        }
                    });
                    if(filter){
                        tips('您不在麦序');
                    }
                }
                if(filter) return;
                let micrpMsg = {
                    type:'msg',
                    typeString:item,
                    roomId: state.homeState.currentRoomInfo.roomId,		//房间唯一标识符
                    roomName: state.homeState.currentRoomInfo.roomName,
                    user:state.homeState.userInfo
                };
                // console.log(micrpMsg);
                send(JSON.stringify(micrpMsg),function(){});
            }
        })
    }
    render(){
        return (<div className='microphone-a'>
            {/*头像区域*/}
            <div className="avatar-area" >
                <img src='./images/avatar.png' />
                <p className='user-name'>
                    {state.homeState.roomMicrophoneUser[0]?state.homeState.roomMicrophoneUser[0].name:'暂无人员'}
                    </p>
            </div>
            <div className='online-total'>上麦总人数：{state.homeState.roomMicrophoneUser.length}</div>
            <div className='microphone' onClick={e=>this.onClickHandle(e)}>
                <Select size={'small'} disabled={(state.homeState.userInfo.level < 4) ? false : true} defaultValue='自由模式' onChange={e => {this.handleChange(e)}}>
                    <Option value="自由模式">自由模式</Option>
                    <Option value="主席模式">主席模式</Option>
                    <Option value="麦序模式">麦序模式</Option>
                </Select>
                <span> <span className={state.homeState.microphoneMode != 3 ? 'disabled':''}>放麦</span> |</span>
                <span> <span  className={state.homeState.microphoneMode != 3 ? 'disabled':''}>禁麦</span> |</span>
                <span> <span  className={state.homeState.microphoneMode != 3 ? 'disabled':''}>离麦</span></span>
            </div>
            <div className='microphone-list'>
                <List
                    size='small'
                    dataSource={state.homeState.roomMicrophoneUser}
                    renderItem={item => (<List.Item><Icon className='list-icon' type="user" />{item.name}</List.Item>)}
                />
            </div>
        </div>)
    }
}

export default MicroPhone;
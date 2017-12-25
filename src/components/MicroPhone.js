import React,{ Component }  from 'react'
import { Select, List, Icon,Modal } from 'antd';
import store, {CONSTANT} from "../reducer/reducer";
import WS,{ send } from  '../static/wsInstace.js';
const Option = Select.Option;

let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    // console.log(store.getState())
});

class MicroPhone extends React.Component {
    componentDidMount(){
        //这里需要获取每个房间的麦序列表，有多少人在麦
        /*let userData = state.homeState.roomMicrophoneUser;
        console.log(state.homeState.roomMicrophoneUser);
        // userData.push(dataJson.user);
        store.dispatch({type:CONSTANT.ROOMMICROPHONEUSER,val:userData});*/
    }
    handleChange(e){
        console.log(e)
    }
    onClickHandle(e){
        let text = e.target.innerHTML;
        const powerArr = ['放麦','离麦','禁麦'];
        const noPowerArr = ['主席模式','麦序模式','自由模式'];
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
        noPowerArr.map(function(item){
            if(text.indexOf(item) !== -1){
                tips('您没有权限');
                return;
            }
        });
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
                    console.log(state.homeState.roomMicrophoneUser);
                    state.homeState.roomMicrophoneUser.map(function(item){
                        console.log(typeof item.id+','+typeof state.homeState.userInfo.id);
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
                    roomId: state.homeState.currentRoomInfo.id,		//房间唯一标识符
                    roomName: state.homeState.currentRoomInfo.title,
                    user:state.homeState.userInfo
                };
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
                <Select size={'small'} disabled={(state.homeState.userInfo.level <= 7) ? false : true} defaultValue='主席模式' onChange={e => {this.handleChange(e)}}>
                    <Option value="主席模式">主席模式</Option>
                    <Option value="麦序模式">麦序模式</Option>
                    <Option value="自由模式">自由模式</Option>
                </Select>
                <span> <span>放麦</span> |</span>
                <span> <span>禁麦</span> |</span>
                <span> <span>离麦</span></span>
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
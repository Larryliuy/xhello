import React,{ Component } from 'react';
import { Menu,Icon,Button } from 'antd';
import store,{ CONSTANT } from '../reducer/reducer';
import '../static/login.scss'

let state = store.getState();
store.subscribe(function () {
    state = store.getState();
    console.log(store.getState())
});
let tRoomStatus = {};
class ChannelList extends React.Component{
    constructor(props){
        super(props);
        this.state = {data:[],roomStatus:{}};
    }
    componentDidMount(){
        const datas = [
            {title:'房间1',id:1,living:false,online:5,childNode:[
                    {title:'用户1',id:1,level:1,sex:1},
                    {title:'用户2',id:2,level:2,sex:2},
                    {title:'用户3',id:3,level:3,sex:1}
                ]},
            {title:'房间2',id:2,living:true,online:10,childNode:[
                    {title:'用户4',id:4,level:4,sex:2},
                    {title:'用户5',id:5,level:5,sex:1},
                    {title:'用户6',id:6,level:6,sex:2}
                ]},
            {title:'房间3',id:3,living:false,online:5,childNode:[]},
            {title:'房间4',id:4,living:false,online:10,childNode:[]}
        ];
        datas.map(function(item){
            // console.log(item.id == state.homeState.currentRoomInfo.id);
            if(item.id == state.homeState.currentRoomInfo.id){
                tRoomStatus[item.id] = true;
            }else{
                tRoomStatus[item.id] = false;
            }
            return item;
        });
        // console.log(tRoomStatus);
        this.setState({data:datas,roomStatus:tRoomStatus});
        // console.log(this.state.roomStatus);
        // console.log(this.state)
    }

    dblClickHandle = (event) =>{
        let roomId = event.target.getAttribute('id');
        //权限不够给提示
        //参数：roomId
        //返回值：data
        // console.log(channelId);

        //进入房间，更新当前房间信息
        let tDatas = this.state.data.map(function(item){
            if(item.id == roomId){
                //修改当前房间信息并添加自己到当前用户中
                item.childNode.push({title:'larry',id:7,level:1,sex:1});
                store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:{id:item.id,online:item.online,living:item.living}});
            }else{
                //删除其他房间的自己
                item.childNode = item.childNode.filter(function(user){
                    return user.id != 7
                });
                console.log(item.childNode)
            }
            return item;

        });

        let tRoomState = this.state.roomStatus;
        if(!this.state.roomStatus[roomId]){
            tRoomState[roomId] = true;
        }
        this.setState({data:tDatas,roomStatus:tRoomState});
        // console.log(state)
    };
    rightClickHandle = (e) =>{
        if(e.button == 2){
            const id = e.target.getAttribute('id');
            if(id.length == 1){
                // alert('创建频道列表')
                //弹出创建频道列表
            }
            if(id.length == 3){
                // alert('创建房间列表，修改房间信息等')
                //弹出创建房间或子房间列表
            }
            console.log('right')
        }
    };
    clickOpenHandle  = (e) => {
        const roomId = e.target.parentNode.parentNode.getAttribute('id');
        let tRoomState = this.state.roomStatus;
        if(this.state.roomStatus[roomId]){
            tRoomState[roomId] = false;
        }else{
            tRoomState[roomId] = true;
        }
        this.setState({roomStatus:tRoomState});
            //打开本地房间列表
        console.log(this.state.roomStatus);
    };
    render(){
        const { data, roomStatus } = this.state;
        const clickOpenHandle = this.clickOpenHandle;
        const getUserIconSrc = (sex,level) =>{
            let src = '';
            switch(level){
                case 1:
                    if(sex === 1){
                        src = 'p_man.png';
                    }else{
                        src = 'p_female.png';
                    }
                    break;
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
            }
            return "./images/icons/"+src;
        };
        return (
            <div style={{paddingLeft:'20px',width:240,height:'100%'}}
                 onDoubleClick={this.dblClickHandle}
                 onMouseDown={this.rightClickHandle}
                 className='channel-list'
            >
                <ul>
                {data.map(function (item) {
                    return <li id={item.id} key={item.id}>
                        <span onClick={clickOpenHandle}><Icon type={roomStatus[item.id] ?"minus" : "plus"} /> </span>
                        {item.title}
                        {roomStatus[item.id] && item.childNode &&
                        <ul style={{paddingLeft:'10px'}}>
                            {item.childNode.map(function (item) {
                                return <li id={item.id} key={item.id}>
                                    <span className='user-icon'><img src={getUserIconSrc(item.sex,item.level)} /></span> {item.title}
                                    </li>
                            })}
                        </ul>}
                        </li>
                })}
                </ul>
            </div>
        )
    }
};

export default ChannelList;

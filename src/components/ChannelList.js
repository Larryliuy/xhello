import React,{ Component } from 'react';
import { Menu,Icon,Button } from 'antd';
import store,{ collapsed } from '../reducer/reducer';
const SubMenu = Menu.SubMenu;
import '../static/login.scss'

let state = store.getState().homeState[0];
/*store.subscribe(function () {
    state = store.getState().homeState[0]
    console.log(store.getState())
});*/
class ChannelList extends React.Component{
    /*state = {
        collapsed: false,
    }*/
    constructor(props){
        super(props)
        this.state = {data:[],currentInfo:{channel:1,room:1}};
    }
    componentDidMount(){
        const datas = [
            {title:'频道1',key:'1',childNode:[
                    {title:'子频道1',key:'1-1',childNode:[]},
                    {title:'子频道2',key:'1-2',childNode:[]},
                    {title:'子频道3',key:'1-3'}
                ]},
            {title:'频道2',key:2,childNode:[
                    {title:'子频道2',key:'2-1',childNode:[]},
                    {title:'子频道2',key:'2-2',childNode:[]},
                    {title:'子频道3',key:'2-3'}
                ]},
            {title:'频道3',key:3,childNode:[]},
            {title:'频道4',key:4,childNode:[]}
        ];
        this.setState({collapsed:false,data:datas})
    }

    dblClickHandle = (event) =>{
        let channelId = event.target.getAttribute('id');
        //权限不够给提示
        //参数：channelID，roomId
        //返回值：data
        console.log(channelId);
        this.setState({currentInfo:{channel:channelId,room:1}})
        console.log(this.state)
    }
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
    }
    clickOpenHandle  = (e) => {
        const roomId = e.target.parentNode.parentNode.getAttribute('id')
        console.log(roomId)
        console.log(e.target.parentNode.parentNode)
        this.setState({currentInfo:{channel:roomId,room:1}})
        if(roomId == this.state.currentInfo.channel &&
            this.state.currentInfo.channel !== 0){
            this.setState({currentInfo:{channel:0,room:1}})
        }
    }
    render(){
        const { currentInfo, data } = this.state;
        const clickOpenHandle = this.clickOpenHandle

        return (
            <div style={{paddingLeft:'20px',width:240,height:'100%'}}
                 onDoubleClick={this.dblClickHandle}
                 onMouseDown={this.rightClickHandle}
                 className='channel-list'
            >
                <ul>
                {data.map(function (item) {
                    return <li id={item.key} key={item.key}>
                        <span onClick={clickOpenHandle}><Icon type={currentInfo.channel == item.key ?"minus" : "plus"} /> </span>
                        {item.title}
                        {item.key == currentInfo.channel && item.childNode && <ul style={{paddingLeft:'10px'}}>
                            {item.childNode.map(function (item) {
                                return <li id={item.key} key={item.key}>
                                    <Icon type="user" /> {item.title}
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
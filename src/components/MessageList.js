import React,{ Component } from 'react';
import { List, Avatar, message } from 'antd';
import WS, {send, timeStamp} from "../static/wsInstace";
import store from "../reducer/reducer";
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
});
class MessageList extends React.Component{
    constructor(props) {
        super(props);
        this.state={
            top:'0px',
            left:'0px',
            display:'none',
            timeStamp:0,
        }
    }
    componentDidMount(){

    }
    rightClickHanle(e){
        //副房主以下级别没有撤回消息权限
        if(state.homeState.userInfo.level > 3)return;
        if(e.button === 2){
            let msgDiv = null;
            if(e.target.nodeName === 'P'){
                // console.log(e.target.parentNode);
                msgDiv = e.target.parentNode;
            }else if(e.target.nodeName === 'IMG'){
                msgDiv = e.target.parentNode.parentNode;
            }else{
                msgDiv = e.target.parentNode.parentNode || {id:false};
                console.log(msgDiv);
            }
            if(msgDiv.id){
                let timestampMsg =msgDiv.id.substring(msgDiv.id.indexOf('id')+2);
                //如果消息不是自己发的则返回
                if(parseInt(msgDiv.id) !== parseInt(state.homeState.userInfo.id))return;
                //如果发送消息时间超过一分钟则返回
                if(new Date().getTime() - parseInt(timestampMsg) > 60000){
                    console.log('over');
                    console.log(new Date().getTime());
                    return;
                }
                this.setState({display:'block',top:e.clientY+10,left:e.clientX,timeStamp:timestampMsg});
            }
        }
    }
    withdrawHandle(){
        this.setState({display:'none'});
        let micrpMsg = {
            type:'msg',
            typeString:'withdraw',
            roomId: state.homeState.currentRoomInfo.roomId,		//房 间唯一标识符
            roomName: state.homeState.currentRoomInfo.roomName,
            user:state.homeState.userInfo,
            timeStamp:this.state.timeStamp
        };
        send(JSON.stringify(micrpMsg),function(){
            message.success('撤回成功');
        });
    }
    render(){
        return (<div><List
            size="small"
            itemLayout="horizontal"
            dataSource={this.props.data}
            renderItem={item => (
                <List.Item>
                    <List.Item.Meta
                        avatar={<Avatar src="./images/avatar.png" />}
                        title={<p>{item.userName} {item.time}</p>}
                        description={<div onMouseDown={e=>this.rightClickHanle(e)}
                                          id={item.timeStamp && item.userId +'id' + item.timeStamp}
                                          dangerouslySetInnerHTML={{__html:item.data}} />}
                    />
                </List.Item>
            )}
        />
            <div id={'withdraw'}
                 onClick={()=>this.withdrawHandle()}
                 style={{top:this.state.top,left:this.state.left,display:this.state.display}}>撤回消息</div>
        </div>)
    }
}


export default MessageList;

/*
注明：dangerouslySetInnerHTML需要对内容做<script>和HTML注释给escape一下
function  escape(str){
    str.replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--');
}*/

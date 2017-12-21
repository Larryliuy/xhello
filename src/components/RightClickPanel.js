import React,{ Component } from 'react';
import { Card, Popover, List } from 'antd';
import CreateRoom from './CreateRoom';




class RightClickPanel extends React.Component{
    constructor(props){
        super(props);
        this.state = {display:'none',operate:[],createRoom:false}
    }
    setCreateRoomVisible(){
        this.setState({createRoom:false})
    }
    componentWillMount(){
        // this.setState({operate:operateData});
    }
    mouseOverHandle(e){
        //鼠标进入选项时弹出相应的操作
        let _this = this;
        if(e.target.getAttribute('class').indexOf('ant-list-item') === 0){
            let text = e.target.firstChild.innerText || e.target.innerText;
            // console.log(text);
            //没有联级菜单的不显示
            if(text.indexOf('移动') === -1 && text.indexOf('房间') === -1 && text.indexOf('排序') === -1){
                this.props.listData.map(function(item){
                    if(item.title === text){
                        _this.setState({display:'block',operate:item.operate});
                    }
                });
            }else{
                _this.setState({display:'none'});
            }
        }
    }
    clickHandle(e){
        let _this = this;
        if(e.target.getAttribute('class').indexOf('ant-list-item') === 0) {
            let text = e.target.firstChild.innerText || e.target.innerText;
            console.log(text);
            switch(text){
                case '移动到本房间':
                    //移动时需要确认
                    alert(text);
                    break;
                case '封IP':
                    alert(text);
                    break;
                case '封ID':
                    alert(text);
                    break;
                case '禁止此人图片':
                    alert(text);
                    break;
                case '禁止此人语音':
                    alert(text);
                    break;
                case '禁止此人文字':
                    alert(text);
                    break;
                case '一级管理员':
                    alert(text);
                    break;
                case '二级管理员':
                    alert(text);
                    break;
                case '副房主':
                    alert(text);
                    break;
                case 'VIP':
                    alert(text);
                    break;
                case '会员':
                    alert(text);
                    break;
                case '撤销级别':
                alert(text);
                break;
                case '禁止图片':
                    alert(text);
                    break;
                case '禁止语音':
                    alert(text);
                    break;
                case '禁止文字':
                    alert(text);
                    break;
                case '新建房间':
                    // alert(text);
                    _this.setState({createRoom:true});
                    break;
                case '删除房间':
                    alert(text);
                    break;
                case '房间设置':
                    alert(text);
                    break;
                case '排序':
                    //选中获取元素id（即房间id），然后建一个临时AllRoomList用于更新排序列表，
                    // 点确定按钮更新到state.homeState.allRoomList.
                    alert(text);
                    break;
                default:
                    break;
            }
        }
    }
    render(){

        return (<div className={'right-click'}
                     onClick={e => this.clickHandle(e)}>

                    <Card bodyStyle={{padding:0}}>

                    <List
                        onMouseOver={e=>this.mouseOverHandle(e)}

                        className={'right-panel'}
                        size="small"
                        bordered
                        dataSource={this.props.listData}
                        renderItem={item => (<List.Item>{item.title}</List.Item>)}
                    /> </Card>
                    <Card bodyStyle={{padding:0,height:'100%',display:this.state.display}}>
                    <List
                        // onClick={e => this.clickHandle(e)}
                        className={'right-panel-item'}
                        size="small"
                        bordered
                        dataSource={this.state.operate}
                        renderItem={item => (<List.Item>{item}</List.Item>)}
                    /> </Card>
            {this.state.createRoom && <CreateRoom setVisible={this.setCreateRoomVisible.bind(this)}></CreateRoom>}

        </div>)
    }
}

export default RightClickPanel;
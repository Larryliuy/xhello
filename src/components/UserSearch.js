import React,{ Component } from 'react';
import { Input, Icon, message } from 'antd';
import SearchResult from './SearchResult';

import store ,{ CONSTANT } from "../reducer/reducer";

let state = store.getState();
store.subscribe(function(){
    state = store.getState();
});

let AllRoomData = [];
store.subscribe(function(){
    state = store.getState();
    AllRoomData = state.homeState.allRoomList;
});
class UserSearch extends React.Component{
    constructor(){
        super();
    }
    // 点击搜索处理
    changeSearchHandle(e){
        let resultData = [];
        // console.log(AllRoomData)
        AllRoomData.map(function(item){
            if(item.childNode.length !== 0){
                return item.childNode.filter(function(item){
                    if(item.name && item.name.indexOf(e.target.value) !== -1){
                        resultData.push(item);
                    }
                    return item.name && item.name.indexOf(e.target.value) !== -1
                });
            }else{
                return ;
            }
        });
        store.dispatch({type:CONSTANT.SEARCHKEYWORD,val:e.target.value});
        store.dispatch({type:CONSTANT.SEARCHRESULT,val:resultData});
    }
    // 定位自己
    clickLocationHandle(){
        let selfDom = document.getElementById(state.homeState.userInfo.id.toString());
        if(!selfDom) {
            message.warn('自己所在的房间未展开');
            return;
        }
        selfDom.scrollIntoView();
        selfDom.style.color = 'green';
    }
    render(){
        return (
            <div>
                <Input style={{marginLeft:'-10px',width:'180px'}}
                        placeholder="请输入用户名"
                        prefix={<Icon type="search" style={{ color: 'rgba(0,0,0,.25)' }} />}
                        onChange={value => this.changeSearchHandle(value)}
            />
                <span onClick={this.clickLocationHandle} style={{overflowX: 'hidden'}}><Icon className='icon-location' type="environment-o" /></span>
                <SearchResult data={state.homeState.resultData}></SearchResult>
            </div>)
    }
}

export default UserSearch;
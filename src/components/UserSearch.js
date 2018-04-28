import React,{ Component } from 'react';
import { Input, Icon, message } from 'antd';
import SearchResult from './SearchResult';

import store ,{ CONSTANT } from "../reducer/reducer";
import { getLocationBtUserId } from '../static/comFunctions';

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
                item.childNode.map(function (itm) {
                    if(itm.childNode.length !== 0){
                        return itm.childNode.filter(function(itm){
                            if(itm.name && itm.name.indexOf(e.target.value) !== -1){
                                resultData.push(itm);
                            }
                            return itm.name && itm.name.indexOf(e.target.value) !== -1
                        });
                    }else{
                        return ;
                    }
                })
            }
        });
        store.dispatch({type:CONSTANT.SEARCHKEYWORD,val:e.target.value});
        store.dispatch({type:CONSTANT.SEARCHRESULT,val:resultData});
    }
    // 定位自己
    clickLocationHandle(){
        let location = getLocationBtUserId(state.homeState.userInfo.id);
        console.log(location);
        setTimeout(function () {
            let selfDom = document.getElementById('u'+state.homeState.userInfo.id);
            if(!selfDom) {
                message.warn('未找到');
                return;
            }
            selfDom.scrollIntoView();
            selfDom.style.color = 'green';
        },200)
    }
    render(){
        return (
            <div>
                <input type="text" style={{position:'absolute',width:'1px',height:'1px',top:'-1px',left:'-1px'}} placeholder={"请输入用户名"}/>
                <input type="password" style={{position:'absolute',width:'1px',height:'1px',top:'-1px',left:'-1px'}} placeholder={"以上两个input只是解决Google浏览器自动填充问题"}/>
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
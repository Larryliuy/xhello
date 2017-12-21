import React,{ Component } from 'react';
import store ,{ CONSTANT } from "../reducer/reducer";
import { Popover } from 'antd';
import {message} from "antd/lib/index";
let state = store.getState();
store.subscribe(function(){
    state = store.getState();
});

class SearchResult extends React.Component{
    constructor(props){
        super(props);
    }
    componentDidMount(){
    }
    handleClickUser(e){
        console.log(e.target.id);
        //定位到id为e.target.id的元素位置;
        let selfDom = document.getElementById(e.target.id.toString());
        if(!selfDom) {
            message.error('用户所在的房间未展开或不在公共房间');
            return;
        }
        store.dispatch({type:CONSTANT.SEARCHKEYWORD,val:''});
        selfDom.scrollIntoView();
        selfDom.style.color = 'green';

    }
    render(){
        const content = (<ul className='result-ul' onClick={e => this.handleClickUser(e)}>
            {state.homeState.searchResult.length !== 0 ?
                state.homeState.searchResult.map(function(item){
                    return <li key={'result'+item.id} id={item.id}>{item.userName}</li>
                }):<li className='no-match'>没有匹配的用户</li>
            }
        </ul>);
        return (<div  className='search-box'>
            <Popover content={content}
                     placement="bottomRight"
                     visible = {state.homeState.searchKeyword ? true:false}
            >
            </Popover>
        </div>)
    }
}

export default SearchResult;
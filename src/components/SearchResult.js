import React,{ Component } from 'react';
import store ,{ CONSTANT } from "../reducer/reducer";
import { Popover } from 'antd';
import {message} from "antd/lib/index";
import {getLocationBtUserId} from "../static/comFunctions";
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
        let uId = e.target.id.substring(1);
        let location = getLocationBtUserId(uId);
        // console.log(e.target.id);
        setTimeout(function () {
            //定位到id为e.target.id的元素位置;
            let selfDom = document.getElementById('u'+uId);
            if(!selfDom) {
                message.error('未找到或用户已下线');
                return;
            }
            // console.log(selfDom);
            store.dispatch({type:CONSTANT.SEARCHKEYWORD,val:''});
            selfDom.scrollIntoView();
            selfDom.style.color = 'green';
        },200);


    }
    render(){
        const content = (<ul className='result-ul' onClick={e => this.handleClickUser(e)}>
            {state.homeState.searchResult.length !== 0 ?
                state.homeState.searchResult.map(function(item){
                    return <li key={item.id} id={'s'+item.id}>{item.name}</li>
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
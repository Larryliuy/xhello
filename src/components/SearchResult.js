import React,{ Component } from 'react';
import store ,{ CONSTANT } from "../reducer/reducer";
import { Popover } from 'antd';
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
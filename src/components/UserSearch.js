import React,{ Component } from 'react';
import { Input, Icon } from 'antd';
const Search = Input.Search;

class UserSearch extends React.Component{
    clickSearchHandle(value){
        alert(value)
    }
    clickLocationHandle(){
    alert('location')
    }
    render(){
        return (
            <div><Search style={{marginLeft:'-10px',width:'190px'}} placeholder="input search text"
                        onSearch={value => this.clickSearchHandle(value)}
                        enterButton
            />
            <span onClick={this.clickLocationHandle}><Icon className='icon-location' type="environment-o" /></span>
            </div>)
    }
}

export default UserSearch
import React,{ Component } from 'react';
import UserSearch from '../components/UserSearch';

class UserSearchBox extends React.Component{
    render(){
        return (<div className="logo-slider">
            <UserSearch></UserSearch>
        </div>)
    }
}

export default UserSearchBox
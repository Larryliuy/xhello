import React,{Component} from 'react'
import {BrowserRouter, Route,Redirect, Link} from 'react-router-dom';
import Login from '../components/Login';
import cookieUtil from '../libs/cookieUtil';
import '../static/login.scss'
import store,{ CONSTANT } from "../reducer/reducer";

let state = store.getState();
store.subscribe(function () {
    state = store.getState()
});
const divStyle = {
    textAlign:'center !important',
    height:'100%',
    paddingTop: 'calc(100px + 15%)'
};


class LoginBox extends React.Component {
    state = {
        login:false,
        data:''
    };
    handleLogin(bool,data){
        this.setState({login:bool,data:data});
        location.replace("#/home");
        store.dispatch({type:CONSTANT.USERINFO,val:{id:data.id,name:data.name,sex:parseInt(data.sex),level:parseInt(data.level),limit:data.limit,avatar:'./images/avatar.png'}});
    }
    componentDidMount(){
        if(cookieUtil.get('userName') && cookieUtil.get('password')){
            this.setState({login:true,data:cookieUtil.get('userData')})
        }
    }
    render(){
        return(
        <div style={divStyle}>
            <Login login ={this.handleLogin.bind(this)}/>
        </div>
    )}
}
export default LoginBox;
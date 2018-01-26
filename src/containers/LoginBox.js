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
    constructor(props){
        super(props)
    }
    state = {
        login:false,
        data:''
    };
    handleLogin(bool,data){
        if(!this.refs.loginRef) return;
        this.setState({login:bool,data:data});
        store.dispatch({type:CONSTANT.USERINFO,val:{id:data.id,name:data.name,sex:parseInt(data.sex),level:parseInt(data.level),limit:data.limit,avatar:'./images/avatar.png',maxChildren:2,Children:[]}});
        location.replace("#/home");
    }
    componentDidMount(){
        // if(cookieUtil.get('userName') && cookieUtil.get('password')){
        //     this.setState({login:true,data:cookieUtil.get('userData')})
        // }
        //uri参数截取函数
        function GetQueryString(str,key) {
            let reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
            let r = str.match(reg);
            if (r != null) return decodeURI(r[2]);
            return null;
        }
        if(this.props.location.search.indexOf('invited=') !== -1){
            // let queryStr = location.href.substring(location.href.indexOf('invited')+8);
            let username = GetQueryString(this.props.location.search,'userName');
            console.log(username)
        }
    }
    render(){
        // console.log(this.props.match);
        // console.log(this.props.location);
        return(
        <div ref={'loginRef'} style={divStyle}>
            <Login login ={this.handleLogin.bind(this)}/>
        </div>
    )}
}
export default LoginBox;
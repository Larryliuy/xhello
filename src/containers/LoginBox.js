import React,{Component} from 'react'
import Login from '../components/Login';
import '../static/login.scss'
import { getImgApi } from '../static/apiInfo';
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
        // console.log(data);
        if(!this.refs.loginRef) return;
        this.setState({login:bool,data:data});
        let userInfo = {};
        userInfo = {
            id:data.id,
            name:data.name,
            sex:parseInt(data.sex),
            level:parseInt(data.level),
            limit:data.limit,
            fileId:data.fileId,
            avatar:'./images/avatar.png',
            maxChildren:2,Children:[]
        };
        // if(data.fileId){
        //     //根据请求获取用户头像
        //     fetch(getImgApi+data.fileId+".dat")
        //         .then(res=>{/*console.log(res)*/return res.text()})
        //         .then(data=>{
        //             // console.log(data);
        //             // console.log(encodeURIComponent(data));
        //             userInfo.avatar = data ;
        //             store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
        //         })
        //         .catch(e=>console.error(e))
        // }else {
        //     userInfo.avatar = './images/avatar.png';
        store.dispatch({type:CONSTANT.USERINFO,val:userInfo});
        // }
        location.replace("#/home");
    }
    componentDidMount(){
        // if(cookieUtil.get('userName') && cookieUtil.get('password')){
        //     this.setState({login:true,data:cookieUtil.get('userData')})
        // }
        //uri参数截取函数
        // function GetQueryString(str,key) {
        //     let reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
        //     let r = str.match(reg);
        //     if (r != null) return decodeURI(r[2]);
        //     return null;
        // }
        // if(this.props.location.search.indexOf('invited=') !== -1){
        //     // let queryStr = location.href.substring(location.href.indexOf('invited')+8);
        //     let username = GetQueryString(this.props.location.search,'userName');
        //     console.log(username)
        // }
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
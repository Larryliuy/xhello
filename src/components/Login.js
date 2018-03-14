import React,{Component} from 'react';
import { Link } from 'react-router-dom';
import { Form, Icon, Input, Button, Checkbox, message } from 'antd';
const FormItem = Form.Item;
import cookieUtil from '../libs/cookieUtil';
import '../static/login.scss'
import { loginApi, redirect_uri, domian } from "../static/apiInfo";
import store,{CONSTANT} from "../reducer/reducer";
import { GetQueryString } from '../static/comFunctions';
// document.domain = domian;
const iconStyle = {
    width: '20px',
    height: '20px'
};

class Login extends React.Component {
    constructor(props){
        super(props);
        this.state = {wechatVisible:'hidden',userName:'',password:'',loginComponent:true}
    }
    componentDidMount(){
        // if(this.state.loginComponent){
        //     setTimeout(function () {
        //         let obj = new WxLogin({
        //             id:"we-chat",
        //             appid: "wx592e917bee49160b",
        //             scope: "snsapi_login",
        //             redirect_uri: 'http://www.xtell.cn'
        //         });
        //     },300);
        // }
        // console.log(document.domain);
    }
    componentWillMount(){
        let locationUrl = window.location.href,
            accessToken,_this=this,
            allQueryString = window.location.hash.substring(3);
        // console.log(allQueryString);
        //邀请登录
        if(locationUrl.indexOf('inviteCode=') !== -1){
            //这里做邀请登录的功能
            let inviteCode = GetQueryString(allQueryString,'inviteCode'),//截取URL中的invitedCode值
                userName = GetQueryString(allQueryString,'userName'),//截取URL中的userName值
                arg = 'LoginName='+userName+'&inviteCode='+inviteCode;
            // console.log(inviteCode);
            if(!inviteCode)return;
            fetch(loginApi,{
                method:'POST',
                // credentials: "include",
                headers:{
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body:arg//JSON.stringify(args)
            }).then((response) => {/*console.log(response);*/return response.text()})
                .then(data=>{
                    // console.log(data);
                    let datatmp = JSON.parse(data);
                    if(datatmp.status === 'ok'){
                        message.success('登录成功');
                        _this.props.login(true,{name:userName,level:datatmp.data.Type,id:datatmp.data.Id,sex:datatmp.data.Sex,limit:datatmp.data.Limit});
                    }else {
                        message.error('用户名与密码不匹配');
                        location.replace("#/home");
                    }

                }).catch(err=>{
                console.log(err);
                // props.login(true,{name:'haha',level:1,id:7,sex:2,limit:0});
            });
            return ;//如果是要请登录则不需要继续判断登录是否是快捷登录了
        }
        //QQ快捷登录
        if(locationUrl.indexOf('access_token=') !== -1){
            console.log('QQ login');
            accessToken = GetQueryString(allQueryString,'access_token');//截取URL中的code值
            // console.log(code);
            if(accessToken){
                _this.setState({loginComponent:false});
                cookieUtil.set('accessToken',accessToken);
                //使用Access Token来获取用户的OpenID
                let args = 'access_token='+accessToken+'&callback=callback';
                let path = "https://graph.qq.com/oauth2.0/me?";
                let url = path + args;
                let script = document.createElement('script');
                script.src = url;
                document.body.appendChild(script);
                //根据accessToken获取openID
                /*let args = 'access_token='+accessToken;
                fetch("https://graph.qq.com/oauth2.0/me?"+args)
                    .then((response) => {return response.text()})
                    .then(data=>{
                        console.log(data);
                        data = data.substring(10,data.length-4);
                        data = JSON.parse(data);
                        // console.log(data);
                        if(data.openid){
                            //openid 需要和用户绑定在一起
                            let clientId = data.client_id,
                                openId = data.openid,
                                args = 'access_token='+accessToken+'&oauth_consumer_key='+clientId+'&openid='+openId;
                            // console.log(clientId+','+openId);
                            fetch('https://graph.qq.com/user/get_user_info?'+args)
                                .then((response) => {return response.json()})
                                .then(data=>{
                                    //这里获取用户信息
                                    console.log(data);
                                    if(data.ret === 0){
                                        store.dispatch({type:CONSTANT.USERINFO,val:{id:openId,name:data.nickname,sex:data.gender === '男'?1:2,level:7,limit:0,avatar:data.figureurl_2,maxChildren:2,Children:[]}});
                                        location.replace("#/home");
                                    }
                                })
                                .catch(err=>{
                                    console.log(err);
                                })
                        }else {
                            message.error('openid为获取到');
                            location.replace("#/home");
                        }
                    })
                    .catch(err=>{
                        console.log(err);
                    });*/
                }
            }
    }
    handleSubmit(e){
        e.preventDefault();
        // console.log('register:'+userName)
    };
    onChangeUserName(e){
        // console.log('userName:' + e.target.value)
        this.setState({userName:e.target.value});
    };
    onChangePassword(e){
        // console.log('password:' + e.target.value)
        this.setState({password:e.target.value});
    };
    onClickHandle(){
        let userName = this.state.userName,
            password = this.state.password,
            _this = this;
        let arg = '?LoginName='+userName+'&Password='+password;
        // let args = {LoginName:userName,Password:password};
        // if('fetch' in window){
            fetch(loginApi+arg)
                .then((response) => {/*console.log(response);*/return response.json()})
              .then(data=>{
                  if(data.status === 'ok'){
                      message.success('登录成功');
                      _this.props.login(true,{name:userName,level:data.data.Type,id:data.data.Id,sex:data.data.Sex,limit:data.data.Limit,fileId:data.data.AvatarFileId});
                  }else {
                      message.error('用户名与密码不匹配');
                  }

              }).catch(err=>{
                  console.log(err);
              });

    };
    qqSpanHandle(){
        //https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=101454868&redirect_uri="+redirect_uri+"&state=test
        let url = 'https://graph.qq.com/oauth2.0/authorize?';
        let args = 'response_type=code&client_id=101454868&redirect_uri='+redirect_uri+'&state=test';
        fetch(url+args).then((response) => {
            console.log(response);
            console.log(response.location);
            location.replace(response.url);
            return response.text()})
            .then(data=>{
                // document.
                // history.back();
                // console.log(data)
            }).catch(err=>{
            console.log(err);
            // props.login(true,{name:'haha',level:1,id:7,sex:2,limit:0});
        });
    }
    onMouseHoverHandle(){
        console.log('hover');
        this.setState({wechatVisible:'visible'});
    }
    onMouseOutHandle(){
        this.setState({wechatVisible:'hidden'});
    }
    callback(user)
    {
        console.log(user);
    }
    render(){
        if(!this.state.loginComponent)return (<div style={{textAlign:'center'}}><p>正在验证中...,请稍候</p></div>);
        return (<Form onSubmit={this.handleSubmit} className="login-form">
                    <FormItem>
                        <Input id='user' onChange = {(e) => this.onChangeUserName(e)}
                               prefix={<Icon type="user" className={'login-form-input-logo'} />}
                               defaultValue={cookieUtil.get('loginChecked')=='true'?cookieUtil.get('userName'):''}  placeholder="Username" />
                    </FormItem>
                    <FormItem>
                        <Input id='pwd' onChange = {(e) => this.onChangePassword(e)}
                               prefix={<Icon type="lock" className={'login-form-input-logo'} />}
                               type="password" defaultValue={cookieUtil.get('loginChecked')=='true'?cookieUtil.get('password'):''} placeholder="Password" />
                    </FormItem>
                    <FormItem>
                        <Checkbox defaultChecked={cookieUtil.get('loginChecked')=='true'}
                                  onChange={(e)=>this.onChangeCheckBox(e)}
                                  style = {{float:'left'}}>记住密码</Checkbox>
                        {/*<a className="login-form-forgot" href="">忘记密码</a>*/}
                        <br/>
                        <Button type="primary" htmlType="submit" className="login-form-button" onClick={()=>this.onClickHandle()}>
                            登 录
                        </Button>
                        {/*Or <Link to="/register" >现在注册<Icon type="right"/></Link>
                        <Link to="/register" >忘记密码<Icon type="question"/></Link>*/}
                    </FormItem>
                    <FormItem>
                        <div className={'register-forget-box'}>
                        <Link to="/register" >现在注册<Icon type="right"/></Link>
                        <Link to="/register" >忘记密码<Icon type="question"/></Link>
                        </div>
                    </FormItem>
                    <div className='fast_login'>
                        <span className='icon_wechat' onMouseOver={()=>this.onMouseHoverHandle()}><Icon type="wechat" style={iconStyle}/></span>
                        <div id={'we-chat'} onMouseOut={()=>this.onMouseOutHandle()} style={{visibility:this.state.wechatVisible}}></div>
                        <span id={'qqSpan'} onClick={()=>this.qqSpanHandle()} className='icon_qq'><a href={"https://graph.qq.com/oauth2.0/authorize?response_type=token&client_id=101454868&redirect_uri="+redirect_uri+'&scope=get_user_info'}><Icon type="qq" style={iconStyle}/></a></span>
                        {/*<span id={'qqSpan'} onClick={()=>this.qqSpanHandle()} className='icon_qq'><a href={"#"}><Icon type="qq" style={iconStyle}/></a></span>*/}
                    </div>
            </Form>
        );
    }
}
export default Login;

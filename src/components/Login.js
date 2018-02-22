import React,{Component} from 'react';
import { Link } from 'react-router-dom';
import { Form, Icon, Input, Button, Checkbox, message } from 'antd';
const FormItem = Form.Item;
import cookieUtil from '../libs/cookieUtil';
import '../static/login.scss'
import { loginApi, redirect_uri, domian } from "../static/apiInfo";
import store,{CONSTANT} from "../reducer/reducer";
import { GetQueryString } from '../static/comFunctions';
document.domain = domian;
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
        console.log(document.domain);
    }
    componentWillMount(){

        let locationUrl = window.location.href,
            code,accessToken,_this=this,
            allQueryString = locationUrl.substring(locationUrl.indexOf('?')).substr(1);
        //邀请登录
        if(locationUrl.indexOf('inviteCode=') !== -1){
            //这里做邀请登录的功能
            let inviteCode = GetQueryString(allQueryString,'inviteCode'),//截取URL中的invitedCode值
                userName = GetQueryString(allQueryString,'userName'),//截取URL中的userName值
                arg = 'LoginName='+userName+'&inviteCode='+inviteCode;
            console.log(inviteCode);
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
                    // try {
                    //     datatmp = JSON.parse(data);
                    //JSON.parse没问题的情况
                    // console.log(datatmp);
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
        if(locationUrl.indexOf('code=') !== -1 && locationUrl.indexOf('inviteCode=') === -1){
                // console.log(ev.oldURL);
                // locationUrl = ev.oldURL;
                code = GetQueryString(allQueryString,'code');//截取URL中的code值
                // console.log(code);
                if(code){
                    _this.setState({loginComponent:false});
                    let args = 'grant_type=authorization_code&client_id=101454868&client_secret=4811cade40988ad7094119ef56f9a5bd&code='+code+'&redirect_uri='+redirect_uri;
                    //获取access token值
                    fetch('https://graph.qq.com/oauth2.0/token?'+args, {method:"GET",mode: 'cors'})
                        .then((response) => {console.log(response);return response.text()})
                        .then(data=>{
                            console.log(data);
                            if(GetQueryString(data,'access_token')){
                                accessToken = GetQueryString(data,'access_token');
                                console.log(accessToken);
                                args = 'access_token='+accessToken;
                                //根据accessToken获取openID
                                fetch('https://graph.qq.com/oauth2.0/me?'+args)
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
                                    });
                            }else {
                                message.error('access_token未获取到');
                                location.replace("#/home");
                            }
                        })
                        .catch(err=>{
                            console.log(err);
                            // location.replace(location.href.split('?')[0]+'#/');//QQ登录失败时跳回登录页
                        });
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
        this.setState({password:e.target.value});;
    };
    onClickHandle(){
        let userName = this.state.userName,
            password = this.state.password,
            _this = this;
        // let url = 'http://192.168.6.3:82/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/user/login.php';
        let args = {};//'LoginName='+userName+'&Password='+password;
        let arg = 'LoginName='+userName+'&Password='+password;
        // if('fetch' in window){
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
                  let datatmp;
                  try {
                      datatmp = JSON.parse(data);
                      //JSON.parse没问题的情况
                      // console.log(datatmp);
                      if(datatmp.status === 'ok'){
                          message.success('登录成功');
                          _this.props.login(true,{name:userName,level:datatmp.data.Type,id:datatmp.data.Id,sex:datatmp.data.Sex,limit:datatmp.data.Limit});
                      }else {
                          message.error('用户名与密码不匹配');
                      }
                  }catch (e){
                      //JSON.parse有问题的情况,手动截取返回信息中JSON字符串,此处不严格，如果严格需要使用正则
                      console.log(data.substring(data.indexOf('>{'),data.indexOf('}<br')+1));
                      try{
                        datatmp = JSON.parse(data.substring(data.indexOf('{')));
                      }catch (e){
                          datatmp = JSON.parse(data.substring(data.indexOf('{'),data.indexOf('}<br')+1));
                      }
                      console.log(datatmp);
                      if(datatmp.status === 'ok'){
                          message.success('登录成功');
                          _this.props.login(true,{name:userName,level:datatmp.data.Type,id:datatmp.data.Id,sex:datatmp.data.Sex,limit:datatmp.data.Limit});
                      }else {
                          message.error('用户名与密码不匹配');
                      }
                  }

              }).catch(err=>{
                  console.log(err);
                  // props.login(true,{name:'haha',level:1,id:7,sex:2,limit:0});
              });

    };
    onChangeCheckBox(e){
        // if(!cookieUtil.get('loginChecked')){
            cookieUtil.set('loginChecked',e.target.checked);
            console.log(document.cookie);
            console.log(cookieUtil.get('loginChecked'))
       /* if(e.target.checked){
        }else {
            cookieUtil.unset('userName')
            cookieUtil.unset('password')
        }*/
        // }
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
                        <span id={'qqSpan'} onClick={()=>this.qqSpanHandle()} className='icon_qq'><a href={"https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=101454868&redirect_uri="+redirect_uri+"&state=test"}><Icon type="qq" style={iconStyle}/></a></span>
                        {/*<span id={'qqSpan'} onClick={()=>this.qqSpanHandle()} className='icon_qq'><a href={"#"}><Icon type="qq" style={iconStyle}/></a></span>*/}
                    </div>
            </Form>
        );
    }
}
export default Login;

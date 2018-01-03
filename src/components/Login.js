import React,{Component} from 'react';
import {BrowserRouter, Route, Link} from 'react-router-dom';
import { Form, Icon, Input, Button, Checkbox, message, Popover } from 'antd';
const FormItem = Form.Item;
import cookieUtil from '../libs/cookieUtil';
import '../static/login.scss'
import { loginApi } from "../static/apiInfo";

const iconStyle = {
    width: '20px',
    height: '20px'
};

const Login = (props) => {
    let userName = '';
    let password = '';
    const handleSubmit = (e) => {
        e.preventDefault();
        // console.log('register:'+userName)
    };
    const onChangeUserName = (e) => {
        // console.log('userName:' + e.target.value)
        userName = e.target.value;
    };
    const onChangePassword = (e) => {
        // console.log('password:' + e.target.value)
        password = e.target.value;
    };
    const onClickHandle =() =>{
        userName = document.getElementById('user').value;
        password = document.getElementById('pwd').value;
        // let url = 'http://192.168.6.3:82/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/user/login.php';
        let args = {};//'LoginName='+userName+'&Password='+password;
        let arg = 'LoginName='+userName+'&Password='+password;
        args.LoginName = userName;
        args.Password = password;
        // console.log(args);
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
                      console.log(datatmp);
                      if(datatmp.status === 'ok'){
                          message.success('登录成功');
                          props.login(true,{name:userName,level:datatmp.data.Type,id:datatmp.data.Id,sex:datatmp.data.Sex,limit:datatmp.data.Limit});
                      }else {
                          message.error('用户名与密码不匹配');
                      }
                  }catch (e){
                      //JSON.parse有问题的情况,手动截取返回信息中JSON字符串
                      datatmp = JSON.parse(data.substring(data.indexOf('{')));
                      console.log(datatmp);
                      if(datatmp.status === 'ok'){
                          message.success('登录成功');
                          props.login(true,{name:userName,level:datatmp.data.Type,id:datatmp.data.Id,sex:datatmp.data.Sex,limit:datatmp.data.Limit});
                      }else {
                          message.error('用户名与密码不匹配');
                      }
                  }

              }).catch(err=>{
                  console.log(err);
                  // props.login(true,{name:'haha',level:1,id:7,sex:2,limit:0});
              });

    };
    const onChangeCheckBox =(e) => {
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
    const content = (<a href="https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx592e917bee49160b&secret=6825956c197d4f23dbe2d06202f80bef&code=0018ZQ880FCj3I1ziN580KUJ8808ZQ8X&grant_type=authorization_code">参数</a>);
    return (<Form onSubmit={handleSubmit} className="login-form">
                <FormItem>
                    <Input id='user' onChange = {(e) => onChangeUserName(e)}
                           prefix={<Icon type="user" className={'login-form-input-logo'} />}
                           defaultValue={cookieUtil.get('loginChecked')=='true'?cookieUtil.get('userName'):''}  placeholder="Username" />
                </FormItem>
                <FormItem>
                    <Input id='pwd' onChange = {(e) => onChangePassword(e)}
                           prefix={<Icon type="lock" className={'login-form-input-logo'} />}
                           type="password" defaultValue={cookieUtil.get('loginChecked')=='true'?cookieUtil.get('password'):''} placeholder="Password" />
                </FormItem>
                <FormItem>
                    <Checkbox defaultChecked={cookieUtil.get('loginChecked')=='true'}
                              onChange={(e)=>onChangeCheckBox(e)}
                              style = {{float:'left'}}>记住密码</Checkbox>
                    {/*<a className="login-form-forgot" href="">忘记密码</a>*/}
                    <br/>
                    <Button type="primary" htmlType="submit" className="login-form-button" onClick={()=>onClickHandle()}>
                        登 录
                    </Button>
                    {/*Or <Link to="/register" >现在注册<Icon type="right"/></Link>
                    <Link to="/register" >忘记密码<Icon type="question"/></Link>*/}
                </FormItem>
                <FormItem>
                    <div className={'register-forget-box'}>
                    <Link to="/register" >现在注册<Icon type="right"/></Link>
                    <Link to="/register" >邀请登录<Icon type="question"/></Link>
                    </div>
                </FormItem>
                <div className='fast_login'>
                    <Popover content={content} trigger="hover">
                    <span className='icon_qq'><Icon type="wechat" style={iconStyle}/></span>
                    </Popover>
                    <span className='icon_wechat'><Icon type="qq" style={iconStyle}/></span>
                </div>
        </Form>
    );
};

export default Login;


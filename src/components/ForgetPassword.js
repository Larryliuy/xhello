import React,{Component} from 'react';
import {BrowserRouter, Route, Link} from 'react-router-dom';
import { Form, Icon, Input, Button, Checkbox,message } from 'antd';
const FormItem = Form.Item;
import cookieUtil from '../libs/cookieUtil';

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
        let args = 'account='+userName+'&password='+password;
        // console.log(args);
        // if('fetch' in window){
        fetch('/user/login',{
            method:'POST',
            credentials: 'include',
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body:args
        }).then((response) => {console.log(response);return response.json()})
            .then(data=>{
                console.log(data)
                if(data.state == 100){
                    message.success(data.msg)
                    props.login(true,data.result[0]);
                    console.log(data.result[0])
                    console.log(JSON.stringify(data.result[0]))
                    console.log(encodeURI(JSON.stringify(data.result[0])))
                    if(!cookieUtil.get('userName')){
                        // console.log('cookie设置成功');
                        cookieUtil.set('userName',userName,new Date().setTime(new Date().getTime()+30*24*60*60*1000))
                        cookieUtil.set('password',password,new Date().setTime(new Date().getTime()+30*24*60*60*1000))
                        cookieUtil.set('userData',encodeURI(JSON.stringify(data.result[0])),new Date().setTime(new Date().getTime()+30*24*60*60*1000))
                    }
                }else {
                    message.error(data.msg)
                }
            }).catch(err=>console.log(err))

        //默认进入
        message.success('密码重置为：123456')
        // props.login(true,{name:'larry',age:25,id:1});

    };

    return (<Form onSubmit={handleSubmit} className='login-form'>
            <FormItem>
                <Input id='user' onChange = {(e) => onChangeUserName(e)}
                       prefix={<Icon type='user' style={{ fontSize: 13 ,color:'#97b5fb' }} />}
                       defaultValue={cookieUtil.get('loginChecked')=='true'?cookieUtil.get('userName'):''}  placeholder='Username' />
            </FormItem>
            <FormItem>
                <Button type='primary' htmlType='submit' className='login-form-button' onClick={()=>onClickHandle()}>
                    重置密码
                </Button>
                Or <Link to='/login' >现在登录<Icon type='right'/></Link>
            </FormItem>
        </Form>
    );
}

export default Login;


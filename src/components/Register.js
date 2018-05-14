import React,{Component} from 'react';
import { Link} from 'react-router-dom';
import { Form, Icon, Input, Button, Radio, message } from 'antd';
const FormItem = Form.Item;
import { registerApi } from '../static/apiInfo';



class Register extends React.Component {
    constructor(){
        super();
        this.state = {
            userName:'',
            password:'',
            passwordOnce:'',
            sex:1,
        };
    }
    userNameOnchange(e){
        // console.log(e.target.value);
        this.setState({userName:e.target.value});
    }
    passwordOnchange(e){
        // console.log(e.target.value);
        this.setState({password:e.target.value});
    }
    passwordConfirmOnchange(e){
        // console.log(e.target.value);
        this.setState({passwordOnce:e.target.value});
    }
    passwordConfirm(e){
        // console.log(this.state.passwordOnce);
        if(this.state.password !== this.state.passwordOnce){
            message.error('两次密码不一致,请重新输入');
        }
    }
    sexOnchange(e){
        console.log(e.target.value);
        this.setState({sex:e.target.value});
        // console.log(this.state)
    }
    handleSubmit(e){
        e.preventDefault();
        console.log(this.state);
        if(!this.state.userName || !this.state.password){
            message.error('用户名和密码不能为空');
            return;
        }
        let args = 'LoginName='+this.state.userName+'&Password='+this.state.password+'&Sex='+this.state.sex;
        fetch(registerApi,{
            method:'POST',
            // credentials: 'include',
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body:args//JSON.stringify(args)
        }).then((response) => {console.log(response);return response.json();})
            .then(data=>{
                console.log(data);
                if(data.status === 'ok'){
                    message.success('注册成功');
                    location.replace('#/');
                }else {
                    message.error('注册失败');
                }
            }).catch(err=>console.log(err));
    }
    render(){
        return (<Form className='login-form'>
                <FormItem>
                    <Input onChange={e => this.userNameOnchange(e)}
                           prefix={<Icon type='user' className={'login-form-input-logo'} />}
                           placeholder='Username' />
                </FormItem>
                <FormItem>
                    <Input onChange={e => this.passwordOnchange(e)}
                           prefix={<Icon type='lock' className={'login-form-input-logo'} />}
                           type='password'
                           placeholder='Password' />
                </FormItem>
                <FormItem>
                    <Input onChange={e => this.passwordConfirmOnchange(e)}
                           onBlur={(e)=>this.passwordConfirm(e)}
                           prefix={<Icon type='lock' className={'login-form-input-logo'} />}
                           type='password'
                           placeholder='Confirm ' />
                </FormItem>
                <FormItem>
                    <Radio.Group defaultValue={'1'} onChange={e => this.sexOnchange(e)} >
                        <Radio value='1'>男</Radio>
                        <Radio value='2'>女</Radio>
                    </Radio.Group>
                </FormItem>
                <FormItem>
                    <Button onClick={(e)=>this.handleSubmit(e)} type='primary' htmlType='submit' className='login-form-button'>
                        注 册
                    </Button>
                    Or <Link to='/'>现在登录!</Link>
                </FormItem>
            </Form>
        );
    }
}

export default Register;
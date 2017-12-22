import React,{Component} from 'react';
import { Link} from 'react-router-dom';
import { Form, Icon, Input, Button, Radio } from 'antd';
const FormItem = Form.Item;


const Register = () => {
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('register')
    };
    return (<Form onSubmit={handleSubmit} className="login-form">
            <FormItem>
                <Input prefix={<Icon type="user" className={'login-form-input-logo'} />} placeholder="Username" />
            </FormItem>
            <FormItem>
                <Input prefix={<Icon type="lock" className={'login-form-input-logo'} />} type="password" placeholder="Password" />
            </FormItem>
            <FormItem>
                <Input prefix={<Icon type="lock" className={'login-form-input-logo'} />} type="password" placeholder="Confirm " />
            </FormItem>
            <FormItem>
                <Radio.Group>
                    <Radio value="man">男</Radio>
                    <Radio value="female">女</Radio>
                </Radio.Group>
            </FormItem>
            <FormItem>
                <Button type="primary" htmlType="submit" className="login-form-button">
                    注 册
                </Button>
                Or <Link to="/">现在登录!</Link>
            </FormItem>
        </Form>
    );
}

export default Register;
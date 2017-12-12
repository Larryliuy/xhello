import React, { Component } from 'react';
import { Icon ,message } from 'antd';
import HeaderTop from '../components/HeaderTop';
import cookieUtil from "../libs/cookieUtil";

class HeaderTopBox extends React.Component{
    loginOut=()=>{
        message.success('退出成功！');
        cookieUtil.unset('userName');
        cookieUtil.unset('password');
        cookieUtil.unset('userData');
    };
    render(){
        return (<HeaderTop></HeaderTop>)
    }
}

export default HeaderTopBox;
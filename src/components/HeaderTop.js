import React, { Component } from 'react';
import {Link} from 'react-router-dom'
import { Icon ,message } from 'antd';
import cookieUtil from "../libs/cookieUtil";
import HeaderLeft from "../components/HeaderLeft";



import Skin from './Skin';

class HeaderTop extends React.Component{
    loginOut=()=>{
        // location.reload();
        message.success('退出成功！');
        cookieUtil.unset('userName');
        cookieUtil.unset('password');
        cookieUtil.unset('userData');
    };
    render(){
        return (<div>
            <div className="logo" >
                <HeaderLeft></HeaderLeft>
            </div>
            <h2>
                中华人民共和国商务部直销查询信息管理系统
            </h2>
            <span style={{cursor:'pointer',position:'absolute',fontSize:16,right:60,top:3}}>
                        <Skin></Skin>
                    </span>
            <Link to='/'
                  onClick={this.loginOut}
                  style={{position:'absolute',top:5,right:30,cursor:'pointer'}}
            >
                <Icon type="poweroff" style={{fontSize:16,color:'red'}}/>
            </Link>

        </div>)
    }
}

export default HeaderTop;
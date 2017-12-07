import React,{Component} from 'react'
import Register from '../components/Register';

const divStyle = {
    textAlign:'center !important',
    height:'100%',
    paddingTop: 'calc(100px + 15%)'
};


const RegisterBox = ()=>(
    <div style={divStyle}>
        <Register/>
    </div>
);

export default RegisterBox;
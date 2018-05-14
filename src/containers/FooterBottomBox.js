import React,{ Component } from 'react';
import FooterBottom from '../components/FooterBottom';

class FooterBottomBox extends React.Component{
    constructor(props){
        super(props);
    }
    render(){
        return (<div>
            <FooterBottom userName={this.props.userName}></FooterBottom>
        </div>);
    }
}

export default FooterBottomBox;
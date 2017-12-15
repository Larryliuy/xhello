import React,{ Component } from 'react';
import { Card } from 'antd';

class RightClickPanel extends React.Component{
    constructor(props){
        super(props);
    }
    render(){
        return (<Card>
            <p>操作1</p>
            <p>操作2</p>
            <p>操作3</p>
        </Card>)
    }
}

export default RightClickPanel;
import React,{ Component } from 'react';
import { List, Avatar } from 'antd';


class MessageList extends React.Component{
    constructor(props) {
        super(props);

    }
    componentDidMount(){

    }
    render(){

        return (<List
            size="small"
            itemLayout="horizontal"
            dataSource={this.props.data}
            renderItem={item => (
                <List.Item>
                    <List.Item.Meta
                        avatar={<Avatar src="./images/avatar.png" />}
                        title={<p>{item.userName} {item.time}</p>}
                        description={<div dangerouslySetInnerHTML={{__html:item.data}} />}
                    />
                </List.Item>
            )}
        />)
    }
}


export default MessageList;

/*
注明：dangerouslySetInnerHTML需要对内容做<script>和HTML注释给escape一下
function  escape(str){
    str.replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--');
}*/

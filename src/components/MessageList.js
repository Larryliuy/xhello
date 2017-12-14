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
                        avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />}
                        title={<p>{item.username} {item.time}</p>}
                        description={<p style={{color:'red'}}>111</p>}
                    />
                </List.Item>
            )}
        />)
    }
}


export default MessageList
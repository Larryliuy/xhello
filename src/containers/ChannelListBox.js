import React,{ Component } from 'react';
// import { Menu,Icon,Button } from 'antd';
import ChannelList from '../components/ChannelList';

const ChannelListBox = () => (<div style={{position:'absolute',width:'100%',height:'90%',overflowX:'hidden',overflowY:'scroll'}}><ChannelList/></div>)

export default ChannelListBox;
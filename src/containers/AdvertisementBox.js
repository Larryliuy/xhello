import React,{ Component } from 'react'
import UploadAvatar from '../components/UploadAvatar';
import store, {CONSTANT} from "../reducer/reducer";
import {message} from "antd/lib/index";
import {generalApi, getImgApi, uploadJpegApi} from "../static/apiInfo";
import { setRoomInfo } from "../webrtc/webRtcVideo";

let state = store.getState();
store.subscribe(function () {
    state = store.getState();
});
class AdvertisementBox extends React.Component{
    state={visible:false,advertisement:'./images/ads.png'};
    componentDidMount(){
        const _this = this;
        setTimeout(function () {
            let fileId = state.homeState.currentRoomInfo.advertisementFileId;
            //根据请求获取用户头像
            if(fileId && fileId != 0){
                fetch(getImgApi+fileId+".dat")
                    .then(res=>{/*console.log(res)*/return res.text()})
                    .then(data=>{
                        _this.setState({advertisement:data});
                    })
                    .catch(e=>console.error(e))
            }
        },100);
    }
    onClickHandle(e){
        // console.log(e.button);
        if(state.homeState.userInfo.level <=2){
            this.setState({visible:true});
        }
    }
    handOk(imgData){
        this.setState({visible: false});
        let imgType = imgData.toString().substring(0,17);//data:image/jpeg;base64
        if(imgType.indexOf('jpeg')){
            imgType = '.jpeg';
        }else if (imgType.indexOf('png')){
            imgType = '.png';
        }else if (imgType.indexOf('git')){
            imgType = '.git';
        }else{
            imgType = '.jpeg';
        }
        //请求头像API
        let fileName = new Date().getTime() + imgType,
            roomInfo = state.homeState.currentRoomInfo,
            _this = this,
            args;
        console.log(fileName);
        if(roomInfo.advertisementFileId){
            args = "uid="+roomInfo.roomId+"&fileId="+ roomInfo.advertisementFileId +"&name="+fileName+"&img="+encodeURIComponent(imgData);
        }else{
            args = "uid="+roomInfo.roomId+"&name="+roomInfo+"&img="+encodeURIComponent(imgData);
        }
        fetch(uploadJpegApi,{
            method:'POST',
            // credentials: "include",
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body:args//JSON.stringify(args)
        })
            .then(res=>res.json())
            .then(data=>{
                let fileId = data.data[0].id;
                console.log(fileId);
                if(data.status === 'ok'){
                    // roomInfo.advertisement = imgData;
                    roomInfo.advertisementFileId = fileId;
                    store.dispatch({type:CONSTANT.CURRENTROOMINFO,val:roomInfo});
                    setRoomInfo(roomInfo);
                    //将fileId存入房间表
                    args = "?action=update&table=room&cond=id="+roomInfo.roomId+"&advertisementFileId="+fileId;
                    fetch(generalApi+args)
                        .then(res=>res.json())
                        .then(data=>{
                            console.log(data);
                            if(data.status === 'ok'){
                                message.success('更换成功');
                                let fileId = state.homeState.currentRoomInfo.advertisementFileId;
                                //根据请求获取用户头像
                                fetch(getImgApi+fileId+".dat")
                                    .then(res=>{/*console.log(res)*/return res.text()})
                                    .then(data=>{
                                        _this.setState({advertisement:data});
                                    })
                                    .catch(e=>console.error(e))
                            }
                        })
                        .catch(e=>console.error(e));
                }
            })
            .catch(e=>console.error(e));
    }
    handleCancel(){
        this.setState({visible: false});
    }
    render(){
        return (<div onClick={(e)=>this.onClickHandle(e)} className='advertisement-box'>
            <img src={this.state.advertisement} />
            <UploadAvatar visible={this.state.visible}
                          title={'请上传广告图片'}
                          handleOk={this.handOk.bind(this)}
                          handleCancel={this.handleCancel.bind(this)}
            >
            </UploadAvatar>
        </div>)
    }
}

export default AdvertisementBox;
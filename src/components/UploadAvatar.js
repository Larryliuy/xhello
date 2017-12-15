import React, { Component } from 'react';
import { Modal } from 'antd';
class UploadAvatar extends React.Component{
    constructor(props){
        super(props);
        this.state={
            visible: false
        }
    }
    componentDidMount(){

    }
    handleFiles(obj){
        let fileList = document.getElementById("pre-show");
        let files = obj.target.files,
            img = new Image();
        console.log(obj.target);
        if(window.URL){
            //File API
            alert(files[0].name + "," + files[0].size + " bytes");
            img.src = window.URL.createObjectURL(files[0]); //创建一个object URL，并不是你的本地路径
            img.width = 200;
            img.onload = function(e) {
                window.URL.revokeObjectURL(this.src); //图片加载后，释放object URL
            };
            fileList.removeChild(fileList.querySelector('img'));
            fileList.appendChild(img);
        }else if(window.FileReader){
            //opera不支持createObjectURL/revokeObjectURL方法。我们用FileReader对象来处理
            let reader = new FileReader();
            reader.readAsDataURL(files[0]);
            reader.onload = function(e){
                alert(files[0].name + "," +e.total + " bytes");
                img.src = this.result;
                img.width = 200;
                fileList.removeChild(fileList.querySelector('img'));
                fileList.appendChild(img);
            }
        }else{
            //ie
            obj.select();
            obj.blur();
            let nfile = document.selection.createRange().text;
            document.selection.empty();
            img.src = nfile;
            img.width = 200;
            img.onload=function(){
                alert(nfile+","+img.fileSize + " bytes");
            };
            fileList.removeChild(fileList.querySelector('img'));
            fileList.appendChild(img);
        }
    };
    render(){
        return (<div>
            <Modal
                title="修改头像"
                visible={this.props.visible}
                onOk={this.props.handleOk}
                onCancel={this.props.handleCancel}
            >
                <div className='upload-btn'>
                    <label htmlFor="file-input">选择图片<input onChange={(e) => {this.handleFiles(e)}} id='file-input' type='file' /></label>
                    <span>提示：支持jpg gif png 格式图片,不能超过5M</span>
                </div>
                <div id='pre-show'>
                    <img src='./images/avatar.png'/>
                </div>
            </Modal>
        </div>)
    }
}

export default UploadAvatar;
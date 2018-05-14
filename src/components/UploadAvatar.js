import React, { Component } from 'react';
import { Modal, message } from 'antd';
class UploadAvatar extends React.Component{
    constructor(props){
        super(props);
        this.state={
            visible: this.props.visible,
            fileBase64Data:''
        };
    }
    componentDidMount(){
        // console.log(this.props);
    }
    handleFiles(obj){
        // console.log(obj);
        let fileList = document.getElementById('pre-show');
        let files = obj.target.files,
            img = new Image(),
            _this = this;
        if(files[0] && files[0].name){
            let viaType = {'jpeg':true,'jpg':true,'git':true,'png':true};
            let tail = files[0].name.split('.')[1];
            console.log(tail);
            //在这里做图片格式验证
            if(!viaType[tail]){
                message.error('请上传符合格式的图片');
            }
        }else{
            message.info('未选择图片');
            return;
        }
        // console.log(files[0]);
        if(window.FileReader){
            //opera不支持createObjectURL/revokeObjectURL方法。我们用FileReader对象来处理
            let reader = new FileReader();
            reader.readAsDataURL(files[0]);
            reader.onload = function(e){
                // alert(files[0].name + ',' +e.total + ' bytes');
                // console.log(this.result.length);
                _this.setState({fileBase64Data:this.result});
                img.src = this.result;
                // img.width = 200;
                fileList.removeChild(fileList.querySelector('img'));
                fileList.appendChild(img);
            };
        }else if(window.URL){
            //File API
            // alert(files[0].name + ',' + files[0].size + ' bytes');
            // img.src = window.URL.createObjectURL(files[0]); //创建一个object URL，并不是你的本地路径
            img.srcObject = files[0]; //创建一个object URL，并不是你的本地路径
            // img.width = 200;
            img.onload = function(e) {
                window.URL.revokeObjectURL(this.srcObject); //图片加载后，释放object URL
            };
            fileList.removeChild(fileList.querySelector('img'));
            fileList.appendChild(img);
        }else{
            //ie
            obj.select();
            obj.blur();
            let nfile = document.selection.createRange().text;
            document.selection.empty();
            img.src = nfile;
            // img.width = 200;
            img.onload = function(){
                // alert(nfile+','+img.fileSize + ' bytes');
            };
            fileList.removeChild(fileList.querySelector('img'));
            fileList.appendChild(img);
        }
        // console.log(files[0]);
    }
    handleFatherOk(){
        let imgData = this.state.fileBase64Data;
        console.log(imgData.length);
        if (imgData.length < 1000000){
            this.props.handleOk(imgData);
        }else {
            message.error('图片过大');
            return;
        }
    }
    render(){
        return (<div>
            <Modal
                title={this.props.title}
                visible={this.props.visible}
                onOk={()=>this.handleFatherOk()}
                onCancel={this.props.handleCancel}
                okText={'确认'}
                cancelText={'取消'}
            >
                <div className='upload-btn'>
                    <label htmlFor='file-input'>选择图片<input onChange={(e) => {this.handleFiles(e);}} id='file-input' type='file' /></label>
                    <span>提示：推荐jpg gif png 格式图片,不能超过600KB</span>
                </div>
                <div id='pre-show'>
                    <img src='./images/avatar.png'/>
                </div>
            </Modal>
        </div>);
    }
}

export default UploadAvatar;
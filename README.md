# live 直播网站PC端
## 软件架构说明
    描述：总体来说算是一个网页版的YY吧
    软件架构：p2p架构
    服务端：php+nginx
    前端：react技术栈+webRTC+webAudio+webSocket
    网址：https://a701.xtell.cn/softwares/xtell_projects_dev/24_YUN_VIDEO/src/web/index.php
    混音频架构：如图所示
    ![](https://github.com/Larryliuy/live/blob/master/screenshots/audioMixer.png)
    混视频架构：如图所示
    ![](https://github.com/Larryliuy/live/blob/master/screenshots/videoMixer.png)
## 图片展示
主页
![](https://github.com/Larryliuy/live/blob/master/screenshots/homepage.png)
视频点播
![](https://github.com/Larryliuy/live/blob/master/screenshots/vod.png)
单人直播
![](https://github.com/Larryliuy/live/blob/master/screenshots/singleLive.jpg)
双人直播
![](https://github.com/Larryliuy/live/blob/master/screenshots/doubleLive.jpg)
语音聊天
![](https://github.com/Larryliuy/live/blob/master/screenshots/audioMode.png)

## 开发日志
    2017.12.06
    1， 环境初步搭建完成
    2，主界面无视频时的页面布局上面和左边完成

    2017.12.07
    1，根据需求列出具体功能需求表
    2，配置git
    3，主页左侧房间列表区域增加滚动

    2017.12.08
    1，框架搭建完成
    2，开发环境优化
    3，频道列表完成2级
    4，富文本编辑器，文字大小，下划线，图片完成

    2017.12.11
    1，用户搜索框修改和增加定位按钮
    2，无视频时显示文本区
    3，富文本增加字体颜色、背景色
    4，部分browser路由改成hash路由（解决build的本地文件不能访问问题）

    2017.12.12
    1，右侧区域麦序组件编写
    2，富文本空格与回车键限制出入（目前还有个光标问题没解决）
    3，切换皮肤逻辑实现

    2017.12.13
    1，用户列表图标根据level显示对应图标
    2，插进入房间逻辑实现
    3，完成有视频与无视频两种模式的切换
    4，富文本发送按钮调整位置

    2017.12.14
    1，底部布局和交互
    2，消息展示区滚动条保持在最下面
    3，了解了socket.io，需要兼容低版本浏览器时使用socket.io，否则使用websocket
    4，上传个人头像

    2017.12.15
    1，搜索用户逻辑完成
    2，修复了一个bug：双击uid与房间id一致的用户的时候导致切换房间
    3，右键菜单弹窗逻辑实现

    2017.12.18
    1，调通websock
    2，富文本增加enter（回车键）发送，ctrl+enter显示上次发送内容



    2017.12.19
    1，创建房间的时候就会创建相应的聊天室，这个聊天室什么情况下会删除？
    2，离开房间时需要广播
    3，进入房间时，需要返回房间的用户列表
    4，websocket聊天完成

    2017.12.20
    1，360/QQ浏览器刷新问题解决
    2，修复进入主页路由会加载两次问题
    3，右键对房间和用户操作的菜单

    2017.12.21
    1，左上角点击房间头像房间管理
    2，创建房间组件

    2017.12.22
    1，操作没权限提示弹窗等
    2，增加密码房间

    2017.12.25
    1，上麦与离麦逻辑
    2，消息发送优化
    3，左侧栏拉动改变宽度

    2017.12.26
    1，集成截图粘贴功能
    2，登录注册对接后台API


    2017.12.27
    1，换房间后接收不到消息:已修复
    2，邀请链接

    2017.12.28
    1，禁止用户文字图片
    2，广告右键上传
    3，消息撤回
    4，修改用户名

    2017.12.29
    1，修复左侧房间列表右键菜单偶尔不消失问题
    2，左右拖动时会选择文本或元素bug 已修复
    3，房间结构更改为3级

    2018.1.2
    1，修改数据结构成对应的3级房间结构
    2，优化权限控制
    3，创建房间50%

    2018.1.3
    1，修复撤回消息时当字体设置了样式时有问题
    2，删除房间(没有删除数据库)
    3，创建房间

    2018.1.4
    1，熟悉通用api,
    2，提升级别逻辑（这里发了websocket和http两次消息）;
    3，用户限制存数据库

    2018.1.5
    1，移动到我所在房间（缺后台）
    2，设置房间
    4，房间禁止图片文字
    7，修改用户名


    2018.1.6
    1，QQ登录，流程走通（QQ登陆以后需要注册一个账号，并且需要与QQ的openid绑定）

    2018.1.7
    1，QQ登录跨域问题未解决
    2，解决重复key值问题

    2018,1,10
    1，房间管理撤销权限
    2，视频模式切换优化

    2018.1.11
    1，进入本房间后目标端没有展开房间
    2，切换成living模式后 不能进入其他房间
    3，解决被移动到房间时，房间未展开
    4，解决快捷登录时没有管理员操作部分无效问题
    5，修复修改名称是输入框变动问题

    2018.1.15
    1，修复多次移动到房间有不更新房间列表bug
    2，看直播文档，初步选出直播开发方案

    2018.1.16
    1，修复进入房间更新bug，即进入双击进入房间get_room_users没有更新问题
    2，用户根据等级排序，等级相同根据名字排序
    3，查阅直播文档

    2018.1.17
    1，修复移动到房间全部移动问题

    2018.1.18
    1，WebRTC 一对一对话

    2018.1.19
    1，WebRTC 一对多对话

    2018.1.22
    1，WebRTC 多对多对话

    2018.1.23
    1，音量控制
    2，多对多对话

    2018.1.24
    1，混音

    2018.1.25
    1，入网算法

    2018.1.26
    1，websocket心跳重连
    2，清理无效的rtcsession
    3，webrtc断后重连
    4，老大断掉还差最后两步

    2018.1.27~1.31
    1，解决老大掉线重连问题，
    2，解决老二掉线连接问题
    3，优化入网连接算法
    4，解决混音webAudio上限问题


    2018.2.5
    1，点播，
    2，关麦（未完成，有混音的节点关麦后，孩子互相听不见）

    2018.2.6
    1，开关麦问题解决（get技能：软件架构层，哪一层出现问题，尽量使用同层的办法解决，这里属于混音层问题，前提解决思路涉及到网络层了。谨记）

    2018.2.7
    1，自由模式，主席模式，排麦模式逻辑实现
    2，点播共享模式（修复新进来的人没有点播视频）

    今日待办：
    1，二维码摆放
    2，自测麦序模式
    3，整理一下尾项
    4，qq登录换链接(小叶)

    待做事项
    1，QQ登录与二级域名问题
    6，房间个人头像上传返回服务器连接(缺后台支持)
    2，黑名单问题
    3，封IP，ID后台
    5，后台管理问题
    6，回音问题待解决


    2018.2.8
    1，QQ登录已修复完成
    2，微信需要一级域名
    3，默认关麦已完成
    4，房间和个人修改权限后，可以取消禁止了
    5，邀请连接已完成
    6，长时间登录后重新进入显示人员不全的问题是我在调试时的问题，我自己也在上账号（larry1）
    7，欢呼，鼓掌就差音频了
    8，调整麦序完成

    2018.2.9
    1，欢呼和鼓掌的音频已放到服务器了，已OK
    2，房间排序 完成
    3，开麦提醒 完成

    3，个人主页 ing...
    5，放音乐 ing...

    新年好
    2018.2.22
    1，QQ登录需要看后台回调域
    2，注册进入后默认的性别为女性问题已修复
    3， 邀请连接这个，生成连接后提示用户名和密码不匹配问题修复
    4，没有语音问题修复
    5，优酷视频可以播放

    2018.2.23
    1，单人直播级联
    2，单人直播断线重连

    2018.2.24
    1，业务逻辑分离直播代码与音频会议
    2，创建房间需要发送websocket消息后，后台没有创建房间到数据库

    2018.2.26
    1，移动到本房间时，被移动的人显示在线人数不正确

    1，邀请连接这里格式问题已经修改过来了；
    2，在线人数不对，我这边测试还是正常的；
    （测到了一个移动到房间，被移动的一方显示在线人数不正确，这个已修复）
    3，自动播放问题暂时解决不了
    4，变为视频模式时，右侧输入框无显示
    5，菜单功能出现问题 点击右键无法出现正常的功能菜单
    6，进入其他房间语音，退出后，重新进入大厅，右侧麦序没有更新
    7，语音功能不正常，无法同步声音


    8，退出登录时，触发了两次leave_room消息
    已查处原因，由于用户在页面卸载后，后端会发送一次leave_room消息，我前端又发送了一次，所以导致退出登录是重载页面时发送两次leave_room消息，导致在线人数不正确;

    1，邀请连接现在正常了
    2，在线人数不符这个也修复了
    3，视频暂时还不能自动播放
    4，我这边使用360测试正常
    5,菜单这个问题不用担心，这个是用于调试的
    6，右侧麦序列表显示错误已修复


    2018.3.9
    1，任意房间均可在语音模式与视频模式间切换
    2，修复单人直播断线重连bug
    3，修复webAudio实例上线为6的bug（不断刷新视频时必然会出现）

    2018.3.12
    1，与连麦者连接成功之后 观众重连获取最新的连麦画面
    2，播放网络音乐
    3，主播可以编辑文字区域

    2018.3.13
    1，封IP，封ID，黑名单管理
    2，上传头像

    2018.3.14
    1，增加上传头像后，登录变的有些迟缓（待解决）
    2，房间更换头像，房间更换广告，单人直播间编辑文字区域
    3，麦序头像变换(显示上麦人的头像)

    2018.3.15
    1，上麦的第一个人开了语音，有些问题，必须得关一次买和开一次麦才正常(可能的一种情况：当房间里只有一个人的时候上麦会出现此问题),可以做个控制，当房间大于两个人的时候才能放麦
    2，QQ登录 通过后台完成
    V1.0已完成


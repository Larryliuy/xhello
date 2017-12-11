/*
 *长连接
 * */

$(function() {
    roomdao.Sock = function(url) {
        if (!window.WebSocket) {
            window.WebSocket = window.MozWebSocket;
        }
        if (window.WebSocket) {
            roomdao.obj.socket = new WebSocket(url);
            console.log('socket', roomdao.obj.socket)
            roomdao.obj.socket.onopen = onopen;
            roomdao.obj.socket.onmessage = onmessage;
            roomdao.obj.socket.onclose = onclose;
        } else {
            alert("Your browser does not support Web Socket.");
        }

        function onopen(event) {
            console.log('服务器连接');
        }

        /*
         * @name 改变房间用户列表语音状态
         * @param { Object } object: {
         *                     id: userId,
         *                     status: 语音状态
         *                   }
         */

        function changeVoice (object) {
            var isMyself = $('#' + object.id)
            console.log(isMyself)
            if (object.status) {
                isMyself.find('.user-list-voice').html('<img src="./images/voice_open.png">')
            } else {
                isMyself.find('.user-list-voice').html('')
            }
        }

        var interval

        function onmessage(event) {//长连接回调函数
            //如果进入房间改变房间样式
            var json = JSON.parse(event.data);
            console.log('socketEvent', json);
            switch (json.fromName) {
                case 'freespeak':
                    changeVoice({
                        id: json.to,
                        status: true
                    })
                    break
                case 'buttonspeak':
                    changeVoice({
                        id: json.to,
                        status: false
                    })
                    break;
                case 'speaking':
                    // 延时0.5S关闭说话
                    changeVoice({
                        id: json.to,
                        status: true
                    })

                    // 限流
                    // if (interval) {
                    //     return false
                    // } else {
                    //     interval = true
                    //     setTimeout(function () {
                    //         changeVoice({
                    //             id: json.to,
                    //             status: false
                    //         })
                    //         interval = false
                    //     }, 500)
                    // }
                    break;
                case 'login':
                    $('.userAdmin').html('');
                    $('.header-icon-detail .onlinenum').text(json.text);
                    $('.roomdetail').find('i').text(json.text)

                    // if (json.map.power.length != 0) {
                    //     for (var i = 0; i < json.map.power.length; i++) {

                    //         if (json.map.power[i].power <= 3) {
                    //             roomdao.adminCon('user', json.map.power[i].power, json.map.power[i].id, 'userAdmin', json.map.power[i].name, json.map.power[i].sex)
                    //         }


                    //     }
                    // }

                    json.map.power.forEach(function(item) {
                        if (item.power <= 3) {
                            roomdao.adminCon('user', item.power, item.id, 'userAdmin', item.name, item.sex)
                        }
                        // console.log('item', item)
                        var className = roomdao.showmajia(item.power, item.sex)
                        // console.log($('#s' + item.id))
                        $('#s' + item.id).find('i').removeClass().addClass(className)
                    })

                    break;
                case 'rlogin'://进入子频道
                    if (json.map.result = 'success') {
                        var userInfo = roomdao.getconUserInfo(json.map.user, json.text.substr(1))
                        var swf = document.getElementById('swf1');
                        roomdao.ismobile(event.data);
                        $('.addroom1').remove();
                        var subroomid = json.map.rid;
                        var previd = json.map.previd;
                        var j = subroomid.substr(1, 1);
                        //获取当前要进入的房间的高度
                        var currentm = parseFloat($('#' + json.map.rid).css('marginBottom')); //要进入房间的高度
                        //清空当前房间所有用户
                        $('#' + json.text).remove();
                        $('#' + json.map.rid).find('.user').remove();
                        roomdao.subroomstrn(json.map.user, 'user', json.map.rid, 0);

                        // 修改自己的性别
                        // if (userInfo) {
                        //   var className = roomdao.showmajia(userInfo.power, userInfo.sex)
                        //   console.log(className)
                        //   console.log($('#s' + userInfo.id).find('i'))
                        //   $('#s' + userInfo.id).find('i').removeClass().addClass(className)
                        // }


                        if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.map.rid) {
                            if (json.map.voicedown) {
                                roomdao.obj.devoiceid = json.map.voicedown
                            } else {
                                roomdao.obj.devoiceid = [];
                            }
                            if (json.map.silence) {
                                roomdao.obj.fontuserlist = json.map.silence
                            } else {
                                roomdao.obj.fontuserlist = []
                            }
                            if (json.map.picture) {
                                roomdao.obj.picuserlist = json.map.picture
                            } else {
                                roomdao.obj.picuserlist = [];
                            }

                        }

                        //如果是自己
                        if (roomdao.obj.subuserid == json.text) {
                            $('.music').hide();
                            $('.exitlive').remove()
                            $('.reflash').remove()
                            roomdao.obj.status = json.map.room.status;
                            if (previd) {
                                var x = previd.substr(1, 1);
                                if (x == 'i') {
                                    $('#' + previd).css({
                                        'marginBottom': 0,
                                        'overflow': 'hidden'
                                    });
                                    $('#' + previd).css({
                                        'marginBottom': 0,
                                        'overflow': 'hidden'
                                    }).find('svg use').attr('xlink:href', '#icon-jia')
                                    $('#' + previd).css({
                                        'marginBottom': 0,
                                        'overflow': 'hidden'
                                    }).find('.lock').find('svg use').attr('xlink:href', '#icon-suo');
                                    $('#' + previd).find('.sublock').find('svg use').attr('xlink:href', '#icon-suo').css({
                                        'marginBottom': 0,
                                        'overflow': 'hidden'
                                    });
                                } else {
                                    $('#' + previd).css({
                                        'marginBottom': 0,
                                        'overflow': 'hidden'
                                    }).find('svg use').attr('xlink:href', '#icon-jia');
                                    $('#' + previd).parent().parent('.sibroom').css({
                                        'marginBottom': 0,
                                        'overflow': 'hidden'
                                    }).find('svg use').attr('xlink:href', '#icon-jia');
                                    $('#' + previd).parent().parent('.sibroom').find('.lock').css({
                                        'marginBottom': 0,
                                        'overflow': 'hidden'
                                    }).find('svg use').attr('xlink:href', '#icon-suo');
                                    $('#' + previd).parent().parent('.sibroom').css({
                                        'marginBottom': 0,
                                        'overflow': 'hidden'
                                    }).find('.sublock').find('svg use').attr('xlink:href', '#icon-suo');
                                }

                                //上次双击房间的高度变为0
                                roomdao.obj.previndex = roomdao.obj.currentindex;
                            }
                            if (j == 'i') {
                                $('#' + subroomid).find('svg use').attr('xlink:href', '#icon-jia');
                                $('#' + subroomid).find('.subroom').find('svg use').attr('xlink:href', '#icon-jia');
                                $('#' + subroomid).find('.subroom').find('.sublock').find('svg use').attr('xlink:href', '#icon-suo');
                                $('#' + subroomid).find('.room-icon').find('svg use').attr('xlink:href', '#icon-jian1');
                            } else {
                                $('#' + subroomid).parent().parent('.sibroom').find('svg use').attr('xlink:href', '#icon-jia');
                                $('#' + subroomid).parent().parent('.sibroom').find('.subroom').find('.sublock').find('svg use').attr('xlink:href', '#icon-suo');
                                $('#' + subroomid).parent().parent('.sibroom').find('.room-icon').find('svg use').attr('xlink:href', '#icon-jian1');
                                $('#' + subroomid).find('.subroom-icon').find('svg use').attr('xlink:href', '#icon-jian1')
                            }

                            var snum = $('#' + subroomid).find('.user').size();
                            var sroomnum = $('#' + subroomid).find('.subroom').size();
                            $('#' + subroomid).css({
                                'marginBottom': (snum + sroomnum) * 28,
                                'overflow': 'visible'
                            });
                            $('#' + subroomid).find('.user').show();
                            $('.addroom').fadeOut();
                            roomdao.setPortrait(json.map.room.rpic, roomdao.obj.path)

                            if (roomdao.obj.status == 0) {
                                roomdao.comeinstatus(json.map.room.status, json.map.StreamName, json.map.StreamName1, json.map.liveid, json.map.mike)
                            } else if (roomdao.obj.status == 4) {
                                roomdao.comeinstatus(json.map.room.status, json.map.StreamName, json.map.StreamName1, json.map.doubleliveid, json.map.mike)
                            } else {
                                roomdao.comeinstatus(json.map.room.status, json.map.StreamName, json.map.StreamName1, json.map.liveid, json.map.mike, json.map.control)
                            }
                            if (json.map.vedio) {
                                roomdao.totovideo(json.map.vedio.mobile, json.map.rid)
                            } else if (json.map.musicname) {
                                if (json.map.pause) {
                                    roomdao.ismusicRun(json.map.musicname, json.map.mp3url, json.map.musicname, false)
                                    //$('.aplayer-icon-pause').click()
                                    //$('#mydiv').attr('src','#')

                                    setTimeout(function() {
                                        ap.pause()
                                    }, 50)
                                    console.log(ap.audio);
                                    //$('#mydiv')[0].pause();
                                } else {
                                    roomdao.ismusicRun(json.map.musicname, json.map.mp3url, json.map.musicname, true)
                                }
                            } else {
                                if (ap) {
                                    setTimeout(function() {
                                        ap.pause()
                                    }, 50)
                                } else {
                                    $('#mydiv').attr('src', '#')
                                }

                            }

                            roomdao.setad(roomdao.obj.banner)
                            roomdao.seeSkin(roomdao.obj.path)
                            let msgwarning = "<div class='user'><img src=\"images\/chatico.png\" class=\"msginfo-icon\"\/><span style=\"color:#56AE00\">【提示】</span><span style=\"color:#56AE00\">您已进入房间：</span><span style=\"color:#24A6CA\">" + json.map.room.rname + "</span></div>";
                            if (roomdao.obj.hasvideo == 1) {
                                $('.hudong').append(msgwarning);
                                $('.hudong').scrollTop($('.hudong')[0].scrollHeight);
                            } else {
                                $('.main').append(msgwarning);
                                $('#middle .main').scrollTop($('#middle .main')[0].scrollHeight);
                            }


                            roomdao.roomonlinenum(json.map.rid, json.map.room.rname, 0);
                        }

                    } else {
                        roomdao.wints('密码输入错误')
                    }
                    jsheight($('#' + roomdao.obj.subuserid).parent().attr('id'));
                    //roomdao.getusernum();
                    roomdao.obj.droomwrite = json.map.silenceex;
                    roomdao.obj.droompic = json.map.pictureex;
                    // 用户当前所在房间ID 跟socket的来源房间一致时
                    if (roomdao.obj.currentRoomId == json.map.rid) {
                        if (json.map.mp3url) {
                            if (json.map.mp3url.playModel) {
                                console.log('进入子频道', json)
                                vm.changeMusic(json.map.mp3url.playModel, json.map.pause)
                            }
                        }

                        json.map.speaking.forEach(function(id) {
                            changeVoice({
                                id: id,
                                status: true
                            })
                        })


                    }
                    break;
                case 'exit'://退出平台
                    var s = (json.text).substr(1, 1);
                    if(json.map.power != undefined){
                        $('#admin' + json.map.power.id).remove();
                    }
                    var currentheight = parseFloat($('#' + json.to).parent().css('marginBottom'));
                    if (currentheight > 0) {
                        if (s == 'i') {
                            $('#' + json.to).remove();
                            $('#' + json.text).css('marginBottom', currentheight - 28);
                        } else {
                            var currentparentheight = parseFloat($('#' + json.text).parent().parent('.sibroom').css('marginBottom'));
                            $('#' + json.to).remove();
                            $('#' + json.text).css('marginBottom', currentheight - 28);
                            $('#' + json.text).parent().parent('.sibroom').css('marginBottom', currentparentheight - 28);
                        }
                    }

                    var swf = document.getElementById('swf1');
                    roomdao.ismobile(event.data)

                    if (roomdao.obj.subuserid == 's' + json.from) {
                        //退出登录
                        $('.mask').fadeIn();
                        $('.QQlogin').fadeIn();
                        $('.ima').fadeIn()
                        $('.kkk').fadeOut();

                        //location.reload();
                    }
                    $('.header-icon-detail .onlinenum').text(json.map.nop);
                    break;
                case 'videoout'://退出网络视频播放
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.to) {
                        roomdao.toggleVideo(0);
                        roomdao.obj.hasvideo = 0
                        roomdao.setad(roomdao.obj.banner)
                        roomdao.seeSkin(roomdao.obj.path)
                    }
                    break;
                case 'rRlogin'://进图二级房间

                    if (json.map.result = 'success') {
                        var swf = document.getElementById('swf1');
                        roomdao.ismobile(event.data);
                        $('.addroom1').remove();
                        var subroomid1 = json.map.rid; //要进入的房间id
                        var j = subroomid1.substr(1, 1); //要进入的房间id
                        var subprevid = json.map.previd; //上次所在房间id
                        //获取当前要进入的房间的高度
                        var subcurrentm = parseFloat($('#' + json.map.rid).css('marginBottom'));
                        var subparentcurrentm = parseFloat($('#' + json.map.rid).parent().parent('.sibroom').css('marginBottom'));
                        //清空当前房间所有用户
                        $('#' + json.text).remove();
                        $('#' + json.map.rid).find('.subuser').remove();
                        roomdao.subroomstrn(json.map.user, 'subuser', json.map.rid, 0);
                        if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.map.rid) {
                            if (json.map.voicedown) {
                                roomdao.obj.devoiceid = json.map.voicedown
                            } else {
                                roomdao.obj.devoiceid = [];
                            }
                            if (json.map.silence) {
                                roomdao.obj.fontuserlist = json.map.silence
                            } else {
                                roomdao.obj.fontuserlist = []
                            }
                            if (json.map.picture) {
                                roomdao.obj.picuserlist = json.map.picture
                            } else {
                                roomdao.obj.picuserlist = [];
                            }
                            console.log('thing')
                        }
                        //如果是自己
                        if (roomdao.obj.subuserid == json.text) {
                            if (subprevid) {
                                var x = subprevid.substr(1, 1);
                                if (x == 'i') {
                                    $('#' + subprevid).css({
                                        'marginBottom': 0,
                                        'overflow': 'hidden'
                                    }).find('.room-icon').find('svg use').attr('xlink:href', '#icon-jia');
                                    $('#' + subprevid).css({
                                        'marginBottom': 0,
                                        'overflow': 'hidden'
                                    }).find('.lock').find('svg use').attr('xlink:href', '#icon-suo');
                                    $('#' + subprevid).css({
                                        'marginBottom': 0,
                                        'overflow': 'hidden'
                                    }).find('.sublock').find('svg use').attr('xlink:href', '#icon-suo');
                                } else {
                                    $('#' + subprevid).css({
                                        'marginBottom': 0,
                                        'overflow': 'hidden'
                                    });
                                    $('#' + subprevid).parent().parent('.sibroom').css({
                                        'marginBottom': 0,
                                        'overflow': 'hidden'
                                    }).find('svg use').attr('xlink:href', '#icon-jia');
                                    $('#' + subprevid).parent().parent('.sibroom').css({
                                        'marginBottom': 0,
                                        'overflow': 'hidden'
                                    }).find('.lock').find('svg use').attr('xlink:href', '#icon-suo');
                                    $('#' + subprevid).parent().parent('.sibroom').css({
                                        'marginBottom': 0,
                                        'overflow': 'hidden'
                                    }).find('.sublock').find('svg use').attr('xlink:href', '#icon-suo');
                                }
                                //上次双击房间的高度变为0
                                roomdao.obj.status = json.map.roomm.status
                                var snum = $('#' + subroomid1).find('.subuser').size();
                                console.log('进入子房间用户数量' + snum);
                                var subcurrentroomnum = $('#' + subroomid1).parent().parent('.sibroom').find('.subroom').size();
                                console.log('子房间的数量是' + subcurrentroomnum)
                                console.log('进入子房间同级房间子房间数量' + subcurrentroomnum);

                                $('#' + subroomid1).css({
                                    'marginBottom': snum * 28,
                                    'overflow': 'visible'
                                });
                                $('#' + subroomid1).parent().parent('.sibroom').css({
                                    'marginBottom': (snum + subcurrentroomnum) * 28,
                                    'overflow': 'visible'
                                });
                                $('#' + subroomid1).parent().parent('.sibroom').find('.user').hide();
                                $('.addroom').fadeOut();
                                roomdao.obj.previndex = roomdao.obj.currentindex;
                            }
                            roomdao.setPortrait(json.map.roomm.rpic, roomdao.obj.path)
                            $('#mydiv').attr('src', '#')
                            if (roomdao.obj.status == 0) {
                                roomdao.comeinstatus(json.map.roomm.status, json.map.StreamName, json.map.StreamName1, json.map.liveid, json.map.mike)
                            } else if (roomdao.obj.status == 4) {
                                roomdao.comeinstatus(json.map.roomm.status, json.map.StreamName, json.map.StreamName1, json.map.doubleliveid, json.map.mike)
                            } else {
                                roomdao.comeinstatus(json.map.roomm.status, json.map.StreamName, json.map.StreamName1, json.map.liveid, json.map.mike, json.map.control)
                            }
                            if (json.map.vedio) {
                                roomdao.totovideo(json.map.vedio.mobile, json.map.rid)
                            } else if (json.map.musicname) {
                                if (json.map.pause) {
                                    roomdao.ismusicRun(json.map.musicname, json.map.mp3url, json.map.musicname, false)
                                    //$('.aplayer-icon-pause').click()
                                    //$('#mydiv').attr('src','#')
                                    console.log('进入二级房建1')
                                    setTimeout(function() {
                                        ap.pause()
                                    }, 50)
                                    console.log(ap.audio);
                                    //$('#mydiv')[0].pause();
                                } else {
                                    roomdao.ismusicRun(json.map.musicname, json.map.mp3url, json.map.musicname, true)
                                }
                            } else {
                                console.log('进入二级房建2')
                                if (ap) {
                                    setTimeout(function() {
                                        ap.pause()
                                    }, 50)
                                } else {
                                    $('#mydiv').attr('src', '#')
                                }
                            }

                            roomdao.setad(roomdao.obj.banner)
                            roomdao.seeSkin(roomdao.obj.path)
                            let msgwarning = "<div class='user'><img src=\"images\/chatico.png\" class=\"msginfo-icon\"\/><span style=\"color:#56AE00\">【提示】</span><span style=\"color:#56AE00\">您已进入房间：</span><span style=\"color:#24A6CA\">" + json.map.roomm.rname + "</span></div>";
                            if (roomdao.obj.hasvideo == 1) {
                                $('.hudong').append(msgwarning);
                                $('#right .hudong').scrollTop($('#right .hudong')[0].scrollHeight);
                            } else {
                                $('.main').append(msgwarning);
                                $('#middle .main').scrollTop($('#middle .main')[0].scrollHeight);
                            }


                            roomdao.roomonlinenum(json.map.rid, json.map.roomm.rname, 1);
                            if (j == 'i') {
                                $('#' + subroomid1).find('.room-icon').find('svg use').attr('xlink:href', '#icon-jia');
                                $('#' + subroomid1).find('.lock').find('svg use').attr('xlink:href', '#icon-suo');
                                $('#' + subroomid1).find('.sublock').find('svg use').attr('xlink:href', '#icon-suo');
                            } else {
                                $('#' + subroomid1).parent().parent('.sibroom').find('.sublock').find('svg use').attr('xlink:href', '#icon-suo');
                                $('#' + subroomid1).parent().parent('.sibroom').find('.room-icon').find('svg use').attr('xlink:href', '#icon-jian1');
                                $('#' + subroomid1).find('.subroom-icon').find('svg use').attr('xlink:href', '#icon-jian1')
                            }
                        }

                        // 如果是自己所在的房间id
                        if (roomdao.obj.currentRoomId == json.map.rid) {
                            if (json.map.mp3url) {
                                if (json.map.mp3url.playModel) {
                                    console.log('进入子子频道', json)
                                    vm.changeMusic(json.map.mp3url.playModel)
                                }
                            }
                        }
                        jsheight($('#' + roomdao.obj.subuserid).parent().attr('id'));
                        //roomdao.getusernum();
                    } else {
                        roomdao.wints('密码输入错误');
                    }

                    roomdao.obj.droomwrite = json.map.silenceex;
                    roomdao.obj.droompic = json.map.pictureex;
                    break;
                case 'message'://发送消息和图片
                    if (roomdao.obj.hasvideo == 0) {
                        roomdao.mesAndPictutrs(1, $('.main'), json.text, json.to, json.date, json.from)
                    } else {
                        roomdao.mesAndPictutrs(1, $('.hudong'), json.text, json.to, json.date, json.from)
                    }
                    if (roomdao.obj.subuserid == json.from) {
                        roomdao.obj.list = [];
                        roomdao.obj.load = 0;
                        roomdao.obj.sendimg = '';
                        roomdao.obj.piclist = [];
                    }
                    break
                case 'ar'://创建房间
                    if (json.map.result == 'success') {
                        var htmlsib = "<li id='" + 'sib' + json.map.room.id + "'class=\"sibroom removecurrent\"><span  class=\"room-info\">" + json.map.room.rname + "</span><span class=\"room-icon skin1\"><svg class=\"icon\" aria-hidden=\"true\"> <use xmlns:xlink=\"http://www.w3.org/1999/xlink\" xlink:href=\"#icon-jia\"></use></svg></span><span class=\"room-num\"></span><ul></ul></li>"
                        $('.room').append(htmlsib); //传给后台的颜色值
                        $('#sib' + json.map.room.id).find('.room-info').css('color', ('#' + json.map.room.color))
                        //如果有房间密码那么房间图标样式是带锁的创建同级房间
                        if (json.map.room.password != '') {
                            $('.room .sibroom').last().find('.room-icon').addClass('lock').find('svg use').attr('xlink:href', '#icon-suo');
                            $('.addroom').fadeOut();
                        } else {
                            $('.addroom').fadeOut();
                        }
                    } else {
                        roomdao.wints('房间名重复，请更换房间名')
                    }
                    roomdao.seeSkin(roomdao.obj.path);
                    break;
                case 'dr'://删除房间
                    //当前房间的所有用户全部退出登录
                    console.log($('#' + roomdao.obj.subuserid).parent('.sibroom').attr('id'));
                    console.log($('#' + roomdao.obj.subuserid).parent().parent().parent('.sibroom').attr('id'));
                    if ($('#' + roomdao.obj.subuserid).parent('.sibroom').attr('id') == json.to || $('#' + roomdao.obj.subuserid).parent().parent().parent('.sibroom').attr('id') == json.to) {


                        roomdao.wints('此房间已被管理员删除，请重新登录');
                        $('.btns').removeClass('btns').addClass('btnss')
                        $('.btnss').prev().remove();
                        $('.btnss').click(function() {
                            window.location.reload();
                        })
                        socket.onclose();
                    }
                    roomdao.seeSkin(roomdao.obj.path)
                    $('#' + json.to).remove();
                    break;
                case 'drr'://删除二级房间
                    if (json.map.result == 'success') {
                        //要删除房间的父级房间的id
                        var deparentheight = parseFloat($('#' + json.map.parentdeid).css('marginBottom')); //要删除房间的父元素当前高度
                        var deheight = parseFloat($('#' + json.to).css('marginBottom')); //要删除房间的当前高度
                        if ($('#' + roomdao.obj.subuserid).parent('.subroom').attr('id') == json.to) {
                            roomdao.wints('此房间已被管理员删除，请重新登录');
                            $('.btns').removeClass('btns').addClass('btnss')
                            $('.btnss').prev().remove();
                            $('.btnss').click(function() {
                                $('.exitdemo').click();
                            })
                            socket.onclose();
                        }
                        $('#' + json.to).remove();
                        if (deparentheight > 0) {
                            var snum = $('#' + json.map.parentdeid).find('.subroom').size(); //父级房间中子房间的数量；
                            var pnum = $('#' + json.map.parentdeid).find('.user').size(); //父级房间用户数量
                            var opennum = $('#' + json.map.parentdeid).find('.sibopen').find('.subuser').size();
                            if (deheight > 0) {
                                $('#' + json.map.parentdeid).css({
                                    'marginBottom': (snum) * 28,
                                    'overflow': 'visible'
                                })
                            } else {
                                $('#' + json.map.parentdeid).css({
                                    'marginBottom': deparentheight - 28,
                                    'overflow': 'visible'
                                })
                            }
                        }
                    }
                    roomdao.seeSkin(roomdao.obj.path);
                    break;
                case 'banip'://封ip
                    if (json.map.result == 'success') {
                        if (roomdao.obj.subuserid == 's' + json.map.id) {
                            roomdao.wints('您已被管理员封ip')
                            $('.btns').removeClass('btns').addClass('btnsss')
                            $('.btnsss').prev().remove();
                            $('.btnsss').click(function() {
                                $('.exitdemo').click();
                            })
                        }
                    }
                    break;
                case 'addbl'://黑名单
                    if (json.map.result == 'success') {
                        if (roomdao.obj.subuserid == ('s' + json.to)) {
                            roomdao.wints('您已经被管理员封id')
                            $('.btns').removeClass('btns').addClass('btnssss')
                            $('.btnssss').prev().remove();
                            $('.btnssss').click(function() {
                                $('.exitdemo').click();
                            })
                        }
                    } else {
                        roomdao.wints('操作失败');
                    }
                    roomdao.seeSkin(roomdao.obj.path);
                    break;
                case 'rpic'://房间头像
                    roomdao.obj.pic = json.map.path;
                    $('.roompic img').attr('src', 'rpic/' + json.map.path);
                    $('.cover').remove();
                    $('.changetoux').fadeOut();
                    break;
                case 'rank'://上麦
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.from) {
                        $('.maixuuser').append("<li id='" + 'mai' + json.map.id + "'class=\"clearfix\"><em class=\"mainum\"></em><div>" + json.text + "</div><i></i><button class=\"btn btn-sm  out skingradient\">踢出</button> </li>");
                        //上麦标记
                        roomdao.seeSkin(roomdao.obj.path)
                        $('.maionline i').text($('.maixuuser li').size())
                    }
                    var swf = document.getElementById('swf1');
                    roomdao.ismobile(event.data);
                    break;
                case 'rankdown'://离麦
                    if (json.map.selfindex != undefined) {
                        if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.from) {
                            roomdao.domovemaixu('success', json.to, json.map.mikename, json.map.x, json.map.selfindex)
                            var id = $('.maixuuser').find('li').eq(0).attr('id');
                            $('.maionline i').text($('.maixuuser li').size())
                        }
                    } else {
                        if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.from) {
                            $('#' + json.to).remove();
                            var rankdownuseid = json.to.substr(3);
                            if (roomdao.obj.subuserid == rankdownuseid) {
                                roomdao.obj.isonmai = false;
                            }
                            $('.maionline i').text($('.maixuuser li').size())
                        }
                    }
                    var obj = new Object();
                    obj.id = json.map.mikeid;
                    obj.from = json.from;
                    obj.to = json.to
                    obj.mikeid = json.map.mikeid
                    obj.fromName = json.fromName
                    var swf = document.getElementById('swf1');
                    roomdao.ismobile(JSON.stringify(obj));
                    break;
                case 'voice'://麦序到时间换人
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.from) {
                        if (json.map) {
                            var rankdownuseid = json.map.id.substr(3);
                            var id = $('.maixuuser').find('li').eq(0).attr('id');
                            var obj = new Object();
                            obj.id = id;
                            obj.to = json.to
                            obj.fromName = json.fromName
                            obj.from = json.from;
                            obj.mikeid = json.map.mikeid
                            $('#' + json.map.id).remove();
                            $('.maionline i').text($('.maixuuser li').size())
                            var swf = document.getElementById('swf1');
                            roomdao.ismobile(JSON.stringify(obj));
                            if (roomdao.obj.subuserid == rankdownuseid) {
                                roomdao.obj.isonmai = false;
                            }
                            $('#' + json.map.id).remove();
                        } else {
                            var id = $('.maixuuser').find('li').eq(0).attr('id');
                            console.log('第一个用户的id是' + id)
                            var obj = new Object();
                            obj.id = id;
                            obj.to = json.to
                            obj.mikeid = mikeid
                            obj.fromName = json.fromName
                            obj.from = json.from;
                            var swf = document.getElementById('swf1');
                            roomdao.ismobile(JSON.stringify(obj));
                        }

                        //上麦标记
                    }
                    var obj = new Object();
                    obj.id = id;
                    obj.to = json.to
                    obj.fromName = json.fromName
                    obj.from = json.from;
                    obj.mikeid = json.map.mikeid
                    $('#' + json.map.id).remove();
                    var swf = document.getElementById('swf1');
                    roomdao.ismobile(JSON.stringify(obj));
                    break;
                case 'status'://模式切换
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.to) {

                        if (json.text == 1) {
                            $('#dropdownMenu1').text('主席模式')
                            $('.maixuuser li').remove();
                            roomdao.obj.ismai = true
                            roomdao.obj.isonmai = false
                        } else if (json.text == 2) {
                            $('#dropdownMenu1').text('麦序模式')
                            roomdao.obj.ismai = false
                        } else {
                            $('#dropdownMenu1').text('自由模式')
                            $('.maixuuser li').remove();
                            roomdao.obj.ismai = true
                            roomdao.obj.isonmai = false
                        }
                        roomdao.ismaixu();
                    }
                    var swf = document.getElementById('swf1');
                    roomdao.ismobile(event.data);
                    break;
                case 'live'://单人直播
                    var swf = document.getElementById('swf1')
                    var obj = new Object();
                    obj.fromName = 'status';
                    obj.to = json.to;
                    obj.text = '0';
                    var swf = document.getElementById('swf1');
                    roomdao.ismobile(JSON.stringify(obj))
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.to) {
                        if (ap) {
                            ap.pause()
                            stopmusic();
                            $('.music').hide()
                        }
                        roomdao.obj.liveid = json.to;
                        roomdao.obj.status = 0
                        roomdao.toggleVideo(1);
                        roomdao.setad(roomdao.obj.banner);
                        roomdao.obj.hasvideo = 1
                        roomdao.seeSkin(roomdao.obj.path)
                        roomdao.obj.lonelyurl = json.text

                        roomdao.playerinit('J_prismPlayer', 'player', '100%', roomdao.obj.lonelyurl, '55%');
                        $('.reflash').remove();
                        $('.flash1').append("<button class=\"btn btn-default reflash\">刷新直播间</button>")
                        if (roomdao.obj.subuserid == json.from) {
                            $('.exitlive').remove();
                            $('.flash1').append("<button class=\"btn btn-default exitlive\">退出直播</button>")
                            roomdao.obj.islive = true;
                        }
                        roomdao.obj.isonmai = false
                        roomdao.mobileVideo('J_prismPlayer', 'player', roomdao.obj.lonelyurl, '46%');
                    }
                    break;
                case 'doublelive'://双人直播
                    var obj = new Object()
                    obj.fromName = 'status';
                    obj.to = json.to;
                    obj.text = '4'
                    var swf = document.getElementById('swf1');
                    roomdao.ismobile(JSON.stringify(obj))
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.to) {
                        if (ap) {
                            ap.pause()
                            stopmusic();
                            $('.music').hide()
                        }
                        roomdao.obj.status = 4
                        roomdao.toggleVideo(1);
                        roomdao.seeSkin(roomdao.obj.path)
                        roomdao.setad(roomdao.obj.banner);
                        roomdao.obj.hasvideo = 1
                        roomdao.obj.doubleliveid = json.from;
                        if (json.map.play.length == 1) {
                            roomdao.obj.doublelivestatus = 0
                        } else {
                            roomdao.obj.doublelivestatus = 1
                        }
                        if (json.map.play.length == 1) {
                            if (roomdao.obj.subuserid == json.from) {
                                roomdao.obj.selffirsturl = "rtmp://a.zhuboinc.com/" + json.to + '/' + json.map.play[0]

                            }
                            roomdao.obj.firsturl = "rtmp://a.zhuboinc.com/" + json.to + '/' + json.map.play[0]
                            roomdao.playerinit('J_prismPlayer', 'player', '50%', roomdao.obj.firsturl, '55%')
                            $('.joindoublelive').remove();
                            $('.videomain').append("<button class=\"btn btn-primary joindoublelive\">加入双人视频直播</button>")
                            $('.reflash').remove();
                            $('.flash1').append("<button class=\"btn btn-default reflash\">刷新直播间</button>")
                            roomdao.mobileVideo('J_prismPlayer', 'player', roomdao.obj.firsturl, '46%')

                        } else {
                            if (roomdao.obj.subuserid == json.from) {
                                roomdao.obj.selffirsturl = "rtmp://a.zhuboinc.com/" + json.to + '/' + json.map.play[0]
                                roomdao.obj.selfsecondurl = "rtmp://a.zhuboinc.com/" + json.to + '/' + json.map.play[1]
                            }
                            roomdao.obj.firsturl = "rtmp://a.zhuboinc.com/" + json.to + '/' + json.map.play[0]
                            roomdao.obj.secondurl = "rtmp://a.zhuboinc.com/" + json.to + '/' + json.map.play[1]
                            roomdao.playerinit('J_prismPlayer', 'player', '50%', roomdao.obj.firsturl, '55%')
                            roomdao.playerinit('K_prismPlayer', 'singer', '50%', roomdao.obj.secondurl, '55%')
                            $('.joindoublelive').remove();
                            $('.reflash').remove();
                            $('.flash1').append("<button class=\"btn btn-default reflash\">刷新直播间</button>")
                            $('.reflash').remove();
                            $('.flash1').append("<button class=\"btn btn-default reflash\">刷新直播间</button>")
                            roomdao.mobileVideo('J_prismPlayer', 'player', roomdao.obj.firsturl, '33%')
                            roomdao.mobileVideo('K_prismPlayer', 'singer', roomdao.obj.secondurl, '33%')
                        }
                        roomdao.obj.isonmai = false;
                    }

                    if (roomdao.obj.subuserid == json.from) {
                        $('.exitlive').remove();
                        $('.flash1').append("<button class=\"btn btn-default exitlive\">退出直播</button>")
                        roomdao.obj.islive = true;
                    }
                    break;
                case 'liveout'://退出单人直播
                    var obj = new Object;
                    obj.fromName = 'status';
                    obj.to = json.to;
                    obj.text = '3'
                    var swf = document.getElementById('swf1');
                    roomdao.ismobile(JSON.stringify(obj))
                    if ($('#' + json.from).parent().attr('id') == json.to) { //如果用户在此房间

                        roomdao.toggleVideo(0);
                        roomdao.seeSkin(roomdao.obj.path)
                        roomdao.obj.ismai = true
                        roomdao.ismaixu();
                        roomdao.obj.hasvideo = 0
                        roomdao.setad(roomdao.obj.banner);
                        roomdao.obj.freeaudoindex = 3;
                        $('#dropdownMenu1').text('自由模式')
                        $('.exitlive').remove();
                        $('.reflash').remove();

                    }
                    if (roomdao.obj.subuserid == json.from) {
                        roomdao.obj.islive = false;
                        roomdao.obj.status = 3
                    }
                    break;
                case 'doubleliveout'://退出双人主播
                    var obj = new Object();
                    obj.fromName = 'status';
                    obj.to = json.to;
                    obj.text = '3';
                    var swf = document.getElementById('swf1');
                    roomdao.ismobile(JSON.stringify(obj))
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.to) {
                        if (json.from == roomdao.obj.subuserid) {
                            roomdao.obj.islive = false
                            roomdao.obj.doubleliveid = ''
                        }
                        if (json.map.play) {
                            roomdao.toggleVideo(1);
                            roomdao.seeSkin(roomdao.obj.path)
                            roomdao.setad(roomdao.obj.banner);
                            roomdao.obj.hasvideo = 1
                            $('#K_prismPlayer').remove();
                            roomdao.playerinit('J_prismPlayer', 'player', '50%', roomdao.obj.firsturl, '55%');
                            $('.joindoublelive').remove();
                            $('.videomain').append("<button class=\"btn btn-primary joindoublelive\">加入双人视频直播</button>")
                            roomdao.mobileVideo('J_prismPlayer', 'player', roomdao.obj.firsturl, '46%')
                            if ('s' + json.map.id2 != roomdao.obj.subuserid) {
                                $('.reflash').remove();
                                $('.exitlive').remove();
                                $('.flash1').append("<button class=\"btn btn-default reflash\">刷新直播间</button>")
                            }
                            roomdao.obj.doubleliveid = 's' + json.map.id2;
                            roomdao.obj.doublelivestatus = 0;
                            roomdao.obj.status = 4
                        } else {
                            roomdao.toggleVideo(0)
                            roomdao.ismaixu()
                            roomdao.setad(roomdao.obj.banner);
                            roomdao.obj.hasvideo = 0
                            $('.reflash').remove();
                            $('.exitlive').remove();
                            roomdao.obj.doublelivestatus = '';
                            roomdao.obj.status = 3
                        }
                    }
                    roomdao.seeSkin(roomdao.obj.path);
                    break;
                case 'power'://提升用户等级
                    if (json.map.result == 'success') {
                        //收到的要改变等级的用户id
                        var s = (json.from).substr(1, 1); //判断是在子房间还是同级房间
                        //要调整的用户
                        //调整前的class       //调整后的class
                        if (s == 'u') {
                            $('#' + json.map.id).find('i').removeClass(json.map.uclass).addClass(roomdao.showmajia(json.map.power, json.map.sex))
                        } else {
                            $('#' + json.map.id).find('i').removeClass(json.map.uclass).addClass(roomdao.showmajia(json.map.power, json.map.sex))
                        }
                        console.log(roomdao.showmajia(json.map.power, json.map.sex))
                        if (roomdao.obj.subuserid == json.map.id) {
                            roomdao.obj.power = json.map.power
                        }

                        $('#menu').remove();
                        $('#pconmenu').remove();
                    }
                    break;
                case 'urm'://更改房间信息
                    $('#' + json.from).find('span').eq(0).text(json.map.uname)
                    if (json.from.substr(1, 1) == 'i') {
                        if (json.map.password != '' || json.map.password != null) {
                            $('#' + json.from).find('span').eq(1).addClass('lock')
                        } else {
                            $('.lock').removeClass('lock');
                        }
                    } else {
                        if (json.map.password != '' || json.map.password != null) {
                            $('#' + json.from).find('span').eq(1).addClass('sublock')
                        } else {
                            $('.sublock').removeClass('sublock');
                        }
                    }
                    $('#' + json.from).find('span').eq(0).css('color', '#' + json.map.color)
                    $('.addroom').fadeOut();
                    break;
                case 'voicedown'://禁止说话
                    var obj = new Object();
                    obj.fromName = 'dvoice';
                    obj.id = json.to;
                    obj.roomid = json.from;
                    var swf = document.getElementById('swf1')
                    roomdao.ismobile(JSON.stringify(obj))
                    console.log($('#' + roomdao.obj.subuserid).parent().attr('id'));
                    //if(s=='i'){
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.from) {
                        if (roomdao.obj.subuserid == json.to) {
                            roomdao.wints('您已被管理员禁止说话')
                        }
                        roomdao.obj.devoiceid.push(json.to);
                    }
                    break;
                case 'voiceopen'://开启语音
                    var obj = new Object();
                    obj.fromName = json.fromName;
                    obj.id = json.to;
                    obj.roomid = json.from;
                    var swf = document.getElementById('swf1')
                    roomdao.ismobile(JSON.stringify(obj))
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.from) {
                        if (roomdao.obj.subuserid == json.to) {
                            roomdao.wints('您现在可以说话了')
                        }
                        roomdao.removeByValue(roomdao.obj.devoiceid, json.to);
                    }
                    break;
                case 'picturedown'://禁止图片
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.from) {
                        roomdao.obj.picuserlist.push(json.to)
                        if (json.to == roomdao.obj.subuserid) {
                            $('.middlesendimg').hide();
                            roomdao.wints('您已经被管理员禁止图片')
                        }
                    }
                    break;
                case 'pictureopen'://开启图片
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.from) {
                        roomdao.removeByValue(roomdao.obj.picuserlist, json.to)
                        if (json.to == roomdao.obj.subuserid) {
                            $('.middlesendimg').show();
                            roomdao.wints('您现在可以发送图片了')
                        }
                    }
                    break;
                case 'ose'://禁止文字
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.from) {
                        roomdao.obj.fontuserlist.push(json.to)
                        if (json.to == roomdao.obj.subuserid) {
                            $('.sendmsg').attr('disabled', true)
                            roomdao.wints('您现在被管理员禁言了')
                        }
                    }
                    break;
                case 'oseex'://开启文字
                    roomdao.obj.droomwrite.push(json.from);
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.from) {
                        $('.sendmsg').attr('disabled', true)
                    }
                    break;
                case 'dse'://解除禁言
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.from) {
                        roomdao.removeByValue(roomdao.obj.fontuserlist, json.to)
                        if (json.to == roomdao.obj.subuserid) {
                            $('.sendmsg').attr('disabled', false)
                            roomdao.wints('您已被管理员解除禁言')
                        }
                    }
                    break;
                case 'dseex'://禁言
                    if (json.from == $('#' + roomdao.obj.subuserid).parent().attr('id')) {
                        roomdao.removeByValue(roomdao.obj.droomwrite, json.from);
                        $('.sendmsg').attr('disabled', false);
                    }
                    break;
                case 'pictureopenex'://解除图片
                    if (json.from == $('#' + roomdao.obj.subuserid).parent().attr('id')) {
                        roomdao.removeByValue(roomdao.obj.droompic, json.from);
                        $('.middlesendimg').show();
                    }
                    break;
                case 'picturedownex'://禁止图片
                    if (json.from == $('#' + roomdao.obj.subuserid).parent().attr('id')) {
                        roomdao.obj.droompic.push(json.from);
                        $('.middlesendimg').hide();
                    }
                    break;
                case 'todarkroom'://反思室
                    if (roomdao.obj.subuserid == json.map.id) {
                        roomdao.obj.power = 2
                        $('#sib' + json.map.rid).click();
                        roomdao.obj.power = json.map.power
                        setTimeout(function() {
                            $('.sendmsg').attr('disabled', true)
                        }, 100)
                    }
                    break;
                case 'ad1':
                    roomdao.adloading(roomdao.obj.banner, json.text);
                    break;
                case 'ad2':
                    roomdao.adloading(roomdao.obj.banner, json.text);
                    break;
                case 'arr'://创建子房间
                    if (json.map.result == 'success') {
                        $('.addroom').fadeOut();
                        var currentmargin = $('#sib' + json.map.roomm.roomid).css('marginBottom'); //父房间的下外边距
                        var usersize = parseFloat($('#sib' + json.map.roomm.roomid).css('marginBottom'));

                        if (usersize != 0) {
                            $('#sib' + json.map.roomm.roomid).css('marginBottom', usersize + 28)
                        } else {
                            $('#sib' + json.map.roomm.roomid).css('marginBottom', 0)
                        }
                        roomdao.subroomlist('sub' + json.map.roomm.id, json.map.roomm.rname, json.map.roomm.password, 'sib' + json.map.roomm.roomid, json.map.roomm.color);

                    } else {
                        roomdao.wints('房间名已存在，请更换房间名重新创建房间')
                    }
                    break;
                case 'oncontrol'://麦序模式控制
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.from) {
                        roomdao.controlmai(json.fromName)
                    }
                    break;
                case 'offcontrol'://麦序模式控制
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.from) {
                        roomdao.controlmai(json.fromName)
                    }
                    break;
                case 'uname'://更改用户名
                    $('#' + json.to).find('em').text(json.text)
                    if (roomdao.obj.subuserid == json.to) {
                        $('.cover').remove();
                        roomdao.obj.uname = json.text
                        roomdao.obj.name = json.text
                    }
                    break;
                case 'pictures'://发送图片
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.to) {
                        var subimg = roomdao.cteateimglist(json.text, JSON.parse(json.map[json.text]))
                        roomdao.obj.sendimglist[json.text] = subimg
                        console.log(subimg)
                        console.log(roomdao.obj.sendimglist)

                    }
                    break;
                case 'audio'://欢呼和掌声
                    if (json.text == 'huanhu') {
                        $('audio').remove();
                        $('body').append("<audio  src=\"audio/huanhu.mp3\" autoplay='true' style='display:none' id=\"huanhu\"></audio>")
                    } else {
                        $('audio').remove();
                        $('body').append("<audio  src=\"audio/guzhang.mp3\" autoplay='true' style='display:none' id=\"zhangsheng\"></audio>")
                    }
                    break;
                case 'outdarkroom'://移出反思室
                    if (roomdao.obj.subuserid == json.map.id) {
                        roomdao.obj.power = 3;
                        console.log(roomdao.obj.arr[1])
                        $('#sib' + roomdao.obj.arr[1]).click();
                        roomdao.obj.power = json.map.power
                        roomdao.wints('您已被管路员移出反思室。')

                    }
                    break;
                case 'speaking'://禁止说话 允许说话图标显示
                    if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.from) {
                        if (json.mode == 1) {
                            $('#' + roomdao.obj.subuserid).find('img').hide();
                        } else if (json.mode == 2 || json.mode == 0) {
                            $('#' + roomdao.obj.subuserid).find('img').show();
                        } else {
                            return
                        }
                    }
                    break;
                case 'tovideo'://网络视频模式
                    if (json.text == 'success') {
                        if (json.map != null || json.map != '') {
                            if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.from) {
                                roomdao.totovideo(json.map.mobile, json.from)
                                roomdao.obj.status = 5;
                                if (ap) {
                                    ap.pause()
                                    stopmusic();
                                    $('.music').hide()
                                }

                            }

                        }
                    } else {
                        if (roomdao.obj.subuserid == json.to) {
                            roomdao.wints('视频播放有误，请检查地址重新播放')
                        }
                    }
                    break;
                case 'stop'://停止播放音乐
                    $('#mydiv').attr('src', '#');
                    break;
                case 'playmusic'://播放音乐
                    //

                    if (roomdao.obj.currentRoomId == json.from) {
                        // if ($('#' + roomdao.obj.subuserid).parent().attr('id') == json.from) {
                        // playmusic('', json.text, true);
                        // console.log('切换歌曲', json.map.playModel)
                        vm.changeMusic(json.map.playModel)
                    }
                    // }
                    break;
                case 'pause'://音乐暂停

                    if (roomdao.obj.currentRoomId == json.from) {

                        vm.playerPause()

                        // if (ap) {
                        //     ap.pause()
                        // }
                    }
                    break;
                case 'play'://播放
                    if (roomdao.obj.currentRoomId == json.from) {
                        vm.playerPlay()
                        // if (ap) {
                        //     ap.play()
                        // }

                    }
                    break;
                case 'a':
                    break
            }

            function onclose(event) {//长连接关闭回调
                appendTextArea("Web Socket closed");
            }

            //事件函数右侧提示窗口

            function appendTextArea(newData) {//提示信息
                var el = getTextAreaElement();
                el.innerHTML = el.InnerHTML + '\n' + newData;
            }

            function getTextAreaElement() {//获取显示的区域的id
                return document.getElementById('middle');
                return $('.hudong')
            }

        }
    }
})
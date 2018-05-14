define({ "api": [
  {
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "optional": false,
            "field": "varname1",
            "description": "<p>No type.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "varname2",
            "description": "<p>With type.</p>"
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "./doc/main.js",
    "group": "D__blankDemo_src_webrtc_SDK_design_doc_main_js",
    "groupTitle": "D__blankDemo_src_webrtc_SDK_design_doc_main_js",
    "name": ""
  },
  {
    "type": "window.XRTC.answer",
    "url": "answer",
    "title": "answer",
    "name": "answer",
    "version": "0.1.0",
    "description": "<p>回应对方的连接</p>",
    "group": "XRTC",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "toUser",
            "description": "<p>指定用户</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "offersdp",
            "description": "<p>收到的对方的sdp</p>"
          },
          {
            "group": "Parameter",
            "type": "Function",
            "optional": false,
            "field": "successCallback",
            "description": "<p>成功的回调函数</p>"
          },
          {
            "group": "Parameter",
            "type": "Function",
            "optional": false,
            "field": "errorCallback",
            "description": "<p>失败的回调函数</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "用法示例：",
          "content": "window.XRTC.answer(toUser,offersdp,function(response){\n        console.log(response);\n        if(response.type === 'offer'){\n            //send offer to remote(server)\n        }else if(response.type === 'candidate'){\n            //send candidate to remote(server)\n        }else{\n            if(response.type === 'over'){\n                //candidate is over\n            }\n        }\n    },function(response){\n        console.log(response);\n        if(response.type === 'error'){\n            console.log(response.reason);\n        }\n    })",
          "type": "String"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "json",
            "optional": false,
            "field": "response",
            "description": "<p>格式：{type:'answer',value:answer}, type有3中类型：1，‘answer’表示创建成功的offer（sdp），2.‘candidate’表示产生的candidate，3，‘over’表示candidate产生完毕</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "reason",
            "description": "<p>失败的原因</p>"
          }
        ]
      }
    },
    "filename": "./sdk_design.js",
    "groupTitle": "XRTC",
    "sampleRequest": [
      {
        "url": "https://www.xtell.cn/meeting/src/web/doc/sample.htmlanswer"
      }
    ]
  },
  {
    "type": "window.XRTC.call",
    "url": "call",
    "title": "call",
    "name": "call",
    "version": "0.1.0",
    "description": "<p>呼叫指定用户</p>",
    "group": "XRTC",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "toUser",
            "description": "<p>指定的用户</p>"
          },
          {
            "group": "Parameter",
            "type": "Function",
            "optional": false,
            "field": "successCallback",
            "description": "<p>成功的回调函数</p>"
          },
          {
            "group": "Parameter",
            "type": "Function",
            "optional": false,
            "field": "errorCallback",
            "description": "<p>失败的回调函数</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "用法示例：",
          "content": "window.XRTC.call(toUser,function(response){\n        console.log(response);\n        if(response.type === 'offer'){\n            //send offer to remote(server)\n        }else if(response.type === 'candidate'){\n            //send candidate to remote(server)\n        }else{\n            if(response.type === 'over'){\n                //candidate is over\n            }\n        }\n    },function(response){\n        console.log(response);\n    })",
          "type": "String"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "json",
            "optional": false,
            "field": "response",
            "description": "<p>格式：{type:'offer',value:offer}, type有3中类型：1，'offer'表示创建成功的offer（sdp），2.'candidate'表示产生的candidate，3，'over'表示candidate产生完毕</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "reason",
            "description": "<p>失败的原因</p>"
          }
        ]
      }
    },
    "filename": "./sdk_design.js",
    "groupTitle": "XRTC",
    "sampleRequest": [
      {
        "url": "https://www.xtell.cn/meeting/src/web/doc/sample.htmlcall"
      }
    ]
  },
  {
    "type": "window.XRTC.createPc",
    "url": "createPc",
    "title": "createPc",
    "name": "createPc",
    "version": "0.1.0",
    "description": "<p>创建peerConnection对象</p>",
    "group": "XRTC",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "role",
            "description": "<p>角色，只有offer（call一方）与answer（answer一方）</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "toUser",
            "description": "<p>指定用户</p>"
          },
          {
            "group": "Parameter",
            "type": "Function",
            "optional": false,
            "field": "successCallback",
            "description": "<p>成功的回调函数</p>"
          },
          {
            "group": "Parameter",
            "type": "Function",
            "optional": false,
            "field": "errorCallback",
            "description": "<p>失败的回调函数</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "用法示例：",
          "content": "window.XRTC.createPc('offer','123',function(xpc,candidate){\n        console.log(response);\n        if(xpc){\n            console.log(xpc); //handle the xpc\n        }\n        if(candidate){\n            console.log(candidate);//handle the candidate\n        }\n    },function(response){\n        console.log(response);\n    })",
          "type": "String"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "json",
            "optional": false,
            "field": "xpc",
            "description": "<p>创建peerConnection成功后返回的xpc对象及一系列属性</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "condidate",
            "description": "<p>onicecandidate函数响应产生的candidate</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "json",
            "optional": false,
            "field": "reason",
            "description": "<p>失败的原因 {status：'failed',reason:reason}</p>"
          }
        ]
      }
    },
    "filename": "./sdk_design.js",
    "groupTitle": "XRTC",
    "sampleRequest": [
      {
        "url": "https://www.xtell.cn/meeting/src/web/doc/sample.htmlcreatePc"
      }
    ]
  },
  {
    "type": "window.XRTC.getStream",
    "url": "getStream",
    "title": "getStream",
    "name": "getStream",
    "version": "0.1.0",
    "description": "<p>根据设置的模式获取音频还是音视频</p>",
    "group": "XRTC",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Function",
            "optional": false,
            "field": "successCallback",
            "description": "<p>成功的回调函数</p>"
          },
          {
            "group": "Parameter",
            "type": "Function",
            "optional": false,
            "field": "errorCallback",
            "description": "<p>失败的回调函数</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "用法示例：",
          "content": "window.XRTC.getStream(function(stream){\n        console.log(stream);\n    },function(reason){\n        console.log(reason);\n    })",
          "type": "String"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "MediaStream",
            "optional": false,
            "field": "stream",
            "description": "<p>获取到的媒体流</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "streamType",
            "description": "<p>获取到的媒体流类型,micStream为麦克风音频流，tagStream为audio tag标签的音频流</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "reason",
            "description": "<p>失败的原因</p>"
          }
        ]
      }
    },
    "filename": "./sdk_design.js",
    "groupTitle": "XRTC",
    "sampleRequest": [
      {
        "url": "https://www.xtell.cn/meeting/src/web/doc/sample.htmlgetStream"
      }
    ]
  },
  {
    "type": "window.XRTC.init",
    "url": "init",
    "title": "init",
    "name": "init",
    "group": "XRTC",
    "version": "0.1.0",
    "description": "<p>初始化函数init</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "json",
            "optional": true,
            "field": "config",
            "description": "<p>初始化时的配置 .</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "用法示例：",
          "content": "var config = {\n    mode:2,\n    localVideo:dom,\n    remoteVideo:dom\n};\nwindow.XRTC.init(config)",
          "type": "String"
        }
      ]
    },
    "filename": "./sdk_design.js",
    "groupTitle": "XRTC",
    "sampleRequest": [
      {
        "url": "https://www.xtell.cn/meeting/src/web/doc/sample.htmlinit"
      }
    ]
  },
  {
    "type": "window.XRTC.mixerAudio",
    "url": "mixerAudio",
    "title": "mixerAudio",
    "name": "mixerAudio",
    "version": "0.1.0",
    "group": "XRTC",
    "description": "<p>混音函数，A连B，C也连B，B属于混音节点，此函数的功能是让A与B也互通</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "MediaStream",
            "optional": false,
            "field": "stream",
            "description": "<p>远程的音频流</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "用法示例：",
          "content": "window.XRTC.mixerAudio(stream,pc,type)",
          "type": "String"
        }
      ]
    },
    "filename": "./sdk_design.js",
    "groupTitle": "XRTC",
    "sampleRequest": [
      {
        "url": "https://www.xtell.cn/meeting/src/web/doc/sample.htmlmixerAudio"
      }
    ]
  },
  {
    "type": "window.XRTC.onAnswer",
    "url": "onAnswer",
    "title": "onAnswer",
    "name": "onAnswer",
    "version": "0.1.0",
    "description": "<p>收到对方的answer sdp时调用</p>",
    "group": "XRTC",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "toUser",
            "description": "<p>指定用户</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "answer",
            "description": "<p>指定用户的answer</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "用法示例：",
          "content": "XRTC.onAnswer('123',answerSdp)",
          "type": "String"
        }
      ]
    },
    "filename": "./sdk_design.js",
    "groupTitle": "XRTC",
    "sampleRequest": [
      {
        "url": "https://www.xtell.cn/meeting/src/web/doc/sample.htmlonAnswer"
      }
    ]
  },
  {
    "type": "window.XRTC.onCandidates",
    "url": "onCandidates",
    "title": "onCandidates",
    "name": "onCandidates",
    "version": "0.1.0",
    "description": "<p>收到对方的candidate时调用</p>",
    "group": "XRTC",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "toUser",
            "description": "<p>指定用户</p>"
          },
          {
            "group": "Parameter",
            "type": "json",
            "optional": false,
            "field": "candidate",
            "description": "<p>指定用户的candidate</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "用法示例：",
          "content": "XRTC.onCandidates('123',candidate)",
          "type": "String"
        }
      ]
    },
    "filename": "./sdk_design.js",
    "groupTitle": "XRTC",
    "sampleRequest": [
      {
        "url": "https://www.xtell.cn/meeting/src/web/doc/sample.htmlonCandidates"
      }
    ]
  },
  {
    "type": "window.XRTC.removeInstance",
    "url": "removeInstance",
    "title": "removeInstance",
    "name": "removeInstance",
    "version": "0.1.0",
    "group": "XRTC",
    "description": "<p>此函数用于清除会话示例，释放资源(webAudio peerConnection)</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "json",
            "optional": false,
            "field": "session",
            "description": "<p>会话实例</p>"
          }
        ]
      }
    },
    "filename": "./sdk_design.js",
    "groupTitle": "XRTC",
    "sampleRequest": [
      {
        "url": "https://www.xtell.cn/meeting/src/web/doc/sample.htmlremoveInstance"
      }
    ]
  },
  {
    "type": "window.XRTC.setIceServers",
    "url": "setIceServers",
    "title": "setIceServers",
    "name": "setIceServers",
    "version": "0.1.0",
    "description": "<p>设置ice服务器</p>",
    "group": "XRTC",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Array",
            "optional": false,
            "field": "iceServers",
            "description": "<p>stun与turn服务器对象数组</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "用法示例：",
          "content": "var iceServer = [\n    {url:'stun:stun.xxx.org'},\n    {urls:'turn:turn.xxx.org',username:'xxx',credential:'xxx'}\n];\nwindow.XRTC.setIceServers(iceServer)",
          "type": "String"
        }
      ]
    },
    "filename": "./sdk_design.js",
    "groupTitle": "XRTC",
    "sampleRequest": [
      {
        "url": "https://www.xtell.cn/meeting/src/web/doc/sample.htmlsetIceServers"
      }
    ]
  },
  {
    "type": "window.XRTC.setMode",
    "url": "setMode",
    "title": "setMode",
    "name": "setMode",
    "version": "0.1.0",
    "description": "<p>设置音视频模式</p>",
    "group": "XRTC",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "mode",
            "description": "<p>音视频模式 1 表示音频,2 音视频,3 表示桌面共享（只限firefox）</p>"
          },
          {
            "group": "Parameter",
            "type": "Dom",
            "optional": true,
            "field": "localVideoTag",
            "description": "<p>本地视频播放容器</p>"
          },
          {
            "group": "Parameter",
            "type": "Dom",
            "optional": true,
            "field": "remoteVideoTag",
            "description": "<p>远程视频播放容器</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "用法示例：",
          "content": "window.XRTC.setMode(1,null) //音频模式\nwindow.XRTC.setMode(2,localVideo,remoteVideo) //视频模式\nwindow.XRTC.setMode(3,localVideo) //屏幕共享模式（只限firefox）",
          "type": "String"
        }
      ]
    },
    "filename": "./sdk_design.js",
    "groupTitle": "XRTC",
    "sampleRequest": [
      {
        "url": "https://www.xtell.cn/meeting/src/web/doc/sample.htmlsetMode"
      }
    ]
  }
] });

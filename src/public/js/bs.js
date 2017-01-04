/**
 * Created by Ian on 2014/8/10.
 * 优化
 */

(function(){
    window['BS'] = window['BS'] || {};
    window.BS.b$ = window.BS.b$ || {};
})();

(function(){
	$.toJSON = $.toJSON || JSON.stringify;
	
    var b$ = {};

    b$ = $.extend(window.BS.b$,{});

    b$.pNative = (typeof maccocojs !== 'undefined') && (maccocojs); // 本地引擎
	
	// 定义临时回调处理函数定义接口
	b$._ncb_idx = 0;
	b$._get_callback = function(func, noDelete){
		window._nativeCallback = window._nativeCallback || {};
		var _nativeCallback = window._nativeCallback;
		var r = 'ncb' + b$._ncb_idx++;
		_nativeCallback[r] = function(){
			try {
                if (!noDelete) {
                    delete _nativeCallback[r];
                }
            }catch(e){}
            func && func.apply(null, arguments);
		};
		return '_nativeCallback.' + r;
	};
	
    b$.cb_execTaskUpdateInfo = null; //执行任务的回调
    b$.pCorePlugin = { //核心处理引导插件部分,尽量不要修改
        useThread: true,
        passBack:"BS.b$.cb_execTaskUpdateInfo",
        packageMode: 'bundle',
        taskToolPath: "/Plugins/extendLoader.bundle",
        bundleClassName: "LibCommonInterface"
    };

    b$.pIAPPlugin = {
        path:"/plugin.iap.bundle"
    };

    // IAP 功能封装
    b$.cb_handleIAPCallback = null; // IAP的回调函数
    b$.IAP = {
        enableIAP : function(parms){
            if(b$.pNative){
                try{
                    //注册IAP回调
                    b$.pNative.iap.regeditIAPCallbackJs(parms.cb_IAP_js || "BS.b$.cb_handleIAPCallback");

                    //注册IAPBundle
                    b$.pNative.iap.regeditIAPCore($.toJSON({
                        path:b$.getAppPluginDir() + b$.pIAPPlugin.path
                    }));

                    //看看是否可以起诉购买
                    if(b$.pNative.iap.canMakePayments()){
                        //启动服务
                        b$.pNative.iap.startIAPService();

                        //发送商品请求
                        b$.pNative.iap.requestProducts($.toJSON({
                            productIdentifiers:parms.productIds ||[]
                        }));
                    }
                }catch(e){
                    console.error(e);
                }

            }
        },

        restore:function(){
            if(b$.pNative){
                //发送购买请求
                b$.pNative.iap.restoreIAP();
            }
        },

        buyProduct:function(parms){
            if(b$.pNative){
                //发送购买请求
                b$.pNative.iap.buyProduct($.toJSON({
                    identifier:parms.productIdentifier,
                    quantity:parms.quantity || 1
                }));
            }
        },

        getPrice:function(productIdentifier){
            if(b$.pNative){
                return b$.pNative.iap.getPrice(productIdentifier);
            }

            return "";
        },

        getUseableProductCount: function(productIdentifier){
            if(b$.pNative){
                return b$.pNative.iap.getUseableProductCount(productIdentifier);
            }

            return 0;
        },
		
		setUseableProductCount:function(jsonObj){
            if(b$.pNative){
				var params = {
					identifier: jsonObj.productIdentifier || '',
					quantity: jsonObj.quantity || 1
				};
                return b$.pNative.iap.setUseableProductCount($.toJSON(params));
            }

            return 0;
		},

        add1Useable : function(productIdentifier){
            if(b$.pNative){
                return b$.pNative.iap.add1Useable(productIdentifier);
            }

            return 0;
        },

        sub1Useable : function(productIdentifier){
            if(b$.pNative){
                return b$.pNative.iap.sub1Useable(productIdentifier);
            }

            return 0;
        }
    };
	
    /**
     * Notice 内容封装
     */
	b$.Notice = {
		alert:function(jsonObj){
            if(b$.pNative){
				var params = {
					message: jsonObj.message || 'Tip',
					title: jsonObj.title || 'title',
					buttons: jsonObj.buttons || ['Ok'],
					alertType: jsonObj.alertType || 'Alert'
				};
			
                return b$.pNative.notice.alert($.toJSON(params));
            }else{
                alert(jsonObj.message);
            }
		}
	};

    /**
     * App 内容封装
     */
    b$.App = {
        appName:null,
        getAppName:function(){
            if(b$.pNative){
                var t = this;
                if(t.appName) return t.appName;
                t.appName = b$.pNative.app.getAppName();
                return t.appName;
            }
            return "AppName";
        },

        appVersion:null,
        getAppVersion:function(){
            if(b$.pNative){
                var t = this;
                if(t.appVersion) return t.appVersion;
                t.appVersion = b$.pNative.app.getAppVersion();
                return t.appVersion;
            }
            return "4.5.6";
        },

        appId:null,
        getAppId:function(){
            if(b$.pNative){
                var t = this;
                if(t.appId) return t.appId;
                t.appId = b$.pNative.app.getAppIdentifier();
                return t.appId;
            }
            return "AppID";
        },

        getSandboxEnable:function(){
            if(b$.pNative){
                var sandboxEnable = b$.pNative.app.getSandboxEnable();
                return sandboxEnable;
            }
            return false;
        },

        getRegInfoJSONString:function(){
            if(b$.pNative){
                var str = b$.pNative.app.getRegInfoJSONString();
                return str;
            }
            return "";
        },

        getSerialNumber:function(){
            if(b$.pNative){
                var str = b$.pNative.app.getStringSerialNumber();
                return str;
            }
            return "";
        },

        getLocalIP:function(){
            if(b$.pNative){
                var str = b$.pNative.app.getLocalIP();
                return str;
            }
            return "";
        },

        open:function(data){
            if(b$.pNative){
                return b$.pNative.app.open(data);
            }else{
                try{
                    window.open(data);
                }catch(e){}

            }
        },

        //{开启启动部分}
        isStartAtLogin:function(){
            if(b$.pNative){
                return b$.pNative.app.isStartAtLogin();
            }

            return false;
        },

        setStartAtLogin:function(enable){
            if(b$.pNative){
                return b$.pNative.app.setStartAtLogin(enable); //备注：沙盒状态下无效
            }
        },

        //{NSUserDefaults}
        setInfoToUserDefaults:function(jsonObj){
            if(b$.pNative){
                var obj = jsonObj || {callback: 'console.log', key:'', value:''};
                b$.pNative.window.setInfoToUserDefaults($.toJSON(obj));
            }
        },
        getInfoFromUserDefaults:function(jsonObj){
            if(b$.pNative){
                var obj = jsonObj || {callback: 'console.log', key:''};
                b$.pNative.window.getInfoFromUserDefaults($.toJSON(obj));
            }
        },
        removeItemFromUserDefaults:function(jsonObj){
            if(b$.pNative){
                var obj = jsonObj || {callback: 'console.log', key:''};
                b$.pNative.window.removeItemFromUserDefaults($.toJSON(obj));
            }
        },

        ///{方便函数，设置评价App功能是否开启}
        setOptions_RateAppClose:function(enable){
            b$.App.setInfoToUserDefaults({key:'RateApp_CLOSE', value:enable});
        },


        ///{获取开通的服务器端口}
        getServerPort:function(){
            if(b$.pNative){
                return b$.pNative.app.getHttpServerPort();
            }

            return 8888;
        },


        ///路径是否存在
        checkPathIsExist:function(path){
            if(b$.pNative){
                return b$.pNative.path.pathIsExist(path);
            }

            return false;
        },

        ///文件是否为0Byte
        checkFileIsZero:function(file_path){
            if(b$.pNative){
                return b$.pNative.path.fileIsZeroSize(file_path);
            }

            return false;
        },

        ///路径是否可以写
        checkPathIsWritable:function(path){
            if(b$.pNative){
                return b$.pNative.path.checkPathIsWritable(path);
            }

            return false;
        },

        ///判断路径是否可读
        checkPathIsReadable:function(path){
            if(b$.pNative){
                return b$.pNative.path.checkPathIsReadable(path);
            }

            return false;
        },

        ///判断路径是否可运行
        checkPathIsExecutable:function(path){
            if(b$.pNative){
                return b$.pNative.path.checkPathIsExecutable(path);
            }

            return false;
        },

        ///判断路径是否可删除
        checkPathIsDeletable:function(path){
            if(b$.pNative){
                return b$.pNative.path.checkPathIsDeletable(path);
            }

            return false;
        },


        ///判断是否为文件
        checkPathIsFile:function(path){
            if(b$.pNative){
                return b$.pNative.path.checkPathIsFile(path);
            }

            return false;
        },

        ///判断是否为目录
        checkPathIsDir:function(path){
            if(b$.pNative){
                return b$.pNative.path.checkPathIsDir(path);
            }

            return false;
        },

        ///获取文件扩展名
        getFileExt:function(path){
            if(b$.pNative){
                return b$.pNative.path.getFileExt(path);
            }

            return "";
        },

        ///获取路径上一级目录路径
        getPathParentPath:function(path){
            if(b$.pNative){
                return b$.pNative.path.getPathParentPath(path);
            }

            return "";
        },


        ///获取文件的基本属性
        getFilePropertyJSONString:function(path){
            if(b$.pNative){
                return b$.pNative.path.getFilePropertyJSONString(path);
            }

            return "";
        },


        ///获得文件/目录size(实际字节数 1024)
        fileSizeAtPath:function(path){
            if(b$.pNative){
                return b$.pNative.app.fileSizeAtPath(path);
            }

            return "";
        },

        ///获得文件/目录占用磁盘(字节数 1000)
        diskSizeAtPath:function(path){
            if(b$.pNative){
                return b$.pNative.app.diskSizeAtPath(path);
            }

            return "";
        },

        ///获得字符串的md5值
        md5Digest:function(str){
            if(b$.pNative){
                return b$.pNative.app.md5Digest(str);
            }

            return "";
        },


        ///获得当前苹果操作系统本地的语言
        getAppleLanguage:function(){
            if(b$.pNative){
                return b$.pNative.app.getAppleLanguage();
            }

            return "en-US";
        },


        ///获得兼容浏览器的语言标识, 发起者，为Native
        getCompatibleWebkitLanguageList:function(_getType){

            var getType = _getType || 'Native2Webkit'; // 获取类型，默认是获取兼容WebKit的语言标识数组

            var defaultLanguage = 'en';
            //本地对应浏览器的语言标识
            var NativeApple2WebKit_LanguageMap = {
                'Unknown':['']
                ,'en':['en','en-US','en-us']                    // 英语
                ,'fr':['fr', 'fr-FR', 'fr-fr']                  // French (fr) 法语
                ,'de':['de', 'de-DE', 'de-de']                  // German (de) 德语
                ,'zh-Hans':['zh', 'zh-CN', 'zh-cn', 'zh-Hans']  // Chinese (Simplified) (zh-Hans) 中文简体
                ,'zh-Hant':['zh-TW', 'zh-tw', 'zh-Hant']        // Chinese (Traditional) (zh-Hant) 中文繁体
                ,'ja':['ja', 'ja-JP', 'ja-jp']                  // Japanese (ja) 日语
                ,'es':['es', 'es-ES', 'es-es']                  // Spanish (es) 西班牙语
                ,'es-MX':['es-MX', 'es-XL', 'es-xl']            // Spanish (Mexico) (es-MX) 西班牙语（墨西哥）
                ,'it':['it', 'it-IT', 'it-it']                  // Italian (it) 意大利语
                ,'nl':['nl', 'nl-NL', 'nl-nl']                  // Dutch (nl) 荷兰语
                ,'ko':['ko', 'ko-KR', 'ko-kr']                  // Korean (ko) 韩语
                ,'pt':['pt', 'pt-BR', 'pt-br']                  // Portuguese (pt) 葡萄牙语
                ,'pt-PT':['pt-PT','pt-pt']                      // Portuguese (Portugal) (pt) 葡萄牙语（葡萄牙）
                ,'da':['da', 'da-DK', 'da-da']                  // Danish (da) 丹麦语
                ,'fi':['fi', 'fi-FI', 'fi-fi']                  // Finnish (fi) 芬兰语
                ,'nb':['nb', 'nb-NO', 'nb-no']                  // Norwegian Bokmal (nb) 挪威语
                ,'sv':['sv', 'sv-SE', 'sv-se']                  // Swedish (sv) 瑞典语
                ,'ru':['ru', 'ru-RU', 'ru-ru']                  // Russian (ru) 俄语
                ,'pl':['pl', 'pl-PL', 'pl-pl']                  // Polish (pl) 波兰语
                ,'tr':['tr', 'tr-TR', 'tr-tr']                  // Turkish (tr) 土耳其语
                ,'ar':['ar', 'AR']                              // Arabic (ar) 阿拉伯语
                ,'th':['th', 'th-TH', 'th-th']                  // Thai (th) 泰语
                ,'cs':['cs', 'cs-CZ', 'cs-cz']                  // Czech (cs) 捷克语
                ,'hu':['hu', 'hu-HU', 'hu-hu']                  // Hungarian (hu) 匈牙利语
                ,'ca':['ca', 'ca-ES', 'ca-es']                  // Catalan (ca) 加泰罗尼亚语
                ,'hr':['hr', 'hr-HR', 'hr-hr']                  // Croatian (hr) 克罗地亚语
                ,'el':['el', 'el-GR', 'el-gr']                  // Greek (el) 希腊语
                ,'he':['he', 'he-IL', 'he-il']                  // Hebrew (he) 希伯来语
                ,'ro':['ro', 'ro-RO', 'ro-ro']                  // Romanian (ro) 罗马尼亚语
                ,'sk':['sk', 'sk-SK', 'sk-sk']                  // Slovak (sk) 斯洛伐克语
                ,'uk':['uk', 'uk-UA', 'uk-ua']                  // Ukrainian (uk) 乌克兰语
                ,'id':['id', 'ID', 'id-ID', 'id-id']            // Indonesian (id) 印尼语
                ,'ms':['ms', 'MS', 'ms-MS', 'ms-ms']            // Malay (ms) 马来西亚语
                ,'vi':['vi', 'vi-VN', 'vi-vn']                  // Vietnamese (vi) 越南语
            };

            if(getType === 'Native2Webkit'){ // 先获取Native的语言，然后查找Map
                var apple_lng = 'en-US';
                if(b$.pNative){
                    apple_lng = b$.pNative.app.getAppleLanguage();
                }

                if(NativeApple2WebKit_LanguageMap.hasOwnProperty(apple_lng)){
                    return NativeApple2WebKit_LanguageMap[apple_lng];
                }

                return NativeApple2WebKit_LanguageMap[defaultLanguage];
            }else if(getType === 'webkitCompatible'){
                var mapValue = null, webLanguage = navigator.language || 'en';

                function inArray(value, array){
                    if (Array.prototype.indexOf) {
                        return array.indexOf(value);
                    } else {
                        for (var i = 0; i < array.length; i++) {
                            if (array[i] === value) return i;
                        }
                        return -1;
                    }
                }

                for(var key in NativeApple2WebKit_LanguageMap){
                    if(NativeApple2WebKit_LanguageMap.hasOwnProperty(key)){
                        var languageArray = NativeApple2WebKit_LanguageMap[key];
                        if(inArray(webLanguage, languageArray) > -1){
                            mapValue = languageArray;
                            break;
                        }
                    }
                }

               return mapValue;
            }

            return console.error('调用方式不正确，需要的参数为:Native2Webkit 或者webkitCompatible');
        }
    };


    // 启动核心插件功能
    b$.enablePluginCore = function(pluginList){
        if(b$.pNative){
            try{
                var org_pluginArray = pluginList || []; // 插件信息数组
                var pluginArray = [];

                //过滤调用方式非'call' 的插件
                for(var i = 0; i < org_pluginArray.length; ++i){
                    var plugin = org_pluginArray[i];
                    if(plugin["callMethod"] === 'call'){
                        pluginArray.push(plugin);
                    }
                }

                var extendObj = $.objClone(b$.pCorePlugin);
                extendObj["callMethod"] = "initCore";
                extendObj["arguments"] = [
                    true,
                    pluginArray
                ];

                b$.pNative.window.execTask($.toJSON(extendObj));

            }catch (e){
                console.error(e);
            }
        }
    };

    // 启用拖拽功能
    b$.cb_dragdrop = null; // 启动
    b$.enableDragDropFeature = function(obj){
        if(b$.pNative){
            try{
                var configObj = {
                    callback: "BS.b$.cb_dragdrop",
                    enableDir: obj.enableDir || false,
                    enableFile: obj.enableFile ||true,
                    fileTypes: obj.fileTypes || ["*"]
                };
                b$.pNative.window.setDragDropConfig($.toJSON(configObj));
            }catch(e){
                console.error(e);
            }
        }
    };

    // 创建任务
    /**
     *
     * @param callMethod  调用方式：task，sendEvent，
     * @param taskId
     * @param args
     */
    b$.createTask = function(callMethod, taskId, args){
        if(b$.pNative){
            try{
                var extendObj = $.objClone(b$.pCorePlugin);
                extendObj["callMethod"] = callMethod;
                extendObj["arguments"] = [taskId, args];

                b$.pNative.window.execTask($.toJSON(extendObj));
            }catch(e){
                console.error(e);
            }
        }
    };

    // 发送任务事件
    b$.sendQueueEvent = function(queueID, queueType, event){
        if(b$.pNative){
            try{
                var extendObj = $.objClone(b$.pCorePlugin);
                extendObj["callMethod"] = "sendEvent";
                extendObj["arguments"] = [event, queueType, queueID];

                b$.pNative.window.execTask($.toJSON(extendObj));
            }catch(e){
                console.error(e);
            }
        }
    };

    // 导入文件
    /**
     BS.b$.cb_importFiles({
         "success":true,
         "parentDir":"/Volumes/DiskShareUser/Users/ian/TestResource/xls",
         "filesCount":1,
         "filesArray":[
            {"isExecutable":true,
            "isDeletable":false,
            "fileNameWithoutExtension":"Book1",
            "fileName":"Book1.xls",
            "fileSize":7680,
            "fileSizeStr":"7.7KB",
            "fileUrl":"file:///Volumes/DiskShareUser/Users/ian/TestResource/xls/Book1.xls",
            "isReadable":true,
            "isWritable":true,
            "extension":"xls",
            "filePath":"/Volumes/DiskShareUser/Users/ian/TestResource/xls/Book1.xls"
            }
         ]
     });
    **/
    b$.cb_importFiles = null; // 导入文件的回调
    b$.importFiles = function(parms){
        if(b$.pNative){
            try{
                b$.pNative.window.openFile($.toJSON(parms));
            }catch(e){
                console.error(e);
            }
        }else{
            alert('启动选择文件对话框!')
        }
    };

    // 选择输出目录
    /**
     * 选择目录传入的参数：
     * {
                callback: "BS.b$.cb_selectOutDir",
                allowOtherFileTypes: false,
                canCreateDir: true,
                canChooseDir: true,
                canChooseFiles: false, // 不可以选择文件
                title: "Select Directory",
                prompt: "Select",
                types: []              // 类型要为空
            }
     * @type {null}
     */
    b$.cb_selectOutDir = null; // 选择输出目录的回调
    b$.selectOutDir = function(parms){
        if(b$.pNative){
            try{
                //限制内部属性：
                parms['allowOtherFileTypes'] = false;
                parms['canCreateDir'] = true;
                parms['canChooseDir'] = true;
                parms['canChooseFiles'] = false; //不可以选择文件
                parms['types'] = [];

                b$.pNative.window.openFile($.toJSON(parms));
            }catch(e){
                console.error(e);
            }
        }else{
            alert("启动选择目录对话框!");
        }
    };

    // 选择输出文件
    /*
     BS.b$.cb_selectOutFile({
         "success":true,
         "fileName":"untitled.csv",
         "fileUrl":"file:///Volumes/DiskShareUser/Users/ian/TestResource/xls/untitled.csv",
         "fileNameWithoutExtension":"untitled",
         "extension":"csv",
         "filePath":"/Volumes/DiskShareUser/Users/ian/TestResource/xls/untitled.csv"
     });
     */
    b$.cb_selectOutFile = null; // 选择输出文件的回调
    b$.selectOutFile = function(parms){
        if(b$.pNative){
            try{
                b$.pNative.window.saveFile($.toJSON(parms));
            }catch(e){
                console.error(e);
            }
        }else{
            alert('启动选择输出文件对话框!')
        }
    };

    // 定位文件
    b$.cb_revealInFinder = null; // 选择定位文件的回调
    b$.revealInFinder = function(path){
        if(b$.pNative){
            try{
                b$.pNative.window.revealInFinder($.toJSON({
                    filePath:path
                }));
            }catch(e){
                console.error(e)
            }
        }
    };

    // 获得App的插件目录
    b$.getAppPluginDir = function(){
        if(b$.pNative){
            return b$.pNative.path.appPluginDirPath();
        }
        return "";
    };

    // 获得Public目录
    b$.getAppResourcePublicDir = function(){
        if(b$.pNative){
            return b$.pNative.path.resource() + "/public";
        }
        return "";
    };



    // 检测路径是否存在
    b$.pathIsExist = function(path){
        if(b$.pNative){
            return b$.pNative.path.pathIsExist(path);
        }
        return true;
    };

    // 检测路径是否可写
    b$.checkPathIsWritable = function(path){
        if(b$.pNative){
            return b$.pNative.path.checkPathIsWritable(path);
        }
        return true;
    };

    // 检测文件是否为0Byte字节
    b$.checkFileIsZeroSize = function(path){
        if(b$.pNative){
            return b$.pNative.path.fileIsZeroSize(path);
        }
        return false;
    };

    // 创建空文件
    b$.createEmptyFile = function(path){
        if(b$.pNative){
            return b$.pNative.window.createEmptyFile($.toJSON({path:path}));
        }
    };

    // 删除文件
    b$.removeFile = function(path){
        if(b$.pNative){
            return b$.pNative.window.removeFile($.toJSON({path:path}));
        }
    };

    // 查找文件
    b$.findFile = function(dir, fileName){
        if(b$.pNative){
            return b$.pNative.window.findFile($.toJSON({dir:dir, fileName:fileName}));
        }
        return null;
    };

    // 检测是否支持本地存储
    b$.check_supportHtml5Storage = function(){
        try{
            return 'localStorage' in window && window['localStorage'] != null;
        }catch(e){
            return false;
        }
    };

    // 初始化默认的Manifest文件, callback 必须定义才有效
    b$.defaultManifest_key = 'js_defaultManifest_key';
    b$.defaultManifest = {};

    // 保存默认Manifest对象
    b$.saveDefaultManifest = function(newManifest){
        if(!b$.check_supportHtml5Storage()) return false;
        var obj = {manifest: newManifest || b$.defaultManifest};
        var encoded = $.toJSON(obj);
        window.localStorage.setItem(b$.defaultManifest_key, encoded);
        return true;
    };

    // 还原默认Manifest对象
    b$.revertDefaultManifest = function(){
        if(!b$.check_supportHtml5Storage()) return false;
        var encoded = window.localStorage.getItem(b$.defaultManifest_key);
        if(encoded != null){
            var obj = $.secureEvalJSON(encoded);
            b$.defaultManifest = obj.manifest;
        }

        return true;
    };


    // 评价功能监测,内部标识

    b$.ServiceCheckRateApp = {
        key : 'local_defaultRateApp_key', // 默认评价Key
        data : null,                      // 对应的数据

        // 清空数据
        removeData:function(){
            if(b$.check_supportHtml5Storage()){
                window.localStorage.removeItem(this.key);
                this.data = null;
            }
        },

        /**
         * local_defaultRateApp_key : string
         * stirng ---> obj
         *
         * obj[AppName+version] : {toRate:false, remindLater: false, hadRate: false}
         * 可以用0111来标识
         *
         * @returns {null}
         */

        // 获取数据内容
        getData:function(){
            var t = this;
            if(t.data) return t.data;

            if(b$.check_supportHtml5Storage()){
                var objStr = window.localStorage.getItem(t.key);
                if(objStr != null){
                    var obj = $.secureEvalJSON(objStr);
                    t.data = obj;
                    return t.data;
                }else{
                    t.data = {};
                    return t.data;
                }
            }

            return null;
        },

        // 存储数据内容
        saveData:function(){
            var t = this;
            if(t.data != null){
                if(b$.check_supportHtml5Storage()){
                    var objStr = $.toJSON(t.data);
                    window.localStorage.setItem(t.key, objStr);
                }
            }
        },

        // 获取Data关键
        getDataKey:function(type){
            var key = 'defaultAppKey';
            if(type === 'AppKey'){
                var appName = b$.App.getAppName();
                var appVersion = b$.App.getAppVersion();
                key = appName + appVersion;
            }

            return key;
        },

        // 获取obj[AppName+version] 中的对象
        getDataItem:function(key){
            var t = this;
            t.getData();
            if(t.data){
                if(!((typeof t.data[key] != 'undefined') && t.data[key])){
                    t.data[key] = 0;
                }
                return  t.data[key];
            }

            return null;
        },

        // 监测是否有对应的值
        checkRateItemData:function(bord){
            var t = this;
            var key = t.getDataKey("AppKey");
            var obj = t.getDataItem(key);
            var num = parseInt(obj);
            return (num & bord) == bord;
        },

        // 保存评价是否点击的结果
        setRateItemData:function(is, bord){
            var t = this;
            var key = t.getDataKey("AppKey");
            var nowNum = t.data[key];
            t.data[key] = (is == true ? (nowNum | bord) : (nowNum & bord));
            t.saveData();
        },

        // 获取当前版本是否激活了Rate
        getRateActive:function(){
            var t = this;
            return t.checkRateItemData(4);
        },
        // 激活当前版本的Rate
        setRateActive:function(active){
            var t = this;
            return t.setRateItemData(active,4);
        },

        // 获取版本是否RemindLater可用
        getEnableRemindLater:function(){
            var t = this;
            return t.checkRateItemData(2);
        },
        // 设置RemindLater是否可用
        setRemindLaterEnable:function(enable){
            var t = this;
            return t.setRateItemData(enable,2);
        },

        // 获取版本是否已经激活了已经评价过功能
        getHadRateActive:function(){
            var t = this;
            return t.checkRateItemData(1);
        },
        // 设置是否已经评价过
        setHadRateActive:function(active){
            var t = this;
            return t.setRateItemData(active,1);
        }

    };




    window.BS.b$ = $.extend(window.BS.b$,b$);

})();


